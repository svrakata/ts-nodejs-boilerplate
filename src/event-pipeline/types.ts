export enum TaskStatus {
    QUEUED = "queued",
    PROCESSING = "processing",
    COMPLETED = "completed",
    FAILED = "failed",
}

export interface Task<T> {
    id: string;
    url: string;
    data: T;
    retries: number;
    status: TaskStatus;
}

export interface Processor<T> {
    process(task: Task<T>): Promise<void>;
}

export interface EventQueue<T> {
    enqueue(task: Task<T>): Promise<void>;
    dequeue(): Promise<Task<T> | undefined>;
    retry(task: Task<T>): Promise<void>;
}
