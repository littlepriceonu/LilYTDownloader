"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const _Region = "RENDERER";
const videoDisplay = document.getElementsByClassName('videoDisplay').item(0);
videoDisplay.remove();
const ThumbNailString = "https://i.ytimg.com/vi/[ID]/maxresdefault.jpg";
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
const DownloadLocation = document.getElementById("DownloadLocation");
const DownloadSize = document.getElementById("DownloadSize");
const DownloadVID = document.getElementById("DownloadVID");
const VideoTitle = document.getElementById("VideoTitle");
const VideoAuthor = document.getElementById("VideoAuthor");
const ProgressText = document.getElementById("ProgressText");
const DownloadButton = document.getElementById("DownloadButton");
const DownloadCloseButton = document.getElementById("DownloadCloseButton");
const TypeInput = document.getElementById("TypeInput");
const DirectoryInput = document.getElementById("DirectoryInput");
const FileNameInput = document.getElementById("FileNameInput");
const DownloadInApp = document.getElementById("DownloadInApp");
const VideoLinkInput = document.getElementById("VideoLinkInput");
const DownloadNotValid = document.getElementById("DownloadNotValid");
const DownloadVideoDisplay = document.getElementById("DownloadVideoDisplay");
const DownloadThumbnail = document.getElementById("DownloadThumbnail");
const DownloadTitle = document.getElementById("DownloadTitle");
const DownloadAuthor = document.getElementById("DownloadAuthor");
const InAppDownloadInterface = document.getElementById("InAppDownloadInterface");
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
const ProgressTextMap = {
    "Video_!Audio_!FinalOutput_": "Downloading Audio...",
    "Video_Audio_!FinalOutput_": "Finalizing...",
    "!Video_Audio_!FinalOutput_": "Downloading Video...",
    "!Video_!Audio_!FinalOutput_": "Downloading Video & Audio...",
    "Video_Audio_FinalOutput_": "Download Complete!",
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
        Downloads[data.downloadID].videoTitle = videoData.videoDetails.title;
        Downloads[data.downloadID].videoAuthor = videoData.videoDetails.author.name;
        if (CurrentInfoID == data.downloadID) {
            VideoTitle.innerText = videoData.videoDetails.title;
            VideoAuthor.innerText = videoData.videoDetails.author.name;
        }
    });
    return newVideoDisplay;
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
    document.querySelector("#Settings > div:nth-child(1)").classList.remove("ContentActive");
    Settings.classList.add("ContentActive");
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
    SettingsHolder.append(newSetting);
}
function UpdateProgressBar(PartsFinished, TotalParts) {
    const DownloadProgressBar = document.getElementById("DownloadProgressBar");
    const FullLength = DownloadProgressBar.parentElement.getBoundingClientRect().width;
    const LengthPerPart = FullLength / TotalParts;
    DownloadProgressBar.style.width = `${LengthPerPart * PartsFinished}px`;
    return [DownloadProgressBar, (PartsFinished == TotalParts)];
}
function getProgressTextFromFinishedParts(PartsFinished, DownloadID) {
    var ProgressText = "Progress Text Error!";
    var ProgressToText;
    Downloads[DownloadID].type == "MP3" ? ProgressToText = "Video_" : ProgressToText = "";
    Object.entries(PartsFinished).forEach(part => {
        part[1] ? ProgressToText += part[0] : ProgressToText += `!${part[0]}`;
        ProgressToText += "_";
    });
    CLog_("PROGRESS_TO_TEXT", ProgressToText);
    ProgressText = ProgressTextMap[ProgressToText];
    return ProgressText;
}
function setInfoVideo(downloadID) {
    DownloadVID.innerText = Downloads[downloadID].vid;
    DownloadLocation.innerText = Downloads[downloadID].fullDir;
    Downloads[downloadID].downloadSize ? DownloadSize.innerText = `${Downloads[downloadID].downloadSize}mbs` : DownloadSize.innerText = "Downloading...";
    const Thumbnail = document.getElementById("Thumbnail");
    Thumbnail.src = ThumbNailString.replace("[ID]", Downloads[downloadID].vid);
    Downloads[downloadID].videoTitle ? VideoTitle.innerText = Downloads[downloadID].videoTitle : VideoTitle.innerText = "Loading...";
    Downloads[downloadID].videoAuthor ? VideoAuthor.innerText = Downloads[downloadID].videoAuthor : VideoAuthor.innerText = "Loading...";
    var parts = getPartsData(Downloads[downloadID].partsDownloaded);
    UpdateProgressBar(parts[0], parts[1]);
    ProgressText.innerText = getProgressTextFromFinishedParts(Downloads[downloadID].partsDownloaded, downloadID);
    UpdateSelectedTab(InfoTab);
}
function getPartsData(partsDownloaded) {
    var parts = 0;
    var totalParts = 0;
    Object.entries(partsDownloaded).forEach(part => {
        totalParts += 1;
        if (part[1] == true) {
            parts += 1;
        }
    });
    return [parts, totalParts];
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
    data.type == "MP4" ? data.partsDownloaded = {
        Video: false,
        Audio: false,
        FinalOutput: false,
    } : data.partsDownloaded = {
        Audio: false,
        FinalOutput: false,
    };
    Downloads[data.downloadID] = data;
    const sidebarVideo = addVideoToSidebar(data);
    sidebarVideo.onclick = () => {
        document.querySelector("#Info > div:nth-child(1)").classList.remove("ContentActive");
        Info.classList.add("ContentActive");
        CurrentInfoID = data.downloadID;
        setInfoVideo(data.downloadID);
    };
    NothingsHereYet.classList.remove("ContentActive");
    Videos.classList.add("ContentActive");
});
window.IPC.subscribeToEvent("DOWNLOAD_UPDATE", (data) => {
    CLog_("DOWNLOAD_UPDATE", "Download Update Data Recieved!");
    if (!data.updateType)
        throw new Error("DOWNLOAD_UPDATE did not have an updateType");
    Downloads[data.downloadID].updates ? Downloads[data.downloadID].updates.push(data) : Downloads[data.downloadID].updates = [data];
    if (data.isError) {
        getVideoProgressIconFromID(data.downloadID).classList.add(StatusIconMap["error"]);
        getVideoProgressIconFromID(data.downloadID).setAttribute("data-status", "error");
        Downloads[data.downloadID].hasErrored = true;
        Downloads[data.downloadID].error = data.data.error;
        document.getElementById("ProgressText").innerText = `An Error Occured: ${data.data.err}`;
    }
    if (!Downloads[data.downloadID].hasErrored && data.updateType == "DOWNLOAD_COMPLETE") {
        getVideoProgressIconFromID(data.downloadID).classList.add(StatusIconMap["success"]);
        getVideoProgressIconFromID(data.downloadID).setAttribute("data-status", "success");
        Downloads[data.downloadID].hasFinished = true;
        CLog_("DOWNLOAD_FINISHED", data.data);
        Downloads[data.downloadID].downloadSize = Math.round(data.data.size);
        DownloadSize.innerText = `${Math.round(data.data.size)}mbs`;
    }
    if (DownloadedPartsMap[data.updateType]) {
        Downloads[data.downloadID].partsDownloaded[DownloadedPartsMap[data.updateType]] = true;
        if (CurrentInfoID == data.downloadID) {
            const partsDownloaded = Downloads[data.downloadID].partsDownloaded;
            ProgressText.innerText = getProgressTextFromFinishedParts(partsDownloaded, data.downloadID);
            var parts = getPartsData(partsDownloaded);
            CLog_("PROGRESS_BAR", UpdateProgressBar(parts[0], parts[1]));
        }
    }
});
window.IPC.subscribeToEvent("DEBUG_MESSAGE", (message) => {
    CLog_("SERVER", message);
});
var CLIENT_ID = "";
const SocketHandlers = {
    "CLIENT_ID": function (id) {
        CLIENT_ID = id;
    }
};
var LYTSocket = new WebSocket("ws://localhost:5020");
LYTSocket.onmessage = (message) => {
    const _Split = message.data.split("|");
    const ID = _Split.shift();
    const Data = _Split;
    if (SocketHandlers[ID])
        SocketHandlers[ID](Data);
};
DownloadInApp.onclick = () => {
    InAppDownloadInterface.classList.add("FullyActive");
};
DownloadCloseButton.onclick = () => {
    InAppDownloadInterface.classList.remove("FullyActive");
};
InAppDownloadInterface.onclick = (event) => {
    if (event.composedPath()[0] == InAppDownloadInterface) {
        InAppDownloadInterface.classList.remove("FullyActive");
    }
};
var currentVIDValid = false;
var currentVID = "";
VideoLinkInput.addEventListener("input", (event) => {
    const idRegex = /^[a-zA-Z0-9-_]{11}$/;
    const splitVID = VideoLinkInput.value.split("?v=")[1]?.split("&")[0];
    const splitVIDValid = idRegex.test(splitVID);
    const mainVIDValid = idRegex.test(VideoLinkInput.value);
    const vid = splitVIDValid ? splitVID : VideoLinkInput.value;
    currentVID = vid;
    currentVIDValid = idRegex.test(vid);
    if (currentVIDValid) {
        CLog_("IN_APP_DOWNLOAD", "VID is valid! Retriving video info...");
        DownloadNotValid.classList.remove("ContentActive");
        DownloadVideoDisplay.classList.add("ContentActive");
        DownloadTitle.innerText = "Loading...";
        DownloadThumbnail.src = "";
        DownloadAuthor.innerText = "Loading...";
        window.IPC.invokeInfoRequest(vid).then((info) => {
            CLog_("IN_APP_DOWNLOAD", "Video Info Recieved!", info);
            DownloadTitle.innerText = info.videoDetails.title;
            DownloadThumbnail.src = ThumbNailString.replace("[ID]", vid);
            DownloadAuthor.innerText = info.videoDetails.author.name;
        });
    }
    else {
        DownloadNotValid.classList.add("ContentActive");
        DownloadVideoDisplay.classList.remove("ContentActive");
    }
});
DownloadButton.onclick = () => {
    if (currentVIDValid) {
        var directory = DirectoryInput.value;
        var fileName = (TypeInput.value == "MP4" ? FileNameInput.value + ".mp4" : FileNameInput.value + ".mp3");
        var type = TypeInput.value;
        var toSend = `DOWNLOAD_VIDEO|${CLIENT_ID}|${currentVID}|${fileName}|${directory}|${type}`;
        LYTSocket.send(toSend);
    }
};
Log_("Loaded!");
//# sourceMappingURL=renderer.js.map