import assert from "node:assert/strict";
import test from "node:test";
import { JSDOM } from "jsdom";
import { mountTranslator } from "../src/ui/dom-translate";

test("translates browser tooltips, accessibility labels and button values safely", async () => {
  const dom = new JSDOM(`<body>
    <div aria-description="No results found" data-tooltip="View all">View all</div>
    <img alt="View details" src="/demo.png">
    <input type="submit" value="Save">
    <input type="text" value="Save" placeholder="Search">
    <input type="password" value="user-password">
    <div data-user-content="true"><span>Tasks</span></div>
    <div contenteditable="true">Agents</div>
  </body>`, { url: "http://localhost:3100" });
  const { document, MutationObserver } = dom.window;
  const originalObserver = globalThis.MutationObserver;
  globalThis.MutationObserver = MutationObserver as typeof MutationObserver;

  try {
    const translator = mountTranslator(document, true);
    assert.equal(document.querySelector("[data-tooltip]")?.getAttribute("data-tooltip"), "查看全部");
    assert.equal(document.querySelector("[aria-description]")?.getAttribute("aria-description"), "未找到结果");
    assert.equal(document.querySelector("img")?.getAttribute("alt"), "查看详情");
    assert.equal(document.querySelector('input[type="submit"]')?.getAttribute("value"), "保存");
    assert.equal(document.querySelector('input[type="text"]')?.getAttribute("value"), "Save");
    assert.equal(document.querySelector('[data-user-content]')?.textContent, "Tasks");
    assert.equal(document.querySelector("[contenteditable]")?.textContent, "Agents");

    const portal = document.createElement("div");
    portal.setAttribute("role", "dialog");
    portal.innerHTML = '<button aria-label="Cancel">Cancel</button>';
    document.body.append(portal);
    await new Promise((r) => setTimeout(r, 0));
    assert.equal(portal.querySelector("button")?.textContent, "取消");
    assert.equal(portal.querySelector("button")?.getAttribute("aria-label"), "取消");

    const dynamic = portal.querySelector("button")!;
    dynamic.textContent = "Retry";
    dynamic.setAttribute("aria-label", "Retry");
    await new Promise((r) => setTimeout(r, 0));
    assert.equal(dynamic.textContent, "重试");
    assert.equal(dynamic.getAttribute("aria-label"), "重试");

    translator.setEnabled(false);
    assert.equal(portal.querySelector("button")?.textContent, "Retry");
    assert.equal(document.querySelector('input[type="submit"]')?.getAttribute("value"), "Save");
    translator.destroy();
  } finally {
    globalThis.MutationObserver = originalObserver;
  }
});
