import { loggingMaxEntries } from "$lib/state";
import { get, writable } from "svelte/store";

export const enum LogLevel {
    INFO = "info",
    WARN = "warn",
    ERROR = "error",
}

export interface LogEntry {
    level: LogLevel;
    message: string;
    error?: any;
}

export const entries = writable<LogEntry[]>([]);

type LogFunc = (...vals: any[]) => void;
const logFuncs: Record<string, LogFunc> = {
    [LogLevel.INFO]: console.log,
    [LogLevel.WARN]: console.warn,
    [LogLevel.ERROR]: console.error,
};

const consoleLog = console.log;
const log0 = (level: LogLevel, message: string, error?: any) => {
    const logFunc = logFuncs[level] || consoleLog;

    logFunc(message);
    if (error) {
        logFunc(error);

        const errorMsg = error.toString();
        if (message !== errorMsg) {
            message += ` (${errorMsg})`;
        }
    }

    message = message.replaceAll("\n", " ");
    entries.update(($entries) => {
        $entries.push({ level, message, error });
        if ($entries.length > get(loggingMaxEntries)) {
            $entries.shift(); // pop first
        }

        return $entries;
    });
};

const jsLog = (level: LogLevel, data: any[]) => {
    log0(
        level,
        data.join(" "),
        data.find((i) => i instanceof Error)
    );
};

console.info = (...data: any[]) => jsLog(LogLevel.INFO, data);
console.warn = (...data: any[]) => jsLog(LogLevel.WARN, data);
console.error = (...data: any[]) => jsLog(LogLevel.ERROR, data);

console.log = console.info;

export const log = (message: string, error?: any) => log0(LogLevel.INFO, message, error);
export const warn = (message: string, error?: any) => log0(LogLevel.WARN, message, error);
export const error = (message: string, error?: any) => log0(LogLevel.ERROR, message, error);
