import { Downloader, DownloaderType } from "@/types/downloader.js";

import { AxiosDownloader } from "./axios.js";
import { RateLimitedDownloader } from "./rate_limiter.js";
import { RetryDownloader } from "./retry.js";

interface DownloaderConfig {
    type: DownloaderType;
    retries?: number;
    rateLimit?: number;
}

export class DownloaderFactory {
    static create(config: DownloaderConfig): Downloader {
        const { type, retries, rateLimit } = config;
        let downloader: Downloader;

        switch (type) {
            case DownloaderType.Axios:
                downloader = new AxiosDownloader();
                break;
            case DownloaderType.Fetch:
                // future implementation
                throw new Error(`Downloader type ${type} is not implemented yet`);
            default:
                throw new Error(`Unknown downloader type: ${type}`);
        }

        if (retries !== undefined) {
            downloader = new RetryDownloader(downloader, retries);
        }

        if (rateLimit !== undefined) {
            downloader = new RateLimitedDownloader(downloader, rateLimit);
        }

        return downloader;
    }
}
