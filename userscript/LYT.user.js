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
    OuterUI.innerHTML = ``

    const UI = document.getElementById("LYTUI")

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

            injectCSS(`
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
            }
            `)

            SaveButton.onclick = () => {
                if (LYT.readyState == LYT.OPEN) {
                   LYT.send(`DOWNLOAD_VIDEO|${CLIENT_ID}|${document.URL.split("?v=")[1]}|downloads/test.mp4`)
                   console.log(`[LYT] Downloading Video (${document.URL.split("?v=")[1]})...`)
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