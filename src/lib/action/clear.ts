import { clear as clearWs } from "$lib/workspace";
import { clear as clearTabs } from "$lib/tab";

export const clear = () => {
    clearWs();
    clearTabs();
};
