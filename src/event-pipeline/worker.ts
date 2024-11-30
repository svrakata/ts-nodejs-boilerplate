import Logger from "@/utils/logger.js";
import EventQueue from "./event_queue.js";
import { Processor, TaskStatus } from "./types.js";
import State from "@/state_manager.js";

const QUEUE_CHECK_INTERVAL = 1000;

interface WorkerParams<T> {
    logger: Logger;
    queue: EventQueue<T>;
    state: State;
    concurrency: number;
    processor: Processor<T>;
}

class Worker<T> {
    private activeJobs = 0;
    private logger: Logger;
    private queue: EventQueue<T>;
    private state: State;
    private concurrency = 1;
    private processor: Processor<T>;

    constructor(params: WorkerParams<T>) {
        const { logger, queue, state, concurrency, processor } = params;
        this.logger = logger;
        this.queue = queue;
        this.state = state;
        this.concurrency = concurrency;
        this.processor = processor;
    }

    start() {
        const intervalId = setInterval(async () => {
            try {
                if (this.activeJobs >= this.concurrency) {
                    this.logger.debug("Max concurrency reached...");
                    return;
                }

                const task = await this.queue.dequeue();

                if (!task) {
                    this.logger.debug("No tasks to process...");
                    return;
                }
        
                const taskState = await this.state.get(task.id);

                if (taskState === TaskStatus.COMPLETED) {
                    this.logger.info(`Task ${task?.id} is already completed...`);
                    return;
                }

                try {
                    this.activeJobs++;
                    this.logger.info(`Processing task ${task.id}...`);
                    await this.processor.process(task);
                    await this.state.set(task.id, TaskStatus.COMPLETED);
                    this.logger.info(`Task ${task.id} completed!`);
                } catch (error) {
                    console.error(error);
                    this.logger.error(`Task ${task.id} failed: ${JSON.stringify(error)}`);
                    await this.state.set(task.id, TaskStatus.FAILED);
                    await this.queue.retry(task);
                } finally {
                    this.activeJobs--;
                }
            } catch (error) {
                this.logger.error(`Worker error: ${JSON.stringify(error)}`);
                clearInterval(intervalId);
            }
        }, QUEUE_CHECK_INTERVAL);
    }
}

export default Worker;
