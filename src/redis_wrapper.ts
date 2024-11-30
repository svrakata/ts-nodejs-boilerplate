import Logger from "@/utils/logger.js";
import { createClient, RedisClientType } from "redis";

class RedisWrapper {
    private client: RedisClientType;
    private logger: Logger;
    private isConnected = 0;

    constructor(logger: Logger = new Logger()) {
        this.logger = logger;
        this.client = createClient();
    }

    init() {
        this.client.connect();

        this.client.on("connect", () => {
            this.isConnected = 1;
            this.logger.info("Redis connected successfully");
        });

        this.client.on("error", (error) => {
            this.isConnected = -1;
            this.logger.error(`Redis error: ${error}`);
        });
    }

    async checkConnection(timeout = 10000): Promise<void> {
        const startTime = Date.now();

        while (this.isConnected === 0) {
            if (Date.now() - startTime > timeout) {
                this.logger.error("Redis connection timeout");
                throw new Error("Redis connection timeout");
            }
            await new Promise((resolve) => setTimeout(resolve, 100)); // Polling interval
        }

        if (this.isConnected === -1) {
            throw new Error("Redis connection failed");
        }
    }

    async disconnect() {
        if (this.isConnected === 1) {
            await this.client.disconnect();
            this.isConnected = 0;
            this.logger.info("Redis connection closed");
        }
    }

    async rPush<T>(key: string, value: T): Promise<void> {
        await this.checkConnection();
        await this.client.rPush(key, JSON.stringify(value));
    }

    async lPop<T>(key: string): Promise<T | null> {
        await this.checkConnection();
        const value = await this.client.lPop(key);
        const parsedValue = value ? JSON.parse(value) : (null as T);
        return parsedValue;
    }

    async queueLen(key: string): Promise<number> {
        await this.checkConnection();
        return this.client.lLen(key);
    }

    async set(key: string, value: string): Promise<void> {
        await this.checkConnection();
        await this.client.set(key, value);
    }

    async get(key: string): Promise<string | null> {
        await this.checkConnection();
        return this.client.get(key);
    }

    async updateStatus(key: string, status: string): Promise<void> {
        await this.checkConnection();
        await this.client.set(key, status);
    }

    async del(key: string): Promise<void> {
        await this.checkConnection();
        await this.client.del(key);
    }

    async exists(key: string): Promise<boolean> {
        await this.checkConnection();
        return (await this.client.exists(key)) === 1;
    }
}

export default new RedisWrapper();
