import { DownloadedParts, LYTSetting, YoutubeDownloadRequest as YoutubeDownloadData, YoutubeDownloadUpdate } from "./LYT"

const _Region = "RENDERER"

const videoDisplay = document.getElementsByClassName('videoDisplay').item(0)
videoDisplay.remove()

const ThumbNailString = "https://i.ytimg.com/vi/[ID]/default.jpg?sqp=-oaymwEcCNACELwBSFXyq4qpAw4IARUAAIhCGAFwAcABBg==&rs=AOn4CLDPQuXeHaS8R2hZSgRzLiOskHiziQ"

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

const DownloadInfo = <HTMLDivElement>document.getElementById("DownloadInfo")

const OuterTabBar = <HTMLDivElement>document.getElementById("OuterTabBar")

const SettingsTab = <HTMLDivElement>document.getElementById("SettingsTab")
const InfoTab = <HTMLDivElement>document.getElementById("InfoTab")
const HomeTab = <HTMLDivElement>document.getElementById("HomeTab")

const Settings = <HTMLDivElement>document.getElementById("Settings")
const Info = <HTMLDivElement>document.getElementById("Info")
const Home = <HTMLDivElement>document.getElementById("Home")

const TabIndicator = <HTMLDivElement>document.getElementById("TabIndicator")

const SettingsHolder = <HTMLDivElement>document.getElementById("SettingsHolder")
const SettingTemplate = <HTMLDivElement>document.getElementsByClassName("Setting").item(0)
SettingTemplate.remove()

TabIndicator.style.top = `${(TabIndicator.parentElement.getBoundingClientRect().height-TabIndicator.getBoundingClientRect().height)/2}px`

var currentTab = HomeTab

const TabMap: { [key: string]: HTMLDivElement} = {
    "HomeTab": Home,
    "InfoTab": Info,
    "SettingsTab": Settings,  
}

const StatusIconMap = {
    "error": "fa-exclamation",
    "success": "fa-check",
    "inprogress": "",
}

const DownloadTypeIconMap = {
    "MP4": "fa-video",
    "MP3": "fa-headphones"
}

const DownloadedPartsMap = {
    "VIDEO_DOWNLOADED": "Video",
    "AUDIO_DOWNLOADED": "Audio",
    "DOWNLOAD_COMPLETE": "FinalOutput"
}

const ProgressTextMap: {[id: string]: string} = {
    "Video_!Audio_!FinalOutput_": "Downloading Audio...",
    "Video_Audio_!FinalOutput_": "Finalizing...",
    "!Video_Audio_!FinalOutput_": "Downloading Video...",
    "!Video_!Audio_!FinalOutput_": "Downloading Video & Audio...",
    "Video_Audio_FinalOutput_": "Download Complete!",
}

var CurrentInfoID: string;

var RegisteredSettings: {[settingID: string]: LYTSetting} = {

}

//#region Functions

const OnResize = [
    function () {
        OuterTabBar.style.top = `${DownloadInfo.getBoundingClientRect().height - OuterTabBar.getBoundingClientRect().height}px`
    },
    function () {
        TabIndicator.style.left = `${currentTab.getBoundingClientRect().x-currentTab.parentElement.getBoundingClientRect().x}px`
        TabIndicator.style.width = `${currentTab.getBoundingClientRect().width}px`
    }
]

function CLog_(type: string, ...toLog:any[]) {
    console.log(`[${type}]`, ...toLog)
}

function Log_(...toLog: any[]) {
    console.log(`[${_Region}]`, ...toLog)
}

function getVideoTypeIconFromID(id: `${string}-${string}-${string}-${string}-${string}`): HTMLDivElement {
    return document.querySelector(`#${id} > div > div > div > div.typeIndicator`)
}

function getVideoProgressIconFromID(id: `${string}-${string}-${string}-${string}-${string}`): HTMLDivElement {
    return document.querySelector(`#${id} > div > div > div > div.downloadProgress`)
}

/**
 * Adds a video to download in the sidebar
 * @param `data` Youtube download data to add to the sidebar
 * @returns `Video` The HTML element that was added to the sidebar
 */
