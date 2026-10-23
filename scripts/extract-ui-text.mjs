import ts from "typescript";
import { readFile, readdir, mkdir, writeFile } from "node:fs/promises";
import { resolve, relative, extname, join } from "node:path";

const root = resolve(process.argv[2] ?? "../upstream-paperclip-v2026.1012.0/ui/src");
const out = resolve(process.argv[3] ?? "./coverage/upstream-ui-strings.json");
const labels = new Set([
  "title", "label", "placeholder", "description", "helpertext", "hint", "tooltip",
  "subtitle", "heading", "aria-label", "alt", "caption", "text", "message", "footnote",
  "emptytext", "emptymessage", "emptytitle", "emptydescription", "buttontext",
  "confirmtext", "canceltext", "triggerlabel", "displayname", "name", "eyebrow",
  "statustext", "errormessage", "loadingtext", "actionlabel", "dialogtitle",
  "dialogdescription", "confirmtitle", "confirmdescription", "itemlabel",
]);
const results = new Map();

function clean(value) {
  return value.replace(/\s+/g, " ").trim().replace(/&amp;/g, "&").replace(/&nbsp;/g, " ");
}

function looksHuman(value) {
  if (!value || value.length > 1600 || value.length < 2) return false;
  if (!/[A-Za-z]{2,}/.test(value)) return false;
  if (/^(https?:|\/|\\|\.|#|\{|[<>])/u.test(value)) return false;
  if (/^\d/.test(value) || /[@={}\x60]/.test(value)) return false;
  if (/^[_a-z][a-z\d_]*$/u.test(value) && value.length > 10) return false;
  if (/\.(ts|tsx|js|jsx|json|css|svg|png|gif|jpg|lock|md)\b/i.test(value)) return false;
  if (/[\\/]{2,}|[{}<>]/.test(value)) return false;
  if (value.match(/^[a-z]+([.-][a-z0-9]+){2,}$/)) return false;
  if (/\b(className|onClick|data-|aria-|function|return|document\.)/.test(value)) return false;
  if (/^[#a-f0-9]{6,}$/i.test(value)) return false;
  return true;
}

function collect(text, type, file) {
  const phrase = clean(text);
  if (!looksHuman(phrase)) return;
  const r = results.get(phrase) ?? { text: phrase, count: 0, kinds: [], files: [] };
  r.count++;
  if (!r.kinds.includes(type)) r.kinds.push(type);
  if (!r.files.includes(file) && r.files.length < 5) r.files.push(file);
  results.set(phrase, r);
}

function propName(node) {
  return (node.name?.getText?.() ?? "").replace(/^[\"']|[\"']$/g, "").toLowerCase().replace(/[-_]/g, "");
}

/** Only literal branches rendered directly inside JSX; exclude className logic. */
function displayJsxExpression(node) {
  let current = node.parent;
  while (current && !ts.isSourceFile(current)) {
    if (ts.isJsxExpression(current)) {
      if (ts.isJsxAttribute(current.parent)) {
        const name = current.parent.name.getText().toLowerCase().replace(/[-_]/g, "");
        return labels.has(name);
      }
      return true;
    }
    if (!ts.isParenthesizedExpression(current)
      && !ts.isConditionalExpression(current)
      && !ts.isBinaryExpression(current)
      && !ts.isAsExpression(current)) return false;
    current = current.parent;
  }
  return false;
}

async function* files(dir) {
  for (const item of await readdir(dir, { withFileTypes: true })) {
    const path = join(dir, item.name);
    if (item.isDirectory()) {
      if (["__tests__", "__mocks__", "storybook", "fixtures"].includes(item.name)) continue;
      yield* files(path);
    } else if (/\.(tsx|jsx)$/i.test(item.name) && !/\.(test|spec|stories)\./.test(item.name)) yield path;
  }
}

let scanned = 0;
for await (const path of files(root)) {
  const code = await readFile(path, "utf8");
  const sf = ts.createSourceFile(path, code, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
  const file = relative(root, path).replaceAll("\\", "/");
  scanned++;
  function visit(node) {
    if (ts.isJsxText(node)) {
      collect(node.getText(sf), "jsx-text", file);
    } else if (ts.isJsxAttribute(node) && node.initializer && ts.isStringLiteral(node.initializer)) {
      const attribute = node.name.getText(sf).toLowerCase();
      if (labels.has(attribute.replace(/[-_]/g, "")) || ["title", "placeholder", "aria-label", "alt"].includes(attribute))
        collect(node.initializer.text, "jsx-attribute", file);
    } else if (ts.isPropertyAssignment(node) && node.initializer && (ts.isStringLiteral(node.initializer) || ts.isNoSubstitutionTemplateLiteral(node.initializer))) {
      if (labels.has(propName(node))) collect(node.initializer.text, "property", file);
    } else if (ts.isStringLiteral(node) && displayJsxExpression(node)) {
      collect(node.text, "jsx-expression", file);
    }
    ts.forEachChild(node, visit);
  }
  visit(sf);
}

const arr = [...results.values()].sort((a,b)=>b.count-a.count || a.text.localeCompare(b.text));
await mkdir(resolve(out, ".."), {recursive:true});
await writeFile(out, JSON.stringify({ tag: "v2026.1012.0", root, fileCount: scanned, uniqueStrings:arr.length, totalOccurrences:arr.reduce((sum,x)=>sum+x.count,0), items: arr},null,2)+"\n");
console.log("SOURCES="+scanned+" UNIQUE="+arr.length+" OCCURRENCES="+arr.reduce((x,r)=>x+r.count,0)+" OUTPUT="+out);
console.log("TOP_45:");
for(const e of arr.slice(0,45)) console.log(String(e.count).padStart(4),e.text, "["+e.kinds.join(",")+"]");
