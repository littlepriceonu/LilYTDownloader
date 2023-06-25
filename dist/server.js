import ytdl from 'ytdl-core';
import path from 'path';
import * as fs from 'fs';
import * as ws from 'ws';
import { randomUUID } from 'crypto';
import { fileURLToPath } from 'url';
import os from 'os';
import ffmpegPath from '@ffmpeg-installer/ffmpeg';
import ffmpeg from 'fluent-ffmpeg';
ffmpeg.setFfmpegPath(ffmpegPath.path);
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
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
const Username = os.userInfo().username;
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
//#region Functions
function removeLastDirFromString(dir, separator) {
    dir = dir.split(separator);
    dir.pop();
    dir = dir.join("/");
    return dir;
}
//#endregion
const SocketHandlers = {
    "DEBUG": function (userID, msg, ..._) {
        console.log(`[CLIENT_${userID}] ${msg}`);
    },
    "DOWNLOAD_VIDEO": function (userID, vid, fileName, dir, ..._) {
        if (!ytdl.validateID(vid)) {
            console.log(`[YTDL_CORE] Video ID ${vid} is invalid`);
            return;
        }
        var AudioDownloaded = false;
        var VideoDownloaded = false;
        var ErrorOccured = false;
        var CurrentDir = removeLastDirFromString(__dirname, "\\");
        var __dir = DirMap[dir];
        var fullDir = __dir + "/" + fileName;
        var parentDir = __dir + "/" + removeLastDirFromString(fileName, "/");
        function HandleVideo() {
            // Make sure both files are downloaded
            if (!AudioDownloaded || !VideoDownloaded || ErrorOccured)
                return;
            // https://stackoverflow.com/questions/56734348/how-to-add-audio-to-video-with-node-fluent-ffmpeg
            ffmpeg()
                .addInput(`${CurrentDir}/tempVideo.mp4`)
                .addInput(`${CurrentDir}/tempAudio.mp4`)
                // I fucking hate ffmpeg it can suck my fucking balls
                // https://superuser.com/questions/1584053/in-ffmpeg-why-wont-this-avc-video-convert-to-h264
                .outputOptions(['-map 0:v', '-map 1:a', '-c:v copy', '-shortest'])
                .saveToFile(fullDir).on('end', () => {
                // Delete the 2 temp vids
                fs.unlinkSync(`${CurrentDir}/tempVideo.mp4`);
                fs.unlinkSync(`${CurrentDir}/tempAudio.mp4`);
                // Let the client know we're done
                Connections[userID].send("DOWNLOAD_COMPLETE|");
            }).on("error", (err) => {
                FFMPEGErrorHandlers.forEach(handler => handler(userID, err.toString()));
            });
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
        ytdl(`http://youtube.com/watch?v=${vid}`, { filter: (format) => { return format.quality == "hd1080" && format.mimeType.includes("video/mp4") && format.hasVideo; } }).pipe(fs.createWriteStream(`${CurrentDir}/tempVideo.mp4`)).on('finish', () => {
            VideoDownloaded = true;
            console.log("[YTDL_CORE] Video Download Complete!");
            HandleVideo();
        }).on("error", (err) => {
            if (ErrorOccured)
                return;
            console.log(`[YTDL_CORE] Error while downloading! Name: ${err.name} | Message: ${err.message}`);
            Connections[userID].send(`DOWNLOAD_ERROR|${err.message.split(":")[0]}|${err.message}`);
            ErrorOccured = true;
        });
        ytdl(`http://youtube.com/watch?v=${vid}`, { filter: (format) => { return format.quality == "hd720" && format.mimeType.includes("video/mp4") && format.hasAudio; } }).pipe(fs.createWriteStream(`${CurrentDir}/tempAudio.mp4`)).on('finish', () => {
            AudioDownloaded = true;
            console.log("[YTDL_CORE] Audio Download Complete!");
            HandleVideo();
        }).on("error", (err) => {
            if (ErrorOccured)
                return;
            console.log(`[YTDL_CORE] Error while downloading! Name: ${err.name} | Message: ${err.message}`);
            Connections[userID].send(`DOWNLOAD_ERROR|${err.message.split(":")[0]}|${err.message}`);
            ErrorOccured = true;
        });
    },
};
YTSocket.on('connection', function (con) {
    console.log("[ON_CONNECTION] Client Connection Started...");
    // make it so the ID has a common placement in the string sent so it would be like
    // SOME_ID|User's Id|Data goes here|more data here|even more here
    con.on("message", (msg) => {
        msg = msg.toString();
        // I use | as a message split tool
        const _Split = msg.split("|");
        // remove the first item in the array and make it msgID
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
console.log(`[LYT] Listening on port ${PORT}`);
//# sourceMappingURL=server.js.map