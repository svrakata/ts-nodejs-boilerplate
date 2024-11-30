import redis from "@/redis_wrapper.js";
import { join } from "path";

import { DownloaderType } from "./types/downloader.js";
import { DownloaderFactory } from "./downloader/factory.js";
import Logger from "./utils/logger.js";
import StateManager from "./state_manager.js";
import CacheManager from "./cache_manager.js";
import crawlStateCodes from "./state_codes.js";
import { ensureDir } from "fs-extra";

const CACHE_FOLDER_NAME = "_cache";
const DOWNLOADER_RETRIES = 1;
const DOWNLOADER_RATE_LIMIT = 10;

const run = async () => {
    const outputPath = process.cwd();
    const cacheDir = join(outputPath, CACHE_FOLDER_NAME);

    await ensureDir(cacheDir);

    redis.init();

    const downloader = DownloaderFactory.create({
        type: DownloaderType.Axios,
        retries: DOWNLOADER_RETRIES,
        rateLimit: DOWNLOADER_RATE_LIMIT,
    });

    const logger = new Logger();
    const cache = new CacheManager({ logger, cacheDir });
    const state = new StateManager({ logger });

    await crawlStateCodes({ outputPath: join(process.cwd()), downloader, logger, cache, state });
};

run();
