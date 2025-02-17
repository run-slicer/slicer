import { rootContext } from "$lib/script";

export interface Result {
    expr: string;

    value: any;
    error: boolean;
}

type Evaluator = (expr: string) => Result;
export const evalContext = (): Evaluator => {
    "use strict";

    // expose script context to eval
    // noinspection JSUnusedLocalSymbols
    const context = rootContext;

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
