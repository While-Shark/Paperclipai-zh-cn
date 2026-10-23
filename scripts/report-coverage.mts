import { readFileSync, writeFileSync } from "node:fs";
import { chineseMessages, translatePhrase } from "../src/ui/locales/index.ts";

type Item = {text: string;count: number; files: string[]; kinds: string[]};
const src = JSON.parse(readFileSync("coverage/eligible-ui-strings.json","utf8")) as {
  tag: string; eligible: number; eligibleOccurrences: number; items: Item[];
};
const missing = src.items.filter((e)=>translatePhrase(e.text)===e.text);
const missingSet = new Set(missing.map(e=>e.text));
const matched = src.eligible - missing.length;
const missingOccurrences = missing.reduce((s,e)=>s+e.count,0);
const report = {
  sourceTag:src.tag,
  definition:"Static visible UI candidate phrases extracted from TSX JSX text, UI props, and visible literal branches; excludes dynamic application content, user content, and untranslated runtime strings.",
  totalCandidates:src.eligible,
  translatedCandidates:matched,
  translationPercent:Number((matched/src.eligible*100).toFixed(3)),
  totalOccurrences:src.eligibleOccurrences,
  translatedOccurrences:src.eligibleOccurrences-missingOccurrences,
  occurrencePercent:Number(((src.eligibleOccurrences-missingOccurrences)/src.eligibleOccurrences*100).toFixed(3)),
  dictionaryEntries:Object.keys(chineseMessages).length,
  untranslatedStaticCandidates:missing.map(({text,count})=>({text,count})),
  measuredAt:new Date().toISOString(),
};
writeFileSync("coverage/coverage-report.json",JSON.stringify(report,null,2)+"\n");
console.log(JSON.stringify({
  version:report.sourceTag,eligible:report.totalCandidates,
  translated:report.translatedCandidates,coverage:report.translationPercent+"%",
  occurrences:report.occurrencePercent+"%",untranslated:missing.length
},null,2));
if(report.translationPercent<99)process.exitCode=1;
