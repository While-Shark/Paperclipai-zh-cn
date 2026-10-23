import { useEffect, useRef, useState } from "react";
import { mountTranslator, type DomTranslator } from "./dom-translate";

const STORAGE_KEY = "chaostar.paperclip-zh-cn.enabled";

function readPreferredLanguage(): boolean {
  try {
    return window.localStorage.getItem(STORAGE_KEY) !== "false";
  } catch {
    return true;
  }
}

/** Persistent Paperclip app-shell UI slot. */
export function ChineseLanguageOverlay() {
  const [enabled, setEnabled] = useState(readPreferredLanguage);
  const translator = useRef<DomTranslator | null>(null);

  useEffect(() => {
    const mounted = mountTranslator(document, enabled);
    translator.current = mounted;
    return () => {
      mounted.destroy();
      translator.current = null;
    };
  }, []);

  useEffect(() => {
    translator.current?.setEnabled(enabled);
    try {
      window.localStorage.setItem(STORAGE_KEY, String(enabled));
    } catch {
      // Incognito or blocked localStorage: keep the current tab functional.
    }
  }, [enabled]);

  return (
    <button
      type="button"
      data-paperclip-zh-ignore=""
      aria-label={enabled ? "切换到英文界面" : "切换到简体中文界面"}
      title={enabled ? "当前为简体中文，点击切换英文" : "Currently English, click for 简体中文"}
      onClick={() => setEnabled((current) => !current)}
      style={{
        position: "fixed",
        right: 18,
        bottom: 24,
        zIndex: 2147483000,
        display: "inline-flex",
        alignItems: "center",
        gap: 7,
        minHeight: 38,
        padding: "8px 13px",
        background: "#151c2c",
        color: "#fff",
        border: "1px solid #64748b",
        borderRadius: 999,
        fontSize: 13,
        fontWeight: 600,
        letterSpacing: ".01em",
        boxShadow: "0 5px 20px rgba(0,0,0,.2)",
        cursor: "pointer",
      }}
    >
      <span aria-hidden="true">文</span>
      {enabled ? "简体中文 · EN" : "English · 中文"}
    </button>
  );
}
