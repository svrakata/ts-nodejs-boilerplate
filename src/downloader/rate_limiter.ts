import { RateLimiter } from "limiter";
import { Downloader, DownloadOptions, DownloadResponse } from "@/types/downloader.js";

export class RateLimitedDownloader implements Downloader {
    private readonly downloader: Downloader;
    private readonly limiter: RateLimiter;

    constructor(downloader: Downloader, requestsPerSecond: number) {
        this.downloader = downloader;
        this.limiter = new RateLimiter({ tokensPerInterval: requestsPerSecond, interval: "second" });
    }

    async download(url: string, options: DownloadOptions): Promise<DownloadResponse> {
        await this.limiter.removeTokens(1);
        return this.downloader.download(url, options);
    }
}
