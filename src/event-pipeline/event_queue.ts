import Logger from "@/utils/logger.js";
import redis from "@/redis_wrapper.js";
import { EventQueue, Task, TaskStatus } from "./types.js";
import State from "@/state_manager.js";

export interface RedisEventQueueParams {
    name: string;
    logger: Logger;
    maxRetries?: number;
    state: State;
}

class EventQueueRedis<T> implements EventQueue<T> {
    private failedJobs: Task<T>[] = [];
    private name: string;
    private maxRetries: number;
    private logger: Logger;
    private state: State;

    constructor(params: RedisEventQueueParams) {
        const { name, logger, state, maxRetries = 1 } = params;
        this.name = name;
        this.logger = logger;
        this.state = state;
        this.maxRetries = maxRetries;
    }

    async enqueue(task: Task<T>) {
        await this.state.set(task.id, TaskStatus.QUEUED);
        await redis.rPush(this.name, task);

        this.logger.info(`Enqueued task ${task.id}...`);
    }

    async dequeue(): Promise<Task<T> | undefined> {
        const task = await redis.lPop<Task<T>>(this.name);
        if (task === null) {
            this.logger.info("Queue is empty...");
            return;
        }

        this.logger.info(`Dequeued task ${task?.id}...`);
        return task;
    }

    async retry(task: Task<T>): Promise<void> {
        if (task.retries < this.maxRetries) {
            task.retries++;
            await this.enqueue(task);
            this.logger.info(`Retrying task ${task.id}. Attempt ${task.retries}...`);
        } else {
            task.status = TaskStatus.FAILED;
            this.state.set(task.id, TaskStatus.FAILED);
            this.failedJobs.push(task);
        }
    }

}

export default EventQueueRedis;
