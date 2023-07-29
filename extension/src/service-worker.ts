// Types of communication
// https://stackoverflow.com/questions/73461772/sendmessage-from-a-service-worker-to-popup
// Connections
// https://developer.chrome.com/docs/extensions/mv3/messaging/

import { DownloadDirectory, DownloadFileName, DownloadFileType } from "../../src/window/LYT";

const Region = "SERVICE_WORKER";

var Socket: WebSocket;

var PopupLoaded: boolean;

var CLIENT_ID: string;

const ErrorMap: { [key: string]: string } = {
    "EPREM": "No Permission To Create This File!",
    "EISDIR": "File Name Invalid!",
    "INVALID_ARGUMENT": "File Name Invalid!",
    "DIRECTORY_ERROR": "File Name Invalid!"
}

//#region Functions

function CLog(type: string, ...toLog:any[]) {
    console.log(`[${type}]`, ...toLog)
}

function Log(...toLog: any[]) {
    console.log(`[${Region}]`, ...toLog)
}

function SendMessageToRuntime(type: Extension.CommunicationType, data: Extension.CommunicationData) {
    const toSend = {type: type, data: data}
    chrome.runtime.sendMessage(toSend)
}

const ServerHandlers = {
    "CLIENT_ID": function(id: string, ..._: any) {
        CLIENT_ID = id
    },
    "DOWNLOAD_COMPLETE": function(..._: any) {
        //DownloadMessage.style.opacity = "1"
        //DownloadMessage.style.color = "green"
        //DownloadMessage.innerText = "Download Complete!"

        SendMessageToRuntime("DOWNLOAD_COMPLETE", {})

        CLog("SOCKET_HANDLER", "Download Finished!")
    },
    "DOWNLOAD_ERROR": function(errType: string, errMsg: string, ..._: any) {
        //DownloadMessage.style.opacity = "1"
        //DownloadMessage.style.color = "red"
        //DownloadMessage.innerText = ErrorMap[errType] ? ErrorMap[errType] : "An Error Occurred!"

        CLog(`SOCKET_HANDLER`, `Download Error(${errType}) | Message:  ${errMsg} | Mapped Type: ${ErrorMap[errType]} `)
    },
}

//#endregion

//#region Socket Connection

function StartConnection() {
    try {
        Socket = new WebSocket("ws://localhost:5020")

        Socket.onopen = ()=>{
            //SaveButton.value = "SAVE"
    
            //DownloadMessage.style.color = "white"
            //DownloadMessage.style.opacity = "0"
            //DownloadMessage.innerText = ""
    
            CLog("START_CONNECTION", "WebSocket Opened!")
        }
    
        Socket.onmessage = HandleServerMessage
    
        Socket.onclose = ()=>{
            //DownloadMessage.style.color = "red"
            //DownloadMessage.style.opacity = "1"
            //DownloadMessage.innerText = "Server Lost Connection!"
    
            //SaveButton.value = "CONNECTING..."
            CLog("SOCKET", "WebSocket Closed!")
    
            // Keep trying until we connect
            StartConnection()
        } 
    
        Socket.onerror = ()=>{
            CLog("SOCKET", "Connection lost! Attemping to reconnect!")
        }
    } catch {
        CLog("SOCKET", "Connection lost! Attemping to reconnect!")
    }
}

// TODO make type for `msg`
function HandleServerMessage(msg: any) {
    const _Split = msg.data.split("|")
    const ID = _Split.shift()
    const Data = _Split

    if (ServerHandlers[ID]) ServerHandlers[ID](...Data)
}    

StartConnection()

//#endregion

//#region Main Functionality

const PopupHandlers: {[key: string]: Function} = {
    "DOWNLOAD_VIDEO": (downloadInfo: Extension.DownloadRequest) => {
        if (Socket.readyState == Socket.OPEN) {
            const toSend: Extension.SocketDownloadRequest = `DOWNLOAD_VIDEO|${CLIENT_ID}|${downloadInfo.vid}|${downloadInfo.fileName as DownloadFileName}|${downloadInfo.directory as DownloadDirectory}|${downloadInfo.type as DownloadFileType}`
        
            Socket.send(toSend)
        }
        else {
            CLog("SOCKET", "Download requested but Socket isn't ready!")
        }
    },
}

const ContentHandlers: {[key: string]: Function} = {}

// Recieve messages from other content scripts & such
chrome.runtime.onMessage.addListener((message: Extension.Communication, sender: chrome.runtime.MessageSender, _sendResponse: Function): boolean => {
    let CRegion = "ON_MESSAGE"
    
    CLog(CRegion, sender.origin, message)
    
    // this means that the sender is the popup
    if (sender.origin.startsWith("chrome-extension://")) {
        PopupLoaded = true

        if (PopupHandlers[message.type]) {
            return PopupHandlers[message.type](message.data, sender, _sendResponse)
        }
        // ! return so that everything past this point is for content scripts only 
        return
    }

    if (ContentHandlers[message.type]) {
        return ContentHandlers[message.type](message.data, sender, _sendResponse)
    }

    // false means it doesn't return anything using the sendResponse function, also means its not async
    return false
})


//#endregion

Log("Hello, World!")

export {}