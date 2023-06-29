const _Region = "RENDERER";
function CLog_(type, ...toLog) {
    console.log(`[${type}]`, ...toLog);
}
function Log_(...toLog) {
    console.log(`[${_Region}]`, ...toLog);
}
Array.from(document.getElementsByClassName("a")).forEach((el) => {
    el.onclick = () => {
        window.IPC.send("open-url", el.href);
    };
});
Log_("Hello World!");
//# sourceMappingURL=renderer.js.map