function addVideoToSidebar(data: YoutubeDownloadData): HTMLDivElement {
    var newVideoDisplay = videoDisplay.cloneNode(true) as HTMLDivElement
    newVideoDisplay.id = data.downloadID

    Videos.prepend(newVideoDisplay)
    
    CLog_("SIDEBAR", `#${data.downloadID} > div > .videoThumbnail`)

    var thumbnail = document.querySelector(`#${data.downloadID} > div > .videoThumbnail`) as HTMLImageElement
    thumbnail.src = ThumbNailString.replace("[ID]", data.vid)

    var title = document.querySelector(`#${data.downloadID} > div > div > .videoTitle`) as HTMLHeadingElement

    // Old Vibrant Thing
    //window.Vibrant.from(thumbnail.src).quality(1).clearFilters().getPalette().then((palette: any) => {
    //    const StartingRGB = palette.Vibrant.rgb;
    //    const StartingColor = `rgba(${StartingRGB[0].toString()}, ${StartingRGB[1].toString()}, ${StartingRGB[2].toString()}, 0.7)`;
    //    
    //    const EndingRGB = palette.LightVibrant.rgb;
    //    const EndingColor = `rgba(${EndingRGB[0].toString()}, ${EndingRGB[1].toString()}, ${EndingRGB[2].toString()}, 0.55)`;
    //    
    //
    //    //newVideoDisplay.style.setProperty("--gradient-from", StartingColor)
    //    //newVideoDisplay.style.setProperty("--gradient-to", EndingColor)
    //
    //
    //    CLog_("VIBRANT", palette)
    //});

    getVideoTypeIconFromID(data.downloadID).classList.add(DownloadTypeIconMap[data.type])

    getVideoProgressIconFromID(data.downloadID).setAttribute("data-status", "inprogress")
    
    window.IPC.invokeInfoRequest(data.vid).then( videoData => {
        CLog_("INVOKE_INFO_REQUEST", videoData)

        title.innerText = videoData.videoDetails.title
    })

    return newVideoDisplay
}

/**
 * Updates the currently selected tab (i.e. Home, Info, Settings)
 * @param `tabSelected` Tab that was selected 
 */
function UpdateSelectedTab(tabSelected: HTMLDivElement) {
    if (currentTab == tabSelected) return

    TabMap[currentTab.id].classList.remove("ContentActive")
    TabMap[tabSelected.id].classList.add("ContentActive")

    currentTab = tabSelected

    TabIndicator.style.left = `${currentTab.getBoundingClientRect().x-currentTab.parentElement.getBoundingClientRect().x}px`
    TabIndicator.style.width = `${currentTab.getBoundingClientRect().width}px`
}

/**
 * Registers a new LYT setting
 * @param `setting` Data for the setting to register (see LYTSetting)
 */
function RegisterSetting(setting: LYTSetting) {
    if (RegisteredSettings[setting.settingID]) {CLog_("REGISTER_SETTING", `Setting ${setting.settingID} has already been registered!`); return;}

    const newSetting = <HTMLDivElement>SettingTemplate.cloneNode(true)
    newSetting.id = setting.settingID

    // Implement saving settings on server
    document.getElementById(`#${setting.settingID} > div > .settingName`).innerText = setting.title
    document.getElementById(`#${setting.settingID} > .settingDescription`).innerText = setting.description

    const settingToggle = <HTMLInputElement>document.getElementById(`#${setting.settingID} > div > .settingState`)

    settingToggle.onclick = (event) => {
        setting.eventCallback.forEach(func => {
            func(settingToggle.checked, event)
        })
    }

    RegisteredSettings[setting.settingID] = setting 
}

/**
 * Updates the progress bar in the info tab
 * @param `PartsFinished` Parts of a download that have finsished.
 * @param `TotalParts` The total parts of a download that have to finish.
 * @returns `DownloadProgressBar` The HTML element of the progressbar, `IsFinshed` If the progress bar is full
 */
function UpdateProgressBar(PartsFinished: number, TotalParts: number): [HTMLDivElement, boolean] {
    const DownloadProgressBar = <HTMLDivElement>document.getElementById("DownloadProgressBar")
    const FullLength = DownloadProgressBar.parentElement.getBoundingClientRect().width
    const LengthPerPart = FullLength / TotalParts

    DownloadProgressBar.style.width = `${LengthPerPart * PartsFinished}px`

    return [DownloadProgressBar, (PartsFinished == TotalParts)]
}

