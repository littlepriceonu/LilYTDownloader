"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const _Region = "RENDERER";
const videoDisplay = document.getElementsByClassName('videoDisplay').item(0);
videoDisplay.remove();
const ThumbNailString = "https://i.ytimg.com/vi/[ID]/default.jpg";
const SideBar = document.getElementById("SideBar");
const ErrorMap = {
    "EPREM": "No Permission To Create This File!",
    "EISDIR": "File Name Invalid!",
    "INVALID_ARGUMENT": "File Name Invalid!",
    "DIRECTORY_ERROR": "File Name Invalid!"
};
var Downloads = {};
function CLog_(type, ...toLog) {
    console.log(`[${type}]`, ...toLog);
}
function Log_(...toLog) {
    console.log(`[${_Region}]`, ...toLog);
}
function addVideoToSidebar(data) {
    var newVideoDisplay = videoDisplay.cloneNode(true);
    newVideoDisplay.id = data.downloadID;
    SideBar.prepend(newVideoDisplay);
    var thumbnail = document.querySelector(`${data.downloadID} > div > .videoThumbnail`);
    thumbnail.src = ThumbNailString.replace("[ID]", data.vid);
    var title = document.querySelector(`${data.downloadID} > div > .videoTitle`);
    var videoID = document.querySelector(`${data.downloadID} > div > .videoId`);
    videoID.innerText = data.vid;
    window.IPC.invokeInfoRequest(data.vid).then(videoData => {
        CLog_("INVOKE_INFO_REQUEST", videoData);
        videoData = videoData;
        title.innerText = videoData.title;
    });
    document.querySelector(`${data.downloadID} > div > .videoTitle`);
}
Array.from(document.getElementsByTagName("a")).forEach((el) => {
    el.onclick = (e) => {
        if (!el.href)
            return;
        e.preventDefault();
        window.IPC.sendURL(el.href);
    };
});
window.IPC.subscribeToEvent("DOWNLOAD_REQUESTED", (data) => {
    Downloads[data.downloadID] = data;
    addVideoToSidebar(data);
});
//# sourceMappingURL=renderer.js.map