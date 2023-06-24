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

    var CLIENT_ID = ""

    const ServerHandlers = {
        "CLIENT_ID": function(id, ..._) {
            CLIENT_ID = id
        },
        "DOWNLOAD_COMPLETE": function(..._) {
            console.log("[LYT] Download Finished!")
        },
        "DOWNLOAD_ERROR": function(err, ..._) {
            console.log(`[LYT] Download Error! ${err}`)
        },
    }

    const SaveButton = document.createElement("input");

    SaveButton.id = "LYTSaveButton"
    SaveButton.type = "button";
    SaveButton.value = "CONNECTING..."

    const OuterUI = document.createElement("div")
    OuterUI.id = "OuterLYTUI"
    OuterUI.style.display = "none"
    OuterUI.innerHTML = `
    <div id="LYTUI">
        <h1>WOWOWOWOWOW</h1>

        <h1 class="FileNameText">File Name</h1>
        <input id="LYTFileName" type="text">

        <div class="LYTMainButtons">
            <input id="LYTClose" type="button" value="Cancel">
            <input id="LYTDownload" type="button" value="Download">
        </div>
    </div>
    `

    injectCSS(`
    :root {
        --Accent: #c7b5e3;
        --Primary: #d0b3ca;
        --Secondary: #f5eff4;
        --Text-color: #d8e1e9;
        --Background: rgb(12 6 4);
    }
    
    div#OuterLYTUI {
        height: 100vh;
        width: 100%;
        
        position: relative;
        z-index: 1000;
        
        display: flex;
        align-items: center;
        justify-content: center;   
        background-color: rgba(0, 0, 0, 0.486);
    }
    
    div#LYTUI {
        width: 40%;
        height: 30%;
    
        background-color: var(--Background);
    
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
    
        border-radius: 5%;
    
        color: var(--Text-color)
    }
    
    input#LYTFileName {
        width: 20rem;
        height: 2.8rem;
    
        margin-top: 1rem;
        
        background: var(--Primary);
    
        transition: all .2s ease-in;
    
        border: transparent solid 2px
    }
    
    input#LYTFileName:active {
        border: var(--Accent) solid 2px
        
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

    document.body.append(OuterUI)

    const UI = document.getElementById("LYTUI")
    const Close = document.getElementById("LYTClose")
    const Download = document.getElementById("LYTDownload")
    const FileName = document.getElementById("LYTFileName")

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

            console.log("[START_CONNECTION] WebSocket Opened!")
        }

        LYT.onmessage = HandleServerMessage

        LYT.onclose = ()=>{
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
                LYT.send(`DOWNLOAD_VIDEO|${CLIENT_ID}|${document.URL.split("?v=")[1]}|${FileName.value}`)
                console.log(`[LYT] Downloading Video (${document.URL.split("?v=")[1]})...`)
            }

            Close.onclick = () => {
                OuterUI.style.display = "none"
                document.body.style.overflow = "auto"
            }

            SaveButton.onclick = () => {
                if (LYT.readyState == LYT.OPEN) {
                    OuterUI.style.display = "flex"
                    FileName.value = ""

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