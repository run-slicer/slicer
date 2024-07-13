export const partition = <T>(arr: T[], func: (e: T) => boolean): [T[], T[]] => {
    const pass: T[] = [],
        fail: T[] = [];
    for (const elem of arr) {
        (func(elem) ? pass : fail).push(elem);
    }

    return [pass, fail];
};

export const groupBy = <K, V>(arr: V[], func: (e: V) => K): Map<K, V[]> => {
    const map = new Map<K, V[]>();
    for (const e of arr) {
        const key = func(e);

        const group = map.get(key);
        if (!group) {
            map.set(key, [e]);
        } else {
            group.push(e);
        }
    }

    return map;
};
