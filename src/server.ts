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
const Menu = electron.Menu
const Tray = electron.Tray
import ffmpegPath = require("@ffmpeg-installer/ffmpeg")
import ffmpeg = require('fluent-ffmpeg')
import { YoutubeDownloadRequest, YoutubeDownloadUpdate, YoutubeUpdateType } from './window/LYT'
ffmpeg.setFfmpegPath(ffmpegPath.path)

// TODO
// Install entire playlists to a folder
// set up heartbeats on the server & client so I can kill dead client connections
// 
// Userscript:
//  Folder Select (?)
//  Quality Select
//
// Server:
//  Quality Support
//  Check if file exists, send message to client warning about overwrite
//
// App:
//  Confetti if on info screen and download finishes (maybe... ?)
//  Add a little indicator that tells the user if the server has any open websocket connects to tell weither its connected properly or not
//  

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
        CLog("FFMPEG_ERR", err)

        console.log(err.includes("Invalid argument"))

        if (err.includes("Invalid argument")) {
            Connections[userID].send("DOWNLOAD_ERROR|INVALID_ARGUMENT|FFMPEG detected an invalid file name argument")
        }
    },
]

var appReady = false;

const LYTDir = removeLastDirFromString(__dirname, "\\")

const Region = "SERVER"

var Downloads: { [id: string]: YoutubeDownloadRequest } = {};

var tray: electron.Tray

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

        titleBarStyle: "hidden",
        titleBarOverlay: {
            color: "#0f172a",
            symbolColor: "#ffffff"
        },

        webPreferences: {
            preload: path.join(__dirname, 'window/preload.js'),
        },

        icon: path.join(LYTDir, "/imgs/icon.png"),
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

// clear everything in the "temp" directory
fs.readdirSync(path.join(LYTDir, "temp")).forEach(file => {
    fs.unlinkSync(path.join(LYTDir, `temp/${file}`))
})

const ContextMenu = electron.Menu.buildFromTemplate([
    { label: 'Show', click:  function(){
        mainWindow.show();
    } },
    { label: 'Quit', click:  function(){
        app.quit()
    } }
]);

const IPCHandlers = {
    // Open URL in system browser
    'open-url': (_: electron.IpcMainEvent, url: string)=>{
        CLog("OPEN_URL", `Opening URL: ${url}`)
        shell.openExternal(url)
    },
}

const IPCInvokeHandlers = {
    'get-video-info': async (_event: electron.IpcMainEvent, vid: string) => {
        var VData: ytdl.videoInfo;

        await ytdl.getBasicInfo(`https://youtube.com/watch?v=${vid}`).then(data => {
            VData = data
        })

        return VData
    },
}

