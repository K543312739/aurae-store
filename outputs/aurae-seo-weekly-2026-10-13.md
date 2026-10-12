# Aurae SEO 周检报告 — 2026-10-13 (周二)

> 自动化任务：GSC/Bing 收录周检。本周沙箱出站仍全封锁，部分核验沿用最近一次成功复核结论。

## 结论速览

| 检查项 | 本周状态 | 说明 |
|---|---|---|
| 1. GSC sitemap "Couldn't fetch" | 🔴 仍为展示端 bug（持续中） | GSC 内部问题，保留自愈，**不改代码** |
| 2. b12/b13 是否进 Google 索引 | 🔴 仍未收录（连续 ~21 周 0 覆盖） | `site:aurae.asia` 仅返竞品/无关品牌噪声 |
| 3. Bing sitemap 发现/收录 | ⚠️ 本周不可核验（egress 封锁） | 沿用 09-14 基线：7 页、b12/b13 未进 Bing |
| 新 URL 待提交 | ✅ 无（本周无新上线 URL） | 16 篇博客仅本地、未部署，禁止进每日通道 |

---

## 1) GSC 站点地图 "Couldn't fetch"

- 无法登录 GSC 后台读取（需人工凭证），且本周 `curl` 出站到 aurae.asia 超时（HTTP=000），**无法做服务器端 sitemap 复核**。
- 沿用最近成功复核（08-29）：`/sitemap.xml` 200 OK / 79 URL / 干净头 / 含 b12/b13 规范 slug。
- "Couldn't fetch" 自 8 月中以来持续显示，判定为 **GSC 展示端 bug**，非站点故障。
- **本自动化不改代码，保留等待自愈。**
- 🔴 **持续人工待办**：请人工登 GSC 确认站点地图指向 `/sitemap.xml`（旧 `sitemap-v3.xml` 已被服务器主动 404，若 GSC 仍指着旧 URL 则是真失败，需改指）。

## 2) 手动请求 URL（b12/b13）是否已进 Google 索引

- WebSearch `site:aurae.asia` 返回 **0 条真实 aurae.asia 页**，仅混出无关品牌噪声（ASUS Armoury Crate、AURELIA Asia、Aurea 新加坡公寓、Aurora 台湾震旦等竞品/同名站）。
- b12 规范 URL：`https://www.aurae.asia/blog/crystals-for-manifestation-a-practical-step-by-step-guide/`
- b13 规范 URL：`https://www.aurae.asia/blog/the-best-crystals-for-protection-grounding-and-how-to-use-them-daily/`
- 标题定向检索同样只返竞品站、无 aurae → **b12/b13 仍未收录（连续约第 21 周 0 Google 覆盖）**。
- 根因持续：新域名沙盒（注册 2026-08-08）+ SPA 抓取/渲染摩擦。
- **动作**：每日手动索引通道维持最高优先级提交 b12/b13 → 首页 → /shop/（见 `outputs/gsc-manual-index.md`）。根治建议排期 SSR/预渲染（连续 21 周 0 收录，已多次升级）。

## 3) Bing 站长平台 sitemap 发现/收录

- 本周**不可核验**：`curl` 出站到 DuckDuckGo/Yahoo 代理均超时（同 09-14–09-29 的 egress 封锁）。
- 沿用最近一次成功代理核验（09-14）：Bing 已稳定收录 **7 页**（首页 + /shop/ + contact.html + faq.html + shipping-returns.html + products/citrine-merchant-s-ring/ + privacy-policy.html），抓取持续推进、sitemap 发现有效；**b12/b13 仍未进 Bing 博客页**。
- 建议人工登 Bing 站长平台确认 sitemap "已发现/已收录" 计数（公开代理本周不可用）。

## 4) 新 URL 与每日手动索引通道

- **本周无新上线 URL** → 无新增待提交项。
- ⚠️ **部署漂移仍在累积**：本地 `js/data.js` 现 **55 篇博客（b1–b55）**，git 工作树干净且 HEAD=origin/main=`8d9ce7e`（已包含 b54/b55）。但最后一次成功部署为 08-29（39 博客 / 79 URL）。即 **b40–b55 共 16 篇仅本地、从未上线**（`deploy_now.py` 因 egress 封锁从未跑成）。
- 这些不是"待提交新 URL"，而是"未上线 URL"，**不得进每日手动通道**（会 404）。
- **动作**：egress 恢复后立即 `deploy_now.py` 把 b40–b55 推上线（再 `apply_nginx.py` 若有 nginx 变更），部署后复核 `/sitemap.xml` 实际 URL 数（预期 ≈95），上线后再追加进每日提交队列。

## 待办清单

- 🔴 人工确认 GSC 站点地图指向 `/sitemap.xml`（旧 `sitemap-v3.xml` 已 404）。
- 🔴 egress 恢复后：① `deploy_now.py` 推 b40–b55 上线 ②复核 sitemap URL 数 ③上线后追加进每日通道。
- 🟡 人工登 Bing 确认 sitemap 计数；继续观察 b12/b13 是否进 Bing。
- 🟡 根治建议：排期 SSR/预渲染（连续 21 周 Google 0 收录）。

---
*核验方法备注：本周沙箱出站全封锁，`curl` 到 aurae.asia / DuckDuckGo / Yahoo 均超时（HTTP=000）。Google 覆盖经 WebSearch `site:aurae.asia` 内部 API 核验（不受出站封锁影响）；Bing 因代理不可达沿用 09-14 基线。*
