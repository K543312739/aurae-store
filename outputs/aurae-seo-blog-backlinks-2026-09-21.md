# Aurae SEO 周报 — 2026-09-21（博客 + 外链建设）

> 自动化任务「每周博客与外链建设」第 20 跑。本周新增 2 篇博客、同步 sitemap、产出外链文案；未改动服务器代码（遵守指令）。

## 1. 本周发布博客（已 commit + push 到 main，commit `67380ff`）

| ID | 标题 | 分类 | 规范 URL（canonical） | 旧式 URL |
|----|------|------|----------------------|----------|
| b50 | Crystals for Self-Worth & Setting Boundaries | crystals | `https://www.aurae.asia/blog/crystals-for-self-worth-setting-boundaries/` | `index.html?blog=b50` |
| b51 | Crystals for Memory, Mental Clarity & Better Decisions | guides | `https://www.aurae.asia/blog/crystals-for-memory-mental-clarity-better-decisions/` | `index.html?blog=b51` |

- 已写入 `js/data.js` BLOG_POSTS（现 **51 篇**）+ 静态 `sitemap.xml`（现 **91 总 URL / 51 篇 blog**）。
- `node --check` 通过；slug 与 `app.js` 的 `slugify()` 逐字节一致；无重复 slug；XML 解析通过。
- 两篇均含内链（商品 + 历史博客），利于内部权重流转与 SEO 抓取。

### ✅ 请在 GSC 手动提交收录（Agent 无法登录 GSC）
1. 打开 Google Search Console → URL 检查 → 分别粘贴上面两个 **规范 URL** → 点 **「请求编入索引 / Request indexing」**。
2. 旧式 `index.html?blog=b50` / `b51` 已被 nginx 301 到规范 URL，无需单独提交；若 GSC 仍报 sitemap「无法获取」，可改用 **sitemap-v3.xml** 提交绕过缓存。
3. **历史 backlog 仍未补齐**：b8–b49 中仍有大量未提交的博客（约 40+ 篇），建议每周顺手补提 3–5 篇，逐步消积压。

## 2. 外链建设文案（复制即用 — Agent 无法登录这些平台，需你手动发）

> 全部含主站链接 `https://www.aurae.asia/`。Pinterest 文案用英文（配 SEO 关键词）；Reddit 走「价值贡献 + 软链」避免被删。

### 2.1 Pinterest — 3 个 Pin（建议 board：Crystal Healing / Self-Care & Wellness / Crystal Jewelry）

**Pin 1 — 自爱与边界（对应 b50）**
> **Title:** Stop Shrinking to Keep the Peace 💎 Crystals for Self-Worth & Boundaries
> **Description:** If saying no feels impossible, these are the stones that hold your worth so the boundary comes from steadiness — not panic. Rose Quartz for self-compassion, Garnet for inner fire, Black Obsidian for the clean "no." Save this for your next hard conversation. 🔗 Shop grounding crystal jewelry: https://www.aurae.asia/
> **Image context:** 玫瑰石英/石榴石手链平铺图；boards: Self-Care & Wellness, Crystal Healing
> **SEO keywords:** crystals for self worth, crystals for boundaries, rose quartz, how to set boundaries

**Pin 2 — 清晰决策（对应 b51）**
> **Title:** Foggy Brain? 🧠 Crystals for Memory, Clarity & Better Decisions
> **Description:** When the choice feels like wading through soup, reach for Clear Quartz (clear lens), Amethyst (calm orderly thinking), Blue Quartz (mental coolant) and Tiger's Eye (decide & commit). A 3-step clarity ritual inside. 🔗 Browse clarity crystals: https://www.aurae.asia/
> **Image context:** 紫水晶/蓝晶/黄虎眼手链组合图；boards: Crystal Healing, Study & Focus
> **SEO keywords:** crystals for focus, crystals for memory, clear quartz, mental clarity

