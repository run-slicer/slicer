import { cancellable, type Cancellable, CancelledError } from "$lib/utils";
import { type Remote, wrap } from "comlink";

type WorkerTask<T, R> = (w: Remote<T>) => R | PromiseLike<R>;

export interface WorkerLike<T> {
    task<R>(task: WorkerTask<T, R>): Promise<R>;
    cancellable<R>(func: WorkerTask<T, R>): Cancellable<R>;
}

export interface WorkerPool<T> {
    size: number;
    instance(): WorkerLike<T>;
}

interface QueuedTask<T, R> {
    func: WorkerTask<T, R>;
    resolve: (value: R) => void;
    reject: (error: any) => void;
    cancelled?: boolean;

    signal?: Promise<never>;
}

interface InternalWorker<T> extends WorkerLike<T> {
    proxy: Remote<T> | null;
    current: Worker | null;
    queue: QueuedTask<T, any>[];
    processing: boolean;
    processQueue(): Promise<void>;
}

export const createWorker = <T>(factory: () => Worker): InternalWorker<T> => {
    return {
        proxy: null,
        current: null,
        queue: [],
        processing: false,

        async processQueue() {
            if (this.processing || this.queue.length === 0) {
                return;
            }

            this.processing = true;

            while (this.queue.length > 0) {
                const task = this.queue.shift()!;
                if (task.cancelled) {
                    continue;
                }

                try {
                    if (this.current === null) {
                        this.current = factory();
                        this.proxy = wrap<T>(this.current);
                    }

                    // race the task against cancellation to handle worker termination
                    const result = await Promise.race([
                        task.func(this.proxy!),
                        task.signal ?? new Promise(() => {}), // never resolves if no cancel promise
                    ]);

                    if (!task.cancelled) {
                        task.resolve(result);
                    }
                } catch (error) {
                    if (!task.cancelled) {
                        task.reject(error);
                    }
                }
            }

            this.processing = false;
        },

        task(func) {
            return new Promise((resolve, reject) => {
                this.queue.push({ func, resolve, reject });
                this.processQueue().then();
            });
        },

        cancellable(func) {
            return cancellable((_, onCancel) => {
                return new Promise((resolve, reject) => {
                    let cancelSignal = () => {};
                    const signal = new Promise<never>((_, rej) => {
                        cancelSignal = () => rej(new CancelledError());
                    });

                    const task: QueuedTask<T, any> = { func, resolve, reject, signal };
                    this.queue.push(task);

                    onCancel(() => {
                        task.cancelled = true;
                        // if currently processing, terminate the worker
                        const index = this.queue.indexOf(task);
                        if (index === -1) {
                            const current = this.current;
                            this.current = null;
                            this.proxy = null;
                            current?.terminate();

                            cancelSignal();
                        }

                        reject(new CancelledError());
                    });

                    this.processQueue().then();
                });
            });
        },
    };
};

const DEFAULT_SIZE = Math.max(1, navigator.hardwareConcurrency);

export const createDefaultWorkerPool = <T>(factory: () => Worker): WorkerPool<T> => {
    return createWorkerPool<T>(DEFAULT_SIZE, factory);
};

export const createWorkerPool = <T>(count: number, factory: () => Worker): WorkerPool<T> => {
    const pool = new Array<InternalWorker<T>>(count);
    for (let i = 0; i < count; i++) {
        pool[i] = createWorker(factory);
    }

    let currWorker = 0;
    return {
        size: count,
        instance() {
            for (const worker of pool) {
                // find an idle worker
                if (!worker.processing && worker.queue.length === 0) {
                    return worker;
                }
            }

            // all busy, use round-robin
            const worker = pool[currWorker++];
            if (currWorker >= pool.length) {
                currWorker = 0; // wrap around
            }

            return worker;
        },
    };
};
