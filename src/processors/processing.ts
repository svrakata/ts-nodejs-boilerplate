import { ensureDir, exists } from "fs-extra";
import { readFile, writeFile } from "fs/promises";
import { join } from "path";

import Cache from "@/cache_manager.js";
import { EventQueue, Processor, Task, TaskStatus } from "@/event-pipeline/types.js";
import USStateCodesParserFactory from "@/parsers/us_state_codes/index.js";
import State from "@/state_manager.js";
import { DownloadTaskData, ProcessingTaskData, USStateCodeCrawlingLevel } from "@/types/processors.js";
import Logger from "@/utils/logger.js";
import { getHash } from "@/utils/get_hash.js";

interface ProcessingProcessorParams {
    downloadQueue: EventQueue<DownloadTaskData>;
    processingQueue: EventQueue<ProcessingTaskData>;
    state: State;
    logger: Logger;
    cache: Cache;
}

class ProcessingProcessor implements Processor<ProcessingTaskData> {
    private downloadQueue: EventQueue<DownloadTaskData>;
    private processingQueue: EventQueue<ProcessingTaskData>;
    private state: State;
    private logger: Logger;
    private cache: Cache;

    constructor(params: ProcessingProcessorParams) {
        const { downloadQueue, processingQueue, state, logger, cache } = params;

        this.downloadQueue = downloadQueue;
        this.processingQueue = processingQueue;
        this.state = state;
        this.logger = logger;
        this.cache = cache;
    }

    async process(task: Task<ProcessingTaskData>): Promise<void> {
        const { id, data } = task;
        const { level, filePath } = data;

        this.logger.info(`Processing task ${id}.`);
        this.logger.debug(`Retrieved HTML file path: ${filePath}`);

        // await wait(20);

        if (!exists(filePath)) {
            // if the file does not exists, requee the download task
            // not imeplemented
            // there is a need to store the tasks in redis at all
            throw new Error(`File not found: ${filePath}`);
        }

        const fileContent = await readFile(filePath, "utf-8");
        const fileData = JSON.parse(fileContent);
        const { value } = fileData as { value: string };

        const parser = USStateCodesParserFactory.create(level);

        const result = await parser.parse(value, task.data.path);
        this.logger.debug(`Parsed data: ${JSON.stringify(result)}`);

        const { urls, nextLevel, slug, data: parsedData } = result;

        if (nextLevel === USStateCodeCrawlingLevel.END) {
            this.logger.info(`Reached end of the task ${id}.`);
            return;
        }

        for (const url of urls) {
            const downloadTask: Task<DownloadTaskData> = {
                id: `download-${getHash(url.href)}`,
                url: url.href,
                data: {
                    url: url.href,
                    level: nextLevel,
                    path: [...task.data.path, url.slug],
                },
                retries: 0,
                status: TaskStatus.QUEUED,
            };

            await this.downloadQueue.enqueue(downloadTask);
        }

        const outputDir = join(process.cwd(), "output");
        await ensureDir(outputDir);

        const outputFilePath = join(outputDir, `${getHash(id)}.json`);
        await writeFile(outputFilePath, JSON.stringify(result, null, 4));
    }
}

export default ProcessingProcessor;
