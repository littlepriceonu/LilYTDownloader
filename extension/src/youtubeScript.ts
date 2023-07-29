//#region Variables

const Region = "YOUTUBE"

function CLog(type: string, ...toLog:any[]) {
    console.log(`[${type}]`, ...toLog)
}

function Log(...toLog: any[]) {
    console.log(`[${Region}]`, ...toLog)
}

/**
 * Waits for an element to be loaded/added to the DOM using {@link document.querySelector}
 * @param {string} `selector` Query selector to wait for
 * @returns {Promise<Element>} A promise which resolves with the element in the selector when its found in the DOM
 */
function WaitForElement(selector: string): Promise<Element> {
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

const ServiceWorkerHandlers: {[key: string]: Function} = {}

const PopupHandlers: {[key: string]: Function} = {
    GET_VIDEO_INFO: (_data: Extension.CommunicationData, _sender: chrome.runtime.MessageSender, sendResponse: Function) => {
        WaitForElement("#title > h1 > yt-formatted-string").then((title: HTMLHeadingElement) => {
            WaitForElement("#text > a").then((author: HTMLAnchorElement) => {
                const toSend: Extension.VideoInfoResponse = {
                    title: title.innerText,
                    author: author.innerText,
                    vid: document.URL.split("?v=")[1].split("&")[0]
                }

                CLog("GET_VIDEO_INFO", toSend)
                
                sendResponse(toSend)
            })
        })

        return false
    }
}

//#endregion

//#region Main

// Recieves message from the service-worker & popup
chrome.runtime.onMessage.addListener((message: Extension.Communication, sender: chrome.runtime.MessageSender, _sendResponse: Function): boolean => {
    let CRegion = "ON_MESSAGE"
    
    if (sender.origin == undefined || null) {
        CLog(CRegion, "Sender may be service-worker")

        if (ServiceWorkerHandlers[message.type]) {
            return ServiceWorkerHandlers[message.type](message.data, sender, _sendResponse)
        }

        // ! everything past this point is from the popup
    }

    CLog(CRegion, sender.origin, message)

    if (PopupHandlers[message.type]) {
        return PopupHandlers[message.type](message.data, sender, _sendResponse)
    }

    return false
})

chrome.runtime.sendMessage(`Hello from [${Region}]!`)

//#endregion

Log("Hello, World!")

//export {}