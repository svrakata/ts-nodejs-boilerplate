import CacheManager from "./cache_manager.js";
import { BASE_URL_US_CODES } from "./config/crawler.js";
import EventQueueRedis from "./event-pipeline/event_queue.js";
import { Task, TaskStatus } from "./event-pipeline/types.js";
import Worker from "./event-pipeline/worker.js";
import DownloadProcessor from "./processors/download.js";
import ProcessingProcessor from "./processors/processing.js";
import StateManager from "./state_manager.js";
import { Downloader } from "./types/downloader.js";
import { DownloadTaskData, ProcessingTaskData, USStateCodeCrawlingLevel } from "./types/processors.js";
import { getHash } from "./utils/get_hash.js";
import Logger from "./utils/logger.js";

interface CrawlStateCodesParams {
    outputPath: string;
    downloader: Downloader;
    logger: Logger;
    cache: CacheManager;
    state: StateManager;
}

const crawlStateCodes = async (params: CrawlStateCodesParams) => {
    const { downloader, logger, cache, state } = params;

    const dlQueueName = "download-queue";
    const processQueueName = "processing-queue";

    const dlQueue = new EventQueueRedis<DownloadTaskData>({ logger, state, name: dlQueueName });
    const processQueue = new EventQueueRedis<ProcessingTaskData>({ logger, state, name: processQueueName });

    const dlProcessor = new DownloadProcessor({
        logger,
        cache,
        downloader,
        state,
        processingQueue: processQueue,
    });

    const processingProcessor = new ProcessingProcessor({
        logger,
        cache,
        state,
        downloadQueue: dlQueue,
        processingQueue: processQueue,
    });

    const dlWorker = new Worker({ logger, queue: dlQueue, state, concurrency: 10, processor: dlProcessor });
    const processingWorker = new Worker({
        logger,
        queue: processQueue,
        state,
        concurrency: 10,
        processor: processingProcessor,
    });

    dlWorker.start();
    processingWorker.start();

    const urlHash = getHash(BASE_URL_US_CODES);

    const rootTask: Task<DownloadTaskData> = {
        id: `download-${urlHash}`,
        retries: 0,
        status: TaskStatus.QUEUED,
        url: BASE_URL_US_CODES,
        data: {
            url: BASE_URL_US_CODES,
            level: USStateCodeCrawlingLevel.STATES,
            path: [] as string[],
        },
    };

    await dlQueue.enqueue(rootTask);
};

export default crawlStateCodes;
