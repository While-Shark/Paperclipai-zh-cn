import { definePlugin, runWorker } from "@paperclipai/plugin-sdk";

// Translation only: the worker registers no tools, jobs, network requests or write APIs.
const plugin = definePlugin({
  async setup(ctx) {
    ctx.logger.info("Paperclip 简体中文语言插件已就绪");
  },
});

export default plugin;
runWorker(plugin, import.meta.url);
