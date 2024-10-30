import { read } from "./reader";
import type { Worker } from "./";
import { expose } from "comlink";

expose({ read } satisfies Worker);
