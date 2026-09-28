# Aurae 每周 SEO 汇报 — 2026-09-29（第 22 跑）

> 自动化任务：博客 + 外链建设 + 收录检查。本报告**续用 `aurae-seo-blog-backlinks-*` 命名**，避免覆盖「站点收录周检」自动化占用的 `aurae-seo-weekly-*` 系列文件。

## 1. 本周博客（已写、已 commit + push 到 `main`）

| ID | 标题 | 分类 | Canonical URL | 配图 |
|----|------|------|---------------|------|
| b54 | Crystals for Overthinking & Quieting a Racing Mind | crystals | `/blog/crystals-for-overthinking-quieting-a-racing-mind/` | p012.webp |
| b55 | Crystals for Self-Discipline & Building Habits That Stick | guides | `/blog/crystals-for-self-discipline-building-habits-that-stick/` | p013.webp |

- 提交：`007261a` → `origin/main`。`js/data.js` 现 **55 篇**博客；`sitemap.xml` 同步至 **55 条 blog URL / 95 条总 URL**。
- 校验：`node --check js/data.js` 通过；slug 由标题经 `slugify()` 派生，**与 sitemap 逐字节一致**；sitemap.xml XML 解析通过。
- 内部链接全部指向**已确认存在的 canonical slug**（顺手规避了一处 b52 历史遗留的失效 manifestation slug）。
- **未改服务器代码**（遵守指令）。

## 2. 部署状态（重要）

与往周一致：本自动化**无 SSH 权限 + 指令「简单汇报」**，**未部署**。按仓库运行日志，b44–b55 多周博客均已 commit 但未上线，live `data.js` 落后。

部署后博客才对外可见、方可提交 GSC。步骤：

```bash
# 服务器（admin 用户）
cd /opt/aurae-store && git checkout -- . && git pull origin main && \
sudo chown -R admin:admin /opt/aurae-store && \
sudo fuser -k 3000/tcp ; pm2 restart aurae
```

部署后请顺手在 GSC 提交本周 + 历史 backlog（见 §3）。

## 3. GSC「Request indexing」提交清单

⚠️ 站点已做 URL 静态化，博客规范地址是 `/blog/<slug>/`，旧的 `index.html?blog=bXX` 会 **301 跳转**到规范地址。**请在 GSC 对规范地址点 Request indexing**（提交旧地址也会被 301 带过去，但规范地址优先）。

**本周 2 条（部署后提交）：**
- `https://www.aurae.asia/blog/crystals-for-overthinking-quieting-a-racing-mind/`
- `https://www.aurae.asia/blog/crystals-for-self-discipline-building-habits-that-stick/`

**历史 backlog（已 commit 未提交，建议分批补提，每周 2–4 条避免触发审核）：**
- b44 `…/crystals-for-stress-relief-beating-burnout/`
- b45 `…/how-to-cleanse-your-crystals-7-safe-methods-and-what-not-to-do/`
- b46 `…/crystals-for-abundance-prosperity-a-practical-wealth-guide/`
- b47 `…/the-crystal-color-meaning-guide-what-each-hue-symbolizes/`
- b48 `…/crystals-for-anger-irritability-and-finding-patience/`
- b49 `…/crystals-for-new-beginnings-fresh-starts-and-big-transitions/`
- b50 `…/crystals-for-self-worth-setting-boundaries/`
- b51 `…/crystals-for-memory-mental-clarity-better-decisions/`
- b52 `…/crystals-for-gratitude-a-daily-positivity-practice/`
- b53 `…/crystals-for-men-subtle-grounded-everyday-pieces/`
- （更早的 b8–b43 若从未提交过，也建议逐步补提）

> 也可在 GSC 提交 `https://www.aurae.asia/sitemap.xml` 整体重抓，绕开单 URL 限制。

## 4. 外链建设（可复制文案，需你手动发布 — Agent 无法登录这些平台）

### 4.1 Pinterest — 3 个 Pin（描述必须含 `https://www.aurae.asia/`）

**Pin 1 — 主题：b54 静心**
- 标题：`Crystals for Overthinking & a Quiet Mind 💎`
- 描述：`Your brain won't stop looping? These 5 crystals help quiet a racing mind — Amethyst, Blue Quartz, Aquamarine, Moonstone & Tea Quartz. Save this for the 2am spiral 🌙 Full guide + a 3-min "stop the spiral" practice: https://www.aurae.asia/blog/crystals-for-overthinking-quieting-a-racing-mind/  Shop healing crystal jewelry: https://www.aurae.asia/`
- Board：`Crystal Healing · Mind & Mood` ｜ 图：静谧单晶/手串（如 p012）

