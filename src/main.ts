import "@xyflow/svelte/dist/style.css";
import "./main.css";
import App from "./app.svelte";

export default new App({
    target: document.getElementById("app")!,
});
