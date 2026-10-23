import { translatePhrase } from "./locales";

type TranslationState = { source: string; translated: string };
type Attribute =
  | "placeholder" | "title" | "aria-label" | "aria-description"
  | "aria-valuetext" | "alt" | "data-tooltip" | "data-tooltip-content"
  | "data-placeholder" | "value";

const ATTRIBUTES: Attribute[] = [
  "placeholder", "title", "aria-label", "aria-description", "aria-valuetext",
  "alt", "data-tooltip", "data-tooltip-content", "data-placeholder", "value",
];
const IGNORED_SELECTOR = [
  "[data-paperclip-zh-ignore]",
  "[contenteditable]",
  "[data-lexical-editor]",
  "[role=textbox]",
  "script",
  "style",
  "textarea",
  "pre",
  "code",
  "kbd",
  ".cm-editor",
  ".monaco-editor",
  ".ProseMirror",
  ".tiptap",
  "[data-user-content]",
  "[data-editor]",
  "[data-slate-editor]",
].join(", ");

export interface DomTranslator {
  setEnabled(enabled: boolean): void;
  destroy(): void;
}

/**
 * Browser-side localization for short, known UI labels only.
 * No network requests and no changes to task/issue/editor field values.
 */
export function mountTranslator(doc: Document, initialEnabled: boolean): DomTranslator {
  const originalText = new Map<Text, TranslationState>();
  const originalAttributes = new Map<Element, Map<Attribute, TranslationState>>();
  const pending = new Set<Node>();
  let enabled = initialEnabled;
  let scheduled = false;
  let disposed = false;

  const isIgnored = (element: Element | null): boolean =>
    !element || Boolean(element.closest(IGNORED_SELECTOR));

  function visitText(node: Text): void {
    if (isIgnored(node.parentElement)) return;
    const current = node.nodeValue ?? "";
    const previous = originalText.get(node);
    if (!enabled) {
      if (previous && current === previous.translated) node.nodeValue = previous.source;
      originalText.delete(node);
      return;
    }
    if (previous?.translated === current) return;

    const replacement = translatePhrase(current);
    if (replacement !== current) {
      originalText.set(node, { source: current, translated: replacement });
      node.nodeValue = replacement;
    } else {
      originalText.delete(node);
    }
  }

  function visitElement(element: Element): void {
    if (isIgnored(element)) return;
    for (const name of ATTRIBUTES) {
      // Input value is user-controlled except for native button controls.
      if (name === "value" && !(element instanceof doc.defaultView!.HTMLInputElement &&
        /^(button|submit|reset)$/i.test(element.type))) continue;

      const current = element.getAttribute(name);
      if (current === null) continue;

      let states = originalAttributes.get(element);
      const previous = states?.get(name);
      if (!enabled) {
        if (previous && previous.translated === current) {
          element.setAttribute(name, previous.source);
        }
        states?.delete(name);
        if (states?.size === 0) originalAttributes.delete(element);
        continue;
      }
      if (previous?.translated === current) continue;
      const replacement = translatePhrase(current);
      if (replacement !== current) {
        if (!states) {
          states = new Map();
          originalAttributes.set(element, states);
        }
        states.set(name, { source: current, translated: replacement });
        element.setAttribute(name, replacement);
      } else {
        states?.delete(name);
      }
    }
  }

  function visitSubtree(root: Node): void {
    if (root.nodeType === 1 && isIgnored(root as Element)) return;
    if (root.nodeType === 3) {
      visitText(root as Text);
      return;
    }
    if (root.nodeType !== 1 && root.nodeType !== 9 && root.nodeType !== 11) return;
    if (root.nodeType === 1) visitElement(root as Element);

    const walker = doc.createTreeWalker(root, 1 | 4); // elements + text
    let node = walker.nextNode();
    while (node) {
      if (node.nodeType === 1) visitElement(node as Element);
      else visitText(node as Text);
      node = walker.nextNode();
    }
  }

  function forgetSubtree(root: Node): void {
    if (root.isConnected) return;
    if (root.nodeType === 3) originalText.delete(root as Text);
    if (root.nodeType === 1) originalAttributes.delete(root as Element);
    const walker = doc.createTreeWalker(root, 1 | 4);
    let node = walker.nextNode();
    while (node) {
      if (node.nodeType === 3) originalText.delete(node as Text);
      else originalAttributes.delete(node as Element);
      node = walker.nextNode();
    }
  }

  const observer = new MutationObserver((mutations) => {
    if (disposed) return;
    for (const change of mutations) {
      if (change.type === "childList") {
        change.addedNodes.forEach((node) => pending.add(node));
        change.removedNodes.forEach(forgetSubtree);
      } else {
        pending.add(change.target);
      }
    }
    if (scheduled || pending.size === 0) return;
    scheduled = true;
    queueMicrotask(() => {
      scheduled = false;
      if (disposed) return;
      const changes = [...pending];
      pending.clear();
      for (const node of changes) {
        if (node.isConnected) visitSubtree(node);
      }
    });
  });

  if (doc.body) {
    observer.observe(doc.body, {
      childList: true,
      characterData: true,
      attributes: true,
      attributeFilter: ATTRIBUTES,
      subtree: true,
    });
    if (enabled) visitSubtree(doc.body);
  }

  return {
    setEnabled(nextEnabled: boolean) {
      if (disposed || nextEnabled === enabled) return;
      enabled = nextEnabled;
      pending.clear();
      if (!enabled) {
        for (const [node, state] of originalText) {
          if (node.isConnected && node.nodeValue === state.translated) node.nodeValue = state.source;
        }
        for (const [element, states] of originalAttributes) {
          if (!element.isConnected) continue;
          for (const [attr, state] of states) {
            if (element.getAttribute(attr) === state.translated) element.setAttribute(attr, state.source);
          }
        }
        originalText.clear();
        originalAttributes.clear();
      } else if (doc.body) {
        visitSubtree(doc.body);
      }
    },
    destroy() {
      if (disposed) return;
      observer.disconnect();
      disposed = true;
      for (const [node, state] of originalText) {
        if (node.isConnected && node.nodeValue === state.translated) node.nodeValue = state.source;
      }
      for (const [element, states] of originalAttributes) {
        if (!element.isConnected) continue;
        for (const [attr, state] of states) {
          if (element.getAttribute(attr) === state.translated) element.setAttribute(attr, state.source);
        }
      }
      originalText.clear();
      originalAttributes.clear();
      pending.clear();
    },
  };
}