**Pin 2 — 主题：b55 习惯/自律**
- 标题：`Build Habits That Stick with Crystal Anchors 🔁`
- 描述：`Discipline is a practiced skill, not a personality trait. Here's how to use Tiger's Eye, Citrine, Garnet & Black Obsidian as physical cues that keep a new habit alive past week one 💪 Guide + a simple habit-anchoring ritual: https://www.aurae.asia/blog/crystals-for-self-discipline-building-habits-that-stick/  Find your stone: https://www.aurae.asia/`
- Board：`Crystal Tips · Self Growth` ｜ 图：叠戴手串（如 p013）

**Pin 3 — 主题：产品/店铺（引流转化）**
- 标题：`Handmade Healing Crystal Bracelets for Everyday Calm ✨`
- 描述：`Amethyst for calm, Citrine for momentum, Black Obsidian for focus. Real stones, $20–50, ships worldwide 🌿 Browse the full collection: https://www.aurae.asia/  #crystaljewelry #healingcrystals #crystalbracelet`
- Board：`Aurae · Crystal Jewelry` ｜ 图：爆款手串拼图

### 4.2 Reddit — 2 篇草稿（价值先行，单链接，遵守版规）

**Draft A — r/selfimprovement 或 r/declutter（偏 b54 静心）**
- 标题：`I replaced "thinking it through" with a 3-minute stone ritual for overthinking — here's what changed`
- 正文：`Overthinking for me was a loop, not a logic problem. I started keeping a small Amethyst (or any calming stone) on my desk and doing a 3-min practice: name the thought once, ask "one small thing I can do now?", then set it down. It didn't solve anything — it just closed the loop. I wrote up the fuller version with the stones I use (Blue Quartz, Aquamarine, Moonstone, Tea Quartz) here if useful: https://www.aurae.asia/blog/crystals-for-overthinking-quieting-a-racing-mind/  Curious what others do to interrupt the spiral?`
- ⚠️ 发前先读版规；首次发链接易被删，可考虑先纯分享、隔日再补链接。

**Draft B — r/productivity 或 r/getdisciplined（偏 b55 习惯）**
- 标题：`Using a "physical anchor" (a stone) to make habits stick past the motivation phase`
- 正文：`Most of my habits died in week two, after the motivation ran out. What's been working: pick ONE habit, assign it a small stone I touch every time I do the thing, so the action and the object become the same memory. Tiger's Eye for follow-through, Citrine for starting, Black Obsidian for cutting excuses. Full write-up + a weekly recharge ritual: https://www.aurae.asia/blog/crystals-for-self-discipline-building-habits-that-stick/  Anyone else use a physical cue for habits?`
- ⚠️ 同上，注意版规与频率。

### 4.3 Instagram Bio（放链接或 Link Sticker）
`Handmade healing crystal jewelry ✨ Bracelets & rings for calm, focus & good energy 🌿 Shop: https://www.aurae.asia/`

### 4.4 TikTok Bio
`🌙 Crystal jewelry for everyday energy · Calm · Focus · Good vibes 💎 Shop ↓ https://www.aurae.asia/`

## 5. 本周收录检查（GSC / Bing）

- **Google（`site:aurae.asia`）**：本周 web search 仍 **0 条本站结果**，仅返回无关同名站（ASUS Armoury Crate / Aurelia Asia / Aurea condos 等）。与 GSC「Couldn't fetch」+ 新域抓取周期一致，**本周 Google 无新增收录**。
- **品类词（`aurae.asia crystal jewelry bracelet`）**：仅返竞品（lavval / mesmerizeasia / aurracrystal / ankorstore），**无本站** → 无新增。
- **Bing**：外部无法确认。请在 **Bing Webmaster Tools** 自查此前 38 URL 是否由 Processing → 已编入索引，并手动提交本周 2 篇博客。
- **结论**：本周无可见新增收录页面。根因仍是 GSC sitemap 抓取周期等待（nginx 头已修，等 Google 抓取节奏）；建议持续提交 sitemap + 单 URL，并增加外链加速被发现。

## 6. 跨周待办
1. 部署 b44–b55（尤其本周 b54/b55）后提交 GSC。
2. GSC sitemap 抓取周期等待；可尝试提交 `sitemap.xml` 整体重抓。
3. Bing Webmaster Tools 自查 38 URL + 提交本周博客。
4. PayPal Secret 轮换（安全待办，与此任务无关但长期挂起）。
5. b8–b43 历史博客 GSC 补提交 backlog（约 30+ 篇，分批）。
