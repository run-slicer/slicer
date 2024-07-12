export const partition = <T>(arr: T[], func: (e: T) => boolean): [T[], T[]] => {
    const pass: T[] = [],
        fail: T[] = [];
    for (const elem of arr) {
        (func(elem) ? pass : fail).push(elem);
    }

    return [pass, fail];
};

export const readFiles = (pattern: string, multiple: boolean): Promise<File[]> => {
    return new Promise<File[]>((resolve) => {
        const input = document.createElement("input");
        input.style.display = "none";
        input.type = "file";
        input.accept = pattern;
        input.multiple = multiple;

        input.addEventListener("cancel", () => input.remove());
        input.addEventListener("change", async () => {
            resolve(input.files ? [...input.files] : []);
            input.remove();
        });

        input.click();
    });
};

export interface TimedResult<T> {
    result: T;
    time: number;
}

export const timed = async <T>(name: string, run: () => Promise<T>): Promise<TimedResult<T>> => {
    const start = Date.now();
    const result = await run();
    const time = Date.now() - start;

    console.log(`${name} took ${time}ms`);
    return { result, time };
};

export const timedSync = <T>(name: string, run: () => T): TimedResult<T> => {
    const start = Date.now();
    const result = run();
    const time = Date.now() - start;

    console.log(`${name} took ${time}ms`);
    return { result, time };
};
