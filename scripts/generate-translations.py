#!/usr/bin/env python3
"""Generate a one-time, offline UI dictionary from public Paperclip source strings.
No runtime translation requests and no workspace/user data leaves the machine.
"""
from __future__ import annotations
import concurrent.futures
import json
import os
import re
import sys
import threading
import time
import urllib.error
import urllib.parse
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / "coverage/eligible-ui-strings.json"
CACHE = ROOT / "coverage/translation-cache.json"
OUTPUT = ROOT / "src/ui/locales/generated.json"
MANUAL_KEYS = ROOT / "coverage/manual-keys.json"
SEPARATOR = "\n|||\n"
MAX_CHARS = 1700
MAX_ITEMS = 35
lock = threading.Lock()

items = json.loads(SOURCE.read_text("utf8"))["items"]
originals = [i["text"] for i in items]
manual = set(json.loads(MANUAL_KEYS.read_text("utf8")))
cache: dict[str,str] = json.loads(CACHE.read_text("utf8")) if CACHE.exists() else {}
untranslated = [s for s in originals if s not in manual and s not in cache]
batches = []
pending = []

for phrase in untranslated:
    length = len(SEPARATOR.join(pending + [phrase]))
    if pending and (length > MAX_CHARS or len(pending) >= MAX_ITEMS):
        batches.append(pending)
        pending = []
    pending.append(phrase)
if pending:
    batches.append(pending)

def translate_batch(group: list[str]) -> list[str]:
    text = SEPARATOR.join(group)
    query = urllib.parse.urlencode({
        "client":"gtx", "sl":"en", "tl":"zh-CN", "dt":"t", "q":text
    })
    url = "https://translate.googleapis.com/translate_a/single?" + query
    req = urllib.request.Request(url, headers={"User-Agent":"Mozilla/5.0 (PaperclipUIStaticLocalization/1.0)"})
    for attempt in range(5):
        try:
            with urllib.request.urlopen(req, timeout=30) as response:
                data = json.load(response)
            whole = "".join(fragment[0] or "" for fragment in data[0])
            translated = [part.strip() for part in whole.split("|||")]
            if len(translated) != len(group):
                raise ValueError(f"split mismatch ({len(translated)} != {len(group)})")
            return translated
        except (urllib.error.URLError, ValueError, TimeoutError) as err:
            if attempt == 4:
                raise
            time.sleep(min(2**attempt, 9))
    raise RuntimeError("unreachable")

def write_cache():
    path = CACHE.with_suffix(".json.tmp")
    path.write_text(json.dumps(cache, ensure_ascii=False, indent=2)+"\n","utf8")
    os.replace(path, CACHE)

print(f"UI_PUBLIC_STRINGS={len(originals)} MANUAL={len(manual)} CACHED={len(cache)} NEW={len(untranslated)} BATCHES={len(batches)}",flush=True)
failures = []
complete = 0
with concurrent.futures.ThreadPoolExecutor(max_workers=4) as pool:
    futures={pool.submit(translate_batch,b):b for b in batches}
    for future in concurrent.futures.as_completed(futures):
        batch=futures[future]
        try:
            translated=future.result()
            with lock:
                for source,target in zip(batch,translated):
                    if target and target != source and not re.match(r"^\[\[",target):
                        cache[source]=target
                complete+=1
                if complete % 6==0:
                    write_cache()
                if complete % 15==0 or complete==len(batches):
                    print(f"PROGRESS={complete}/{len(batches)} translated={len(cache)} failures={len(failures)}",flush=True)
        except Exception as exc:
            failures.append(batch)
            print(f"WARN batch-size={len(batch)}: {type(exc).__name__}: {str(exc)[:80]}",flush=True)
write_cache()

def apply_terminology(source:str, translated:str) -> str:
    # Preserve preferred terminology in contexts. Existing manual dictionary is authoritative.
    if re.search(r"\bagents?\b",source,re.I):
        translated = translated.replace("代理人","智能体").replace("代理商","智能体").replace("代理程序","智能体")
        translated = re.sub(r"代理(?!服务|配置|设置|地址|端口|服务器|模式)", "智能体", translated)
    if re.search(r"\bissues?\b",source,re.I):
        translated = re.sub(r"问题(?!报告|描述|诊断)", "任务", translated)
    if re.search(r"\bcompany\b|\borganization\b",source,re.I):
        translated = re.sub("公司", "组织", translated)
    return translated

generated={src:apply_terminology(src,dst) for src,dst in cache.items() if src in originals and src not in manual and dst.strip() and dst != src}
OUTPUT.write_text(json.dumps(generated,ensure_ascii=False,indent=2,sort_keys=True)+"\n","utf8")
print(f"DONE dictionary_auto={len(generated)} manual={len(manual)} failed_batches={len(failures)} output={OUTPUT}",flush=True)
if failures:
    print(f"FAILED_TEXTS={sum(map(len,failures))}",flush=True)
