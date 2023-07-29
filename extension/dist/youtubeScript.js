const Region = "YOUTUBE";
function CLog(type, ...toLog) {
    console.log(`[${type}]`, ...toLog);
}
function Log(...toLog) {
    console.log(`[${Region}]`, ...toLog);
}
function WaitForElement(selector) {
    return new Promise(resolve => {
        if (document.querySelector(selector)) {
            return resolve(document.querySelector(selector));
        }
        const observer = new MutationObserver(mutations => {
            if (document.querySelector(selector)) {
                resolve(document.querySelector(selector));
                observer.disconnect();
            }
        });
        observer.observe(document.body, {
            childList: true,
            subtree: true
        });
    });
}
const ServiceWorkerHandlers = {};
const PopupHandlers = {
    GET_VIDEO_INFO: (_data, _sender, sendResponse) => {
        WaitForElement("#title > h1 > yt-formatted-string").then((title) => {
            WaitForElement("#text > a").then((author) => {
                const toSend = {
                    title: title.innerText,
                    author: author.innerText,
                    vid: document.URL.split("?v=")[1].split("&")[0]
                };
                CLog("GET_VIDEO_INFO", toSend);
                sendResponse(toSend);
            });
        });
        return false;
    }
};
chrome.runtime.onMessage.addListener((message, sender, _sendResponse) => {
    let CRegion = "ON_MESSAGE";
    if (sender.origin == undefined || null) {
        CLog(CRegion, "Sender may be service-worker");
        if (ServiceWorkerHandlers[message.type]) {
            return ServiceWorkerHandlers[message.type](message.data, sender, _sendResponse);
        }
    }
    CLog(CRegion, sender.origin, message);
    if (PopupHandlers[message.type]) {
        return PopupHandlers[message.type](message.data, sender, _sendResponse);
    }
    return false;
});
chrome.runtime.sendMessage(`Hello from [${Region}]!`);
Log("Hello, World!");
//# sourceMappingURL=youtubeScript.js.map