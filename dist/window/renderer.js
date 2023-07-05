"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const _Region = "RENDERER";
const videoDisplay = document.getElementsByClassName('videoDisplay').item(0);
videoDisplay.remove();
const ThumbNailString = "https://i.ytimg.com/vi/[ID]/default.jpg";
const ErrorMap = {
    "EPREM": "No Permission To Create This File!",
    "EISDIR": "File Name Invalid!",
    "INVALID_ARGUMENT": "File Name Invalid!",
    "DIRECTORY_ERROR": "File Name Invalid!"
};
var Downloads = {};
const Videos = document.getElementById("Videos");
const NothingsHereYet = document.getElementById("NothingsHereYet");
const LilYTDownloaderText = document.getElementById("LilYTDownloader");
const DownloadInfo = document.getElementById("DownloadInfo");
const OuterTabBar = document.getElementById("OuterTabBar");
const SettingsTab = document.getElementById("SettingsTab");
const InfoTab = document.getElementById("InfoTab");
const HomeTab = document.getElementById("HomeTab");
const Settings = document.getElementById("Settings");
const Info = document.getElementById("Info");
const Home = document.getElementById("Home");
const TabIndicator = document.getElementById("TabIndicator");
TabIndicator.style.top = `${(TabIndicator.parentElement.getBoundingClientRect().height - TabIndicator.getBoundingClientRect().height) / 2}px`;
var currentTab = HomeTab;
setTimeout(() => {
    TabIndicator.style.left = `${currentTab.getBoundingClientRect().x - currentTab.parentElement.getBoundingClientRect().x}px`;
    TabIndicator.style.width = `${currentTab.getBoundingClientRect().width}px`;
}, 150);
setTimeout(() => {
    TabIndicator.style.left = `${currentTab.getBoundingClientRect().x - currentTab.parentElement.getBoundingClientRect().x}px`;
    TabIndicator.style.width = `${currentTab.getBoundingClientRect().width}px`;
}, 300);
const TabMap = {
    "HomeTab": Home,
    "InfoTab": Info,
    "SettingsTab": Settings,
};
const StatusIconMap = {
    "error": "fa-exclamation",
    "success": "fa-check",
    "inprogress": "",
};
const DownloadTypeIconMap = {
    "MP4": "fa-video",
    "MP3": "fa-headphones"
};
var CurrentInfoID;
const OnResize = [
    function () {
        OuterTabBar.style.top = `${DownloadInfo.getBoundingClientRect().height - OuterTabBar.getBoundingClientRect().height}px`;
    },
    function () {
        TabIndicator.style.left = `${currentTab.getBoundingClientRect().x - currentTab.parentElement.getBoundingClientRect().x}px`;
        TabIndicator.style.width = `${currentTab.getBoundingClientRect().width}px`;
    }
];
function CLog_(type, ...toLog) {
    console.log(`[${type}]`, ...toLog);
}
function Log_(...toLog) {
    console.log(`[${_Region}]`, ...toLog);
}
function addVideoToSidebar(data) {
    var newVideoDisplay = videoDisplay.cloneNode(true);
    newVideoDisplay.id = data.downloadID;
    Videos.prepend(newVideoDisplay);
    CLog_("SIDEBAR", `#${data.downloadID} > div > .videoThumbnail`);
    var thumbnail = document.querySelector(`#${data.downloadID} > div > .videoThumbnail`);
    thumbnail.src = ThumbNailString.replace("[ID]", data.vid);
    var title = document.querySelector(`#${data.downloadID} > div > div > .videoTitle`);
    window.IPC.invokeInfoRequest(data.vid).then(videoData => {
        CLog_("INVOKE_INFO_REQUEST", videoData);
        title.innerText = videoData.videoDetails.title;
    });
}
function UpdateSelectedTab(tabSelected) {
    if (currentTab == tabSelected)
        return;
    TabMap[currentTab.id].classList.remove("ContentActive");
    TabMap[tabSelected.id].classList.add("ContentActive");
    currentTab = tabSelected;
    TabIndicator.style.left = `${currentTab.getBoundingClientRect().x - currentTab.parentElement.getBoundingClientRect().x}px`;
    TabIndicator.style.width = `${currentTab.getBoundingClientRect().width}px`;
}
var access = 0;
var granted = false;
Array.from(document.getElementsByTagName("a")).forEach((el) => {
    el.onclick = (e) => {
        const isMe = el.id == "Littlepriceonu";
        if (isMe) {
            access += 1;
            if (access == 3)
                granted = true;
            else
                granted = false;
        }
        if (!el.href)
            return;
        if (!granted) {
            e.preventDefault();
            window.IPC.openURL(el.href);
        }
        else if (granted && isMe) {
            e.preventDefault();
            LilYTDownloaderText.innerText = "[ACCESS GRANTED]";
            LilYTDownloaderText.classList.add("ACCESS_GRANTED");
        }
    };
});
OnResize.forEach(func => {
    func();
});
addEventListener("resize", () => {
    OnResize.forEach(func => {
        func();
    });
});
SettingsTab.onclick = () => {
    UpdateSelectedTab(SettingsTab);
};
HomeTab.onclick = () => {
    UpdateSelectedTab(HomeTab);
};
InfoTab.onclick = () => {
    UpdateSelectedTab(InfoTab);
};
window.IPC.subscribeToEvent("DOWNLOAD_REQUESTED", (data) => {
    Downloads[data.downloadID] = data;
    addVideoToSidebar(data);
    NothingsHereYet.classList.remove("ContentActive");
    Videos.classList.add("ContentActive");
});
Log_("Loaded!");
//# sourceMappingURL=renderer.js.map