import { writable } from "svelte/store";
import { cyrb53 } from "$lib/utils";
import { log } from "$lib/log";

export interface Task {
    id: string;
    name: string;
    desc: string;
}

export const tasks = writable(new Map<string, Task>());

const add = (task: Task) => {
    tasks.update(($tasks) => {
        $tasks.set(task.id, task);
        return $tasks;
    });
};

const remove = (id: string) => {
    tasks.update(($tasks) => {
        $tasks.delete(id);
        return $tasks;
    });
};

export type TaskAction<T> = (task: Task) => T | PromiseLike<T>;

export interface TimedResult<T> {
    result: T;
    time: number;
}

export const recordTimed = async <T>(name: string, desc: string, call: TaskAction<T>): Promise<TimedResult<T>> => {
    const task: Task = { id: cyrb53(name + desc).toString(16), name, desc };

    add(task);
    const start = Date.now();
    const result = await call(task);
    const end = Date.now();
    remove(task.id);

    const time = end - start;
    log(`task ${task.name} (${task.desc}) took ${time}ms`);

    return { result, time };
};

export const record = async <T>(name: string, desc: string, call: TaskAction<T>): Promise<T> => {
    return (await recordTimed(name, desc, call)).result;
};
