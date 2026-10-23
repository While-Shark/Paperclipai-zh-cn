import assert from "node:assert/strict";
import test from "node:test";
import experimental from "../src/ui/locales/experimental.json";
import { translatePhrase } from "../src/ui/locales";

const dict: Record<string, string> = experimental;

test("experimental settings long descriptions and footnotes have curated Chinese translations", () => {
  const entries = Object.entries(experimental);
  assert.ok(entries.length >= 50, "Experimental settings translation map should cover all static notices.");
  for (const [english, chinese] of entries) {
    assert.match(chinese, /[\u3400-\u9fff]/, `Missing Chinese text for ${english.slice(0, 60)}`);
    assert.equal(translatePhrase(english), chinese, `Failed to map ${english.slice(0, 75)}`);
  }
  assert.equal(translatePhrase("Decisions"), "决策");
  assert.equal(translatePhrase("Memory connectors"), "记忆连接器");
  assert.equal(translatePhrase("Paperclip Runner"), "Paperclip Runner（执行器）");
  assert.equal(translatePhrase("Smoke Lab"), "Smoke Lab（冒烟测试）");
});

test("large descriptions and JSX whitespace are translated without losing boundaries", () => {
  const source = Object.keys(experimental).find((key) => key.startsWith("Talk to each agent"));
  assert.ok(source);
  const rendered = `  ${source.replace(" Clarify goals", "\n   Clarify goals")}  `;
  assert.equal(translatePhrase(rendered), `  ${dict[source]}  `);

  const note = Object.keys(experimental).find((key) => key.startsWith("Requires an authenticated"));
  assert.ok(note);
  assert.equal(translatePhrase(note), dict[note]);

  assert.equal(translatePhrase("IdeaWeave customer onboarding roadmap"), "IdeaWeave customer onboarding roadmap");
});
