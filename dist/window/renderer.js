"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const _Region = "RENDERER";
const videoDisplay = document.getElementsByClassName('videoDisplay').item(0);
videoDisplay.remove();
function CLog_(type, ...toLog) {
    console.log(`[${type}]`, ...toLog);
}
function Log_(...toLog) {
    console.log(`[${_Region}]`, ...toLog);
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
    Log_("data:", data);
    Log_("vid:", data.vid);
});
//# sourceMappingURL=renderer.js.map