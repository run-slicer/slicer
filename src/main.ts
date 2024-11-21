import "@fontsource/geist-sans/400.css";
import "@fontsource/geist-sans/500.css";
import "@fontsource/geist-sans/600.css";
import "@fontsource/geist-sans/700.css";
import "@fontsource/geist-mono";
import "@xyflow/svelte/dist/style.css";
import "./main.css";
import App from "./app.svelte";
import { mount } from "svelte";

export default mount(App, { target: document.getElementById("app")! });
