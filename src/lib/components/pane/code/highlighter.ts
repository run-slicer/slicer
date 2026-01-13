import { RangeSetBuilder, type Extension } from "@codemirror/state";
import { Decoration, EditorView, ViewPlugin } from "@codemirror/view";
import type { TypeReferenceResolver } from "@katana-project/laser";

export const highlightAst = (resolver: TypeReferenceResolver | null): Extension => {
    const plugin = ViewPlugin.fromClass(
        class {
            decorations = Decoration.none;

            ctrlDown = false;
            hoverPos: number | null = null;

            constructor(readonly view: EditorView) {}

            update() {
                // All logic lives here
                if (!this.ctrlDown || !resolver || this.hoverPos == null) {
                    this.decorations = Decoration.none;
                    return;
                }

                const resolved =
                    resolver.resolveAt(this.hoverPos)

                const node = resolved?.ref?.node;

                if (!node || resolved.kind === "unresolved") {
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

    const handlers = EditorView.domEventHandlers({
        mousemove(event, view) {
            const inst = view.plugin(plugin);
            if (!inst) return;

            const pos = view.posAtCoords({
                x: event.clientX,
                y: event.clientY,
            });

            if (inst.hoverPos !== pos) {
                inst.hoverPos = pos;
                view.dispatch({}); // force update()
            }
        },

        keydown(event, view) {
            if (event.key === "Control") {
                const inst = view.plugin(plugin);
                if (!inst) return;

                inst.ctrlDown = true;
                view.dispatch({}); // highlight immediately
            }
        },

        keyup(event, view) {
            if (event.key === "Control") {
                const inst = view.plugin(plugin);
                if (!inst) return;

                inst.ctrlDown = false;
                view.dispatch({}); // clear immediately
            }
        },

        mouseleave(_, view) {
            const inst = view.plugin(plugin);
            if (!inst) return;

            inst.hoverPos = null;
            view.dispatch({});
        },
    });

    return [plugin, handlers];
};
