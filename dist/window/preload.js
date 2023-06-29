const { contextBridge, ipcRenderer } = require('electron');
const Region = "PRELOAD";
function CLog(type, ...toLog) {
    console.log(`[${type}]`, ...toLog);
}
function Log(...toLog) {
    console.log(`[${Region}]`, ...toLog);
}
contextBridge.exposeInMainWorld("IPC", {
    send: (url) => {
        ipcRenderer.send("open-url", url);
    },
});
Log("Hello World!");
//# sourceMappingURL=preload.js.map