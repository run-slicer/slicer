import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { cubicOut } from "svelte/easing";
import type { TransitionConfig } from "svelte/transition";

export const cn = (...inputs: ClassValue[]) => twMerge(clsx(inputs));

interface FlyAndScaleParams {
    y?: number;
    x?: number;
    start?: number;
    duration?: number;
}

export const flyAndScale = (
    node: Element,
    params: FlyAndScaleParams = { y: -8, x: 0, start: 0.95, duration: 150 }
): TransitionConfig => {
    const style = getComputedStyle(node);
    const transform = style.transform === "none" ? "" : style.transform;

    const scaleConversion = (valueA: number, scaleA: [number, number], scaleB: [number, number]) => {
        const [minA, maxA] = scaleA;
        const [minB, maxB] = scaleB;

        const percentage = (valueA - minA) / (maxA - minA);
        return percentage * (maxB - minB) + minB;
    };

    const styleToString = (style: Record<string, number | string | undefined>): string => {
        return Object.keys(style).reduce((str, key) => {
            if (style[key] === undefined) return str;
            return str + `${key}:${style[key]};`;
        }, "");
    };

    return {
        duration: params.duration ?? 200,
        delay: 0,
        css: (t) => {
            const y = scaleConversion(t, [0, 1], [params.y ?? 5, 0]);
            const x = scaleConversion(t, [0, 1], [params.x ?? 0, 0]);
            const scale = scaleConversion(t, [0, 1], [params.start ?? 0.95, 1]);

            return styleToString({
                transform: `${transform} translate3d(${x}px, ${y}px, 0) scale(${scale})`,
                opacity: t,
            });
        },
        easing: cubicOut,
    };
};

export const partition = <T>(arr: T[], func: (e: T) => boolean): [T[], T[]] => {
    const pass: T[] = [], fail: T[] = [];
    for (const elem of arr) {
        (func(elem) ? pass : fail).push(elem);
    }

    return [pass, fail];
}

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
