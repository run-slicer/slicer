import type { EventHandler } from "$lib/event";
import { resolveClassNavigator } from "$lib/utils";
import type { Entry } from "$lib/workspace";
import { RangeSetBuilder, type Extension } from "@codemirror/state";
import { Decoration, EditorView, ViewPlugin } from "@codemirror/view";
import type { ResolvedType, TypeReferenceResolver } from "@katana-project/laser";

export const highlightAst = (
    resolver: TypeReferenceResolver | null,
    handler: EventHandler,
    classes: Map<string, Entry>,
    index: Map<string, string>
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
        resolveClassNavigator(resolution, handler, view, classes, index).navigateToClass();

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