**Pin 3 — 品牌引流（常青）**
> **Title:** Wear Your Intention 💫 Handmade Crystal Jewelry $20–50
> **Description:** Ethically sourced, intentional crystal bracelets & necklaces for love, calm, focus and protection. 50+ free crystal guides on the blog. 🔗 Explore: https://www.aurae.asia/
> **Image context:** 多款手链拼图；boards: Crystal Jewelry, Gift Ideas
> **SEO keywords:** crystal jewelry, healing crystals, buy crystals online

### 2.2 Reddit — 2 条草稿（选相关社区，发时去掉「推广感」，先给价值再软链）

**Draft A — r/crystals 或 r/spirituality（对应 b50）**
> Heads-up for anyone who struggles with people-pleasing: I pulled together a guide on the stones people use to rebuild self-worth and actually hold a boundary — Rose Quartz for self-compassion, Garnet for the inner "I matter" fire, Black Obsidian for the clean no, Lapis for saying the true thing. Curious what everyone here reaches for when they need to stop over-giving? (I wrote up the full version with a 3-min reset ritual here if useful: https://www.aurae.asia/blog/crystals-for-self-worth-setting-boundaries/)

**Draft B — r/GetStudying / r/productivity / r/selfimprovement（对应 b51）**
> For the "can't decide / brain fog" days: a short rundown of crystals people use for mental clarity and clean decision-making — Clear Quartz to cut noise, Amethyst to calm the overthinking, Blue Quartz for emotionally-charged calls, Tiger's Eye to actually commit. Anyone else use physical anchors like this to think sharper? Full guide + a pre-decision ritual: https://www.aurae.asia/blog/crystals-for-memory-mental-clarity-better-decisions/

### 2.3 Instagram Bio（放链接，link-in-bio 工具如 Linktree 也可）
> ✨ Handmade crystal jewelry for intention & energy 💎 50+ free crystal guides 🔗 Shop & learn: https://www.aurae.asia/

### 2.4 TikTok Bio
> Crystal jewelry & meaning 💎 self-love · focus · calm 🛍 https://www.aurae.asia/

## 3. 本周 GSC / Bing 收录核对

- **Google（`site:aurae.asia` + 品类词 web search）**：仍 **0 条本站结果** —— 仅返回同名/近似无关站（Asia Aurora、Aura Group、Aurea、Australasia 词典条目等）；品类词 `aurae.asia crystal jewelry bracelet` 仅返竞品（auragem / lavval / mesmerizeasia / pinkoi）。**本周 Google 无新增收录**，与 GSC sitemap「Couldn't fetch」/ 新域抓取周期一致。
- **Bing**：WebSearch 不区分引擎，无法外部确认。请登录 **Bing Webmaster Tools** 自查：
  - 此前提交的 38 URL 是否从「Processing」转「已编入索引」；
  - 本周新博客 b50/b51 提交收录。

## 4. 部署提醒（重要）
- 本次仅 commit + push 到 GitHub `main`，**未执行服务器部署**（无 SSH 权限 + 指令「简单汇报」）。
- 线上 `data.js` 仍约为 b49，**b50/b51 尚未上线**。部署后博客才可被访问、GSC 提交才生效。
- 部署步骤（在服务器执行）：
  ```bash
  cd /opt/aurae-store && git checkout -- . && git pull origin main
  sudo chown -R admin:admin /opt/aurae-store
  fuser -k 3000/tcp || true
  pm2 restart aurae
  ```
- 注：静态 `sitemap.xml` 已含 b50/b51；动态 sitemap（`server.js` 启动时由 `BLOG_IDS = blogs.map(b=>b.id)` 生成）部署后自动含全部 51 篇。

## 5. 跨周待办（持续）
- 部署 b50/b51（及更早积压的 b44–b49 共 6 篇已 commit 未部署）。
- GSC sitemap 抓取周期等待（可考虑提交 sitemap-v3.xml 绕过缓存）。
- Bing 38 URL 自查 + 本周 2 篇提交。
- PayPal Secret 轮换（安全待办，需你生成新密钥后写 .env + 部署）。
- b8–b49 历史博客 GSC 单 URL 补提交 backlog（约 40 篇）。
