import { cancellable, type Cancellable, CancelledError } from "$lib/utils";
import { type Remote, wrap } from "comlink";

export interface WorkerLike<T> {
    worker(): Remote<T>;
    cancellable<R>(func: (w: Remote<T>) => PromiseLike<R>): Cancellable<R>;
    terminate(): void;
}

export interface WorkerPool<T> {
    size: number;
    instance(): WorkerLike<T>;
}

interface InternalWorker<T> extends WorkerLike<T> {
    proxy: Remote<T> | null;
    current: Worker | null;
}

const DEFAULT_SIZE = Math.max(1, Math.floor(navigator.hardwareConcurrency / 2));

export const createDefaultWorkerPool = <T>(factory: () => Worker): WorkerPool<T> => {
    return createWorkerPool<T>(DEFAULT_SIZE, factory);
};

export const createWorkerPool = <T>(count: number, factory: () => Worker): WorkerPool<T> => {
    const pool: WorkerLike<T>[] = [];

    for (let i = 0; i < count; i++) {
        pool.push({
            proxy: null,
            current: null,
            worker() {
                if (this.current === null) {
                    this.current = factory();
                    this.proxy = wrap<T>(this.current);
                }
                return this.proxy;
            },
            cancellable(func) {
                return cancellable(
                    (_, onCancel) =>
                        new Promise((resolve, reject) => {
                            const promise = func(this.worker());
                            promise.then(resolve, reject);

                            onCancel(() => {
                                this.terminate();
                                reject(new CancelledError());
                            });
                        })
                );
            },
            terminate() {
                this.current?.terminate();
                this.current = null;
                this.proxy = null;
            },
        } as InternalWorker<T>);
    }

    let currWorker = 0;
    return {
        size: count,
        instance() {
            const worker = pool[currWorker++];
            if (currWorker >= pool.length) {
                currWorker = 0; // wrap around
            }

            return worker;
        },
    };
};
