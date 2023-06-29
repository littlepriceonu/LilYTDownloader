"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const ytdl = require("ytdl-core");
const fs = require("fs");
const ws = require("ws");
const crypto = require("crypto");
const randomUUID = crypto.randomUUID;
const os = require("os");
const path = require("path");
const electron = require("electron");
const app = electron.app;
const BrowserWindow = electron.BrowserWindow;
const ipcMain = electron.ipcMain;
const shell = electron.shell;
const ffmpegPath = require("@ffmpeg-installer/ffmpeg");
const ffmpeg = require("fluent-ffmpeg");
ffmpeg.setFfmpegPath(ffmpegPath.path);
const Username = os.userInfo().username;
var mainWindow;
const DirMap = {
    "DOWNLOADS": `C:/Users/${Username}/Downloads`,
    "CURRENT_USER": `C:/`
};
var Connections = {};
const PORT = 5020;
const YTSocket = new ws.WebSocketServer({ port: PORT });
const FFMPEGErrorHandlers = [
    function (userID, err) {
        err = err.replaceAll("\n", "");
        console.log(`[FFMPEG_ERR] ${err}`);
        console.log(err.includes("Invalid argument"));
        if (err.includes("Invalid argument")) {
            Connections[userID].send("DOWNLOAD_ERROR|INVALID_ARGUMENT|FFMPEG detected an invalid file name argument");
        }
    },
];
function removeLastDirFromString(dir, separator) {
    dir = dir.split(separator);
    dir.pop();
    dir = dir.join("/");
    return dir;
}
function sendMessageToClient(type, data) {
    mainWindow.webContents.send(type, data);
}
function createWindow() {
    mainWindow = new BrowserWindow({
        width: 1040,
        height: 600,
        minWidth: 1040,
        minHeight: 600,
        webPreferences: {
            preload: path.join(__dirname, 'window/preload.js')
        }
    });
    mainWindow.loadFile('./dist/window/LYT.html');
}
const SocketHandlers = {
    "DEBUG": function (userID, msg, ..._) {
        console.log(`[CLIENT_${userID}] ${msg}`);
    },
    "DOWNLOAD_VIDEO": function (userID, vid, fileName, dir, type, ..._) {
        if (!ytdl.validateID(vid)) {
            console.log(`[YTDL_CORE] Video ID ${vid} is invalid`);
            return;
        }
        const tempFileName = randomUUID();
        var AudioDownloaded = false;
        var VideoDownloaded = false;
        var ErrorOccured = false;
        var CurrentDir = removeLastDirFromString(__dirname, "\\");
        var __dir = DirMap[dir];
        var fullDir = __dir + "/" + fileName;
        var parentDir = __dir + "/" + removeLastDirFromString(fileName, "/");
        if (!fs.existsSync(`${CurrentDir}/temp`)) {
            fs.mkdirSync(`${CurrentDir}/temp`, { recursive: true });
        }
        function HandleVideo() {
            if (ErrorOccured)
                return;
            if (type == "MP4")
                if (!AudioDownloaded || !VideoDownloaded)
                    return;
            if (type == "MP4") {
                ffmpeg()
                    .addInput(`${CurrentDir}/temp/${tempFileName}_V.mp4`)
                    .addInput(`${CurrentDir}/temp/${tempFileName}_A.mp4`)
                    .outputOptions(['-map 0:v', '-map 1:a', '-c:v copy', '-shortest'])
                    .saveToFile(fullDir).on('end', () => {
                    fs.unlinkSync(`${CurrentDir}/temp/${tempFileName}_V.mp4`);
                    fs.unlinkSync(`${CurrentDir}/temp/${tempFileName}_A.mp4`);
                    Connections[userID].send("DOWNLOAD_COMPLETE|");
                    console.log("[FFMPEG_MP4] Video Complete!");
                }).on("error", (err) => {
                    FFMPEGErrorHandlers.forEach(handler => handler(userID, err.toString()));
                });
            }
            else {
                ffmpeg()
                    .addInput(`${CurrentDir}/temp/${tempFileName}_A.mp4`)
                    .saveToFile(fullDir).on('end', () => {
                    fs.unlinkSync(`${CurrentDir}/temp/${tempFileName}_A.mp4`);
                    Connections[userID].send("DOWNLOAD_COMPLETE|");
                    console.log("[FFMPEG_MP3] Audio Complete!");
                }).on("error", (err) => {
                    FFMPEGErrorHandlers.forEach(handler => handler(userID, err.toString()));
                });
            }
        }
        console.log(`[YTDL_CORE] Video ID valid, installing video to ${fullDir}...`);
        if (!fs.existsSync(parentDir)) {
            try {
                fs.mkdirSync(parentDir, { recursive: true });
            }
            catch (err) {
                console.log(`[FS_MKDIR] Error occured while attempting to create directory. ${err}`);
                Connections[userID].send("DOWNLOAD_ERROR|DIRECTORY_ERROR");
                return;
            }
        }
        if (type == "MP4") {
            ytdl(`http://youtube.com/watch?v=${vid}`, { quality: "highestvideo", filter: (format) => { return format.mimeType.includes("video/mp4") && format.hasVideo; } }).pipe(fs.createWriteStream(`${CurrentDir}/temp/${tempFileName}_V.mp4`)).on('finish', () => {
                VideoDownloaded = true;
                console.log("[YTDL_CORE] Video Download Complete!");
                HandleVideo();
            }).on("error", (err) => {
                if (ErrorOccured)
                    return;
                console.log(`[YTDL_CORE] Error while downloading video! Name: ${err.name} | Message: ${err.message}`);
                Connections[userID].send(`DOWNLOAD_ERROR|${err.message.split(":")[0]}|${err.message}`);
                ErrorOccured = true;
            });
        }
        ytdl(`http://youtube.com/watch?v=${vid}`, { quality: "highestaudio", filter: (format) => { return format.mimeType.includes("video/mp4") && format.hasAudio; } }).pipe(fs.createWriteStream(`${CurrentDir}/temp/${tempFileName}_A.mp4`)).on('finish', () => {
            AudioDownloaded = true;
            console.log("[YTDL_CORE] Audio Download Complete!");
            HandleVideo();
        }).on("error", (err) => {
            if (ErrorOccured)
                return;
            console.log(`[YTDL_CORE] Error while downloading audio! Name: ${err.name} | Message: ${err.message}`);
            Connections[userID].send(`DOWNLOAD_ERROR|${err.message.split(":")[0]}|${err.message}`);
            ErrorOccured = true;
        });
    },
};
YTSocket.on('connection', function (con) {
    console.log("[ON_CONNECTION] Client Connection Started...");
    con.on("message", (msg) => {
        msg = msg.toString();
        const _Split = msg.split("|");
        const msgID = _Split.shift();
        const userID = _Split.shift();
        const msgData = _Split;
        const fullData = [userID, ...msgData];
        if (!Connections[userID]) {
            con.send("ID_INCORRECT|");
            return;
        }
        if (SocketHandlers[msgID]) {
            SocketHandlers[msgID](...fullData);
        }
    });
    var id = randomUUID();
    Connections[id] = con;
    con.send(`CLIENT_ID|${id}`);
});
app.whenReady().then(() => {
    createWindow();
    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) {
            createWindow();
        }
    });
});
app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});
ipcMain.on('open-url', (_, url) => {
    shell.openExternal(url);
});
console.log(`[LYT] Listening on port ${PORT}`);
//# sourceMappingURL=server.js.map