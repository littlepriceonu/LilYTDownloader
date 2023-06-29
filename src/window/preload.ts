const { contextBridge, ipcRenderer } = require('electron')

const Region = "PRELOAD"

//#region Functions

function CLog(type: string, ...toLog:any[]) {
    console.log(`[${type}]`, ...toLog)
}

function Log(...toLog: any[]) {
    console.log(`[${Region}]`, ...toLog)
}

//#endregion

contextBridge.exposeInMainWorld("IPC", {
    send: (url: string) => {
        ipcRenderer.send("open-url", url)
    },
})

Log("Hello World!")