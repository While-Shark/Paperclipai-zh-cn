import { readFile, mkdir, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

const base = resolve(process.cwd(), "coverage");
const { items, fileCount, uniqueStrings } = JSON.parse(await readFile(resolve(base, "upstream-ui-strings.json"), "utf8"));
const sourceKinds = new Set(["jsx-text","jsx-attribute","property"]);
const bad = /\b(?:px|py|space-y|text-(?:sm|xs|lg)|bg-|border-|items-|justify-|hover:|font-|opacity-|rounded-|truncate|flex-col|flex-row|h-|w-|z-|grid-|overflow-|focus:|dark:|transition-|ring-|shadow-)\S*/;
const acronym = /^(?:API|SDK|CSS|JS|HTML|JSON|XML|TS|TSX|GitHub|GitLab|OpenAI|Codex|ChatGPT|MCP|JWT|OAuth|SSO|CLI|ACPX|ASCII|SSE|URL|UUID)$/;
const camel = /[a-z][A-Z]/;
const snake = /\b[a-z]+(?:_[a-z0-9]+)+\b/;
const pureSymbol = /(?:^|\s)(?:false|true|null|undefined|function|return|throw|if|else|const|let|var|typeof|object|number|boolean|string)(?:\s|$)/i;

const result = [];
const rejected = {};
for (const entry of items) {
  const s = entry.text;
  let reason = "";
  const fromUi = entry.kinds.some(k => sourceKinds.has(k));
  if (!fromUi && !((entry.kinds.includes("jsx-expression")) && /[A-Z ]/.test(s) && !/^[a-z]+$/.test(s))) reason = "nonvisible-literal";
  else if (bad.test(s)) reason = "styles";
  else if (acronym.test(s)) reason = "brand-or-code";
  else if (camel.test(s) || snake.test(s)) reason = "identifier";
  else if (pureSymbol.test(s)) reason = "program";
  else if (/^(?:[\w-]+(?:\.[\w-]+)+|[\w-]+(?:\/[\w-]+)+)$/.test(s)) reason="path-like";
  else if (/\b[a-zA-Z]+\.[a-zA-Z]{2,}\b/.test(s)) reason="domain";
  else if (s.length>1500) reason = "too-long";
  else if (/^[a-z\d_-]+$/.test(s) && !fromUi) reason = "enum";
  else if (!/[A-Za-z]/.test(s)) reason = "non-english";
  else if (/\$\{|\{\{?|\}\}?|<\w+/.test(s)) reason = "template-code";
  if (reason) rejected[reason]=(rejected[reason]||0)+1;
  else result.push(entry);
}
const out={tag:"v2026.1012.0",sourceFileCount:fileCount,rawExtracted:uniqueStrings,eligible:result.length,eligibleOccurrences:result.reduce((s,e)=>s+e.count,0),exclusions:rejected,items:result};
await mkdir(base,{recursive:true});
await writeFile(resolve(base,"eligible-ui-strings.json"),JSON.stringify(out,null,2)+"\n");
console.log("ELIGIBLE="+out.eligible+" OCCURRENCES="+out.eligibleOccurrences+" REJECTED="+JSON.stringify(rejected));
console.log("SAMPLE:");
for(const e of result.slice(0,80)) console.log(String(e.count).padStart(3),e.text.slice(0,130));
