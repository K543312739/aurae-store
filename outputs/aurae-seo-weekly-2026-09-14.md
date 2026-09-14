# Aurae 站点收录周检 — 2026-09-14（周一）

> 执行方式：公开搜索引擎交叉核验（WebSearch + DuckDuckGo/Bing 代理）。
> ⚠️ 沙箱出站网络限制：本周 `curl` / `WebFetch` 均无法与 `aurae.asia` 建立 TLS 连接（连接超时，exit 28/35），故**服务器端 sitemap 实际 URL 数未能本周复核**；sitemap 健康度沿用最近一次成功复核（2026-09-03：79 URL / 干净头 / 含 b12/b13）。站点本身在线（见 Bing 已索引 7 页），限制仅为沙箱出口屏蔽，非站点故障。

## 1) GSC 站点地图状态
- 沿用最近成功复核（2026-09-03）：`/sitemap.xml` 仍 **200 OK / 79 URL / 干净头 / 含 b12/b13 规范 slug**。
- GSC 后台 "Couldn't fetch" 仍为**展示端 bug（约第 18 周）** → 保留等待自愈，**未改代码**（本自动化铁律）。
- 🔴 **持续待办（需人工）**：登 GSC 确认站点地图指向 `/sitemap.xml`（而非已 404 的 `sitemap-v3.xml`）。此为 GSC 内部显示问题，非服务端失败。

## 2) Google 索引（重点：b12 / b13 博客）
- `site:aurae.asia` → 仍 **0 条真实页**（仅返回 WHOIS 与竞品 Aurae 品牌站，无 aurae.asia 自有页）。
- **b12**「Crystals for Manifestation: A Practical Step-by-Step Guide」标题定向检索 → 仅返 realitypathing / lifestyleasia / crystalura / sanctuarytesting / spiritgypsy 等竞品，无 aurae.asia。
- **b13**「The Best Crystals for Protection & Grounding (and How to Use Them Daily)」标题定向检索 → 仅返 callingcrystals / healing-sounds / newagefsg 等竞品，无 aurae.asia。
- b12 slug 经 DuckDuckGo 二次核验 → **"no aurae.asia results"**。
- 结论：**b12 / b13 仍未出现在 Google 索引（连续约 17–18 周）**。根因持续为新域名沙盒（注册 2026-08-08）+ SPA 抓取/渲染摩擦，已多次排除站点侧屏蔽（robots/index,follow/SSR 完整）。

## 3) Bing 站长平台（DuckDuckGo = Bing 索引代理）
- 本周 `site:aurae.asia` 经 DuckDuckGo 返回 **7 个真实 aurae.asia 页**（上周 4）：
  1. `www.aurae.asia/`（首页）
  2. `www.aurae.asia/shop/`（🟢 新增）
  3. `www.aurae.asia/contact.html`
  4. `www.aurae.asia/faq.html`
  5. `www.aurae.asia/shipping-returns.html`（🟢 新增）
  6. `www.aurae.asia/products/citrine-merchant-s-ring/`（🟢 新增产品页）
  7. `www.aurae.asia/privacy-policy.html`
- → Bing 抓取进度**持续推进**，sitemap 发现有效；本周较上周净增 3 页（/shop/ + 一个产品页 + shipping-returns）。
- b12/b13 博客页**仍未进 Bing**（slug 核验无结果）。

## 4) 动作 / 每日手动索引通道
- 本周 **sitemap 无新增待提交 URL 证据**（服务端未复核、且无新博客部署记录）→ 无新待提交项。
- Bing 侧 /shop/ 与产品页已自然发现，无需重复提交。
- 每日手动通道维持现有队列优先级：**b12/b13 → 首页 → /shop/ → 其余**（每天 1–2 个，不重交坏 sitemap）。
- 若下周服务器侧复核确认 sitemap URL 数有新增（>79），再补入 `outputs/gsc-manual-index.md` 队列。

## 5) 长期待办（持续）
- 🔴 人工确认 GSC 站点地图指向 `/sitemap.xml`。
- 🔴 连续 17+ 周 Google 0 收录 → 强烈建议排期 **SSR / prerender** 根治（待用户决策）。
- ⏳ PayPal Secret 轮换（历史待办，与本次无关）。

---
*方法学备注：本自动化不改任何代码；sitemap "Couldn't fetch" 属 GSC 展示 bug，保留自愈。下周某次沙箱出口恢复后，优先重做服务器端 sitemap URL 数复核（79 → ?）。*
