# Aurae 每周 SEO 推进 — 2026-08-24

> 自动化任务输出。博客已写入 GitHub `main`（commit `c4a30c1`）。**部署 + GSC 提交需用户手动完成**（Agent 无服务器 SSH / GSC 登录权限）。

## 1. 本周新博客（已发布到 GitHub，待部署上线）

| ID | 标题 | 分类 | canonical URL |
|----|------|------|---------------|
| b28 | Crystals for Manifestation: A Beginner's Guide to Setting Intentions | spirituality | https://www.aurae.asia/blog/crystals-for-manifestation-a-beginner-s-guide-to-setting-intentions/ |
| b29 | Crystals for Meditation & Mindfulness: Build a Calmer Daily Practice | guides | https://www.aurae.asia/blog/crystals-for-meditation-mindfulness-build-a-calmer-daily-practice/ |

- 已写入 `js/data.js` BLOG_POSTS（b28/b29）+ 同步静态 `sitemap.xml`（现 59 条 URL / b1–b29）。
- `node --check` + XML 解析 + slug 逐字节校验均通过。
- **未改服务器代码**（遵守指令）。动态 sitemap 由 `server.js` 的 `blogs.map(b=>b.id)` 自动包含新博客，部署后即生效。

### 让博客上线的部署步骤（用户执行）
```bash
# 服务器 /opt/aurae-store
cd /opt/aurae-store
git checkout -- . && git pull origin main
sudo chown -R admin:admin /opt/aurae-store/server   # 防 EACCES
fuser -k 3000/tcp                                   # 杀旧 3000 进程（防 EADDRINUSE 静默失败）
pm2 restart aurae
```

### GSC「Request indexing」提交清单
部署完成后，到 Google Search Console → URL Inspection，逐个粘贴以下 canonical URL → 点 **Request indexing**：

**本周（优先）：**
1. https://www.aurae.asia/blog/crystals-for-manifestation-a-beginner-s-guide-to-setting-intentions/
2. https://www.aurae.asia/blog/crystals-for-meditation-mindfulness-build-a-calmer-daily-practice/

**历史 backlog（建议分批补提，每周 2–3 条避免触发提交限额）：**
- b8  Crystal Care 101 → /blog/crystal-care-101-everyday-rituals-to-keep-your-stones-bright/
- b9  Crystal Pairings → /blog/crystal-pairings-combine-stones-for-amplified-energy/
- b10 Crystals for Sleep & Anxiety → /blog/crystals-for-sleep-anxiety-calm-your-mind-at-night/
- b11 Chakra Healing → /blog/chakra-healing-a-map-of-the-7-energy-centers-and-their-crystals/
- b12 / b13（请自查 slug，commit 中已含）
- b14 Crystals for Love & Self-Love → /blog/crystals-for-love-self-love-open-your-heart/
- b15 Crystals for Focus & Productivity → /blog/crystals-for-focus-productivity-study-build-a-clear-mind-workspace/
- b16 Crystals for Protection & Grounding → /blog/crystals-for-protection-grounding-feel-safe-in-your-own-energy/
- b17 Crystals for Confidence & Courage → /blog/crystals-for-confidence-courage-self-esteem-stand-in-your-power/
- b18 How to Choose Your First Crystal → /blog/how-to-choose-your-first-crystal-a-simple-friendly-guide/
- b19 Crystal Care Mistakes → /blog/crystal-care-mistakes-7-things-that-dull-your-stones-energy/
- b20 Crystal Grids → /blog/crystal-grids-manifestation-sacred-geometry-for-your-goals/
- b21 Crystals for Emotional Healing → /blog/crystals-for-emotional-healing-letting-go/
- b22 Crystals for Career Success → /blog/crystals-for-career-success-confidence-at-work/
- b23 Crystals for Travel → /blog/crystals-for-travel-protection-grounding-on-the-go/
- b24 Crystals for Health & Vitality → /blog/crystals-for-health-vitality-physical-wellness/
- b25 Crystal Bracelet Stacking → /blog/crystal-bracelet-stacking-build-intentional-combos-for-any-goal/
- b26 Crystals for Creativity → /blog/crystals-for-creativity-inspiration-unblock-your-artistic-flow/
- b27 Crystals for Energy & Motivation → /blog/crystals-for-energy-motivation-beat-the-afternoon-slump-naturally/

