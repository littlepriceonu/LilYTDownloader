// Old imports from module
// import { fileURLToPath } from 'url';
// import path from 'path';

import ytdl = require('ytdl-core')
import fs = require('fs')
import ws = require('ws')
import crypto = require('crypto')
const randomUUID = crypto.randomUUID
import os = require('os')
import path = require('path')
import electron = require('electron')
const app = electron.app
const BrowserWindow = electron.BrowserWindow
const ipcMain = electron.ipcMain
const shell = electron.shell
import ffmpegPath = require("@ffmpeg-installer/ffmpeg")
import ffmpeg = require('fluent-ffmpeg')
ffmpeg.setFfmpegPath(ffmpegPath.path)

// TODO
// Install entire playlists to a folder
// Choose between mp4 and mp3
// Set up a UI for the userscript
// set up heartbeats on the server & client so I can kill dead client connections
// 
// Userscript:
//  Folder Select 
//  Name of file
//  Quality Select
//
// Server:
//  Quality Support
//  Check if file exists, send message to client warning about overwrite

const Username = os.userInfo().username

var mainWindow: electron.BrowserWindow

const DirMap = {
    "DOWNLOADS": `C:/Users/${Username}/Downloads`,
    "CURRENT_USER": `C:/Users/${Username}`
}

var Connections: { [id: string]: ws } = {}

const PORT = 5020

const YTSocket = new ws.WebSocketServer({ port: PORT })

const FFMPEGErrorHandlers = [
    function (userID: string, err: string) {
        err = err.replaceAll("\n", "")
        console.log(`[FFMPEG_ERR] ${err}`)

        console.log(err.includes("Invalid argument"))

        if (err.includes("Invalid argument")) {
            Connections[userID].send("DOWNLOAD_ERROR|INVALID_ARGUMENT|FFMPEG detected an invalid file name argument")
        }
    },
]

var appReady = false;

const Region = "SERVER"

//#region Functions

function removeLastDirFromString(dir: string[] | string, separator: string) {
    dir = (dir as string).split(separator)
    dir.pop()
    dir = dir.join("/")

    return dir
}

function sendMessageToClient(type: string, data: any) {
    mainWindow.webContents.send(type, data)
}

function createWindow() {
    // Create the browser window.
    mainWindow = new BrowserWindow({
        width: 1040,
        height: 600,
        minWidth: 1040,
        minHeight: 600,
        webPreferences: {
            preload: path.join(__dirname, 'window/preload.js')
        }
    })

    // and load the index.html of the app.
    mainWindow.loadFile('./dist/window/LYT.html')
}

function CLog(type: string, ...toLog:any[]) {
    console.log(`[${type}]`, ...toLog)
}

function Log(...toLog: any[]) {
    console.log(`[${Region}]`, ...toLog)
}

//#endregion

const IPCHandlers = {
    // Open URL in system browser
    'open-url': (_: electron.IpcMainEvent, url: string)=>{
        CLog("OPEN_URL", `Opening URL: ${url}`)
        shell.openExternal(url)
    },
}

