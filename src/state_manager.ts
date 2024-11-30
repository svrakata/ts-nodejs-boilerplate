import { TaskStatus } from "./event-pipeline/types.js";
import redis from "./redis_wrapper.js";
import Logger from "./utils/logger.js";

interface StateParams {
    logger: Logger;
}

class StateManager {
    private logger: Logger;
    private keyPrefix = "state";

    constructor(params: StateParams) {
        const { logger } = params;
        this.logger = logger;
    }

    async get(key: string): Promise<TaskStatus | null> {
        const res = await redis.get(`${this.keyPrefix}:${key}`);
        this.logger.debug(`State for key ${key}: ${res}`);
        return res as TaskStatus;
    }

    async set(key: string, value: TaskStatus) {
        this.logger.debug(`Setting state for key ${key}: ${value}`);
        await redis.set(`${this.keyPrefix}:${key}`, value);
    }
}

export default StateManager;
