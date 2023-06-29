declare global {
    interface Window {
        IPC: IPC;
    }
}

export interface IPC {
    send(type: string, data: any): undefined,
    sendURL(url: string): undefined,
    subscribeToEvent(event: string, callback: Function): undefined,
}

export interface ServerEventData {}

export interface YoutubeDownloadRequest extends ServerEventData {
    vid: string,
    fileName: string,
    dir: string,
    fullDir: string,
    type: "MP4" | "MP3",
    
}

export type ServerEvent =  [type: string, data: ServerEventData]