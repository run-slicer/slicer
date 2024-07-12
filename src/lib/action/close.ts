import { current as currentWs } from "$lib/workspace";

export const close = async () => {
    currentWs.set(null);
};
