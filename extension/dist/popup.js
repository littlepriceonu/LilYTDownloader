const Region = "POPUP";
const DownloadButton = document.getElementById("DownloadButton");
const TypeInput = document.getElementById("TypeInput");
const DirectoryInput = document.getElementById("DirectoryInput");
const FileNameInput = document.getElementById("FileNameInput");
const NotYoutube = document.getElementById("NotYoutube");
const VideoDisplay = document.getElementById("VideoDisplay");
const Thumbnail = document.getElementById("Thumbnail");
const Title = document.getElementById("Title");
const Author = document.getElementById("Author");
function CLog(type, ...toLog) {
    console.log(`[${type}]`, ...toLog);
}
function Log(...toLog) {
    console.log(`[${Region}]`, ...toLog);
}
function GetCurrentTab() {
    return new Promise((res) => {
        chrome.tabs.query({ active: true, currentWindow: true }).then((tab) => {
            chrome.tabs.get(tab[0].id).then((tab) => {
                CLog("CURRENT_TAB", tab);
                res(tab);
            });
        });
    });
}
function SendMessageToCurrentTab(type, data) {
    const toSend = { type: type, data: data };
    return new Promise(res => {
        GetCurrentTab().then((tab) => {
            res(chrome.tabs.sendMessage(tab.id, toSend));
        });
    });
}
function GetThumbnailURLfromVID(vid) {
    return `https://i.ytimg.com/vi/${vid}/maxresdefault.jpg`;
}
const ServiceWorkerHandlers = {};
const YoutubeHandlers = {};
var CurrentVideo = {
    vid: null,
    title: null,
    author: null,
};
GetCurrentTab().then((tab) => {
    if (tab.url?.includes("youtube.com/watch?v=")) {
        SendMessageToCurrentTab("GET_VIDEO_INFO", {}).then((data) => {
            CLog("RETURNED_VIDEO_INFO", data);
            Title.innerText = data.title;
            Author.innerText = data.author;
            Thumbnail.src = GetThumbnailURLfromVID(data.vid);
            Thumbnail.onload = () => {
                NotYoutube.classList.remove("ContentActive");
                VideoDisplay.classList.add("ContentActive");
            };
            CurrentVideo = data;
        });
    }
});
chrome.tabs.onUpdated.addListener((_tabId, changeInfo, tab) => {
    CLog("TAB_UPDATED", changeInfo.url, tab.url, changeInfo.url?.includes("youtube.com/watch?v="), tab.url?.includes("youtube.com/watch?v="));
    if (changeInfo.url?.includes("youtube.com/watch?v=") || tab.url?.includes("youtube.com/watch?v=")) {
        SendMessageToCurrentTab("GET_VIDEO_INFO", {}).then((data) => {
            CLog("RETURNED_VIDEO_INFO", data);
            Title.innerText = data.title;
            Author.innerText = data.author;
            Thumbnail.src = GetThumbnailURLfromVID(data.vid);
            Thumbnail.onload = () => {
                NotYoutube.classList.remove("ContentActive");
                VideoDisplay.classList.add("ContentActive");
            };
            CurrentVideo = data;
        });
    }
    else {
        NotYoutube.classList.add("ContentActive");
        VideoDisplay.classList.remove("ContentActive");
        CurrentVideo = {
            vid: null,
            title: null,
            author: null,
        };
    }
});
chrome.runtime.onMessage.addListener((message, sender, _sendResponse) => {
    let CRegion = "ON_MESSAGE";
    if (sender.origin == undefined || null) {
        CLog(CRegion, "Sender may be service-worker");
        if (ServiceWorkerHandlers[message.type]) {
            ServiceWorkerHandlers[message.type](message.data, sender, _sendResponse);
        }
        return;
    }
    if (YoutubeHandlers[message.type]) {
        YoutubeHandlers[message.type](message.data, sender, _sendResponse);
    }
    CLog(CRegion, sender.origin, message);
    return false;
});
DownloadButton.onclick = () => {
    if (!CurrentVideo.vid)
        return;
    const FilteredFileName = TypeInput.value == "MP4" ? FileNameInput.value + ".mp4" : FileNameInput.value + ".mp3";
    const downloadInfo = {
        vid: CurrentVideo.vid,
        fileName: FilteredFileName,
        directory: DirectoryInput.value,
        type: TypeInput.value,
    };
    const toSend = {
        type: 'DOWNLOAD_VIDEO',
        data: downloadInfo,
    };
    chrome.runtime.sendMessage(toSend);
};
Log("Hello, World!");
export {};
//# sourceMappingURL=popup.js.map