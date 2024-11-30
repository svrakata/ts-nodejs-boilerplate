import { EventQueue, Processor, Task, TaskStatus } from "@/event-pipeline/types.js";
import { Downloader } from "@/types/downloader.js";
import { DownloadTaskData, ProcessingTaskData } from "@/types/processors.js";
import StateManager from "@/state_manager.js";
import Logger from "@/utils/logger.js";
import CacheManager from "@/cache_manager.js";
import { getHash } from "@/utils/get_hash.js";

interface DownloadProcessorParams {
    downloader: Downloader;
    processingQueue: EventQueue<ProcessingTaskData>;
    state: StateManager;
    logger: Logger;
    cache: CacheManager;
}

class DownloadProcessor implements Processor<DownloadTaskData> {
    private downloader: Downloader;
    private processingQueue: EventQueue<ProcessingTaskData>;
    private stateManager: StateManager;
    private logger: Logger;
    private cacheManager: CacheManager;

    constructor(params: DownloadProcessorParams) {
        const { downloader, processingQueue, state, logger, cache } = params;

        this.downloader = downloader;
        this.processingQueue = processingQueue;
        this.stateManager = state;
        this.logger = logger;
        this.cacheManager = cache;
    }

    async process(task: Task<DownloadTaskData>): Promise<void> {
        const taskState = await this.stateManager.get(task.id);

        if (taskState === TaskStatus.PROCESSING) {
            this.logger.info(`Task ${task.id} is already being processed.`);
            return;
        }

        const cacheKey = task.id;
        const cacheData = await this.cacheManager.get(cacheKey);
        const processTaskId = `process-${getHash(task.data.url)}`;

        // await wait(20);

        if (!cacheData) {
            this.logger.info(`Cache miss for task ${task.id}.`);
            
            const proxyHost = "gateway.proxyrotator.com";
            const proxyPort = 13000;
            
            const response = await this.downloader.download(task.data.url, {
                proxy: {
                    host: proxyHost,
                    port: proxyPort,
                }
            });

            if (response.status !== 200) {
                throw new Error(`Failed to download ${task.data.url}`);
            }

            const filePath = await this.cacheManager.set(task.id, response.data as string);
            await this.stateManager.set(task.id, TaskStatus.COMPLETED);

            task.status = TaskStatus.COMPLETED;

            await this.processingQueue.enqueue({
                id: processTaskId,
                url: task.data.url,
                data: {
                    level: task.data.level,
                    filePath: filePath,
                    downloadTaskId: task.id,
                    path: task.data.path,
                },
                retries: 0,
                status: TaskStatus.QUEUED,
            });
        } else {
            this.logger.info(`Cache hit for task ${task.id}.`);
            await this.processingQueue.enqueue({
                id: processTaskId,
                url: task.data.url,
                data: {
                    level: task.data.level,
                    filePath: cacheData.filePath,
                    downloadTaskId: task.id,
                    path: task.data.path,
                },
                retries: 0,
                status: TaskStatus.QUEUED,
            });

            task.status = TaskStatus.COMPLETED;
            await this.stateManager.set(task.id, TaskStatus.COMPLETED);
        }
    }
}

export default DownloadProcessor;
