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
const Menu = electron.Menu;
const Tray = electron.Tray;
const ffmpegPath = require("@ffmpeg-installer/ffmpeg");
const ffmpeg = require("fluent-ffmpeg");
ffmpeg.setFfmpegPath(ffmpegPath.path);
const Username = os.userInfo().username;
var mainWindow;
const DirMap = {
    "DOWNLOADS": `C:/Users/${Username}/Downloads`,
    "CURRENT_USER": `C:/Users/${Username}`
};
var Connections = {};
const PORT = 5020;
const YTSocket = new ws.WebSocketServer({ port: PORT });
const FFMPEGErrorHandlers = [
    function (userID, err) {
        err = err.replaceAll("\n", "");
        CLog("FFMPEG_ERR", err);
        console.log(err.includes("Invalid argument"));
        if (err.includes("Invalid argument")) {
            Connections[userID].send("DOWNLOAD_ERROR|INVALID_ARGUMENT|FFMPEG detected an invalid file name argument");
        }
    },
];
var appReady = false;
const LYTDir = removeLastDirFromString(__dirname, "\\");
const Region = "SERVER";
var Downloads = {};
var tray;
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
        titleBarStyle: "hidden",
        titleBarOverlay: {
            color: "#0f172a",
            symbolColor: "#ffffff"
        },
        webPreferences: {
            preload: path.join(__dirname, 'window/preload.js'),
        },
        icon: path.join(LYTDir, "/imgs/icon.png"),
    });
    mainWindow.loadFile('./dist/window/LYT.html');
}
function CLog(type, ...toLog) {
    console.log(`[${type}]`, ...toLog);
}
function Log(...toLog) {
    console.log(`[${Region}]`, ...toLog);
}
fs.readdirSync(path.join(LYTDir, "temp")).forEach(file => {
    fs.unlinkSync(path.join(LYTDir, `temp/${file}`));
});
const ContextMenu = electron.Menu.buildFromTemplate([
    { label: 'Show', click: function () {
            mainWindow.show();
        } },
    { label: 'Quit', click: function () {
            app.quit();
        } }
]);
const IPCHandlers = {
    'open-url': (_, url) => {
        CLog("OPEN_URL", `Opening URL: ${url}`);
        shell.openExternal(url);
    },
};
const IPCInvokeHandlers = {
    'get-video-info': async (_event, vid) => {
        var VData;
        await ytdl.getBasicInfo(`https://youtube.com/watch?v=${vid}`).then(data => {
            VData = data;
        });
        return VData;
    },
};
const SocketHandlers = {
    "DEBUG": function (userID, msg, ..._) {
        CLog(`CLIENT_${userID}`, `${msg}`);
    },
    "DOWNLOAD_VIDEO": function (userID, vid, fileName, dir, type, ..._) {
        if (!appReady) {
            CLog('YTDL_CORE', `Download Requested but App is not loaded!`);
        }
        if (!ytdl.validateID(vid)) {
            CLog(`YTDL_CORE`, `Video ID ${vid} is invalid`);
            return;
        }
        var DownloadID = randomUUID();
        DownloadID = DownloadID.replace(DownloadID.charAt(0), "LYT");
        const __dir = DirMap[dir];
        const fullDir = __dir + "/" + fileName;
        var downloadData = {
            downloadID: DownloadID,
            vid: vid,
            fileName: fileName,
            dir: __dir,
            fullDir: fullDir,
            type: type,
            hasErrored: false,
            error: "",
        };
        Downloads[DownloadID] = downloadData;
        sendMessageToClient("event-message", ["DOWNLOAD_REQUESTED", downloadData]);
        const tempFileName = randomUUID();
        var AudioDownloaded = false;
        var VideoDownloaded = false;
        var ErrorOccured = false;
        const parentDir = __dir + "/" + removeLastDirFromString(fileName, "/");
        if (!fs.existsSync(`${LYTDir}/temp`)) {
            fs.mkdirSync(`${LYTDir}/temp`, { recursive: true });
        }
        function HandleVideo() {
            if (ErrorOccured)
                return;
            if (type == "MP4")
                if (!AudioDownloaded || !VideoDownloaded)
                    return;
            if (type == "MP4") {
                ffmpeg()
                    .addInput(`${LYTDir}/temp/${tempFileName}_V.mp4`)
                    .addInput(`${LYTDir}/temp/${tempFileName}_A.mp4`)
                    .outputOptions(['-map 0:v', '-map 1:a', '-c:v copy', '-shortest'])
                    .saveToFile(fullDir).on('end', () => {
                    fs.unlinkSync(`${LYTDir}/temp/${tempFileName}_V.mp4`);
                    fs.unlinkSync(`${LYTDir}/temp/${tempFileName}_A.mp4`);
                    Connections[userID].send("DOWNLOAD_COMPLETE|");
                    const updateType = "DOWNLOAD_COMPLETE";
                    var updateData = {
                        downloadID: DownloadID,
                        updateType: updateType,
                        data: {},
                    };
                    sendMessageToClient("event-message", ["DOWNLOAD_UPDATE", updateData]);
                    CLog("FFMPEG_MP4", "Video Complete!");
                }).on("error", (err) => {
                    FFMPEGErrorHandlers.forEach(handler => handler(userID, err.toString()));
                });
            }
            else {
                ffmpeg()
                    .addInput(`${LYTDir}/temp/${tempFileName}_A.mp4`)
                    .saveToFile(fullDir).on('end', () => {
                    fs.unlinkSync(`${LYTDir}/temp/${tempFileName}_A.mp4`);
                    Connections[userID].send("DOWNLOAD_COMPLETE|");
                    const updateType = "DOWNLOAD_COMPLETE";
                    var updateData = {
                        downloadID: DownloadID,
                        updateType: updateType,
                        data: {},
                    };
                    sendMessageToClient("event-message", ["DOWNLOAD_UPDATE", updateData]);
                    CLog("FFMPEG_MP3", "Audio Complete!");
                }).on("error", (err) => {
                    FFMPEGErrorHandlers.forEach(handler => handler(userID, err.toString()));
                });
            }
        }
        CLog(`YTDL_CORE`, `Video ID valid, installing video to ${fullDir}...`);
        if (!fs.existsSync(parentDir)) {
            try {
                fs.mkdirSync(parentDir, { recursive: true });
            }
            catch (err) {
                CLog(`FS_MKDIR`, `Error occured while attempting to create directory. ${err}`);
                Connections[userID].send("DOWNLOAD_ERROR|DIRECTORY_ERROR");
                return;
            }
        }
        if (type == "MP4") {
            ytdl(`http://youtube.com/watch?v=${vid}`, { quality: "highestvideo", filter: (format) => { return format.mimeType.includes("video/mp4") && format.hasVideo; } }).pipe(fs.createWriteStream(`${LYTDir}/temp/${tempFileName}_V.mp4`)).on('finish', () => {
                VideoDownloaded = true;
                CLog("YTDL_CORE", "Video Download Complete!");
                HandleVideo();
                const updateType = "VIDEO_DOWNLOADED";
                var updateData = {
                    downloadID: DownloadID,
                    updateType: updateType,
                    data: {},
                };
                sendMessageToClient("event-message", ["DOWNLOAD_UPDATE", updateData]);
            }).on("error", (err) => {
                if (ErrorOccured)
                    return;
                CLog(`YTDL_CORE`, `Error while downloading video! Name: ${err.name} | Message: ${err.message}`);
                Connections[userID].send(`DOWNLOAD_ERROR|${err.message.split(":")[0]}|${err.message}`);
                ErrorOccured = true;
                const updateType = "VIDEO_ERROR";
                var updateData = {
                    downloadID: DownloadID,
                    updateType: updateType,
                    isError: ErrorOccured,
                    data: { err: err.message.split(":")[0] },
                };
                sendMessageToClient("event-message", ["DOWNLOAD_UPDATE", updateData]);
            });
        }
        ytdl(`http://youtube.com/watch?v=${vid}`, { quality: "highestaudio", filter: (format) => { return format.mimeType.includes("video/mp4") && format.hasAudio; } }).pipe(fs.createWriteStream(`${LYTDir}/temp/${tempFileName}_A.mp4`)).on('finish', () => {
            AudioDownloaded = true;
            CLog("YTDL_CORE", "Audio Download Complete!");
            HandleVideo();
            const updateType = "AUDIO_DOWNLOADED";
            var updateData = {
                downloadID: DownloadID,
                updateType: updateType,
                data: {},
            };
            sendMessageToClient("event-message", ["DOWNLOAD_UPDATE", updateData]);
        }).on("error", (err) => {
            if (ErrorOccured)
                return;
            CLog(`YTDL_CORE`, `Error while downloading audio! Name: ${err.name} | Message: ${err.message}`);
            Connections[userID].send(`DOWNLOAD_ERROR|${err.message.split(":")[0]}|${err.message}`);
            ErrorOccured = true;
            const updateType = "AUDIO_ERROR";
            var updateData = {
                downloadID: DownloadID,
                updateType: updateType,
                isError: ErrorOccured,
                data: { err: err.message.split(":")[0] },
            };
            sendMessageToClient("event-message", ["DOWNLOAD_UPDATE", updateData]);
        });
    },
};
YTSocket.on('connection', function (con) {
    CLog("ON_CONNECTION", "Client Connection Started...");
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
    mainWindow.on("close", (e) => {
        e.preventDefault();
        mainWindow.hide();
    });
    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) {
            createWindow();
        }
    });
    Object.entries(IPCHandlers).forEach(handler => {
        ipcMain.on(handler[0], handler[1]);
    });
    Object.entries(IPCInvokeHandlers).forEach(handler => {
        ipcMain.handle(handler[0], handler[1]);
    });
    tray = new Tray(electron.nativeImage.createFromPath(path.join(LYTDir, "imgs/icon.png")));
    tray.setContextMenu(ContextMenu);
    tray.setToolTip("LilYTDownloader");
    tray.setTitle("LilYTDownloader");
    appReady = true;
});
app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        YTSocket.close();
        app.quit();
    }
});
Log(`Listening on port ${PORT}`);
//# sourceMappingURL=server.js.map