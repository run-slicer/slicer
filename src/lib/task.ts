import type { TranslationKey } from "$lib/i18n";
import { log } from "$lib/log";
import { cyrb53 } from "$lib/utils";
import { get, type Writable, writable } from "svelte/store";

export interface Task {
    id: string;
    name: Writable<TranslationKey>;
    desc: Writable<string | null>;
    start?: number;
    progress?: Writable<number>; // 0-100
}

export interface TaskResult {
    task: Task;
    time: number;
}

export const tasks = writable(new Map<string, Task>());

export const add = (task: Task): Task => {
    if (task.start === undefined) {
        task.start = Date.now();
    }

    tasks.update(($tasks) => {
        $tasks.set(task.id, task);
        return $tasks;
    });

    return task;
};

export const create = (name: TranslationKey, desc: string | null, indeterminate: boolean = true): Task => {
    return {
        id: (cyrb53(name + desc) + Math.floor(Math.random() * 65536)).toString(16),
        name: writable(name),
        desc: writable(desc),
        progress: indeterminate ? undefined : writable(0),
    };
};

export const phase = (task: Task): TaskResult => {
    const time = Date.now() - (task.start || 0);
    const desc = get(task.desc);

    let name: string = get(task.name);
    if (name.startsWith("task.")) {
        // prettify translation key
        name = name.substring(5);
    }

    log(`task ${name}${desc ? ` (${desc})` : ""} took ${time}ms`);

    task.start = Date.now(); // reset

    return { task, time };
};

export const remove = (task: Task, endPhase: boolean = true): TaskResult => {
    const result = endPhase ? phase(task) : { task, time: Date.now() - (task.start || 0) };
    tasks.update(($tasks) => {
        $tasks.delete(task.id);
        return $tasks;
    });

    return result;
};

export type TaskAction<T> = (task: Task) => T | PromiseLike<T>;

export interface TimedResult<T> {
    result: T;
    time: number;
}

export const recordTimed = async <T>(
    name: TranslationKey,
    desc: string | null,
    call: TaskAction<T>
): Promise<TimedResult<T>> => {
    const task = create(name, desc);

    let result: T;
    try {
        result = await call(add(task));
    } catch (e) {
        remove(task);
        throw e;
    }

    const { time } = remove(task);
    return { result, time };
};

export const recordProgress = async <T>(name: TranslationKey, desc: string | null, call: TaskAction<T>): Promise<T> => {
    const task = create(name, desc, false);

    try {
        return await call(add(task));
    } finally {
        remove(task);
    }
};

export const record = async <T>(name: TranslationKey, desc: string | null, call: TaskAction<T>): Promise<T> => {
    return (await recordTimed(name, desc, call)).result;
};
