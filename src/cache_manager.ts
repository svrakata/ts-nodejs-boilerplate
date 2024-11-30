import { createHash } from "crypto";
import { ensureDir } from "fs-extra";
import { readdir, readFile, unlink, writeFile } from "fs/promises";
import { join } from "path";
import Logger from "./utils/logger.js";

interface CacheParams {
    cacheDir: string;
    logger: Logger;
}

class CacheManager {
    private cacheDir: string;
    private logger: Logger;

    constructor(params: CacheParams) {
        const { cacheDir, logger } = params;
        this.cacheDir = cacheDir;
        this.logger = logger;
    }

    async init() {
        await ensureDir(this.cacheDir);
    }

    private generateFileName(key: string): string {
        const fileName = createHash("sha256").update(key).digest("hex");
        this.logger.debug(`Generated file name: ${fileName}`);
        return fileName;
    }

    async set(key: string, value: string, ttl: number = 0): Promise<string> {
        const fileName = this.generateFileName(key);
        const filePath = join(this.cacheDir, fileName + ".json");
        const expiration = ttl > 0 ? Date.now() + ttl : 0;
        const data = JSON.stringify({ value, expiration });

        await writeFile(filePath, data);
        this.logger.info(`Cache set for key: ${key}`);

        return filePath;
    }

    async get(key: string): Promise<{ filePath: string; fileContent: string } | null> {
        const fileName = this.generateFileName(key);
        const filePath = join(this.cacheDir, fileName + ".json");

        try {
            const data = await readFile(filePath, "utf-8");
            const { value, expiration } = JSON.parse(data);

            if (expiration && Date.now() > expiration) {
                await this.delete(key);
                this.logger.info(`Cache expired for key: ${key}`);
                return null;
            }

            this.logger.info(`Cache hit for key: ${key}`);
            return { filePath, fileContent: value };
        } catch (error) {
            if (error instanceof Error && (error as any).code === "ENOENT") {
                this.logger.info(`Cache miss for key: ${key}`);
                return null;
            }
            this.logger.error(`Error getting cache for key: ${key}`);
            throw error;
        }
    }

    async delete(key: string) {
        const fileName = this.generateFileName(key);
        const filePath = join(this.cacheDir, fileName);

        try {
            await unlink(filePath);
            this.logger.info(`Cache deleted for key: ${key}`);
        } catch (error) {
            if (error instanceof Error && (error as any).code === "ENOENT") {
                this.logger.info(`Cache not found for key: ${key}`);
                return;
            }
            this.logger.error(`Error deleting cache for key: ${key}`);
            throw error;
        }
    }

    async clear() {
        const files = await readdir(this.cacheDir);
        for (const file of files) {
            await unlink(join(this.cacheDir, file));
        }
        this.logger.info("Cache cleared");
    }
}

export default CacheManager;
