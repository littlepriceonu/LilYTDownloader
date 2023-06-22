import ytdl from 'ytdl-core';
import * as fs from 'fs';
import * as ws from 'ws';
import { randomUUID } from 'crypto';
// TODO
// Install entire playlists to a folder
// Choose between mp4 and mp3
// Set up a UI for the userscript
// 
// Userscript:
//  Folder Select 
//  Name of file
//  Quality Select
//
// Server:
//  Quality Support
//  Check if file exists
var Connections = {};
const PORT = 5020;
const YTSocket = new ws.WebSocketServer({ port: PORT });
const SocketHandlers = {
    "DEBUG": function (msg, ..._) {
        console.log(`[CLIENT] ${msg}`);
    },
    "DOWNLOAD_VIDEO": function (userID, vid, fileName, ..._) {
        if (!ytdl.validateID(vid)) {
            console.log(`[YTDL_CORE] Video ID ${vid} is invalid`);
            return;
        }
        console.log(`[YTDL_CORE] Video ID valid, installing video to ./downloads/${fileName}...`);
        ytdl(`http://youtube.com/watch?v=${vid}`).pipe(fs.createWriteStream(`./downloads/${fileName}`)).on('finish', () => {
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