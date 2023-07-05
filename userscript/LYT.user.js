// ==UserScript==
// @name         LYT UserScript
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  Required UserScript for the LYT Server
// @author       Littlepriceonu
// @match        *://*.youtube.com/watch?v=*
// @icon         https://www.google.com/s2/favicons?domain=youtube.com
// @homepage     https://github.com/littlepriceonu/LilYTDownloader
// @grant        none

// ==/UserScript==

(function() {
    'use strict';
    console.log("[LYT] Init...")
    console.log("[LYT] Made By: Littlepriceonu")

    var LYT;

    var IsInUI = false;

    const ErrorMap = {
        "EPREM": "No Permission To Create This File!",
        "EISDIR": "File Name Invalid!",
        "INVALID_ARGUMENT": "File Name Invalid!",
        "DIRECTORY_ERROR": "File Name Invalid!"
    }

    var DownloadMessage;

    var CLIENT_ID = ""

    const ServerHandlers = {
        "CLIENT_ID": function(id, ..._) {
            CLIENT_ID = id
        },
        "DOWNLOAD_COMPLETE": function(..._) {
            DownloadMessage.style.opacity = "1"
            DownloadMessage.style.color = "green"
            DownloadMessage.innerText = "Download Complete!"

            console.log("[LYT] Download Finished!")
        },
        "DOWNLOAD_ERROR": function(errType, errMsg, ..._) {
            DownloadMessage.style.opacity = "1"
            DownloadMessage.style.color = "red"
            DownloadMessage.innerText = ErrorMap[errType] ? ErrorMap[errType] : "An Error Occurred!"

            console.log(ErrorMap[errType])
            console.log(ErrorMap[errType] ? ErrorMap[errType] : "An Error Occurred!")

            console.log(`[LYT] Download Error(${errType}) ! ${errMsg}`)
        },
    }

    const SaveButton = document.createElement("input");

    SaveButton.id = "LYTSaveButton"
    SaveButton.type = "button";
    SaveButton.value = "CONNECTING..."

    const OuterUI = document.createElement("div")
    OuterUI.id = "OuterLYTUI"
    OuterUI.style.display = "none"

    OuterUI.onclick = (e) => {
        if (e.target == OuterUI) {
            OuterUI.style.display = "none"
            document.body.style.overflow = "auto"

            IsInUI = false;
        }
    }

    //#region HTML & CSS`

    OuterUI.innerHTML = `
    <div id="LYTUI">
    <h1 class="LYTText">LYT UI</h1>

    <h1 class="InputNameText">Type</h1>
    <select name="Dir" class="LYTMainInput" id="LYTType">
        <option value="MP4">Video</option>
        <option value="MP3">Audio</option>
    </select>

    <h1 class="InputNameText">Directory</h1>
    <select name="Dir" class="LYTMainInput" id="LYTDir">
        <option value="DOWNLOADS">Downloads</option>
        <option value="CURRENT_USER">Current User</option>
    </select>

    <h1 class="InputNameText">File Name</h1>
    <input class="LYTMainInput" id="LYTFileName" type="text">

    <div class="LYTMainButtons">
        <input id="LYTClose" type="button" value="Cancel">
        <input id="LYTDownload" type="button" value="Download">
    </div>

    <h1 id="LYTDownloadMessage"></h1>
</div>
    `

    injectCSS(`
    :root {
        --Accent: #a368ff;
        --Primary: #d0b3ca;
        --Secondary: #f5eff4;
        --Text-color: #d8e1e9;
        --Background: #0f0f0f;
    }
    
    .LYTText {
        font-size: 7rem;
    }
    
    div#OuterLYTUI {
        height: 100vh;
        width: 100%;
        
        position: absolute;
        z-index: 1000;
    
        top: 0;
        left: 0;
        
        display: flex;
        align-items: center;
        justify-content: center;   
        background-color: rgba(0, 0, 0, 0.486);
    }
    
    div#LYTUI {
        width: 50%;
        height: 45%;
    
        background-color: var(--Background);
    
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
    
        border-radius: 5%;
    
        color: var(--Text-color)
    }
    
    h1.InputNameText {
        margin-top: 1rem;
        width: 20rem;
        text-align: left;
    }
    
    .LYTMainInput {
        width: 20rem;
        height: 2.8rem;
    
        margin-top: 0.2rem;
        
        background: var(--Primary);
    
        transition: all .2s ease-in;
    
        border: transparent solid 2px
    }
    
    .LYTMainInput:focus-visible {
        border: var(--Accent) solid 2px;
        outline: none;
    }
    
    input#LYTClose, input#LYTDownload {
        margin-left: 0.5rem;
    
        width: 8rem;
        height: 2.8rem;
    
        border-radius: 10%;
    
        transition: all .2s ease-in;
    
        background-color: var(--Primary);
    }
    
    input#LYTClose:hover, input#LYTDownload:hover {
        scale: 1.05;
    }
    
    input#LYTClose:active, input#LYTDownload:active {
        scale: 0.95;
    }
    
    div.LYTMainButtons {
        margin-top: 2rem;
        
        display: flex;
    
        justify-content: space-around;
        align-items: center;
    }
    
    #LYTDownloadMessage {
        margin-top: 1rem;
        opacity: 0;
        transition: all .3s ease-in;
    }
    
    /* Save Button */
    
    input#LYTSaveButton {
        cursor: pointer;
    
        color: #fff;
        background: none;
        border: none;
    
        padding: 0;
        padding-top: 6px;
        padding-bottom: 4px;
        padding-left: 4px;
    
        font-weight: 550;
    }`)

    //#endregion

    document.body.append(OuterUI)

    const UI = document.getElementById("LYTUI")
    const Close = document.getElementById("LYTClose")
    const Download = document.getElementById("LYTDownload")
    const FileName = document.getElementById("LYTFileName")
    const Dir = document.getElementById("LYTDir")
    const Type = document.getElementById("LYTType")
    DownloadMessage = document.getElementById("LYTDownloadMessage")

    // Key Event Listener
    addEventListener("keyup", (e) => {
        console.log(e)
        if (e.key == "Escape" && IsInUI) {
            Close.click()
        } 

        if (e.key == "Enter" && IsInUI) {
            Download.click()
        }
    })

    //#region Functions

    /**
     *  Injects CSS in to the current page
     *  if append is false it will remove all other injected css on the page
     *  if append is either true or null, it will append to the already injected css on the page
     * 
     *  @param {string} CSS
     *  @param {Boolean | null} Append? 
     *  @returns Injected CSS Style Element
     */
    function injectCSS(css, append) {
        if (append == null) append = true

        let CustomCSS = document.querySelector("#CustomCSS")

        if (CustomCSS) {
            if (append) {
                CustomCSS.innerText = CustomCSS.innerText + " " + css
                return CustomCSS
            }
            CustomCSS.innerText = css
            return CustomCSS
        }

        CustomCSS = document.createElement('style');
        CustomCSS.innerText = css;
        CustomCSS.id = "CustomCSS"


        document.head.appendChild(CustomCSS);
        return CustomCSS;
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

    function StartConnection() {
        LYT = new WebSocket("ws://localhost:5020")

        LYT.onopen = ()=>{
            SaveButton.value = "SAVE"

            DownloadMessage.style.color = "white"
            DownloadMessage.style.opacity = "0"
            DownloadMessage.innerText = ""

            console.log("[START_CONNECTION] WebSocket Opened!")
        }

        LYT.onmessage = HandleServerMessage

        LYT.onclose = ()=>{
            DownloadMessage.style.color = "red"
            DownloadMessage.style.opacity = "1"
            DownloadMessage.innerText = "Server Lost Connection!"

            console.log("[LYT] Socket Connection Closed!")
            SaveButton.value = "CONNECTING..."
            StartConnection()
        } 
    }

    function HandleServerMessage(msg) {
        const _Split = msg.data.split("|")
        const ID = _Split.shift()
        const Data = _Split
    
        if (ServerHandlers[ID]) ServerHandlers[ID](...Data)
    }    

    //#endregion

    StartConnection()

    WaitForElement("div#owner").then((el)=>{
        console.log("[LYT] Owner Text Found!")
        WaitForElement("div#subscribe-button").then(() => {
            console.log("[LYT] Subscribe Button Found!")

            Download.onclick = () => {
                DownloadMessage.style.color = "white"
                DownloadMessage.style.opacity = "1"
                DownloadMessage.innerText = "Downloading..."

                var FilteredFileName = Type.value == "MP4" ? FileName.value + ".mp4" : FileName.value + ".mp3" 

                LYT.send(`DOWNLOAD_VIDEO|${CLIENT_ID}|${document.URL.split("?v=")[1].split("&")[0]}|${FilteredFileName}|${Dir.value}|${Type.value}`)
                console.log(`[LYT] Downloading Video (${document.URL.split("?v=")[1].split("&")[0]})...`)
            }

            Close.onclick = () => {
                OuterUI.style.display = "none"
                document.body.style.overflow = "auto"
                IsInUI = false;
            }

            SaveButton.onclick = () => {
                if (LYT.readyState == LYT.OPEN) {
                    IsInUI = true;

                    DownloadMessage.style.color = "white"
                    DownloadMessage.style.opacity = "0"
                    DownloadMessage.innerText = ""
                    
                    OuterUI.style.display = "flex"
                    FileName.value = ""

                    OuterUI.style.top = scrollY.toString() + "px"

                    document.body.style.overflow = "hidden"
                }
            }

            el.append(SaveButton)
            console.log("[LYT] Save Button Applied To DOM!")

            var selector = `div#${el.id} > input`

            const observer = new MutationObserver(mutations => {
                if (!document.querySelector(selector)) {
                    console.log("[LYT] Youtube Removed Save Button! Adding Back...")
                    el.append(SaveButton)
                }
            });
            
            observer.observe(document.body, {
                childList: true,
                subtree: true
            });

            console.log("[LYT] Loaded!")
        })
    })
})();