const SocketHandlers = {
    "DEBUG": function (userID: string, msg: string, ..._: string[]) {
        CLog(`CLIENT_${userID}`, `${msg}`)
    },
    "DOWNLOAD_VIDEO": function (userID: string, vid: string, fileName: string, dir: string, type: string, ..._: string[]) {
        if (!appReady) {CLog('YTDL_CORE', `Download Requested but App is not loaded!`)}
        if (!ytdl.validateID(vid)) { CLog(`YTDL_CORE`, `Video ID ${vid} is invalid`); return; }

        const __dir = DirMap[dir]
        const fullDir = __dir + "/" + fileName

        sendMessageToClient("event-message", ["DOWNLOAD_REQUESTED", {
            vid: vid,
            fileName: fileName,
            dir: __dir,
            fullDir: fullDir,
            type: type,
        }])

        const tempFileName = randomUUID()

        var AudioDownloaded = false;
        var VideoDownloaded = false;
        var ErrorOccured = false;

        const CurrentDir = removeLastDirFromString(__dirname, "\\")
        const parentDir = __dir + "/" + removeLastDirFromString(fileName, "/")

        if (!fs.existsSync(`${CurrentDir}/temp`)) {
            fs.mkdirSync(`${CurrentDir}/temp`, { recursive: true })
        }

        function HandleVideo() {
            // Make sure both files are downloaded
            if (ErrorOccured) return
            if (type == "MP4") if (!AudioDownloaded || !VideoDownloaded) return

            if (type == "MP4") {
                // https://stackoverflow.com/questions/56734348/how-to-add-audio-to-video-with-node-fluent-ffmpeg
                ffmpeg()
                    .addInput(`${CurrentDir}/temp/${tempFileName}_V.mp4`)
                    .addInput(`${CurrentDir}/temp/${tempFileName}_A.mp4`)
                    // I fucking hate ffmpeg it can suck my fucking balls
                    // https://superuser.com/questions/1584053/in-ffmpeg-why-wont-this-avc-video-convert-to-h264
                    .outputOptions(['-map 0:v', '-map 1:a', '-c:v copy', '-shortest'])
                    .saveToFile(fullDir).on('end', () => {
                        // Delete the 2 temp vids
                        fs.unlinkSync(`${CurrentDir}/temp/${tempFileName}_V.mp4`)
                        fs.unlinkSync(`${CurrentDir}/temp/${tempFileName}_A.mp4`)

                        // Let the client know we're done
                        Connections[userID].send("DOWNLOAD_COMPLETE|")

                        CLog("FFMPEG_MP4", "Video Complete!")
                    }).on("error", (err) => {
                        // If an error happened, run all the handlers, which will fix something (maybe) and let the client know
                        FFMPEGErrorHandlers.forEach(handler => handler(userID, err.toString()))
                    })
            }
            else {
                // https://superuser.com/questions/332347/how-can-i-convert-mp4-video-to-mp3-audio-with-ffmpeg
                ffmpeg()
                    .addInput(`${CurrentDir}/temp/${tempFileName}_A.mp4`)
                    .saveToFile(fullDir).on('end', () => {
                        // Delete the Audio temp vid
                        fs.unlinkSync(`${CurrentDir}/temp/${tempFileName}_A.mp4`)

                        // Let the client know we're done
                        Connections[userID].send("DOWNLOAD_COMPLETE|")

                        CLog("FFMPEG_MP3", "Audio Complete!")
                    }).on("error", (err) => {
                        // If an error happened, run all the handlers, which will fix something (maybe) and let the client know
                        FFMPEGErrorHandlers.forEach(handler => handler(userID, err.toString()))
                    })
            }
        }

        CLog(`YTDL_CORE`, `Video ID valid, installing video to ${fullDir}...`)

        if (!fs.existsSync(parentDir)) {
            try {
                fs.mkdirSync(parentDir, { recursive: true });
            }
            catch (err) {
                CLog(`FS_MKDIR`, `Error occured while attempting to create directory. ${err}`)
                Connections[userID].send("DOWNLOAD_ERROR|DIRECTORY_ERROR")
                return
            }
        }

        // Download Video
        if (type == "MP4") {
            ytdl(`http://youtube.com/watch?v=${vid}`, { quality: "highestvideo", filter: (format) => { return format.mimeType.includes("video/mp4") && format.hasVideo } }).pipe(fs.createWriteStream(`${CurrentDir}/temp/${tempFileName}_V.mp4`)).on('finish', () => {
                VideoDownloaded = true

                CLog("YTDL_CORE", "Video Download Complete!")

                HandleVideo()
            }).on("error", (err) => {
                if (ErrorOccured) return;

                CLog(`YTDL_CORE`,  `Error while downloading video! Name: ${err.name} | Message: ${err.message}`)
                Connections[userID].send(`DOWNLOAD_ERROR|${err.message.split(":")[0]}|${err.message}`)

                ErrorOccured = true;
            })
        }

        // Download Audio
        ytdl(`http://youtube.com/watch?v=${vid}`, { quality: "highestaudio", filter: (format) => { return format.mimeType.includes("video/mp4") && format.hasAudio } }).pipe(fs.createWriteStream(`${CurrentDir}/temp/${tempFileName}_A.mp4`)).on('finish', () => {
            AudioDownloaded = true

            CLog("YTDL_CORE", "Audio Download Complete!")

            HandleVideo()
        }).on("error", (err) => {
            if (ErrorOccured) return;

            CLog(`YTDL_CORE`, `Error while downloading audio! Name: ${err.name} | Message: ${err.message}`)
            Connections[userID].send(`DOWNLOAD_ERROR|${err.message.split(":")[0]}|${err.message}`)

            ErrorOccured = true;
        })
    },
}

YTSocket.on('connection', function (con) {

    CLog("ON_CONNECTION", "Client Connection Started...")

    // make it so the ID has a common placement in the string sent so it would be like
    // SOME_ID|User's Id|Data goes here|more data here|even more here

    con.on("message", (msg: ws.RawData | string) => {
        msg = msg.toString()
        // I use | as a message split tool
        const _Split = msg.split("|")
        // remove the first item in the array and make it msgID
        const msgID = _Split.shift()
        const userID = _Split.shift()
        const msgData = _Split

        const fullData = [userID, ...msgData]

        if (!Connections[userID]) { con.send("ID_INCORRECT|"); return; }

        if (SocketHandlers[msgID]) {
            SocketHandlers[msgID](...fullData)
        }
    })

    var id = randomUUID()

    Connections[id] = con

    con.send(`CLIENT_ID|${id}`)

})

app.whenReady().then(() => {
    createWindow()

    // MacOS stuff
    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) {
            createWindow()
        }
    })

    appReady = true
})

// Close the app if all our windows are closed
app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        YTSocket.close()
        app.quit()
    }
})

Object.entries(IPCHandlers).forEach(handler => {
    ipcMain.on(handler[0], handler[1])
})

Log(`Listening on port ${PORT}`)