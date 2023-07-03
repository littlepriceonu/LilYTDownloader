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
const TitleBarEventMap = {
    "MAXIMIZE": "maximize-clicked",
    "MINIMIZE": "minimize-clicked",
    "CLOSE": "close-clicked",
};
const ExposedIPC = {
    sendTitleBarEvent: (type) => {
        CLog("SEND_TITLE_BAR_EVENT", type, TitleBarEventMap[type]);
        electron_1.ipcRenderer.send(TitleBarEventMap[type]);
    },
    openURL: (url) => {
        electron_1.ipcRenderer.send("open-url", url);
    },
    subscribeToEvent: (event, callback) => {
        if (!eventSubscriptions[event]) {
            eventSubscriptions[event] = [callback];
            return;
        }
        eventSubscriptions[event].push(callback);
    },
    invokeInfoRequest: (vid) => {
        return new Promise(res => {
            electron_1.ipcRenderer.invoke("get-video-info", vid).then(data => {
                res(data);
            });
        });
    },
};
electron_1.contextBridge.exposeInMainWorld("IPC", ExposedIPC);
electron_1.ipcRenderer.on('event-message', (_, message) => {
    Log("Message Recieved!", message);
    if (!eventSubscriptions[message[0]])
        return;
    eventSubscriptions[message[0]].forEach(callback => {
        callback(message[1]);
    });
});
//# sourceMappingURL=preload.js.map