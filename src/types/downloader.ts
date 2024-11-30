export interface DownloadProxy {
    host: string;
    port: number;
}

export interface DownloadOptions {
    headers?: Record<string, string>;
    timeout?: number;
    proxy?: DownloadProxy;
}

export interface DownloadResponse {
    url: string;
    status: number;
    headers: Record<string, string>;
    data: string | Buffer;
}

export interface Downloader {
    download(url: string, options?: DownloadOptions): Promise<DownloadResponse>;
}

export enum DownloaderType {
    Axios = "axios",
    Fetch = "fetch",
}