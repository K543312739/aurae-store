# Aurae 每日手动索引通道队列（GSC URL Inspection / 提交）

> 用途：每日 1–2 个 URL 走 GSC「网址检查 → 请求编入索引」，优先推 b12/b13。
> 铁律：**只提交已上线（200 + 正确 canonical）的 URL**；未部署的本地博客（b40–b55）禁止提交（会 404）。

## 当前优先级队列（2026-10-13）

1. `https://www.aurae.asia/blog/crystals-for-manifestation-a-practical-step-by-step-guide/` （b12，最高优先）
2. `https://www.aurae.asia/blog/the-best-crystals-for-protection-grounding-and-how-to-use-them-daily/` （b13，最高优先）
3. `https://www.aurae.asia/` （首页）
4. `https://www.aurae.asia/shop/` （商店页）

## 待上线后追加（egress 恢复、deploy_now.py 推 b40–b55 成功后再启用）

- `https://www.aurae.asia/blog/<b40–b55 规范 slug>/` × 16（上线后从 `js/data.js` 取实际 slug）

## 状态备注

- Google 自 2026-08 起对新域名沙盒 + SPA 渲染持续 0 收录；b12/b13 已连续 ~21 周未进索引。
- 每日通道为「维持抓取信号」手段，非根治；根治需 SSR/预渲染（已多次升级建议）。
- GSC sitemap 长期显示 "Couldn't fetch"（展示端 bug），保留自愈、不改代码；人工确认指向 `/sitemap.xml`。
