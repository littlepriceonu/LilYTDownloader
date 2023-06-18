// ==UserScript==
// @name         LYT UserScript
// @namespace    http://tampermonkey.net/
// @version      1
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

    var LYT = new WebSocket("ws://localhost:5020")

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

    WaitForElement("div#owner").then((el)=>{
        console.log("Owner Text Found!")
        WaitForElement("div#subscribe-button").then(() => {
            console.log("Subscribe Button Found")
            var a = document.createElement("input");

            a.type = "button";
            a.value = "SAVE"

            a.style.cursor = "pointer"
            a.style.color = "#fff"
            a.style.border = "none"
            a.style.padding = "0px"
            a.style.paddingTop = "6px"
            a.style.fontWeight = "550"
            a.style.paddingBottom = "4px"
            a.style.paddingLeft = "4px"
            a.style.background = "none"

            // old one: "https://www.yout.com/watch?v="

            var site = "https://www.youtubepi.com/watch?v="

            a.onclick = () => {
                if (LYT.readyState == LYT.OPEN) {
                   LYT.send(`DOWNLOAD_VIDEO|${document.URL.split("?v=")[1]}`)
                }
            }

            console.log("Loaded!")

            el.append(a)

            var selector = `div#${el.id} > input`

            const observer = new MutationObserver(mutations => {
                if (!document.querySelector(selector)) {
                    console.log("Youtube Removed! adding back...")
                    el.append(a)
                }
            });

            observer.observe(document.body, {
                childList: true,
                subtree: true
            });
            })
    })
})();