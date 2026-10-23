import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import { chineseMessages, translatePhrase } from "../src/ui/locales";

type UiItem = { text: string; count: number; files: string[] };
const source: { eligible: number; eligibleOccurrences: number; items: UiItem[] } =
  JSON.parse(readFileSync(new URL("../coverage/eligible-ui-strings.json", import.meta.url), "utf8"));

test(">=99% of statically extracted UI candidate phrases are translated", () => {
  const translated = source.items.filter((item) => translatePhrase(item.text) !== item.text);
  const percent = translated.length / source.eligible;
  assert.ok(percent >= 0.99, `Only ${(percent * 100).toFixed(2)}% of UI strings were localized`);
});

test("curated Paperclip terminology overrides machine translation", () => {
  assert.equal(chineseMessages.Agent, "智能体");
  assert.equal(chineseMessages.Agents, "智能体");
  assert.equal(chineseMessages.Issues, "任务");
  assert.equal(chineseMessages.Disabled, "已禁用");
  assert.equal(chineseMessages["Plugin Manager"], "插件管理器");
});

test("dynamic counts, relative time and punctuation are localized", () => {
  assert.equal(translatePhrase("3 issues"), "3 个任务");
  assert.equal(translatePhrase("Tasks (12)"), "任务（12）");
  assert.equal(translatePhrase("2 hours ago"), "2 小时前");
  assert.equal(translatePhrase("Showing 1–10 of 50"), "显示第 1–10 条，共 50 条");
  assert.equal(translatePhrase("Project:"), "项目：");
  assert.equal(translatePhrase("https://example.com/"), "https://example.com/");
  assert.equal(translatePhrase("IdeaWeave-X-Publisher"), "IdeaWeave-X-Publisher");
});
