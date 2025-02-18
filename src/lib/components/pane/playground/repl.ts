import { rootContext } from "$lib/script";

export interface Result {
    expr: string;

    value: any;
    error: boolean;
}

type Evaluator = (expr: string) => Result;
export const evalContext = (): Evaluator => {
    "use strict";

    // expose script context
    Object.defineProperty(globalThis, "context", {
        value: rootContext,
        enumerable: false,
        configurable: true,
        writable: false,
    });

    // noinspection ES6ConvertVarToLetConst
    var __EVAL = (expr: string) => eval(`void (__EVAL = ${__EVAL.toString()}); ${expr}`);

    return (expr) => {
        try {
            return { expr, value: __EVAL(expr), error: false };
        } catch (e) {
            return { expr, value: e, error: true };
        }
    };
};
