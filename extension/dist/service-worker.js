const Region = "SERVICE_WORKER";
var Socket;
var PopupLoaded;
var CLIENT_ID;
const ErrorMap = {
    "EPREM": "No Permission To Create This File!",
    "EISDIR": "File Name Invalid!",
    "INVALID_ARGUMENT": "File Name Invalid!",
    "DIRECTORY_ERROR": "File Name Invalid!"
};
function CLog(type, ...toLog) {
    console.log(`[${type}]`, ...toLog);
}
function Log(...toLog) {
    console.log(`[${Region}]`, ...toLog);
}
function SendMessageToRuntime(type, data) {
    const toSend = { type: type, data: data };
    chrome.runtime.sendMessage(toSend);
}
const ServerHandlers = {
    "CLIENT_ID": function (id, ..._) {
        CLIENT_ID = id;
    },
    "DOWNLOAD_COMPLETE": function (..._) {
        SendMessageToRuntime("DOWNLOAD_COMPLETE", {});
        CLog("SOCKET_HANDLER", "Download Finished!");
    },
    "DOWNLOAD_ERROR": function (errType, errMsg, ..._) {
        CLog(`SOCKET_HANDLER`, `Download Error(${errType}) | Message:  ${errMsg} | Mapped Type: ${ErrorMap[errType]} `);
    },
};
function StartConnection() {
    try {
        Socket = new WebSocket("ws://localhost:5020");
        Socket.onopen = () => {
            CLog("START_CONNECTION", "WebSocket Opened!");
        };
        Socket.onmessage = HandleServerMessage;
        Socket.onclose = () => {
            CLog("SOCKET", "WebSocket Closed!");
            StartConnection();
        };
        Socket.onerror = () => {
            CLog("SOCKET", "Connection lost! Attemping to reconnect!");
        };
    }
    catch {
        CLog("SOCKET", "Connection lost! Attemping to reconnect!");
    }
}
function HandleServerMessage(msg) {
    const _Split = msg.data.split("|");
    const ID = _Split.shift();
    const Data = _Split;
    if (ServerHandlers[ID])
        ServerHandlers[ID](...Data);
}
StartConnection();
const PopupHandlers = {
    "DOWNLOAD_VIDEO": (downloadInfo) => {
        if (Socket.readyState == Socket.OPEN) {
            const toSend = `DOWNLOAD_VIDEO|${CLIENT_ID}|${downloadInfo.vid}|${downloadInfo.fileName}|${downloadInfo.directory}|${downloadInfo.type}`;
            Socket.send(toSend);
        }
        else {
            CLog("SOCKET", "Download requested but Socket isn't ready!");
        }
    },
};
const ContentHandlers = {};
chrome.runtime.onMessage.addListener((message, sender, _sendResponse) => {
    let CRegion = "ON_MESSAGE";
    CLog(CRegion, sender.origin, message);
    if (sender.origin.startsWith("chrome-extension://")) {
        PopupLoaded = true;
        if (PopupHandlers[message.type]) {
            return PopupHandlers[message.type](message.data, sender, _sendResponse);
        }
        return;
    }
    if (ContentHandlers[message.type]) {
        return ContentHandlers[message.type](message.data, sender, _sendResponse);
    }
    return false;
});
Log("Hello, World!");
export {};
//# sourceMappingURL=service-worker.js.map