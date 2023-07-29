//#region Variables

import { DownloadDirectory, DownloadFileName, DownloadFileType } from "../../src/window/LYT"

const Region = "POPUP"

const DownloadButton = <HTMLInputElement>document.getElementById("DownloadButton")
const TypeInput = <HTMLSelectElement>document.getElementById("TypeInput")
const DirectoryInput = <HTMLSelectElement>document.getElementById("DirectoryInput")
const FileNameInput = <HTMLInputElement>document.getElementById("FileNameInput")

const NotYoutube = <HTMLDivElement>document.getElementById("NotYoutube")
const VideoDisplay = <HTMLDivElement>document.getElementById("VideoDisplay")

const Thumbnail = <HTMLImageElement>document.getElementById("Thumbnail")
const Title = <HTMLHeadingElement>document.getElementById("Title")
const Author = <HTMLHeadingElement>document.getElementById("Author")

function CLog(type: string, ...toLog:any[]) {
    console.log(`[${type}]`, ...toLog)
}

function Log(...toLog: any[]) {
    console.log(`[${Region}]`, ...toLog)
}

/**
 * Get chrome's current tab
 * @returns `Promise` A promise that resolves with the tab.
 */
function GetCurrentTab(): Promise<chrome.tabs.Tab> {
    return new Promise((res) => {chrome.tabs.query({active: true, currentWindow: true}).then((tab)=>{
        chrome.tabs.get(tab[0].id).then((tab) => {
            CLog("CURRENT_TAB", tab)
            res(tab)
        })
    })})
}

/**
 * Sends a message to chromes current opened tab
 * @param type Type of message to send. See {@link Extension.CommunicationType}
 * @param data Data to send with the message. See {@link Extension.CommunicationData}
 */
function SendMessageToCurrentTab(type: Extension.CommunicationType, data: Extension.CommunicationData): Promise<Extension.CommunicationData> {
    const toSend: Extension.Communication = {type: type, data: data}

    return new Promise(res => {
        GetCurrentTab().then((tab) => {
            res(chrome.tabs.sendMessage(tab.id, toSend))
        })
    })
}

function GetThumbnailURLfromVID(vid: string): string {
    return `https://i.ytimg.com/vi/${vid}/maxresdefault.jpg`
}

const ServiceWorkerHandlers: {[key: string]: Function} = {}

const YoutubeHandlers: {[key: string]: Function} = {}

//#endregion

//#region Main

var CurrentVideo: Extension.VideoInfoResponse = {
    vid: null,
    title: null,
    author: null,
}

GetCurrentTab().then((tab) => {
    if (tab.url?.includes("youtube.com/watch?v=")) {
        SendMessageToCurrentTab("GET_VIDEO_INFO", {}).then((data: Extension.VideoInfoResponse) => {
            CLog("RETURNED_VIDEO_INFO", data)

            Title.innerText = data.title
            Author.innerText = data.author
            Thumbnail.src = GetThumbnailURLfromVID(data.vid)

            Thumbnail.onload = () => {
                NotYoutube.classList.remove("ContentActive")
                VideoDisplay.classList.add("ContentActive")
            }

            CurrentVideo = data
        })
    }
})

chrome.tabs.onUpdated.addListener((_tabId, changeInfo, tab)=>{
    CLog("TAB_UPDATED", changeInfo.url, tab.url, changeInfo.url?.includes("youtube.com/watch?v="), tab.url?.includes("youtube.com/watch?v="))

    if (changeInfo.url?.includes("youtube.com/watch?v=") || tab.url?.includes("youtube.com/watch?v=")) {
        SendMessageToCurrentTab("GET_VIDEO_INFO", {}).then((data: Extension.VideoInfoResponse) => {
            CLog("RETURNED_VIDEO_INFO", data)

            Title.innerText = data.title
            Author.innerText = data.author
            Thumbnail.src = GetThumbnailURLfromVID(data.vid)

            Thumbnail.onload = () => {
                NotYoutube.classList.remove("ContentActive")
                VideoDisplay.classList.add("ContentActive")
            }

            CurrentVideo = data
        })
    }
    else {
        NotYoutube.classList.add("ContentActive")
        VideoDisplay.classList.remove("ContentActive")

        CurrentVideo = {
            vid: null,
            title: null,
            author: null,
        }
    }
})

// Recieves message from the service-worker & content scripts
chrome.runtime.onMessage.addListener((message: Extension.Communication, sender: chrome.runtime.MessageSender, _sendResponse: Function): boolean => {
    let CRegion = "ON_MESSAGE"
    
    if (sender.origin == undefined || null) {
        CLog(CRegion, "Sender may be service-worker")

        if (ServiceWorkerHandlers[message.type]) {
            ServiceWorkerHandlers[message.type](message.data, sender, _sendResponse)
        }
        // ! everything past this point is from content scripts
        return
    }

    if (YoutubeHandlers[message.type]) {
        YoutubeHandlers[message.type](message.data, sender, _sendResponse)
    }

    CLog(CRegion, sender.origin, message)

    return false
})

DownloadButton.onclick = () => {
    if (!CurrentVideo.vid) return

    const FilteredFileName = TypeInput.value == "MP4" ? FileNameInput.value + ".mp4" : FileNameInput.value + ".mp3"

    const downloadInfo: Extension.DownloadRequest = {
        vid: CurrentVideo.vid,
        fileName: FilteredFileName as DownloadFileName, 
        directory: DirectoryInput.value as DownloadDirectory,
        type: TypeInput.value as DownloadFileType,
    }

    const toSend: Extension.Communication = {
        type: 'DOWNLOAD_VIDEO',
        data: downloadInfo,
    }

    chrome.runtime.sendMessage(toSend)
}

//#endregion-

Log("Hello, World!")

export {}