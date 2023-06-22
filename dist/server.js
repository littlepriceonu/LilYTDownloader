import ytdl from 'ytdl-core';
import path from 'path';
import * as fs from 'fs';
import * as ws from 'ws';
import { randomUUID } from 'crypto';
import { fileURLToPath } from 'url';
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
var Connections = {};
const PORT = 5020;
const YTSocket = new ws.WebSocketServer({ port: PORT });
//#region Functions
function removeLastDirFromString(dir, separator) {
    dir = dir.split(separator);
    dir.pop();
    dir = dir.join("/");
    return dir;
}
//#endregion
const SocketHandlers = {
    "DEBUG": function (msg, ..._) {
        console.log(`[CLIENT] ${msg}`);
    },
    "DOWNLOAD_VIDEO": function (userID, vid, fileName, ..._) {
        if (!ytdl.validateID(vid)) {
            console.log(`[YTDL_CORE] Video ID ${vid} is invalid`);
            return;
        }
        var dir = removeLastDirFromString(fileName, "/");
        var __dir = removeLastDirFromString(__dirname, "\\");
        console.log(`[YTDL_CORE] Video ID valid, installing video to ${__dir}/${fileName}...`);
        if (!fs.existsSync(__dir + "/" + dir)) {
            fs.mkdirSync(__dir + "/" + dir, { recursive: true });
        }
        ytdl(`http://youtube.com/watch?v=${vid}`).pipe(fs.createWriteStream(`${__dir}/${fileName}`)).on('finish', () => {
            console.log("[YTDL_CORE] Download Complete!");
            Connections[userID].send("DOWNLOAD_COMPLETE|");
        }).on("error", (err) => {
            console.log(`[YTDL_CORE] Error while downloading! Name: ${err.name} | Message: ${err.message}`);
            Connections[userID].send(`DOWNLOAD_ERROR|${err.name}`);
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