import "@xyflow/svelte/dist/style.css";
import { mount } from "svelte";
import App from "./app.svelte";
import "./main.css";

import { polyfill } from "wasm-imports-parser/polyfill";

// this needs to be polyfilled because Safari has trouble parsing TeaVM output
globalThis.WebAssembly = polyfill(globalThis.WebAssembly);

export default mount(App, { target: document.getElementById("app")! });
