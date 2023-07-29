import { DownloadedParts, LYTDownloadID, LYTSetting, YoutubeDownloadRequest as YoutubeDownloadData, YoutubeDownloadUpdate } from "./LYT"

const _Region = "RENDERER"

const videoDisplay = document.getElementsByClassName('videoDisplay').item(0)
videoDisplay.remove()

const ThumbNailString = "https://i.ytimg.com/vi/[ID]/maxresdefault.jpg"

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

const DownloadLocation = <HTMLDivElement>document.getElementById("DownloadLocation")
const DownloadSize = <HTMLDivElement>document.getElementById("DownloadSize")
const DownloadVID = <HTMLDivElement>document.getElementById("DownloadVID")
const VideoTitle = <HTMLHeadingElement>document.getElementById("VideoTitle")
const VideoAuthor = <HTMLHeadingElement>document.getElementById("VideoAuthor")
const ProgressText = <HTMLDivElement>document.getElementById("ProgressText")

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

function getVideoTypeIconFromID(id: LYTDownloadID): HTMLDivElement {
    return document.querySelector(`#${id} > div > div > div > div.typeIndicator`)
}

function getVideoProgressIconFromID(id: LYTDownloadID): HTMLDivElement {
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
        Downloads[data.downloadID].videoTitle = videoData.videoDetails.title
        Downloads[data.downloadID].videoAuthor = videoData.videoDetails.author.name

        if (CurrentInfoID == data.downloadID) {
            VideoTitle.innerText = videoData.videoDetails.title
            VideoAuthor.innerText = videoData.videoDetails.author.name
        }
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

    document.querySelector("#Settings > div:nth-child(1)").classList.remove("ContentActive")
    Settings.classList.add("ContentActive")

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

    SettingsHolder.append(newSetting)
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

/**
 * Gets the text to describe what is currently occuring within a download (i.e. "Downloading Audio & Video", "Finalizing Download...", "Download Complete", etc.)
 * @param `PartsFinished` Parts of a download that have finsished.
 * @param `DownloadID` The ID of the download
 * @returns `ProgressText` The Progress Text for the current amount downloaded
 */
function getProgressTextFromFinishedParts(PartsFinished: DownloadedParts, DownloadID: LYTDownloadID): string {
    // if the text doesn't get assigned lmfao
    var ProgressText = "Progress Text Error!"

    var ProgressToText: string;

    Downloads[DownloadID].type == "MP3" ? ProgressToText = "Video_" : ProgressToText = ""

    Object.entries(PartsFinished).forEach(part => {
        part[1] ? ProgressToText += part[0] : ProgressToText += `!${part[0]}` 

        ProgressToText += "_"
    })

    CLog_("PROGRESS_TO_TEXT", ProgressToText)

    ProgressText = ProgressTextMap[ProgressToText]

    return ProgressText
}

/**
 * Sets the info screen to display info of the requested ID
 * @param `downloadID` The ID of a download to display data on
 */
function setInfoVideo(downloadID: LYTDownloadID) {
    DownloadVID.innerText = Downloads[downloadID].vid
    DownloadLocation.innerText = Downloads[downloadID].fullDir
    Downloads[downloadID].downloadSize ? DownloadSize.innerText = `${Downloads[downloadID].downloadSize}mbs` : DownloadSize.innerText = "Downloading..."

    const Thumbnail = <HTMLImageElement>document.getElementById("Thumbnail")
    Thumbnail.src = ThumbNailString.replace("[ID]", Downloads[downloadID].vid)

    Downloads[downloadID].videoTitle ? VideoTitle.innerText = Downloads[downloadID].videoTitle : VideoTitle.innerText = "Loading..."
    Downloads[downloadID].videoAuthor ? VideoAuthor.innerText = Downloads[downloadID].videoAuthor : VideoAuthor.innerText = "Loading..."

    var parts = getPartsData(Downloads[downloadID].partsDownloaded)

    UpdateProgressBar(parts[0], parts[1])
    
    ProgressText.innerText = getProgressTextFromFinishedParts(Downloads[downloadID].partsDownloaded, downloadID)

    UpdateSelectedTab(InfoTab)
}

/**
 * Gets `PartsFinished` & `TotalParts` for {@link UpdateProgressBar}
 * @param partsDownloaded Parts of a video that has been downloaded
 * @returns `PartsFinished`, `TotalParts`
 */
function getPartsData(partsDownloaded: DownloadedParts): [number, number] {

    var parts: number = 0
    var totalParts: number = 0

    Object.entries(partsDownloaded).forEach(part => {
        totalParts += 1

        if (part[1] == true) {
            parts += 1
        }
    })
    
    return [parts, totalParts]
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
    data.type == "MP4" ? data.partsDownloaded = {
        Video: false,
        Audio: false,
        FinalOutput: false,
    } : data.partsDownloaded = {
        Audio: false,
        FinalOutput: false,
    }

    Downloads[data.downloadID] = data

    const sidebarVideo = addVideoToSidebar(data)

    sidebarVideo.onclick = () => {
        document.querySelector("#Info > div:nth-child(1)").classList.remove("ContentActive")
        Info.classList.add("ContentActive")

        CurrentInfoID = data.downloadID
        setInfoVideo(data.downloadID)
    }

    NothingsHereYet.classList.remove("ContentActive")
    Videos.classList.add("ContentActive")
})

