# Aurae 站点收录周检 — 2026-09-21（周一）

> 执行方式：公开搜索引擎交叉核验（仅 WebSearch 内部 API 可用；沙箱出站 TLS 被屏蔽，`curl` / `WebFetch` / DuckDuckGo 代理均不可达）。
> ⚠️ 沙箱出站网络限制：本周 `curl` 到 `www.aurae.asia` / `google.com` / `html.duckduckgo.com` 全部连接超时（exit 28/7），故**服务器端 sitemap 实际 URL 数未能本周复核**，且**无法直接核验 Bing 索引**（DuckDuckGo=Bing 代理不可达）。站点本身在线（此前 Bing 已索引 7 页可佐证），限制仅为沙箱出口屏蔽，非站点故障。

## 1) GSC 站点地图状态
- 沿用最近一次成功服务器复核（2026-09-03）：`/sitemap.xml` 仍 **200 OK / 79 URL / 干净头 / 含 b12/b13 规范 slug**（注：本地仓库 HEAD `7e235a2` 已含 b48/b49 博客提交，若已部署则 live sitemap 应 >79，但本周无法服务器复核确认）。
- GSC 后台 "Couldn't fetch" 仍为**展示端 bug（约第 19 周，自 09-14 记录的约第 18 周 +1）** → 保留等待自愈，**未改代码**（本自动化铁律）。
- 🔴 **持续待办（需人工）**：登 GSC 确认站点地图指向 `/sitemap.xml`（而非已 404 的 `sitemap-v3.xml`）。此为 GSC 内部显示问题，非服务端失败，本自动化不改代码。

## 2) Google 索引（重点：b12 / b13 博客）
- `site:aurae.asia` → 仍 **0 条真实页**（仅返回 WHOIS 与竞品 Aurae 品牌站，无 aurae.asia 自有页）。
- `site:aurae.asia/blog` → **0 条博客结果**（只返无关站 Aurora Blog / Aurae Software Solutions / ko-fi/aurae0 等）。
- **b12**「Crystals for Manifestation: A Practical Step-by-Step Guide」标题定向检索 → 仅返 crystaldestiny / healingauracrystals / zensymbols / wikihow 等竞品，**无 aurae.asia**。
- **b13**「The Best Crystals for Protection & Grounding (and How to Use Them Daily)」标题定向检索 → 仅返 elle / wikihow / howstuffworks / mindfulsouls / penguin 等竞品，**无 aurae.asia**。
- 结论：**b12 / b13 仍未出现在 Google 索引（连续约 18–19 周）**，全站 `site:aurae.asia` 仍 0 条。根因持续为新域名沙盒（注册 2026-08-08）+ SPA 抓取/渲染摩擦，已多次排除站点侧屏蔽（robots / index,follow / SSR 完整）。

## 3) Bing 站长平台
- ⚠️ **本周无法核验**：沙箱出站封锁导致 DuckDuckGo（Bing 索引代理）不可达，`curl`/`WebFetch` 均超时。
- 沿用最近一次成功核验（2026-09-14，DuckDuckGo 代理）：Bing 已索引 **7 个真实 aurae.asia 页**（首页 + /shop/ + contact.html + faq.html + shipping-returns.html + products/citrine-merchant-s-ring/ + privacy-policy.html），抓取进度持续推进；**b12/b13 仍未进 Bing**。
- 建议：待沙箱出口恢复后，优先重做 DuckDuckGo 代理核验以更新 Bing 计数；或人工登 Bing 站长平台确认 sitemap "已发现/已收录"。

## 4) 动作 / 每日手动索引通道
- **本周无确认的新增待提交 URL**（服务器端 sitemap 未复核；本地仓库相对 09-14 无新提交）。b48/b49 已在 09-14 提交中随仓库纳入，若已部署则自动进入 live sitemap，但本周无法确认其 live 状态。
- 每日手动通道维持现有队列优先级：**b12/b13 → 首页 → /shop/ → 其余**（每天 1–2 个，不重交坏 sitemap）。
- 若下周沙箱出口恢复，优先重做：①服务器端 `/sitemap.xml` URL 数复核（79 → ?）；②DuckDuckGo 代理核验 Bing 计数（7 → ?）。

## 5) 长期待办（持续）
- 🔴 人工确认 GSC 站点地图指向 `/sitemap.xml`。
- 🔴 连续 18+ 周 Google 0 收录 → 强烈建议排期 **SSR / prerender** 根治（待用户决策）。
- ⏳ PayPal Secret 轮换（历史待办，与本次无关）。

---
*方法学备注：本自动化不改任何代码；sitemap "Couldn't fetch" 属 GSC 展示 bug，保留自愈。本周因沙箱出站 TLS 封锁，仅 Google 索引可通过 WebSearch 内部 API 核验，服务器端 sitemap 与 Bing 索引两项暂挂起，待出口恢复后补做。*
