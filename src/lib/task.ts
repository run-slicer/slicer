import { type Writable, get, writable } from "svelte/store";
import { cyrb53 } from "$lib/utils";
import { log } from "$lib/log";

export interface Task {
    id: string;
    name: string;
    desc: string;
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

export const remove = (id: string): TaskResult | null => {
    const task = get(tasks).get(id);
    if (!task) {
        return null;
    }

    const time = Date.now() - (task.start || 0);
    log(`task ${task.name} (${task.desc}) took ${time}ms`);

    tasks.update(($tasks) => {
        $tasks.delete(id);
        return $tasks;
    });

    return { task, time };
};

export type TaskAction<T> = (task: Task) => T | PromiseLike<T>;

export interface TimedResult<T> {
    result: T;
    time: number;
}

export const recordTimed = async <T>(name: string, desc: string, call: TaskAction<T>): Promise<TimedResult<T>> => {
    const task: Task = { id: cyrb53(name + desc).toString(16), name, desc };

    const result = await call(add(task));
    const { time } = remove(task.id)!;

    return { result, time };
};

export const recordProgress = async <T>(name: string, desc: string, call: TaskAction<T>): Promise<T> => {
    const task: Task = { id: cyrb53(name + desc).toString(16), name, desc, progress: writable(0) };

    const result = await call(add(task));
    remove(task.id);

    return result;
};

export const record = async <T>(name: string, desc: string, call: TaskAction<T>): Promise<T> => {
    return (await recordTimed(name, desc, call)).result;
};
