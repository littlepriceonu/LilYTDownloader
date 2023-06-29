"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const electron_1 = require("electron");
const Region = "PRELOAD";
function CLog(type, ...toLog) {
    console.log(`[${type}]`, ...toLog);
}
function Log(...toLog) {
    console.log(`[${Region}]`, ...toLog);
}
var eventSubscriptions = {};
electron_1.contextBridge.exposeInMainWorld("IPC", {
    send: (type, data) => {
        electron_1.ipcRenderer.send(type, data);
    },
    sendURL: (url) => {
        electron_1.ipcRenderer.send("open-url", url);
    },
    subscribeToEvent: (event, callback) => {
        if (!eventSubscriptions[event]) {
            eventSubscriptions[event] = [callback];
            return;
        }
        eventSubscriptions[event].push(callback);
    }
});
electron_1.ipcRenderer.on('event-message', (_, message) => {
    Log("Message Recieved!", message);
    if (!eventSubscriptions[message[0]])
        return;
    eventSubscriptions[message[0]].forEach(callback => {
        callback(message[1]);
    });
});
//# sourceMappingURL=preload.js.map