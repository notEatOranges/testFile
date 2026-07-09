/* ============================================================
   后端配置 —— Supabase（默认）/ MemFire（国产兼容备选）
   未填写时，站点自动进入「本地预览模式」（localStorage +
   BroadcastChannel，可同浏览器多 tab 模拟双人）。
   填写后即启用跨手机异地实时同步。配置步骤见 SETUP.md。

   Supabase 与 MemFire 的 SDK / API 完全兼容：
   想要国内更快 → 用 MemFire(https://memfirecmp.com)，
   把下面的 url / anonKey 换成 MemFire 给的即可，代码不变。
   ============================================================ */

export const supabaseConfig = {
  url:     "https://xxx.supabase.co",          // ← 项目 URL
  anonKey: "在此粘贴 anon public key",          // ← Project API keys 里的 anon public
};

// Supabase JS SDK（ESM）。jsDelivr 国内可访问；esm.sh 是备选。
export const SUPABASE_SDK = "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm";

// 通用 KV 表名（一张表存整个房间所有数据，详见 store.js）
export const KV_TABLE = "kv";

const PLACEHOLDER = "在此粘贴";

/** 是否已配置云端后端（决定 store 走实时还是本地降级） */
export function isConfigured() {
  return Boolean(
    supabaseConfig.url && supabaseConfig.anonKey &&
    !supabaseConfig.url.includes("xxx") &&
    !supabaseConfig.anonKey.startsWith(PLACEHOLDER)
  );
}
