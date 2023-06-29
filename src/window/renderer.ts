import { YoutubeDownloadRequest } from "./window"

const _Region = "RENDERER"

const videoDisplay = document.getElementsByClassName('videoDisplay').item(0)
videoDisplay.remove()

//#region Functions

function CLog_(type: string, ...toLog:any[]) {
    console.log(`[${type}]`, ...toLog)
}

function Log_(...toLog: any[]) {
    console.log(`[${_Region}]`, ...toLog)
}

//#endregion

//#region Misc

Array.from(document.getElementsByTagName("a")).forEach((el: HTMLAnchorElement) => {
    el.onclick = (e) => {
        if (!el.href) return

        e.preventDefault()
        window.IPC.sendURL(el.href)
    }
})

//#endregion

//#region Main Functionality

window.IPC.subscribeToEvent("DOWNLOAD_REQUESTED", (data: YoutubeDownloadRequest) => {
    Log_("data:", data)
    Log_("vid:", data.vid)
})

//#endregion
