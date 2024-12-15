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

const log0 = (level: LogLevel, message: string, error?: any) => {
    const logFunc = logFuncs[level] || console.log;

    logFunc(message);
    if (error) {
        // log error separately
        logFunc(error);
    }

    entries.update(($entries) => {
        $entries.push({ level, message, error });
        if ($entries.length > get(loggingMaxEntries)) {
            $entries.shift(); // pop first
        }

        return $entries;
    });
};

export const log = (message: string, error?: any) => log0(LogLevel.INFO, message, error);
export const warn = (message: string, error?: any) => log0(LogLevel.WARN, message, error);
export const error = (message: string, error?: any) => log0(LogLevel.ERROR, message, error);
