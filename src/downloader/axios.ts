import { Downloader, DownloadOptions, DownloadResponse } from "@/types/downloader.js";
import axios, { AxiosRequestConfig } from "axios";

export class AxiosDownloader implements Downloader {
    async download(url: string, options: DownloadOptions = {}): Promise<DownloadResponse> {
        const config: AxiosRequestConfig = {
            url,
            method: "GET",
            headers: options.headers,
            proxy: options.proxy ? options.proxy : undefined,
            timeout: options.timeout,
        };

        try {
            const response = await axios(config);
            return {
                url,
                status: response.status,
                headers: response.headers as Record<string, string>,
                data: response.data,
            };
        } catch (error: unknown) {
            if (error instanceof Error) {
                throw new Error(`Failed to download ${url}: ${error.message}`);
            }
            throw new Error(`Failed to download ${url}`);
        }
    }
}
