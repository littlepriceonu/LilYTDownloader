import { IpcRendererEvent } from "electron"
import { ServerEvent, YoutubeDownloadRequest } from "./window"

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

contextBridge.exposeInMainWorld("IPC", {
    sendURL: (url: string) => {
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
    },
})

ipcRenderer.on('event-message', (_: IpcRendererEvent, message: ServerEvent) => {
    Log("Message Recieved!", message)
    if (!eventSubscriptions[message[0]]) return

    eventSubscriptions[message[0]].forEach(callback => {
        callback(message[1])
    })
})

//#endregion