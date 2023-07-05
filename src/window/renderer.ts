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

const DownloadInfo = <HTMLDivElement>document.getElementById("DownloadInfo")

const OuterTabBar = <HTMLDivElement>document.getElementById("OuterTabBar")

const SettingsTab = <HTMLDivElement>document.getElementById("SettingsTab")
const InfoTab = <HTMLDivElement>document.getElementById("InfoTab")
const HomeTab = <HTMLDivElement>document.getElementById("HomeTab")

const Settings = <HTMLDivElement>document.getElementById("Settings")
const Info = <HTMLDivElement>document.getElementById("Info")
const Home = <HTMLDivElement>document.getElementById("Home")

const TabIndicator = <HTMLDivElement>document.getElementById("TabIndicator")

TabIndicator.style.top = `${(TabIndicator.parentElement.getBoundingClientRect().height-TabIndicator.getBoundingClientRect().height)/2}px`

var currentTab = HomeTab

// stupid timeouts cause font-awesome needs time to load icons
setTimeout(() => {
    TabIndicator.style.left = `${currentTab.getBoundingClientRect().x-currentTab.parentElement.getBoundingClientRect().x}px`
    TabIndicator.style.width = `${currentTab.getBoundingClientRect().width}px`
}, 150);

setTimeout(() => {
    TabIndicator.style.left = `${currentTab.getBoundingClientRect().x-currentTab.parentElement.getBoundingClientRect().x}px`
    TabIndicator.style.width = `${currentTab.getBoundingClientRect().width}px`
}, 300);

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

var CurrentInfoID: string;

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

function addVideoToSidebar(data: YoutubeDownloadData) {
    var newVideoDisplay = videoDisplay.cloneNode(true) as HTMLDivElement
    newVideoDisplay.id = data.downloadID

    Videos.prepend(newVideoDisplay)
    
    CLog_("SIDEBAR", `#${data.downloadID} > div > .videoThumbnail`)

    var thumbnail = document.querySelector(`#${data.downloadID} > div > .videoThumbnail`) as HTMLImageElement
    thumbnail.src = ThumbNailString.replace("[ID]", data.vid)

    var title = document.querySelector(`#${data.downloadID} > div > div > .videoTitle`) as HTMLHeadingElement

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

    
    window.IPC.invokeInfoRequest(data.vid).then( videoData => {
        CLog_("INVOKE_INFO_REQUEST", videoData)

        title.innerText = videoData.videoDetails.title
    })
}

function UpdateSelectedTab(tabSelected: HTMLDivElement, ) {
    if (currentTab == tabSelected) return

    TabMap[currentTab.id].classList.remove("ContentActive")
    TabMap[tabSelected.id].classList.add("ContentActive")

    currentTab = tabSelected

    TabIndicator.style.left = `${currentTab.getBoundingClientRect().x-currentTab.parentElement.getBoundingClientRect().x}px`
    TabIndicator.style.width = `${currentTab.getBoundingClientRect().width}px`
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
    Downloads[data.downloadID] = data

    addVideoToSidebar(data)

    NothingsHereYet.classList.remove("ContentActive")
    Videos.classList.add("ContentActive")
})



//#endregion

Log_("Loaded!")