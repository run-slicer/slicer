import { expose } from "comlink";
import type { Worker } from "./";
import { read } from "./reader";

expose({ read } satisfies Worker);
