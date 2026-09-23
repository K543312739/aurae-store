# Aurae SEO 周检报告 — 2026-09-24 (周三)

> 自动化任务：GSC/Bing 收录周检。本周沙箱出站网络**持续全封锁**（同 09-14、09-21），故服务器端 sitemap 复核、Bing 代理核验、部署均无法执行。核心结论如下。

## 1) GSC 站点地图 "Couldn't fetch"
- **状态**：仍为 GSC 展示端 bug（自约 2026-04 起，已持续约 25 周），非站点故障。
- **判断**：本自动化不改动代码，保留等待 GSC 自愈。**但本周无法登后台确认 GSC 实际指向的 sitemap URL**。
- 🔴 **持续待办（人工）**：登录 GSC 确认站点地图指向有效地址 `https://www.aurae.asia/sitemap.xml`（旧 `sitemap-v3.xml` 已被服务器主动 404，若仍指向旧地址则是真失败而非纯展示 bug）。

## 2) Google 索引（b12/b13 等手动请求 URL）
通过 WebSearch 内部 API 核验（沙箱无法直连 Google，沿用标题/站点定向检索）：
- `site:aurae.asia` → **0 条真实 aurae.asia 页面**（仅返回无关的 asiaaurora / austasia / aurea 等竞品/其他品牌）。
- `site:aurae.asia "Crystals for Manifestation"`（b12 标题）→ 仅竞品站（spiritualbathhouse / hindustantimes 等），**无 aurae.asia**。
- `site:aurae.asia "protection and grounding"`（b13 标题）→ 仅竞品站（hindustantimes / myauragemstones 等），**无 aurae.asia**。
- `aurae.asia "Crystals for Manifestation"` → 同上，**无 aurae.asia**。

**结论**：b12/b13 **仍未出现在 Google 索引**（连续约 19–20 周）；全站 `site:` 仍 0 条真实页。根因持续为新域名沙盒 + SPA 抓取/渲染摩擦（此前已排除 robots/noindex/服务器错误等站点侧屏蔽）。

## 3) Bing 站长平台 sitemap 发现/收录
- **本周不可核验**：沙箱出站封锁，DuckDuckGo（Bing 索引代理）与 Bing 直连均 TLS 超时。
- **最近一次可核验（09-14）结论**：Bing 已稳定收录 **7 页**（首页 + /shop/ + contact.html + faq.html + shipping-returns.html + products/citrine-merchant-s-ring/ + privacy-policy.html），sitemap 发现有效、抓取持续推进；**b12/b13 仍未进 Bing 博客页**。
- 待 egress 恢复后，需用 DDG/Bing 重新核验当前计数。

## 4) 新 URL 与每日手动索引通道（本周重点异常）
⚠️ **发现严重漂移（Drift）**：
- 本地仓库 `js/data.js` 现含 **51 篇博客（b1–b51）**；而**最后一次成功部署 + 服务器侧复核为 08-29（sitemap 79 URL / 39 博客）**。
- 自 09-03 起，每周自动化在本地新增博客（b40–b51，共 **12 篇**），但因**出站网络持续封锁，deploy_now.py 从未成功执行** → 这 12 篇**仅存在于本地、从未上线**。
- 后果：① 站点线上内容自 08-29 起冻结在 39 博客；② b40–b51 不是"待提交索引的新 URL"，而是"未上线的 URL"——直接提交会 404，不能进每日手动通道。

**动作**：
- 🔴 **前置阻断项**：egress 恢复后，立即手动跑 `deploy_now.py` 把 b40–b51（及任何本地改动）推上线，再 `apply_nginx.py`（若有 nginx 变更）。部署后复核 `/sitemap.xml` 实际 URL 数（预期 ≈ 91）。
- 每日手动索引通道优先级维持：**b12/b13 → 首页 → /shop/ →**（部署上线后再追加）**b40–b51**。
- 本周因 b40–b51 未上线，**无新增可提交 URL**。

## 5) 运营提示
- 连续 19–20 周 Google 0 真实收录 + b12/b13 始终未进索引，强烈建议排期 **SSR / 预渲染（prerender）** 作为根治手段（SPA 抓取侧摩擦长期无解）。
- 外链建设（Pinterest / IG / TikTok / Reddit 放链接）维持，提升域名权威以加速脱离沙盒。

---
## 执行环境说明
- 沙箱出站网络：🔴 全封锁（curl 到 aurae.asia / google / duckduckgo 均 TLS 超时，含非沙箱模式）。
- 可采信数据源：WebSearch 内部 API（Google 索引侧）；服务器端 sitemap 复核/Bing 代理/部署均无法进行，沿用最近成功结果（sitemap 09-03；Bing 09-14）。
- 本自动化未改动任何代码；GSC "Couldn't fetch" 按既定策略保留自愈。
