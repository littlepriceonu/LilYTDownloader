import { IpcRendererEvent } from "electron"
import { IPC, ServerEvent, YoutubeDownloadRequest } from "./LYT"

import { contextBridge, ipcRenderer } from 'electron'

const Region = "PRELOAD"

//#region Functions

function CLog(type: string, ...toLog:any[]) {
    console.log(`[${type}]`, ...toLog)
}

function Log(...toLog: any[]) {
    console.log(`[${Region}]`, ...toLog)
}

//#endregion

//#region IPC stuff

var eventSubscriptions: { [event: string]: Array<Function> } = {}

const ExposedIPC: IPC = {
    openURL: (url: string) => {
        ipcRenderer.send("open-url", url)
    },
    subscribeToEvent: (event: string, callback: Function) => {
        if (!eventSubscriptions[event]) {
            eventSubscriptions[event] = [callback]
            return
        }
        
        eventSubscriptions[event].push(callback)
    },
    invokeInfoRequest: (vid: string) => {
        return new Promise(res => {
            ipcRenderer.invoke("get-video-info", vid).then(data => {
                res(data)
            })
        })
    }
}

contextBridge.exposeInMainWorld("IPC", ExposedIPC)

ipcRenderer.on('event-message', (_: IpcRendererEvent, message: ServerEvent) => {
    Log("Message Recieved!", message)
    if (!eventSubscriptions[message[0]]) return

    eventSubscriptions[message[0]].forEach(callback => {
        callback(message[1])
    })
})

//#endregion

Log("Loaded!")