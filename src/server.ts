import ytdl from 'ytdl-core';
import * as fs from 'fs';
import * as ws from 'ws';
import {randomUUID} from 'crypto';

// TODO
// Install entire playlists to a folder
// Set up a UI for the userscript
// 
// Userscript:
//  Folder Select
//  Name of file
//  Quality Select
//
// Server:
//  Quality Support

var Connections: {} = {}

const PORT = 5020

const YTSocket = new ws.WebSocketServer({ port: PORT })

const SocketHandlers = {
    "DEBUG": function(msg: string, ..._: string[]) {
        console.log(`[CLIENT] ${msg}`)
    },
    "DOWNLOAD_VIDEO": function(vid: string, fileName: string, ..._: string[]) {
        if (!ytdl.validateID(vid)) return;
        ytdl(`http://youtube.com/watch?v=${vid}`).pipe(fs.createWriteStream(fileName)).on('finish', ()=>{
            console.log("Download Complete!")
        })
    },
}

YTSocket.on('connection', function (con) {
    
    console.log("Client Connection Started...")

    con.on("message", (msg: ws.RawData | string) => {
        msg = msg.toString()
        // I use | as a message split tool
        const _Split = msg.split("|")
        // remove the first item in the array and make it msgID
        const msgID = _Split.shift()
        const msgData = _Split

        if (SocketHandlers[msgID]) {
            SocketHandlers[msgID](msgData)
        }
    })
})

console.log(`[LYT] Listening on port ${PORT}`)