> 注：旧式 `index.html?blog=bXX` 已被 301 到上述 canonical，提交 canonical 即可，无需提交旧 URL。

---

## 2. 外链建设（需用户手动发布，Agent 无法登录第三方平台）

### Pinterest — 创建 3 个 Pin（描述中放置 https://www.aurae.asia/ ）
Pin 配图建议用站内产品 webp（如 `images/p012.webp` 显化、`images/p015.webp` 冥想、`images/p001.webp` 品牌）。

**Pin 1 — Manifestation（呼应 b28）**
- 标题：Crystals for Manifestation: Set Intentions That Actually Stick ✨
- 描述：Want your goals to feel real? These are the crystals people use to clarify intentions and stay aligned — Clear Quartz, Citrine, Green Phantom & more. Beginner-friendly guide + stack ideas. 🔮 Shop intention jewelry: https://www.aurae.asia/

**Pin 2 — Meditation & Calm（呼应 b29）**
- 标题：Can't Sit Still to Meditate? Try a Crystal 🧘
- 描述：A 5-minute crystal meditation for busy minds — Amethyst, Blue Quartz, Aquamarine to drop into calm fast. Plus a simple daily practice. 🌊 Explore calm pieces: https://www.aurae.asia/

**Pin 3 — 品牌/产品（通用引流）**
- 标题：Healing Crystal Jewelry for Everyday Intention 💎
- 描述：Handcrafted crystal bracelets, necklaces & rings for love, focus, protection & calm — $20–50, shipped worldwide. Find your stone: https://www.aurae.asia/

### Reddit — 2 条可发草稿（以「提供价值」为主，链接放评论或个人档，避免硬广被删）
**社区 1：r/Crystals**
- 主题：Beginner's guide — how I use crystals to actually remember my intentions (Clear Quartz + a daily 1-line ritual)
- 正文：分享 b28 的核心方法（3 步显化仪式），末尾 "I wrote up the full beginner guide with stone picks here if useful: [link to /blog/...manifestation...]"。先养号、多互动再发，降低被删风险。

**社区 2：r/Meditation 或 r/spirituality**
- 主题：A tactile trick for a wandering mind — keeping a stone as your "return point"
- 正文：分享 b29 的 5 分钟水晶冥想，链接放评论区或个人简介，正文不硬塞 URL。

### Instagram / TikTok Bio（复制粘贴）
- IG：`Healing crystal jewelry for intention & everyday calm ✨ Shop: https://www.aurae.asia/`
- TikTok：`Crystal tips & calm jewelry 💎 Shop: https://www.aurae.asia/`
- 可在 IG/TikTok Story 高亮 & 置顶视频描述中重复放 https://www.aurae.asia/

---

## 3. 本周收录检查（GSC / Bing）

### Google（site:aurae.asia）
- `site:aurae.asia crystal jewelry` → **0 条本站结果**，返回的 5 条全是同名/近似竞品（aurracrystal.com、aureejewellery.com、Aurea Crystals 等）。
- 与 GSC sitemap「Couldn't fetch」状态一致，**本周 Google 无新增收录**。根因（nginx 缓存头已修）仍等 GSC 抓取周期自愈。
- 绕开方案：继续用上方 GSC 单 URL 提交（canonical）推动收录。

### Bing Webmaster Tools
- 外部无法确认 Bing 实际收录数。**请用户在 BWT 自查**此前约 38 条 URL 是否从「Processing」转为「已编入索引」。
- 建议本周在 BWT 也对本周 2 个 canonical blog URL 提交一次 URL Submission。

---

## 4. 跨周待办
- [ ] 用户执行部署（git pull + chown + fuser -k 3000 + pm2 restart），博客才线上可访问、方可 GSC 提交。
- [ ] GSC 单 URL 提交：本周 b28/b29 + 历史 b8–b27 backlog 分批补提。
- [ ] Bing Webmaster Tools 自查 38 URL 收录状态 + 提交本周 2 个 blog。
- [ ] 手动发布 Pinterest(3)/Reddit(2)/IG&TikTok bio 外链。
- [ ] PayPal Secret 轮换（安全待办，与 SEO 无关，持续提醒）。
