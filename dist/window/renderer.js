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
const SettingsHolder = document.getElementById("SettingsHolder");
const SettingTemplate = document.getElementsByClassName("Setting").item(0);
SettingTemplate.remove();
TabIndicator.style.top = `${(TabIndicator.parentElement.getBoundingClientRect().height - TabIndicator.getBoundingClientRect().height) / 2}px`;
var currentTab = HomeTab;
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
const DownloadedPartsMap = {
    "VIDEO_DOWNLOADED": "Video",
    "AUDIO_DOWNLOADED": "Audio",
    "DOWNLOAD_COMPLETE": "FinalOutput"
};
var CurrentInfoID;
var RegisteredSettings = {};
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
function getVideoTypeIconFromID(id) {
    return document.querySelector(`#${id} > div > div > div > div.typeIndicator`);
}
function getVideoProgressIconFromID(id) {
    return document.querySelector(`#${id} > div > div > div > div.downloadProgress`);
}
function addVideoToSidebar(data) {
    var newVideoDisplay = videoDisplay.cloneNode(true);
    newVideoDisplay.id = data.downloadID;
    Videos.prepend(newVideoDisplay);
    CLog_("SIDEBAR", `#${data.downloadID} > div > .videoThumbnail`);
    var thumbnail = document.querySelector(`#${data.downloadID} > div > .videoThumbnail`);
    thumbnail.src = ThumbNailString.replace("[ID]", data.vid);
    var title = document.querySelector(`#${data.downloadID} > div > div > .videoTitle`);
    getVideoTypeIconFromID(data.downloadID).classList.add(DownloadTypeIconMap[data.type]);
    getVideoProgressIconFromID(data.downloadID).setAttribute("data-status", "inprogress");
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
function RegisterSetting(setting) {
    if (RegisteredSettings[setting.settingID]) {
        CLog_("REGISTER_SETTING", `Setting ${setting.settingID} has already been registered!`);
        return;
    }
    const newSetting = SettingTemplate.cloneNode(true);
    newSetting.id = setting.settingID;
    document.getElementById(`#${setting.settingID} > div > .settingName`).innerText = setting.title;
    document.getElementById(`#${setting.settingID} > .settingDescription`).innerText = setting.description;
    const settingToggle = document.getElementById(`#${setting.settingID} > div > .settingState`);
    settingToggle.onclick = (event) => {
        setting.eventCallback.forEach(func => {
            func(settingToggle.checked, event);
        });
    };
    RegisteredSettings[setting.settingID] = setting;
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
setTimeout(() => {
    TabIndicator.style.left = `${currentTab.getBoundingClientRect().x - currentTab.parentElement.getBoundingClientRect().x}px`;
    TabIndicator.style.width = `${currentTab.getBoundingClientRect().width}px`;
}, 150);
setTimeout(() => {
    TabIndicator.style.left = `${currentTab.getBoundingClientRect().x - currentTab.parentElement.getBoundingClientRect().x}px`;
    TabIndicator.style.width = `${currentTab.getBoundingClientRect().width}px`;
}, 300);
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
    data.type == "MP3" ? data.partsDownloaded = {
        Audio: false,
        FinalOutput: false
    } : data.partsDownloaded = {
        Video: false,
        Audio: false,
        FinalOutput: false,
    };
    Downloads[data.downloadID] = data;
    addVideoToSidebar(data);
    NothingsHereYet.classList.remove("ContentActive");
    Videos.classList.add("ContentActive");
});
window.IPC.subscribeToEvent("DOWNLOAD_UPDATE", (data) => {
    if (!data.updateType)
        throw new Error("DOWNLOAD_UPDATE did not have an updateType");
    Downloads[data.downloadID].updates ? Downloads[data.downloadID].updates.push(data) : Downloads[data.downloadID].updates = [data];
    if (data.isError) {
        getVideoProgressIconFromID(data.downloadID).classList.add(StatusIconMap["error"]);
        getVideoProgressIconFromID(data.downloadID).setAttribute("data-status", "error");
        Downloads[data.downloadID].hasErrored = true;
        Downloads[data.downloadID].error = data.data.error;
    }
    if (!Downloads[data.downloadID].hasErrored && data.updateType == "DOWNLOAD_COMPLETE") {
        getVideoProgressIconFromID(data.downloadID).classList.add(StatusIconMap["success"]);
        getVideoProgressIconFromID(data.downloadID).setAttribute("data-status", "success");
        Downloads[data.downloadID].hasFinished = true;
    }
    if (DownloadedPartsMap[data.updateType]) {
        Downloads[data.downloadID].partsDownloaded[DownloadedPartsMap[data.updateType]] = true;
    }
});
Log_("Loaded!");
//# sourceMappingURL=renderer.js.map