import { YoutubeDownloadRequest as YoutubeDownloadData } from "./window"

const _Region = "RENDERER"

const videoDisplay = document.getElementsByClassName('videoDisplay').item(0)
videoDisplay.remove()

const ThumbNailString = "https://i.ytimg.com/vi/[ID]/default.jpg"

const SideBar = document.getElementById("SideBar")

const ErrorMap = {
    "EPREM": "No Permission To Create This File!",
    "EISDIR": "File Name Invalid!",
    "INVALID_ARGUMENT": "File Name Invalid!",
    "DIRECTORY_ERROR": "File Name Invalid!"
}

var Downloads: { [id: string]: YoutubeDownloadData } = {}

//#region Functions

function CLog_(type: string, ...toLog:any[]) {
    console.log(`[${type}]`, ...toLog)
}

function Log_(...toLog: any[]) {
    console.log(`[${_Region}]`, ...toLog)
}

//! work on this, idk why its error about the selectors 
function addVideoToSidebar(data: YoutubeDownloadData) {
    var newVideoDisplay = videoDisplay.cloneNode(true) as HTMLDivElement
    newVideoDisplay.id = data.downloadID

    SideBar.prepend(newVideoDisplay)

    var thumbnail = document.querySelector(`${data.downloadID} > div > .videoThumbnail`) as HTMLImageElement
    thumbnail.src = ThumbNailString.replace("[ID]", data.vid)

    var title = document.querySelector(`${data.downloadID} > div > .videoTitle`) as HTMLHeadingElement
    var videoID = document.querySelector(`${data.downloadID} > div > .videoId`) as HTMLParagraphElement

    videoID.innerText = data.vid
    
    window.IPC.invokeInfoRequest(data.vid).then( videoData => {
        CLog_("INVOKE_INFO_REQUEST", videoData)
        videoData = videoData as any
        title.innerText = (videoData as any).title
    })

    document.querySelector(`${data.downloadID} > div > .videoTitle`)
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

window.IPC.subscribeToEvent("DOWNLOAD_REQUESTED", (data: YoutubeDownloadData) => {
    Downloads[data.downloadID] = data

    addVideoToSidebar(data)
})

//#endregion
