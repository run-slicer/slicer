import { expose } from "comlink";
import type { Worker } from "./";
import { read as hprof } from "./hprof";

expose({ hprof } satisfies Worker);
