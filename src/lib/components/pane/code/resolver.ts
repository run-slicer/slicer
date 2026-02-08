import type { EventHandler } from "$lib/event";
import type { Entry } from "$lib/workspace";
import { index } from "$lib/workspace/jdk";
import { type Extension, RangeSetBuilder } from "@codemirror/state";
import { Decoration, EditorView, ViewPlugin } from "@codemirror/view";
import type { ResolvedType, TypeReferenceResolver } from "@katana-project/laser";

interface ResolutionDetail {
    className: string | null;
    packageName: string | null;
    simpleName: string | null;

    open(): void;
    canOpen: boolean;
}

export const resolveType = (
    resolution: ResolvedType | null,
    handler: EventHandler,
    view: EditorView,
    classes: Map<string, Entry>
): ResolutionDetail => {
    let className: string | null = null;
    if (resolution?.qualifiedName) {
        const parts = resolution.qualifiedName.split(".");
        const popped: string[] = [];

        while (parts.length > 0) {
            const candidate = parts.join("/") + (popped.length > 0 ? "$" + popped.toReversed().join("$") : "");

            if (classes.has(candidate) || index.has(candidate)) {
                className = candidate;
                break;
            }

            popped.push(parts.pop()!);
        }

        if (!className) {
            // fallback to full qualified name if we couldn't find any match
            // this might be wrong if we're dealing with inner classes, but it's better than nothing
            className = resolution.qualifiedName.replaceAll(".", "/");
        }
    }

    let packageName: string | null = null,
        simpleName: string | null = null;
    if (className) {
        const lastSlash = className.lastIndexOf("/");
        if (lastSlash > 0) {
            packageName = className.substring(0, lastSlash);
            simpleName = className.substring(lastSlash + 1);
        } else {
            simpleName = className;
        }
    }

    return {
        className,
        packageName,
        simpleName,
        open() {
            if (resolution?.kind === "declared" && resolution.declaration) {
                view.dispatch({
                    selection: { anchor: resolution.declaration.from },
                    effects: EditorView.scrollIntoView(resolution.declaration.from),
                });
            } else if (className) {
                const entry = classes.get(className);
                if (entry) handler.open(entry);
            }
        },
        canOpen:
            resolution?.kind !== "builtin" &&
            ((resolution?.kind === "declared" && !!resolution.declaration) || (!!className && classes.has(className))),
    };
};

export const typeResolver = (
    resolver: TypeReferenceResolver | null,
    handler: EventHandler,
    classes: Map<string, Entry>
): Extension => {
    const plugin = ViewPlugin.fromClass(
        class {
            decorations = Decoration.none;
            ctrlDown = false;
            hoverPos: number | null = null;

            constructor(readonly view: EditorView) {}

            update() {
                // Only highlight when Ctrl/Meta is down and we have a hover position
                if (!this.ctrlDown || !resolver || this.hoverPos == null) {
                    this.decorations = Decoration.none;
                    return;
                }

                const resolved = resolver.resolveAt(this.hoverPos);

                const node = resolved?.ref?.node;

                if (!node || resolved.kind === "builtin") {
                    this.decorations = Decoration.none;
                    return;
                }

                const builder = new RangeSetBuilder<Decoration>();
                builder.add(node.from, node.to, Decoration.mark({ class: "cm-resolved-type" }));
                this.decorations = builder.finish();
            }
        },
        {
            decorations: (v) => v.decorations,
        }
    );

    const navigateToClass = (view: EditorView, resolution: ResolvedType) =>
        resolveType(resolution, handler, view, classes).open();

    const handlers = EditorView.domEventHandlers({
        mousemove(event, view) {
            const inst = view.plugin(plugin);
            if (!inst) return;

            const pos = view.posAtCoords({ x: event.clientX, y: event.clientY });
            if (inst.hoverPos !== pos) {
                inst.hoverPos = pos;
                view.dispatch({});
            }
        },

        mousedown(event, view) {
            const inst = view.plugin(plugin);
            if (!inst || !resolver) return;

            // Only left click + Ctrl/Meta
            if ((event.ctrlKey || event.metaKey) && event.button === 0 && inst.hoverPos != null) {
                event.preventDefault(); // prevent selection/context menu

                const resolved = resolver.resolveAt(inst.hoverPos);
                if (resolved && resolved.kind !== "builtin") {
                    navigateToClass(view, resolved);
                }

                // clear highlight after click
                inst.hoverPos = null;
                view.dispatch({});
            }
        },

        keydown(event, view) {
            if (event.key === "Control" || event.key === "Meta") {
                const inst = view.plugin(plugin);
                if (!inst) return;

                inst.ctrlDown = true;
                view.dispatch({});
            }
        },

        keyup(event, view) {
            if (event.key === "Control" || event.key === "Meta") {
                const inst = view.plugin(plugin);
                if (!inst) return;

                inst.ctrlDown = false;
                view.dispatch({});
            }
        },

        mouseleave(_, view) {
            const inst = view.plugin(plugin);
            if (!inst) return;

            inst.hoverPos = null;
            inst.ctrlDown = false;
            view.dispatch({});
        },

        blur(_, view) {
            const inst = view.plugin(plugin);
            if (!inst) return;

            inst.ctrlDown = false;
            inst.hoverPos = null;
            view.dispatch({});
        },
    });

    return [plugin, handlers];
};
