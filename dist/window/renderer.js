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
    var title = document.querySelector(`#${data.downloadID} > div > .videoTitle`);
    window.Vibrant.from(thumbnail.src).quality(1).clearFilters().getPalette().then((palette) => {
        const StartingRGB = palette.Vibrant.rgb;
        const StartingColor = `rgba(${StartingRGB[0].toString()}, ${StartingRGB[1].toString()}, ${StartingRGB[2].toString()}, 0.7)`;
        const EndingRGB = palette.LightVibrant.rgb;
        const EndingColor = `rgba(${EndingRGB[0].toString()}, ${EndingRGB[1].toString()}, ${EndingRGB[2].toString()}, 0.55)`;
        CLog_("VIBRANT", palette);
    });
    window.IPC.invokeInfoRequest(data.vid).then(videoData => {
        CLog_("INVOKE_INFO_REQUEST", videoData);
        title.innerText = videoData.videoDetails.title;
    });
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
window.IPC.subscribeToEvent("DOWNLOAD_REQUESTED", (data) => {
    Downloads[data.downloadID] = data;
    addVideoToSidebar(data);
    NothingsHereYet.classList.remove("ContentActive");
    Videos.classList.add("ContentActive");
});
//# sourceMappingURL=renderer.js.map