function GetProgressTextFromFinishedParts(PartsFinished: DownloadedParts, DownloadID: `${string}-${string}-${string}-${string}-${string}`): string {
    // if the text doesn't get assigned lmfao
    var ProgressText = "Progress Text Error!"

    var ProgressToText = ""

    Object.entries(PartsFinished).forEach(part => {
        if (part[0] == "Audio" && Downloads[DownloadID].type == "MP3") {ProgressToText += "Audio_"; return;}

        part[1] ? ProgressToText += part[0] : ProgressToText += `!${part[0]}` 

        ProgressToText += "_"
    })

    CLog_("PROGRESS_TO_TEXT", ProgressToText)

    ProgressText = ProgressTextMap[ProgressToText]

    return ProgressText
}

//#endregion

//#region Misc

var access = 0
var granted = false

// triple click on pfp
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

OnResize.forEach(func => {
    func()
})

addEventListener("resize", ()=>{
    OnResize.forEach(func => {
        func()
    })
})

//#endregion

//#region Tab Functionality

// stupid timeouts cause font-awesome needs time to load icons
setTimeout(() => {
    TabIndicator.style.left = `${currentTab.getBoundingClientRect().x-currentTab.parentElement.getBoundingClientRect().x}px`
    TabIndicator.style.width = `${currentTab.getBoundingClientRect().width}px`
}, 150);

setTimeout(() => {
    TabIndicator.style.left = `${currentTab.getBoundingClientRect().x-currentTab.parentElement.getBoundingClientRect().x}px`
    TabIndicator.style.width = `${currentTab.getBoundingClientRect().width}px`
}, 300);

SettingsTab.onclick = () => {
    UpdateSelectedTab(SettingsTab)
}

HomeTab.onclick = () => {
    UpdateSelectedTab(HomeTab)
}

InfoTab.onclick = () => {
    UpdateSelectedTab(InfoTab)
}

//#endregion

//#region Main Functionality

window.IPC.subscribeToEvent("DOWNLOAD_REQUESTED", (data: YoutubeDownloadData) => {
    data.type == "MP3" ? data.partsDownloaded = {
        Audio: false,
        FinalOutput: false
    } : data.partsDownloaded = {
        Video: false,
        Audio: false,
        FinalOutput: false,
    }

    Downloads[data.downloadID] = data

    const sidebarVideo = addVideoToSidebar(data)

    sidebarVideo.onclick = () => {
        
    }

    NothingsHereYet.classList.remove("ContentActive")
    Videos.classList.add("ContentActive")
})

// Updates a download with the recieved data
window.IPC.subscribeToEvent("DOWNLOAD_UPDATE", (data: YoutubeDownloadUpdate) => {
    CLog_("DOWNLOAD_UPDATE", "Download Update Data Recieved!")

    if (!data.updateType) throw new Error("DOWNLOAD_UPDATE did not have an updateType");

    Downloads[data.downloadID].updates ? Downloads[data.downloadID].updates.push(data) : Downloads[data.downloadID].updates = [data]

    // sets the little icon on the sidebar to a little exclamation point and make the icon red if the download errors
    if (data.isError) {
        getVideoProgressIconFromID(data.downloadID).classList.add(StatusIconMap["error"])
        getVideoProgressIconFromID(data.downloadID).setAttribute("data-status", "error")
        Downloads[data.downloadID].hasErrored = true
        Downloads[data.downloadID].error = data.data.error
    }

    // sets the little icon on the sidebar to a little check and makes the icon green if the download is complete
    if (!Downloads[data.downloadID].hasErrored && data.updateType == "DOWNLOAD_COMPLETE") {
        getVideoProgressIconFromID(data.downloadID).classList.add(StatusIconMap["success"])
        getVideoProgressIconFromID(data.downloadID).setAttribute("data-status", "success")
        Downloads[data.downloadID].hasFinished = true
    }

    // if its info about how far the download has progressed
    if (DownloadedPartsMap[data.updateType]) {
        Downloads[data.downloadID].partsDownloaded[DownloadedPartsMap[data.updateType]] = true

        //if (CurrentInfoID == data.downloadID) {
            const ProgressText = <HTMLDivElement>document.getElementById("ProgressText")
            const partsDownloaded = Downloads[data.downloadID].partsDownloaded 

            ProgressText.innerText = GetProgressTextFromFinishedParts(partsDownloaded, data.downloadID)

            var parts: number = 0
            var totalParts: number = 0

            Object.entries(partsDownloaded).forEach(part => {
                totalParts += 1

                if (part[1] == true) {
                    parts += 1
                }
            })

            CLog_("PROGRESS_BAR", UpdateProgressBar(parts, totalParts))
        //}
    }
})

//#endregion

Log_("Loaded!")