# Paperclip 简体中文插件 🇨🇳

[![Paperclip](https://img.shields.io/badge/Paperclip-v2026.1012.0-blue)](https://github.com/paperclipai/paperclip)
[![Version](https://img.shields.io/badge/中文插件-v0.2.2-green)](https://github.com/While-Shark/Paperclipai-zh-cn/releases/tag/v0.2.2)
[![Build](https://img.shields.io/github/actions/workflow/status/While-Shark/Paperclipai-zh-cn/ci.yml?branch=master&label=CI)](https://github.com/While-Shark/Paperclipai-zh-cn/actions)

为 [Paperclip](https://github.com/paperclipai/paperclip) 提供可安装的**简体中文界面插件**，支持中英文一键切换，不修改 Paperclip 核心源码。

> 当前版本：**v0.2.2** · 适配 Paperclip **v2026.1012.0**。目前采用浏览器端固定词典替换，并非官方 i18n 语言包。

## 功能预览

- 中文翻译覆盖导航、仪表盘、项目、任务、智能体、审批、日志、设置及插件管理等常见界面。
- 支持弹窗、工具提示、表单占位符、动态加载的内容。
- **长段描述汉化**：包括「设置 → 实验性功能」中的功能介绍和开关影响说明。
- 页面右下角一键切换 **简体中文 / English**，浏览器记住选择。
- 保留用户输入、任务正文、代码编辑器、API 密钥及未知专有名称，不自动上传私人内容。
- **离线运行**：已生成的中文词典随插件安装，不依赖在线翻译服务。

## 安装方式

### 方法一：下载 Release 安装包（推荐）

1. 前往 [Releases](https://github.com/While-Shark/Paperclipai-zh-cn/releases/latest) 下载 `paperclip-zh-cn-v0.2.2.zip`。
2. 解压到任意文件夹（例如 `~/paperclip-zh-cn`）。
3. 电脑需安装 Node.js **24.11+**、pnpm 和 `paperclipai` CLI。进入解压目录，执行：

   ```bash
   cd ~/paperclip-zh-cn
   pnpm install --frozen-lockfile
   paperclipai plugin install "$PWD"
   ```

4. 打开 Paperclip 的 **Settings → Plugins（设置 → 插件）**，确认 `Paperclip 简体中文` 的状态为 `ready`。
5. 按 `Ctrl + Shift + R` 强制刷新 Paperclip 页面。右下角会出现中文 / EN 切换按钮。

> ZIP 已包含构建好的 `dist/` 资源；但插件 Worker 的 SDK 依赖仍需要通过 `pnpm install` 安装。此插件适用于拥有官方插件管理功能的 Paperclip 版本。

### 方法二：从源码安装

```bash
git clone https://github.com/While-Shark/Paperclipai-zh-cn.git
cd Paperclipai-zh-cn
pnpm install --frozen-lockfile
pnpm typecheck
pnpm test
pnpm build
paperclipai plugin install "$PWD"
```

### 升级已有版本

在已安装的插件源码目录中执行 `pnpm install --frozen-lockfile && pnpm build`，随后执行：

```bash
paperclipai plugin upgrade chaostar.paperclip-zh-cn
paperclipai plugin inspect chaostar.paperclip-zh-cn
```

卸载：`paperclipai plugin uninstall chaostar.paperclip-zh-cn`。禁用：`paperclipai plugin disable chaostar.paperclip-zh-cn`。

## 翻译覆盖率

以下数据基于 **Paperclip v2026.1012.0 源码静态候选文本**，不是“全部运行时页面都已人工验证 99%”：

| 指标 | 结果 |
| --- | ---: |
| 静态可见 UI 候选词条 | 8,284 |
| 已有中文词条 | 8,253 |
| **静态词条覆盖率** | **99.626%** |
| 按源码出现次数加权 | **99.720%** |
| 保留原样的技术标识 | 31 |

未翻译的技术标识主要包括 SSH、ACP、`OPENAI_API_KEY` 等。登录与首次初始化向导可能不加载该插件；运行时服务端消息、动态插值、图片内的文字也可能仍为英文。

「实验性功能」页面经过 Windows Chrome 验证：**修复前有 18 段纯英文长说明；修复后为 0 段**。这项检查只代表当前页面和对应测试环境。

## 开发与维护

```bash
pnpm typecheck
pnpm test
pnpm coverage
pnpm build
```

词典分层位于 `src/ui/locales/`：通用、设置、项目任务、智能体、插件、初始化、人工术语表和实验性功能文案各自独立。人工校对的词条优先于 `generated.json` 自动生成词条。

插件入口为 `src/manifest.ts` 和 `src/ui/index.tsx`；浏览器端翻译及观察 DOM 更新的逻辑在 `src/ui/dom-translate.ts`。

`scripts/extract-ui-text.mjs` 和 `scripts/prepare-ui-candidates.mjs` 可从**单独检出的对应版本 Paperclip UI 源码**提取新的候选文案：

```bash
node scripts/extract-ui-text.mjs /path/to/paperclip/ui/src
node scripts/prepare-ui-candidates.mjs
python3 scripts/generate-translations.py
pnpm coverage
```

上述 Python 翻译生成脚本仅供**开发阶段**使用；它会向在线翻译服务发送已提取的公开 UI 字符串。**正式插件运行时不会调用翻译 API**。

## 兼容性与局限

当前 Paperclip 插件 SDK 未提供全局注册完整中文 `i18next` 词典的公开接口，因此使用 `appShellOverlay` 在页面渲染后对**已知固定 UI 文本**进行保守替换。升级 Paperclip 后，新增文案需重新提取、校对并测试。

项目为独立的社区汉化插件，与 Paperclip 官方项目没有关联；底层 Paperclip 的商标和源码归原权利人所有。

欢迎提交 Issue 和 PR 帮助改进翻译。
