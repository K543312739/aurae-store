# Aurae 独立站 SEO 周报 — 2026-09-03（第 18 跑 · 博客 + 外链）

> 范围：本周博客撰写与发布、GSC 单 URL 提交清单、外链文案、收录核对。
> 指令：简单汇报，无需改服务器代码、无需部署。

---

## 1. 本周新博客（已 commit + push 到 `main`，commit `6f1fbf5`）

| ID | 标题 | Canonical URL | 话题 | 字数 |
|----|------|---------------|------|------|
| b46 | Crystals for Abundance & Prosperity: A Practical Wealth Guide | `/blog/crystals-for-abundance-prosperity-a-practical-wealth-guide/` | crystals（财富/丰盛，高商业意图） | ~10 min |
| b47 | The Crystal Color Meaning Guide: What Each Hue Symbolizes | `/blog/the-crystal-color-meaning-guide-what-each-hue-symbolizes/` | guides（颜色→意图映射，常青支柱/信息类，强 Pinterest） | ~11 min |

- 写入 `js/data.js` BLOG_POSTS（现 **47 篇**）+ 静态 `sitemap.xml`（现 **87 总 URL / 47 篇 blog URL**）。
- 图片：`/images/p012.webp`（Green Phantom Wealth，财富主题）、`/images/p003.webp`（Amethyst，紫色代表色）。
- 内部链接已交叉校验：指向 `/products/*` 真实商品页 + 已上线博客 slug（career / luck / confidence / manifestation / love / meditation / communication / pairings / combining / crystal-care-101 / cleanse / charge 等），全部在 sitemap 中可验证。
- 未改服务器代码（遵守指令）；`node --check` 语法 + sitemap XML 解析均通过。

## 2. GSC「Request indexing」单 URL 提交清单

> ⚠️ 提交前提是博客已**部署上线**。本任务未部署（见 §5），请部署后再在 GSC → URL 检查 粘贴以下地址 → 「请求编入索引」。

### 本周新增（部署后优先提交）
1. `https://www.aurae.asia/blog/crystals-for-abundance-prosperity-a-practical-wealth-guide/`
2. `https://www.aurae.asia/blog/the-crystal-color-meaning-guide-what-each-hue-symbolizes/`

### 历史 backlog（分批补提，建议每周 5–10 条）
Google 当前对全站 `site:aurae.asia` 仍 **0 收录**（见 §4），故 sitemap.xml 中全部 `/blog/` URL 均尚未被索引。
请在 `crystal-store/sitemap.xml` 里取全部 `/blog/<slug>/` 地址，按周分批提交（避开单日限额）。
重点高意图词优先：career / luck / stress / cleanse / abundance / color-guide / manifestation / self-love / confidence / focus。

## 3. 外链建设文案（⚠️ Agent 无法登录平台，需用户手动发布）

所有链接统一用 `https://www.aurae.asia/`（品牌主域，利于域名权重集中）。

### 📌 Pinterest — 3 Pins（描述末尾放主域链接）
**Pin 1 · Abundance & Prosperity（对应 b46）**
- Title: `Crystals for Abundance & Prosperity 💰`
- Description:
```
Want more flow in your life? These are the stones people have tied to
wealth & growth for centuries — Citrine, Green Phantom, Tiger's Eye & more.
Plus a 5-minute abundance ritual you can actually stick to. Save for your altar ✨
https://www.aurae.asia/
```

**Pin 2 · Crystal Color Meanings（对应 b47）**
- Title: `Crystal Color Meanings: Pick by Hue 🌈`
- Description:
```
Pink = love · purple = calm · green = growth · blue = truth · black = protection.
A quick color-to-intention map so you choose crystals by feeling, not just looks.
Which color are you drawn to? 💬
https://www.aurae.asia/
```

**Pin 3 · 5-Min Crystal Ritual（常青，引向 shop）**
- Title: `Build a Crystal Ritual in 5 Minutes ⏳`
- Description:
```
No incense, no woo-woo — one stone, one intention a day. A grounded way to
actually use your crystals instead of letting them collect dust. Start with the
color you keep coming back to 💎
https://www.aurae.asia/
```

### 📌 Reddit — 2 Drafts（一次性资源分享，链接只放一次、先互动再发，避免被判 spam）
**Draft 1 · r/Crystals（对应 b46）**
```
Hey all — I put together a practical guide on crystals for abundance & prosperity
(Citrine, Green Phantom, Tiger's Eye, Clear Quartz) with a simple daily ritual.
Not financial advice, just the cultural lore + how to actually work with them.
Curious what stones you all reach for when you want more "flow"? 🙏
https://www.aurae.asia/blog/crystals-for-abundance-prosperity-a-practical-wealth-guide/
```

**Draft 2 · r/spirituality（对应 b47）**
```
Made a crystal color-meaning cheat sheet for newcomers: pink=love, purple=calm,
green=growth, blue=truth, black=protection, etc. Hope it helps folks pick by
intention. Feedback / corrections welcome!
https://www.aurae.asia/blog/the-crystal-color-meaning-guide-what-each-hue-symbolizes/
```

### 📌 Instagram Bio
```
Handmade crystal jewelry with intention ✨ Calm · Love · Focus · Abundance
🌍 Worldwide shipping ↓ Shop & free crystal guides
https://www.aurae.asia/
```

### 📌 TikTok Bio
```
Crystal jewelry that means something 💎 Calm · Love · Focus · Abundance
🌍 Worldwide shipping 👇
https://www.aurae.asia/
```

## 4. 本周 GSC / Bing 收录核对

- **Google（GSC）**：`site:aurae.asia` web search 仍 **0 条本站结果**（仅返 WHOIS + 同名无关站 Aurae / Aurelia lore / Far East Aurea 等）；`aurae.asia crystal jewelry bracelet` 返竞品（aurracrystal / auracrystalau / jamstones / pinkoi）。→ 与 GSC sitemap「Couldn't fetch」/ 新域抓取周期一致，**本周 Google 无新增收录**。
- **Bing**：外部无法确认（WebSearch 不区分引擎、Bing 侧常遇 CAPTCHA）。请在 **Bing Webmaster Tools** 自查此前 38 URL（Processing）是否转「已编入索引」，并手动提交本周 2 篇 blog。

## 5. 部署状态（重要 · 影响 GSC 提交是否生效）

- b44–b47 均已 commit 但**未部署**（无 SSH 权限 + 指令「简单汇报」）。当前 live `data.js` 仍为 b43，新博客线上不可见，GSC 单 URL 提交需等部署。
- 部署步骤（在服务器执行）：
```bash
cd /opt/aurae-store
git pull --ff-only
sudo chown -R admin:admin /opt/aurae-store
fuser -k 3000/tcp; pm2 restart aurae
# 若改过 nginx 配置还需：python3 apply_nginx.py
```
部署后博客上线，§2 的 GSC 提交方生效。

## 6. 跨周待办
- 部署 b44–b47（让本周 + 上周博客上线）。
- GSC sitemap 抓取周期等待（可考虑在 GSC 提交 `sitemap-v3.xml` 绕过缓存）。
- Bing 38 URL 自查 + 提交本周 2 blog。
- PayPal Secret 轮换（安全待办，独立于 SEO）。
- b8–b45 历史博客 GSC 补提交 backlog（约 40 篇，分批）。
