import assert from "node:assert/strict";
import test from "node:test";
import { JSDOM } from "jsdom";
import { chineseMessages, translatePhrase } from "../src/ui/locales";
import { mountTranslator } from "../src/ui/dom-translate";

test("known labels translate exactly; unknown user text stays unchanged", () => {
  assert.equal(translatePhrase("Plugin Manager"), "插件管理器");
  assert.equal(translatePhrase("  Back to app  "), "  返回应用  ");
  assert.equal(translatePhrase("Build special recommendation algorithm"), "Build special recommendation algorithm");
  assert.equal(translatePhrase("E:\\JAVA\\IdeaWeave"), "E:\\JAVA\\IdeaWeave");
  assert.equal(translatePhrase(""), "");
});

test("dictionary includes common plugin and issue controls", () => {
  for (const key of ["Plugins", "Installed Plugins", "Projects", "Agents", "Create task"]) {
    assert.ok(chineseMessages[key], key);
  }
});

test("DOM translation handles mutation, toggles, and skips editors", async () => {
  const dom = new JSDOM(`<body>
    <nav><span>Plugins</span></nav>
    <button title="Save">Save</button>
    <input placeholder="Search" value="Projects">
    <div role="textbox" contenteditable="true">Projects</div>
    <pre><code>Task</code></pre>
    <h2 data-paperclip-zh-ignore>Plugin Manager</h2>
  </body>`, { url: "http://localhost:3100" });
  const { document, MutationObserver } = dom.window;
  const previousObserver = globalThis.MutationObserver;
  globalThis.MutationObserver = MutationObserver as typeof MutationObserver;
  try {
    const translator = mountTranslator(document, true);
    assert.equal(document.querySelector("nav span")?.textContent, "插件");
    assert.equal(document.querySelector("button")?.textContent, "保存");
    assert.equal(document.querySelector("button")?.title, "保存");
    assert.equal(document.querySelector("input")?.getAttribute("placeholder"), "搜索");
    assert.equal(document.querySelector("input")?.value, "Projects");
    assert.equal(document.querySelector('[role="textbox"]')?.textContent, "Projects");
    assert.equal(document.querySelector("pre")?.textContent, "Task");
    assert.equal(document.querySelector("[data-paperclip-zh-ignore]")?.textContent, "Plugin Manager");

    const added = document.createElement("button");
    added.textContent = "Create";
    document.body.append(added);
    await new Promise((resolve) => setTimeout(resolve, 0));
    assert.equal(added.textContent, "创建");
    translator.setEnabled(false);
    assert.equal(document.querySelector("nav span")?.textContent, "Plugins");
    assert.equal(added.textContent, "Create");
    translator.setEnabled(true);
    assert.equal(added.textContent, "创建");
    translator.destroy();
    assert.equal(added.textContent, "Create");
  } finally {
    globalThis.MutationObserver = previousObserver;
  }
});
