// ==UserScript==
// @name         LYT UserScript
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  Button That Downloads A Youtube Video
// @author       Littlepriceonu#0001
// @match        *://*.youtube.com/watch?v=*
// @icon         https://www.google.com/s2/favicons?domain=youtube.com
// @homepage     https://github.com/littlepriceonu/LilYTDownloader
// @grant        none

// ==/UserScript==
(function() {
    'use strict';
    console.log("[LYT] Init...")
    console.log("[LYT] Made By: Littlepriceonu#0001")

    var LYT;

    //#region Functions

    /**
     *  Injects CSS in to the current page
     *  if append is false it will remove all other injected css on the page
     *  if append is either true or null, it will append to the already injected css on the page
     * @param {string} css 
     * @param {Boolean | null} append 
     * @returns Injected CSS Style Element
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

        LYT.onclose = ()=>{
            StartConnection()
        }
    }

    //#endregion

    StartConnection()

    WaitForElement("div#owner").then((el)=>{
        console.log("Owner Text Found!")
        WaitForElement("div#subscribe-button").then(() => {
            console.log("[LYT] Subscribe Button Found... Creating Button")
            var SaveButton = document.createElement("input");

            SaveButton.id = "LYTSaveButton"
            SaveButton.type = "button";
            SaveButton.value = "SAVE"

            // SaveButton.style.cursor = "pointer"
            // SaveButton.style.color = "#fff"
            // SaveButton.style.border = "none"
            // SaveButton.style.padding = "0px"
            // SaveButton.style.paddingTop = "6px"
            // SaveButton.style.fontWeight = "550"
            // SaveButton.style.paddingBottom = "4px"
            // SaveButton.style.paddingLeft = "4px"
            // SaveButton.style.background = "none"

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

            // old one: "https://www.yout.com/watch?v="

            SaveButton.onclick = () => {
                if (LYT.readyState == LYT.OPEN) {
                   LYT.send(`DOWNLOAD_VIDEO|${document.URL.split("?v=")[1]}`)
                }
            }

            console.log("[LYT] Loaded!")

            el.append(SaveButton)

            var selector = `div#${el.id} > input`

            const observer = new MutationObserver(mutations => {
                if (!document.querySelector(selector)) {
                    console.log("Youtube Removed! adding back...")
                    el.append(SaveButton)
                }
            });

            observer.observe(document.body, {
                childList: true,
                subtree: true
            });
            })
    })
})();