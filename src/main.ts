import "@fontsource/geist-mono";
import "@fontsource/geist-sans/400.css";
import "@fontsource/geist-sans/500.css";
import "@fontsource/geist-sans/600.css";
import "@fontsource/geist-sans/700.css";
import "@xyflow/svelte/dist/style.css";
import { mount } from "svelte";
import App from "./app.svelte";
import "./main.css";

export default mount(App, { target: document.getElementById("app")! });
