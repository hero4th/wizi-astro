/**
 * Custom Tiptap nodes for the post editor.
 *
 * Everything here renders to markup the content sanitizer allows (see
 * src/lib/content.ts) and that the public site styles via `.prose-pa` — an
 * attribute added here without matching entries in both places would be
 * silently dropped on save.
 */
import { Node, mergeAttributes } from "@tiptap/core";
import TiptapImage from "@tiptap/extension-image";

export type CalloutKind = "info" | "success" | "warning" | "danger";

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    callout: {
      setCallout: (kind: CalloutKind) => ReturnType;
      toggleCallout: (kind: CalloutKind) => ReturnType;
      unsetCallout: () => ReturnType;
    };
  }
}

/** A highlighted note block: `<aside data-callout="info">…</aside>`. */
export const Callout = Node.create({
  name: "callout",
  group: "block",
  content: "block+",
  defining: true,

  addAttributes() {
    return {
      kind: {
        default: "info" as CalloutKind,
        parseHTML: (el) => (el as HTMLElement).getAttribute("data-callout") || "info",
        renderHTML: (attrs) => ({ "data-callout": attrs.kind }),
      },
    };
  },

  parseHTML() {
    return [{ tag: "aside[data-callout]" }];
  },

  renderHTML({ HTMLAttributes }) {
    return ["aside", mergeAttributes(HTMLAttributes), 0];
  },

  addCommands() {
    return {
      setCallout:
        (kind) =>
        ({ commands }) =>
          commands.wrapIn(this.name, { kind }),
      toggleCallout:
        (kind) =>
        ({ commands }) =>
          commands.toggleWrap(this.name, { kind }),
      unsetCallout:
        () =>
        ({ commands }) =>
          commands.lift(this.name),
    };
  },
});

/**
 * The stock Image node plus display attributes, so a picture can be sized and
 * aligned from the editor instead of being always full-width.
 */
export const SizedImage = TiptapImage.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      "data-size": {
        default: "full",
        parseHTML: (el) => (el as HTMLElement).getAttribute("data-size") || "full",
        renderHTML: (attrs) => ({ "data-size": attrs["data-size"] }),
      },
      "data-align": {
        default: "center",
        parseHTML: (el) => (el as HTMLElement).getAttribute("data-align") || "center",
        renderHTML: (attrs) => ({ "data-align": attrs["data-align"] }),
      },
    };
  },
});