const SocketHandlers = {
    "DEBUG": function (userID: string, msg: string, ..._: string[]) {
        CLog(`CLIENT_${userID}`, `${msg}`)
    },
    "DOWNLOAD_VIDEO": function (userID: string, vid: string, fileName: string, dir: string, type: "MP4"|"MP3", ..._: string[]) {
        if (!appReady) {CLog('YTDL_CORE', `Download Requested but App is not loaded!`)}
        if (!ytdl.validateID(vid)) { CLog(`YTDL_CORE`, `Video ID ${vid} is invalid`); return; }

        var DownloadID = randomUUID()
        DownloadID = <`${string}-${string}-${string}-${string}-${string}`>DownloadID.replace(DownloadID.charAt(0), "LYT")


        const __dir = DirMap[dir]
        const fullDir = __dir + "/" + fileName

        var downloadData: YoutubeDownloadRequest = {
            downloadID: DownloadID,
            vid: vid,
            fileName: fileName,
            dir: __dir,
            fullDir: fullDir,
            type: type,
            hasErrored: false,
            error: "",
        }

        Downloads[DownloadID] = downloadData

        sendMessageToClient("event-message", ["DOWNLOAD_REQUESTED", downloadData])

        const tempFileName = randomUUID()

        var AudioDownloaded = false;
        var VideoDownloaded = false;
        var ErrorOccured = false;

        const parentDir = __dir + "/" + removeLastDirFromString(fileName, "/")

        if (!fs.existsSync(`${LYTDir}/temp`)) {
            fs.mkdirSync(`${LYTDir}/temp`, { recursive: true })
        }

        function HandleVideo() {
            // Make sure both files are downloaded
            if (ErrorOccured) return
            if (type == "MP4") if (!AudioDownloaded || !VideoDownloaded) return

            if (type == "MP4") {
                // https://stackoverflow.com/questions/56734348/how-to-add-audio-to-video-with-node-fluent-ffmpeg
                ffmpeg()
                    .addInput(`${LYTDir}/temp/${tempFileName}_V.mp4`)
                    .addInput(`${LYTDir}/temp/${tempFileName}_A.mp4`)
                    // I fucking hate ffmpeg it can suck my fucking balls
                    // https://superuser.com/questions/1584053/in-ffmpeg-why-wont-this-avc-video-convert-to-h264
                    .outputOptions(['-map 0:v', '-map 1:a', '-c:v copy', '-shortest'])
                    .saveToFile(fullDir).on('end', () => {
                        // Delete the 2 temp vids
                        fs.unlinkSync(`${LYTDir}/temp/${tempFileName}_V.mp4`)
                        fs.unlinkSync(`${LYTDir}/temp/${tempFileName}_A.mp4`)

                        // Let the client know we're done
                        Connections[userID].send("DOWNLOAD_COMPLETE|")

                        const updateType: YoutubeUpdateType = "DOWNLOAD_COMPLETE"

                        var updateData: YoutubeDownloadUpdate = {
                            downloadID: DownloadID,
                            updateType: updateType,
                            data: {},
                        }
            
                        sendMessageToClient("event-message", ["DOWNLOAD_UPDATE", updateData])

                        CLog("FFMPEG_MP4", "Video Complete!")
                    }).on("error", (err) => {
                        // If an error happened, run all the handlers, which will fix something (maybe) and let the client know
                        FFMPEGErrorHandlers.forEach(handler => handler(userID, err.toString()))
                    })
            }
            else {
                // https://superuser.com/questions/332347/how-can-i-convert-mp4-video-to-mp3-audio-with-ffmpeg
                ffmpeg()
                    .addInput(`${LYTDir}/temp/${tempFileName}_A.mp4`)
                    .saveToFile(fullDir).on('end', () => {
                        // Delete the Audio temp vid
                        fs.unlinkSync(`${LYTDir}/temp/${tempFileName}_A.mp4`)

                        // Let the client know we're done
                        Connections[userID].send("DOWNLOAD_COMPLETE|")

                        const updateType: YoutubeUpdateType = "DOWNLOAD_COMPLETE"

                        var updateData: YoutubeDownloadUpdate = {
                            downloadID: DownloadID,
                            updateType: updateType,
                            data: {},
                        }
            
                        sendMessageToClient("event-message", ["DOWNLOAD_UPDATE", updateData])

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
            ytdl(`http://youtube.com/watch?v=${vid}`, { quality: "highestvideo", filter: (format) => { return format.mimeType.includes("video/mp4") && format.hasVideo } }).pipe(fs.createWriteStream(`${LYTDir}/temp/${tempFileName}_V.mp4`)).on('finish', () => {
                
                VideoDownloaded = true

                CLog("YTDL_CORE", "Video Download Complete!")

                HandleVideo()

                const updateType: YoutubeUpdateType = "VIDEO_DOWNLOADED"

                var updateData: YoutubeDownloadUpdate = {
                    downloadID: DownloadID,
                    updateType: updateType,
                    data: {},
                }
    
                sendMessageToClient("event-message", ["DOWNLOAD_UPDATE", updateData])

            }).on("error", (err) => {

                if (ErrorOccured) return;

                CLog(`YTDL_CORE`,  `Error while downloading video! Name: ${err.name} | Message: ${err.message}`)
                Connections[userID].send(`DOWNLOAD_ERROR|${err.message.split(":")[0]}|${err.message}`)

                ErrorOccured = true;

                const updateType: YoutubeUpdateType = "VIDEO_ERROR"

                var updateData: YoutubeDownloadUpdate = {
                    downloadID: DownloadID,
                    updateType: updateType,
                    isError: ErrorOccured,
                    data: {err: err.message.split(":")[0]},
                }
    
                sendMessageToClient("event-message", ["DOWNLOAD_UPDATE", updateData])

            })
        }

        // Download Audio
        ytdl(`http://youtube.com/watch?v=${vid}`, { quality: "highestaudio", filter: (format) => { return format.mimeType.includes("video/mp4") && format.hasAudio } }).pipe(fs.createWriteStream(`${LYTDir}/temp/${tempFileName}_A.mp4`)).on('finish', () => {
            
            AudioDownloaded = true

            CLog("YTDL_CORE", "Audio Download Complete!")

            HandleVideo()

            const updateType: YoutubeUpdateType = "AUDIO_DOWNLOADED"

            var updateData: YoutubeDownloadUpdate = {
                downloadID: DownloadID,
                updateType: updateType,
                data: {},
            }

            sendMessageToClient("event-message", ["DOWNLOAD_UPDATE", updateData])

        }).on("error", (err) => {
            
            if (ErrorOccured) return;

            CLog(`YTDL_CORE`, `Error while downloading audio! Name: ${err.name} | Message: ${err.message}`)
            Connections[userID].send(`DOWNLOAD_ERROR|${err.message.split(":")[0]}|${err.message}`)

            ErrorOccured = true;

            const updateType: YoutubeUpdateType = "AUDIO_ERROR"

            var updateData: YoutubeDownloadUpdate = {
                downloadID: DownloadID,
                updateType: updateType,
                isError: ErrorOccured,
                data: {err: err.message.split(":")[0]},
            }

            sendMessageToClient("event-message", ["DOWNLOAD_UPDATE", updateData])

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

    mainWindow.on("close", (e) => {
        e.preventDefault()

        mainWindow.hide()
    })

    // MacOS stuff
    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) {
            createWindow()
        }
    })

    Object.entries(IPCHandlers).forEach(handler => {
        ipcMain.on(handler[0], handler[1])
    })

    Object.entries(IPCInvokeHandlers).forEach(handler => {
        ipcMain.handle(handler[0], handler[1])
    })

    tray = new Tray(electron.nativeImage.createFromPath(path.join(LYTDir, "imgs/icon.png")))
    tray.setContextMenu(ContextMenu)
    tray.setToolTip("LilYTDownloader")
    tray.setTitle("LilYTDownloader")

    appReady = true
})

// Close the app if all our windows are closed
app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        YTSocket.close()
        app.quit()
    }
})

Log(`Listening on port ${PORT}`)