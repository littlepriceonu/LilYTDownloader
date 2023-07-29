import ytdl = require("ytdl-core");

declare global {
    interface Window {
        IPC: IPC;
        Vibrant: any;
    }

    namespace Extension {
        /**
         * Socket message to be sent from the service worker that contains data relating to the download
         * DOWNLOAD_VIDEO|`CLIENT_ID`|`vid`|`fileName`|`directory`|`type`
         */
        export type SocketDownloadRequest = `DOWNLOAD_VIDEO|${string}|${string}|${DownloadFileName}|${DownloadDirectory}|${DownloadFileType}`

        /**
         * The types of communication within the extension
         */
        export type CommunicationType = "DOWNLOAD_VIDEO" | "DOWNLOAD_COMPLETE" | "GET_VIDEO_INFO"
    
        /**
         * Communication that happens between the `popup`, `service-worker`, & `content-scripts` within the extension
         */
        export type Communication = {
            type: CommunicationType,
            data: CommunicationData
        }
    
        /**
         * Data communcated within the extension
         */
        export type CommunicationData = any;
    
        /**
         * A request from the `popup` to the `service-worker` that makes a download request to the LYT server
         */
        export interface DownloadRequest extends CommunicationData {
            fileName: string,
            directory: string,
            type: DownloadFileType,
            vid: string,
        }
    
        export interface VideoInfoRequest extends CommunicationData {
    
        }

        export interface VideoInfoResponse extends CommunicationData {
            title: string,
            vid: string,
            author: string,
        }
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

/**
 * Random UUID for a LYT download
 */
export type LYTDownloadID = `${string}-${string}-${string}-${string}-${string}`

/**
 * Types of download updates
 */
export type YoutubeUpdateType = "AUDIO_DOWNLOADED" | "AUDIO_ERROR" | "VIDEO_DOWNLOADED" | "VIDEO_ERROR" | "DOWNLOAD_COMPLETE" | "FFMPEG_ERROR" | "SIZE_UPDATE"

/**
 * Types of events recieved from the LYT server
 */
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
 * Type of file for the video/audio to be turned into
 */
export type DownloadFileType = "MP4" | "MP3"

/**
 * Enum for which download directory the file should be downloaded to
 */
export type DownloadDirectory = "DOWNLOADS" | "CURRENT_USER"

/**
 * File name for the download
 */
export type DownloadFileName = `${string}.mp4` | `${string}.mp3`

/**
 * Data thats sent to app from the server that contains info about a requested download
 */
export interface YoutubeDownloadRequest extends ServerEventData {
    vid: string,
    fileName: DownloadFileName,
    dir: DownloadDirectory,
    fullDir: string,
    type: DownloadFileType,
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

/**
 * An event that can be recieved from the LYT server
 */
export type ServerEvent = [type: ServerEventType, data: ServerEventData]