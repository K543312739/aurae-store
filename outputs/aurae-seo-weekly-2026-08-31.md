# Aurae 收录周检报告 — 2026-08-31 (周一)

> 自动化任务：GSC/Bing 收录周检。本周结论与上周（08-30）**完全一致、无回退无新增**。

---

## 1) GSC 站点地图（sitemap）

| 项目 | 实测结果 |
|------|---------|
| 端点 | `https://www.aurae.asia/sitemap.xml` |
| HTTP | **200 OK** |
| URL 数 | **79 条**（与 08-30 持平，本周无新博客部署） |
| 响应头 | `Cache-Control: no-cache, no-store, must-revalidate` / `Pragma: no-cache` / `Expires: 0`；无 `Vary`/`CSP`/`x-powered-by` 泄漏（干净） |
| 含 b12/b13 | ✅ 两篇规范 slug 均在 `<loc>` 中 |
| "Couldn't fetch" | 🔴 **仍是 GSC 展示端 bug（约第 14 周），非站点故障** |

**结论**：服务器端 sitemap 健康，无需改代码。保留等待 GSC 自愈，**不要反复点「重新提交」**（会触发限流且无效）。
🔴 **持续待办（需人工）**：请登 GSC → 站点地图，确认当前注册的是 `https://www.aurae.asia/sitemap.xml`（而非早已 404 的 `sitemap-v3.xml`）。若还指着旧 URL，那才是真失败源——删除旧条、重提 `/sitemap.xml` 即可。

---

## 2) Google 索引（重点：b12 / b13）

- **全站 `site:aurae.asia`**：仍 **0 条真实 aurae.asia 页面**（仅返 WHOIS / 竞品噪声站）—— 连续约第 14 周为 0。
- **b12** `https://www.aurae.asia/blog/crystals-for-manifestation-a-practical-step-by-step-guide/`
  → 定向 `site:` 检索**仅返竞品站（nolivahome / latticegems / manifestlifenow 等），无 aurae** → **仍未收录**。
- **b13** `https://www.aurae.asia/blog/the-best-crystals-for-protection-grounding-and-how-to-use-them-daily/`
  → 定向 `site:` 检索**仅返竞品站（auraelemental / auraliscrystals / crystalguide 等），无 aurae** → **仍未收录**。

**结论**：b12/b13 连续约 14 周未进 Google 索引。已排除站点侧屏蔽（200 / index,follow / bot SSR 完整）。根因持续为**新域名沙盒 + SPA 抓取/渲染摩擦**（域名 `aurae.asia` 注册于 2026-08-08，距今约 23 天，尚在 4–8 周沙盒期内）。

---

## 3) Bing 站长平台（sitemap 发现 / 收录）

经 DuckDuckGo（Bing 索引代理）交叉核验 `site:aurae.asia`：

| 已收录页面 | 状态 |
|-----------|------|
| `https://www.aurae.asia/` | ✅ 稳定 |
| `https://www.aurae.asia/contact.html` | ✅ 稳定 |
| `https://www.aurae.asia/faq.html` | ✅ 稳定 |
| `https://www.aurae.asia/privacy-policy.html` | ✅ 稳定 |

- **共 4 页**，与 08-30 完全一致、无回退无新增。
- **b12/b13 仍未进 Bing 博客页**。
- sitemap 已被 Bing 发现并持续处理（这 4 页即来自 sitemap 抓取），但 slug 深层页尚未放出。

---

## 4) 本周动作 / 待办

- **本周 sitemap 无新增 URL**（79 条持平，无新博客部署）→ **无新待提交项**。
- **每日手动索引通道维持**（本自动化只检查、不代为提交，提交需人工在 GSC URL 检查执行）：
  优先级 **b12/b13 → 首页 → /shop/ → 其余博客/商品**（每天 1–2 个，不重复提交、不重交坏 sitemap）。
- 🔴 **根治建议（排期）**：连续 14 周 Google 0 收录，叠加 Bing 仅 4 页，强烈建议评估 **SSR / 预渲染** 作为根因修复；否则仅靠手动提交难以突破沙盒 + SPA 渲染瓶颈。
- 🔴 **人工待办**：① GSC 站点地图改指 `/sitemap.xml`；② 考虑排期 SSR/prerender。

---

## 5) 附：本次验证方法

- sitemap：`curl -s -o seo_sitemap_check.xml` + 本地 `grep -c '<loc>'`（**相对路径，避开此前 `/tmp` 误读旧文件的坑**）。
- Google：`site:aurae.asia` 全站 + b12/b13 规范 slug 定向 `site:` 检索（Google 直连反爬拒，改用标题/站点定向检索佐证）。
- Bing：DuckDuckGo HTML 端点（`uddg=` 解码去重）作为 Bing 索引代理。
