import { YoutubeDownloadRequest as YoutubeDownloadData } from "./LYT"

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

    //videoID.innerText = data.vid
    window.Vibrant.from(thumbnail.src).quality(1).clearFilters().getPalette().then((palette: any) => {
        const StartingRGB = palette.Vibrant.rgb;
        const StartingColor = `rgba(${StartingRGB[0].toString()}, ${StartingRGB[1].toString()}, ${StartingRGB[2].toString()}, 0.7)`;
        
        const EndingRGB = palette.LightVibrant.rgb;
        const EndingColor = `rgba(${EndingRGB[0].toString()}, ${EndingRGB[1].toString()}, ${EndingRGB[2].toString()}, 0.55)`;
        

        //newVideoDisplay.style.setProperty("--gradient-from", StartingColor)
        //newVideoDisplay.style.setProperty("--gradient-to", EndingColor)


        CLog_("VIBRANT", palette)
    });

    
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
            window.IPC.openURL(el.href)
        }
        else if (granted && isMe) {
            e.preventDefault()
            LilYTDownloaderText.innerText = "[ACCESS GRANTED]"
            LilYTDownloaderText.classList.add("ACCESS_GRANTED")
        }
    }
})

//#endregion

//#region Main Functionality

window.IPC.subscribeToEvent("DOWNLOAD_REQUESTED", (data: YoutubeDownloadData) => {
    Downloads[data.downloadID] = data

    addVideoToSidebar(data)

    NothingsHereYet.classList.remove("ContentActive")
    Videos.classList.add("ContentActive")
})

//#endregion
