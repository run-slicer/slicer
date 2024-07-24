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

export const downloadBlob = (name: string, blob: Blob): Promise<void> => {
    return new Promise<void>((resolve) => {
        const url = URL.createObjectURL(blob);

        const link = document.createElement("a");
        link.style.display = "none";
        link.href = url;
        link.download = name;

        link.click();

        // pretty primitive solution, but should work
        setTimeout(() => {
            link.remove();
            URL.revokeObjectURL(url);

            resolve();
        }, 200);
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
