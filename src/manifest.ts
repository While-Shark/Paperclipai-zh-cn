import type { PaperclipPluginManifestV1 } from "@paperclipai/plugin-sdk";

const manifest: PaperclipPluginManifestV1 = {
  id: "chaostar.paperclip-zh-cn",
  apiVersion: 1,
  version: "0.2.2",
  displayName: "Paperclip 简体中文",
  description: "将 Paperclip 导航、设置、任务、Agent 和插件界面翻译为简体中文，支持一键切换中英文。",
  author: "chaostar",
  categories: ["ui"],
  capabilities: ["ui.action.register"],
  entrypoints: {
    worker: "./dist/worker.js",
    ui: "./dist/ui",
  },
  ui: {
    slots: [
      {
        type: "appShellOverlay",
        id: "zh-cn-language-toggle",
        displayName: "简体中文 / English",
        exportName: "ChineseLanguageOverlay",
      },
    ],
  },
};

export default manifest;
