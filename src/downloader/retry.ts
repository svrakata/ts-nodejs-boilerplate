import { Downloader, DownloadOptions, DownloadResponse } from "@/types/downloader.js";

export class RetryDownloader implements Downloader {
    private readonly downloader: Downloader;
    private readonly maxRetries: number;

    constructor(downloader: Downloader, maxRetries: number) {
        this.downloader = downloader;
        this.maxRetries = maxRetries;
    }

    async download(url: string, options: DownloadOptions): Promise<DownloadResponse> {
        let retries = 0;
        while (retries < this.maxRetries) {
            try {
                return await this.downloader.download(url, options);
            } catch (error: unknown) {
                retries++;
                if (retries >= this.maxRetries) {
                    if (error instanceof Error) {
                        throw new Error(`Failed to download ${url}: ${error.message}`);
                    }
                    throw new Error(`Failed to download ${url}`);
                }
            }
        }
        throw new Error(`Unexpected error in RetryDownloader`);
    }
}
