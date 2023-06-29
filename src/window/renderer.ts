const _Region = "RENDERER"

//#region Functions

function CLog_(type: string, ...toLog:any[]) {
    console.log(`[${type}]`, ...toLog)
}

function Log_(...toLog: any[]) {
    console.log(`[${_Region}]`, ...toLog)
}

//#endregion

Array.from(document.getElementsByClassName("a")).forEach((el: HTMLAnchorElement) => {
    el.onclick = () => {
        window.IPC.send("open-url", el.href)
    }
})

Log_("Hello World!")