// Updates a download with the recieved data
window.IPC.subscribeToEvent("DOWNLOAD_UPDATE", (data: YoutubeDownloadUpdate) => {
    CLog_("DOWNLOAD_UPDATE", "Download Update Data Recieved!")

    if (!data.updateType) throw new Error("DOWNLOAD_UPDATE did not have an updateType");

    Downloads[data.downloadID].updates ? Downloads[data.downloadID].updates.push(data) : Downloads[data.downloadID].updates = [data]

    // if the update is telling us the download errored
    if (data.isError) {
        // sets the little icon on the sidebar to a little exclamation point and make the icon red if the download errors
        getVideoProgressIconFromID(data.downloadID).classList.add(StatusIconMap["error"])
        getVideoProgressIconFromID(data.downloadID).setAttribute("data-status", "error")
        Downloads[data.downloadID].hasErrored = true
        Downloads[data.downloadID].error = data.data.error

        document.getElementById("ProgressText").innerText = `An Error Occured: ${data.data.err}`
    }

    // if the update is telling up the update is done
    if (!Downloads[data.downloadID].hasErrored && data.updateType == "DOWNLOAD_COMPLETE") {
        // sets the little icon on the sidebar to a little check and makes the icon green if the download is complete
        getVideoProgressIconFromID(data.downloadID).classList.add(StatusIconMap["success"])
        getVideoProgressIconFromID(data.downloadID).setAttribute("data-status", "success")
        Downloads[data.downloadID].hasFinished = true

        CLog_("DOWNLOAD_FINISHED", data.data)

        Downloads[data.downloadID].downloadSize = Math.round(data.data.size)

        DownloadSize.innerText = `${Math.round(data.data.size)}mbs` 
    }

    // if its info about how far the download has progressed
    if (DownloadedPartsMap[data.updateType]) {
        Downloads[data.downloadID].partsDownloaded[DownloadedPartsMap[data.updateType]] = true

        if (CurrentInfoID == data.downloadID) {
            const partsDownloaded = Downloads[data.downloadID].partsDownloaded 

            ProgressText.innerText = getProgressTextFromFinishedParts(partsDownloaded, data.downloadID)

            var parts = getPartsData(partsDownloaded)

            CLog_("PROGRESS_BAR", UpdateProgressBar(parts[0], parts[1]))
        }
    }
})

window.IPC.subscribeToEvent("DEBUG_MESSAGE", (message: string) => {
    CLog_("SERVER", message)
})

//#endregion

Log_("Loaded!")