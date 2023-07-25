import ytdl = require("ytdl-core");

declare global {
    interface Window {
        IPC: IPC;
        Vibrant: any;
    }
}

/**
 * An object of renderer exposed IPC (Inter Process Communication) functions from the preload script.
 */
export interface IPC {
    /**
     * Invokes a video info request from ytdl-core, see {@link ytdl.videoInfo}
     * @param vid The Video ID to request info on
     */
    invokeInfoRequest(vid: string): Promise<ytdl.videoInfo>,
    /**
     * Opens a URL in the users prefered web browser
     * @param url The URL to open
     */
    openURL(url: string): undefined,
    /**
     * 
     * @param event The event to subscribe to
     * @param callback 
     */
    subscribeToEvent(event: ServerEventType, callback: Function): undefined,
}

export type LYTDownloadID = `${string}-${string}-${string}-${string}-${string}`

/**
 * Types of download updates
 */
export type YoutubeUpdateType = "AUDIO_DOWNLOADED" | "AUDIO_ERROR" | "VIDEO_DOWNLOADED" | "VIDEO_ERROR" | "DOWNLOAD_COMPLETE" | "FFMPEG_ERROR"

export type ServerEventType = "DOWNLOAD_UPDATE" | "DOWNLOAD_REQUESTED" | "DEBUG_MESSAGE"

/**
 * Data sent with a download update
 */
export type YoutubeUpdateData = any

/**
 * The updates that has happened to a certain download
 */
export type YoutubeUpdates = YoutubeDownloadUpdate[]

/**
 * Tells you what has finished downloading and processing
 */
export type DownloadedParts = {
    Video?: boolean,
    Audio: boolean,
    FinalOutput: boolean,
}

/**
 * Data that can be recieved from the server
 */
export interface ServerEventData {
    downloadID: LYTDownloadID,
}

/**
 * Data thats sent to app from the server that contains info about a requested download
 */
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
    partsDownloaded?: DownloadedParts,
    downloadSize?: number,
    videoTitle?: string,
    videoAuthor?: string,
}

/**
 * Data thats sent to the app from the server that contains info about an event that happened to an update, such as the video/audio downloading, the download finishing, the download erroring, etc.
 */
export interface YoutubeDownloadUpdate extends ServerEventData {
    updateType: YoutubeUpdateType,
    data: YoutubeUpdateData, 
    isError?: boolean,
}

/**
 * Data for a LYT Setting
 */
export interface LYTSetting {
    title: string,
    description: string,
    settingID: `LYT${string}`,
    toggled: boolean,
    eventCallback: Function[],
} 

export type ServerEvent = [type: ServerEventType, data: ServerEventData]