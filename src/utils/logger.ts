import { Chalk, ChalkInstance } from "chalk";

type LogLevel = "debug" | "info" | "warn" | "error";

class Logger {
    private useColors: boolean;
    private logColors: Record<LogLevel, ChalkInstance>;

    constructor(useColors: boolean = true, customColors?: Partial<Record<LogLevel, ChalkInstance>>) {
        const chalk = new Chalk();

        this.useColors = useColors;
        this.logColors = {
            info: chalk.blue,
            warn: chalk.yellow,
            error: chalk.red,
            debug: chalk.gray,
            ...customColors,
        };
    }

    private formatMessage(level: LogLevel, message: string): string {
        const color = this.useColors ? this.logColors[level] : (text: string) => text;
        const timestamp = `[${new Date().toISOString()}]`;
        const formattedMessage = `${color(`[${level.toUpperCase()}]`)} ${timestamp} ${message}`;
        return formattedMessage;
    }

    public log(level: LogLevel, message: string): void {
        console.log(this.formatMessage(level, message));
    }

    public debug(message: string): void {
        this.log("debug", message);
    }

    public info(message: string): void {
        this.log("info", message);
    }

    public warn(message: string): void {
        this.log("warn", message);
    }

    public error(message: string): void {
        this.log("error", message);
    }
}

export default Logger;
