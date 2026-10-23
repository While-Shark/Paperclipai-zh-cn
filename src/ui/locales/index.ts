import generated from "./generated.json";
import { common } from "./common";
import { settings } from "./settings";
import { work } from "./work";
import { agents } from "./agents";
import { plugins } from "./plugins";
import { onboarding } from "./onboarding";
import { glossary } from "./glossary";
import experimental from "./experimental.json";

// Machine-generated translations are low priority; manually reviewed terminology wins.
export const chineseMessages: Readonly<Record<string, string>> = Object.freeze({
  ...generated,
  ...common,
  ...settings,
  ...work,
  ...agents,
  ...plugins,
  ...onboarding,
  ...glossary,
  ...experimental,
});

const surroundingWhitespace = /^(\s*)([\s\S]*?)(\s*)$/;
const localizedUnits: Record<string, string> = {
  second: "秒", minute: "分钟", hour: "小时",
  day: "天", week: "周", month: "个月", year: "年",
};

/** Translate known UI labels without changing arbitrary task/user content. */
export function translatePhrase(text: string): string {
  const match = surroundingWhitespace.exec(text);
  if (!match) return text;
  const [, start, core, end] = match;
  if (!core || !/[A-Za-z]/.test(core)) return text;
  const translated = translateCore(core);
  return translated === core ? text : start + translated + end;
}

function translateCore(core: string): string {
  const direct = chineseMessages[core];
  if (direct) return direct;

  const normalized = core.replace(/\s+/g, " ").trim().replace(/…/g, "...").replace(/\u00a0/g, " ");
  if (normalized !== core && chineseMessages[normalized]) return chineseMessages[normalized];

  const countSuffix = /^(.*)\s+\((\d+)\)$/.exec(core);
  if (countSuffix) {
    const noun = chineseMessages[countSuffix[1]];
    if (noun) return `${noun}（${countSuffix[2]}）`;
  }
  const countPrefix = /^(\d[\d,.]*)\s+([A-Za-z][A-Za-z ]{1,55})$/.exec(core);
  if (countPrefix) {
    const label = chineseMessages[countPrefix[2]];
    if (label) return `${countPrefix[1]} 个${label}`;
  }

  const ago = /^(\d+)\s+(second|minute|hour|day|week|month|year)s?\s+ago$/i.exec(core);
  if (ago) return `${ago[1]} ${localizedUnits[ago[2].toLowerCase()]}前`;

  const paging = /^Showing\s+([\d,]+)\s*[-–]\s*([\d,]+)\s+of\s+([\d,]+)$/i.exec(core);
  if (paging) return `显示第 ${paging[1]}–${paging[2]} 条，共 ${paging[3]} 条`;

  const colon = /^(.+?)\s*[:：]$/.exec(core);
  if (colon && chineseMessages[colon[1]]) return chineseMessages[colon[1]] + "：";
  const ellipsis = /^(.+?)(\.\.\.|…)$/.exec(core);
  if (ellipsis && chineseMessages[ellipsis[1]]) return chineseMessages[ellipsis[1]] + "…";

  return core;
}
