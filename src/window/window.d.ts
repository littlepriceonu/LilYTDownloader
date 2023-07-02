import ytdl = require("ytdl-core");

declare global {
    interface Window {
        IPC: IPC;
    }
}

export interface IPC {
    sendTitleBarEvent(type: "MAXIMIZE"|"MINIMIZE"|"CLOSE"): undefined,
    invokeInfoRequest(vid: string): Promise<ytdl.videoInfo>,
    sendURL(url: string): undefined,
    subscribeToEvent(event: string, callback: Function): undefined,
}

export interface ServerEventData {}

export interface YoutubeDownloadRequest extends ServerEventData {
    downloadID: `${string}-${string}-${string}-${string}-${string}`,
    vid: string,
    fileName: string,
    dir: string,
    fullDir: string,
    type: "MP4" | "MP3",
    hasErrored: boolean,
    error: string,
}

export type ServerEvent =  [type: string, data: ServerEventData]