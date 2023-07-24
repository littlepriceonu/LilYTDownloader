import ytdl = require("ytdl-core");

declare global {
    interface Window {
        IPC: IPC;
        Vibrant: any;
    }
}

export interface IPC {
    sendTitleBarEvent(type: "MAXIMIZE"|"MINIMIZE"|"CLOSE"): undefined,
    invokeInfoRequest(vid: string): Promise<ytdl.videoInfo>,
    openURL(url: string): undefined,
    subscribeToEvent(event: string, callback: Function): undefined,
}

// Types of download Updates
export type YoutubeUpdateType = "AUDIO_DOWNLOADED" | "AUDIO_ERROR" | "VIDEO_DOWNLOADED" | "VIDEO_ERROR" | "DOWNLOAD_COMPLETE" | "FFMPEG_ERROR"

// Data sent with a download update
export type YoutubeUpdateData = any

// The updates that has happened to a certain download
export type YoutubeUpdates = YoutubeDownloadUpdate[]

// Tells you what has finished downloading and processing
export type DownloadedParts = {
    Video?: boolean,
    Audio: boolean,
    FinalOutput: boolean,
}

// Data that can be recieved from the server
export interface ServerEventData {
    downloadID: `${string}-${string}-${string}-${string}-${string}`,
}

export interface YoutubeDownloadRequest extends ServerEventData {
    vid: string,
    fileName: string,
    dir: string,
    fullDir: string,
    type: "MP4" | "MP3",
    hasErrored?: boolean,
    error?: string,
    hasFinished?: boolean,
    updates?: YoutubeUpdates,
    partsDownloaded?: DownloadedParts
}

export interface YoutubeDownloadUpdate extends ServerEventData {
    updateType: YoutubeUpdateType,
    data: YoutubeUpdateData, 
    isError?: boolean,
}

export interface LYTSetting {
    title: string,
    description: string,
    settingID: `LYT${string}`,
    toggled: boolean,
    eventCallback: Function[],
} 

export type ServerEvent =  [type: string, data: ServerEventData]