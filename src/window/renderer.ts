import { YoutubeDownloadRequest as YoutubeDownloadData } from "./window"

const _Region = "RENDERER"

const videoDisplay = document.getElementsByClassName('videoDisplay').item(0)
videoDisplay.remove()

const ThumbNailString = "https://i.ytimg.com/vi/[ID]/default.jpg"

const ErrorMap = {
    "EPREM": "No Permission To Create This File!",
    "EISDIR": "File Name Invalid!",
    "INVALID_ARGUMENT": "File Name Invalid!",
    "DIRECTORY_ERROR": "File Name Invalid!"
}

var Downloads: { [id: string]: YoutubeDownloadData } = {}

const Videos = <HTMLDivElement>document.getElementById("Videos");
const NothingsHereYet = <HTMLDivElement>document.getElementById("NothingsHereYet");
const LilYTDownloaderText = <HTMLHeadingElement>document.getElementById("LilYTDownloader")

const CloseApp = document.getElementById("CloseApp")
const MaximizeApp = document.getElementById("MaximizeApp")
const MinimizeApp = document.getElementById("MinimizeApp")

const SettingsButton = document.getElementById("SettingsButton")

SettingsButton.onclick = () => {
    if (SettingsButton.style.rotate == "90deg") {
        // close settings
        SettingsButton.style.rotate = "0deg"
    }
    else {
        // open settings
        SettingsButton.style.rotate = "90deg"
    }
}

//#region Functions

function CLog_(type: string, ...toLog:any[]) {
    console.log(`[${type}]`, ...toLog)
}

function Log_(...toLog: any[]) {
    console.log(`[${_Region}]`, ...toLog)
}

function addVideoToSidebar(data: YoutubeDownloadData) {
    var newVideoDisplay = videoDisplay.cloneNode(true) as HTMLDivElement
    newVideoDisplay.id = data.downloadID

    Videos.prepend(newVideoDisplay)
    
    CLog_("SIDEBAR", `#${data.downloadID} > div > .videoThumbnail`)

    var thumbnail = document.querySelector(`#${data.downloadID} > div > .videoThumbnail`) as HTMLImageElement
    thumbnail.src = ThumbNailString.replace("[ID]", data.vid)

    var title = document.querySelector(`#${data.downloadID} > div > .videoTitle`) as HTMLHeadingElement
    var videoID = document.querySelector(`#${data.downloadID} > div > .videoId`) as HTMLParagraphElement

    videoID.innerText = data.vid
    
    window.IPC.invokeInfoRequest(data.vid).then( videoData => {
        CLog_("INVOKE_INFO_REQUEST", videoData)

        title.innerText = videoData.videoDetails.title
    })
}

//#endregion

//#region Misc

var access = 0
var granted = false

Array.from(document.getElementsByTagName("a")).forEach((el: HTMLAnchorElement) => {
    el.onclick = (e) => {
        const isMe = el.id == "Littlepriceonu"

        if (isMe) {
            access += 1

            if (access == 3) granted = true
            else granted = false
        }

        if (!el.href) return

        if (!granted) {
            e.preventDefault()
            window.IPC.sendURL(el.href)
        }
        else if (granted && isMe) {
            e.preventDefault()
            LilYTDownloaderText.innerText = "[ACCESS GRANTED]"
            LilYTDownloaderText.classList.add("ACCESS_GRANTED")
        }
    }
})

//#endregion

//#region Title Bar

MaximizeApp.onclick = () => {
    window.IPC.sendTitleBarEvent("MAXIMIZE")
}

MinimizeApp.onclick = () => {
    window.IPC.sendTitleBarEvent("MINIMIZE")
}

CloseApp.onclick = () => {
    window.IPC.sendTitleBarEvent("CLOSE")
}

//#endregion

//#region Main Functionality

window.IPC.subscribeToEvent("DOWNLOAD_REQUESTED", (data: YoutubeDownloadData) => {
    Downloads[data.downloadID] = data

    addVideoToSidebar(data)

    NothingsHereYet.classList.remove("ContentActive")
    Videos.classList.add("ContentActive")
})

//#endregion
