export enum USStateCodeCrawlingLevel {
    STATES = "states",
    YEARS = "years",
    LEAF = "list",
    END = "end",
}

export interface DownloadTaskData {
    url: string;
    level: USStateCodeCrawlingLevel;
    path: string[];
}

export interface ProcessingTaskData {
    filePath: string;
    level: USStateCodeCrawlingLevel;
    downloadTaskId: string;
    path: string[];
}