import "@xyflow/svelte/dist/style.css";
import { mount } from "svelte";
import App from "./app.svelte";
import "./main.css";

export default mount(App, { target: document.getElementById("app")! });
