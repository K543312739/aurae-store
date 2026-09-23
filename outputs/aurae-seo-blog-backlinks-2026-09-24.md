# Aurae 周度 SEO 推进报告 — 2026-09-24（第 21 跑）

> 自动化「每周博客与外链建设」执行记录。本周未改服务器代码、未部署（无 SSH 权限），按指令「简单汇报」。

## 1. 博客发布（b52 + b53，已 commit & push）

| ID | 标题 | 分类 | canonical URL | 配图 |
|----|------|------|---------------|------|
| b52 | Crystals for Gratitude & a Daily Positivity Practice | crystals | https://www.aurae.asia/blog/crystals-for-gratitude-a-daily-positivity-practice/ | /images/p014.webp |
| b53 | Crystals for Men: Subtle, Grounded Everyday Pieces | guides | https://www.aurae.asia/blog/crystals-for-men-subtle-grounded-everyday-pieces/ | /images/p015.webp |

- 提交：`commit b6810bd` → 已 `git push origin main`。
- `js/data.js` BLOG_POSTS 现 **53 篇**；静态 `sitemap.xml` 同步至 **93 总 URL / 53 博客**。
- `node --check` 语法通过；slug 与前端 `slugify` 逐字节一致校验通过。
- 选题差异化：b52 心态/感恩（区别于显化 b28），b53 男性受众+搭配建议（电商向、新人群，站内无同类）。

### ⚠️ 部署待办（重要）
b52/b53 已进 Git 仓库但**尚未上线**（live `data.js` 仍约 b51，无 SSH 权限）。部署后才能 GSC 提交生效：
```
ssh admin@47.253.245.165
cd /opt/aurae-store && git pull --ff-only && sudo chown -R admin:admin /opt/aurae-store
fuser -k 3000/tcp ; pm2 restart aurae
```
部署后博客上线，再到 GSC 做下列「Request indexing」。

### 🟢 GSC「Request indexing」提交清单（本周 2 条，部署后操作）
在 Google Search Console → URL 检查 → 粘贴以下规范 URL → 「请求编入索引」：
1. `https://www.aurae.asia/blog/crystals-for-gratitude-a-daily-positivity-practice/`
2. `https://www.aurae.asia/blog/crystals-for-men-subtle-grounded-everyday-pieces/`

> 旧式 `index.html?blog=b52` / `index.html?blog=b53` 已 301 跳转到上述规范 URL，提交规范 URL 即可。
> 历史 backlog（b8–b51 共 40+ 篇）仍未全部单 URL 提交，建议每周分批补提 5–8 条。

## 2. 外链建设（Agent 无法登录平台，以下为可直接发布的文案，需你手动发）

### Pinterest — 3 个 Pin（描述均含站点链接，建议配博客封面图 p014/p015/产品图）
**Pin 1（绑 b52 感恩）**
> A 2-minute gratitude practice you can actually keep 💎 Keep one stone where your eye lands daily — nightstand, laptop, car. These are the crystals that make appreciation stick (Rose Quartz, Citrine, Amethyst, Clear Quartz). Full guide + a simple daily ritual 👉 https://www.aurae.asia/blog/crystals-for-gratitude-a-daily-positivity-practice/
> Shop the collection: https://www.aurae.asia/

**Pin 2（绑 b53 男性）**
> Crystals aren't just one aesthetic. Quiet, grounded, easy to wear — a matte black bead bracelet, a plain ring, a stone in the pocket. The stones + pieces that fit a normal life (Black Obsidian, Tiger's Eye, Smoky Quartz, Garnet). Guide for men 👉 https://www.aurae.asia/blog/crystals-for-men-subtle-grounded-everyday-pieces/
> Browse: https://www.aurae.asia/

**Pin 3（常青爆款，导流首页）**
> Handmade crystal bracelets for calm, focus & good energy — $20–50, shipped worldwide 🌿 Which stone is your sign? https://www.aurae.asia/

### Reddit — 2 条草稿（价值优先、不硬广；链接放评论或 profile，避免被删）
**草稿 A（r/Crystals 或 r/selfimprovement — 绑 b52）**
> Title: *Tried a 2-minute "gratitude stone" habit for a month — here's what changed*
> Body: 写一段个人体验（选一颗 Rose Quartz/Clear Quartz 放手边，每天说 3 件具体的好事）。结尾轻引导：「我整理了一份石头清单和做法 👉 profile / [guide link]」。把 https://www.aurae.asia/blog/crystals-for-gratitude-a-daily-positivity-practice/ 放在个人简介或首评，正文不堆链接。

**草稿 B（r/malefashionadvice 或 r/malefashion — 绑 b53）**
> Title: *Subtle crystal/jewelry for guys who don't want sparkle?*
> Body: 问「想戴点有寓意又不浮夸的，黑色/雾面珠子那种，有推荐吗」。在回复里自然带出 Black Obsidian / Tiger's Eye  bead bracelet，并附指南链接 https://www.aurae.asia/blog/crystals-for-men-subtle-grounded-everyday-pieces/（放评论，正文克制）。

### Instagram / TikTok Bio（补充站点链接）
- Instagram 简介加一行：`🌿 Handmade crystal jewelry · https://www.aurae.asia/`
- TikTok 简介加一行：`✨ Crystal bracelets for calm & energy → https://www.aurae.asia/`
- 帖子/视频文案可带：`Link in bio · https://www.aurae.asia/`

## 3. 本周 GSC / Bing 收录检查

- **Google（web search 核验）**：`site:aurae.asia` 仍 **0 条本站结果**（仅同名无关站 Asia Aurora / AustAsia / Aurea / AustAsia Group / Aurelia Wiki）；`aurae.asia crystal jewelry bracelet` 仅返竞品（auragem / pinkoi / lavval / Astra Aura）→ **Google 本周无新增收录**，与 GSC sitemap「Couldn't fetch」/ 新域抓取周期一致。
- **Bing**：外部无法确认（WebSearch 不区分引擎）。请在 Bing Webmaster Tools 自查此前 38 URL(Processing) 是否转「已编入索引」，并手动提交本周 2 篇博客 URL。

## 4. 跨周待办
- 部署 b52/b53（及以上周积压的 b44–b51，共 10 篇已 commit 未部署）。
- GSC sitemap 抓取周期等待；可尝试在 GSC 重新提交 `sitemap-v3.xml` 绕过缓存。
- Bing 38 URL 自查 + 本周 2 blog 提交。
- PayPal Secret 轮换（安全待办，需你去 PayPal 生成新密钥后写 .env 并部署）。
- b8–b51 历史博客 GSC 单 URL 补提交 backlog（约 40 篇）。

---
*命名说明：`aurae-seo-weekly-*` 系列已被「站点收录周检」自动化占用，本报告续用 `aurae-seo-blog-backlinks-*` 命名，勿覆盖前者。*
