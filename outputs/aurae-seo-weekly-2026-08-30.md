# Aurae 每周 SEO 周报 — 2026-08-30（第 15 跑）

> 本周重点：新增 2 篇博客（已 commit+push，待部署上线）；外链文案产出；GSC / Bing 收录核对。
> 未修改服务器代码（遵守指令）。

## 1. 本周新增博客

已 commit + push 到 `main`（commit `a6411b1`）。**上线前需先部署**（见第 2 节），否则 GSC 提交会 404。

| ID | 标题 | Canonical URL | 分类 | 时长 | 话题/意图 |
|----|------|---------------|------|------|-----------|
| b40 | How to Spot Fake & Treated Crystals: A Practical Buyer's Guide | `https://www.aurae.asia/blog/how-to-spot-fake-treated-crystals-a-practical-buyer-s-guide/` | guides | 13 min | 鉴真/选购（高商业信任意图，降低退货、建信任） |
| b41 | Crystals for Pregnancy, Fertility & New Mothers | `https://www.aurae.asia/blog/crystals-for-pregnancy-fertility-new-mothers/` | crystals | 11 min | 母婴/情绪支持（高情感意图，Pinterest 友好） |

- b40 内链：beginner's guide、vitality guide、care/charge guides、Citrine ring、/shop/
- b41 含**非医疗声明**（crystals 为情绪/ wellness 工具，非治疗，遵医嘱）；内链 rose quartz / moonstone / amethyst / clear quartz / garnet 产品 + grief guide + care/charge guides + /shop/
- 校验：`node --check` 通过；`sitemap.xml` 现 **81 URL / 41 篇 blog**；slug 与 `app.js` 的 `slugify()` **逐字节一致**（已脚本比对通过）。

## 2. 部署步骤（博客上线后才可在 GSC 提交）

```
ssh admin@47.253.245.165
cd /opt/aurae-store
git pull origin main
sudo chown -R admin:admin /opt/aurae-store
fuser -k 3000/tcp          # 或 kill -9 占用 3000 的旧进程（防 EADDRINUSE 静默失败）
pm2 restart aurae
```

部署后验证：① `/js/data.js` 含 `b40`/`b41`；② `/sitemap.xml` 含两个新 slug；③ 两个 canonical URL 返回 200 且 SSR 渲染出标题。

## 3. GSC 单 URL 提交清单（部署后执行）

**本周新文（部署后提交这 2 条）：**
- `https://www.aurae.asia/blog/how-to-spot-fake-treated-crystals-a-practical-buyer-s-guide/`
- `https://www.aurae.asia/blog/crystals-for-pregnancy-fertility-new-mothers/`

**历史 backlog（建议分批补提，每次 ≤10 条）：** b8–b39 共 32 篇（sitemap.xml 已含全部 41 篇）。例：
- `/blog/crystals-for-grief-loss-comforting-the-heart/`
- `/blog/crystals-to-welcome-a-new-home-placement-ideas-for-every-room/`
- `/blog/crystals-for-intuition-the-third-eye-trusting-your-gut/` …
（完整列表见 `sitemap.xml`）

> 提示：GSC 仍报 sitemap「Couldn't fetch」→ 用**单 URL 提交**绕过；提交 canonical `/blog/<slug>/`（旧式 `index.html?blog=bXX` 现已 301 到 canonical，无需单独提交）。

## 4. GSC / Bing 收录核对（本周）

- **Google**：`site:aurae.asia crystal jewelry` → **0 条本站结果**（仅同名无关站/竞品 aureejewellery、aurracrystal、auracrystalau 等）。与 GSC「Couldn't fetch」+ 新域抓取周期一致，**本周无新增收录**。仍需等待 GSC 抓取周期自愈。
- **Bing**：外部无法确认。请用户在 **Bing Webmaster Tools** 自查此前 38 URL（Processing）是否转「已编入索引」，并手动提交本周 2 篇 blog。

## 5. 外链建设（Agent 无法登录平台，以下文案请用户手动发）

### Pinterest — 3 个 Pin（描述放 `https://www.aurae.asia/`）

**Pin 1（b41 母婴）**
- Title: *Crystals for New & Expecting Moms 🤍*
- Description: A gentle, non-medical guide to the stones mothers keep close for calm & comfort. Rose Quartz, Moonstone, Amethyst & more — worn as jewelry, not just decor. Save this for later 💫 Shop gentle crystal jewelry: https://www.aurae.asia/
- Image: `/images/p001.webp`（Rose Quartz Love bracelet）

**Pin 2（b40 鉴真）**
- Title: *How to Spot Fake Crystals (Before You Buy) 🔍*
- Description: Glass? Resin? Dyed? Heat-treated? The simple no-tools checks that separate real crystals from impostors. Buy with confidence 💎 Read the guide: https://www.aurae.asia/
- Image: `/images/p013.webp`

**Pin 3（搭配/穿搭，引 b35）**
- Title: *How to Style Crystal Jewelry Every Day ✨*
- Description: Wear crystals to work, on dates & every day. Stacking & styling ideas for real-life outfits. Find your piece: https://www.aurae.asia/
- Image: `/images/p001.webp`

### Reddit — 2 篇草稿（相关社区，以讨论为主、结尾轻放链接，遵守 no-self-promo 版规）

**Draft 1** — r/Crystals 或 r/Crystalawakenings
- Title: *A no-tools checklist for spotting fake/treated crystals — what actually works?*
- Body: 分享 b40 要点（温度测试、染色看裂缝、天然 vs 热处理柠檬黄），结尾 *"I wrote up the full checklist here if useful: https://www.aurae.asia/ — would love to hear what tests you all use."* 先参与讨论、勿硬广。

**Draft 2** — r/BabyBumps 或 r/beyondthebump
- Title: *Stones I kept close during pregnancy for calm (not medical, just comfort)*
- Body: 以经验分享口吻讲 b41 的 Rose Quartz / Moonstone / Amethyst，明确**非医疗建议**，结尾轻放链接 `https://www.aurae.asia/`。注意版规，先贡献再偶尔分享。

### Instagram / TikTok Bio

- **IG bio**: ✨ Gentle crystal jewelry for love, calm & everyday magic 💎 Shop: https://www.aurae.asia/
- **TikTok bio**: Crystal jewelry & gentle energy ✨ Shop real, honestly-sourced stones 👉 https://www.aurae.asia/

## 6. 跨周待办

- 部署 b40/b41（`git pull + chown + fuser -k 3000 + pm2 restart`）后到 GSC 提交 2 篇新 blog。
- GSC sitemap「Couldn't fetch」抓取周期等待；可考虑提交 `sitemap-v3.xml` 绕过缓存。
- Bing 38 URL 自查是否转「已编入索引」+ 提交本周 2 blog。
- b8–b39（32 篇）历史 blog GSC 补提交 backlog。
- PayPal Secret 轮换（安全待办，仍挂起）。
