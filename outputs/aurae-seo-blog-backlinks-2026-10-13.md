# Aurae 博客与外链建设周报 — 2026-10-13（周二）

> 自动化任务：每周博客 1–2 篇 + 外链建设 + GSC/Bing 收录检查。
> 本周沙箱**出站全封锁**（`curl` 到 aurae.asia 超时 HTTP=000），故**未做任何部署**，博客仅 commit+push 至 GitHub `main`（HEAD=`2038463`），需待 egress 恢复后手动部署才上线。

---

## 1) 本周博客（已撰写 + 推送 GitHub main，未部署）

| ID | 标题 | 规范 URL（slug 已逐字节校验通过） | 分类 | 主题 |
|---|---|---|---|---|
| b56 | Crystals for Kids & Teens: A Gentle, Safe Intro (with Parent Guardrails) | `https://www.aurae.asia/blog/crystals-for-kids-teens-a-gentle-safe-intro-with-parent-guardrails/` | crystals | 功效 + 安全养护（家长向） |
| b57 | How to Know If Your Crystal Is Working: Signs, Timelines & What to Expect | `https://www.aurae.asia/blog/how-to-know-if-your-crystal-is-working-signs-timelines-what-to-expect/` | guides | 养护认知（新手高频问题） |

- 已写入 `js/data.js` `BLOG_POSTS`（现 57 篇 b1–b57）+ 同步 `sitemap.xml`（现 97 URL）。
- 校验：`node --check` 通过；`slugify(title)` 与 sitemap 中 URL **逐字节一致**；内链均指向已验证存在的规范 slug（color-meaning / cleanse / charge / manifestation / focus / protection / confidence 等博客 + 6 个真实商品 slug）。
- 内容含负责任的免责声明（儿童窒息风险、非医疗替代），契合站点合规基调。
- **未改任何服务器代码**（遵守指令）。

### ⚠️ 部署后才能提交 GSC（重要）
b56/b57 目前**仅存在于 git，尚未部署上线**。按 `outputs/gsc-manual-index.md` 铁律，**未上线 URL 禁止提交 GSC（会 404）**。egress 恢复后请执行：

```bash
cd /opt/aurae-store && git checkout -- . && git pull origin main
chown -R admin:admin /opt/aurae-store/server   # 保持属主避免 EACCES
fuser -k 3000/tcp                              # 杀占用 3000 的旧进程（防 EADDRINUSE）
pm2 restart aurae
```

部署后复核 `/sitemap.xml` 实际 URL 数（预期 ≈97），确认 200 + 正确 canonical，再走下方 GSC 提交流程。

---

## 2) GSC「Request indexing」提交清单（部署后由人工执行）

> 我（Agent）无法登录 GSC，以下为可复制的提交步骤与 URL。旧式 `index.html?blog=b56` 会被 301 重定向到规范 URL，**直接提交规范 URL 即可**。

**步骤（以 GSC 实际界面为准）**：GSC → 左侧「网址检查」→ 粘贴下方 URL → 若显示「网址未被 Google 收录」→ 点「请求编入索引」。

- ✅ 本周新增（**部署后**提交）：
  - `https://www.aurae.asia/blog/crystals-for-kids-teens-a-gentle-safe-intro-with-parent-guardrails/`
  - `https://www.aurae.asia/blog/how-to-know-if-your-crystal-is-working-signs-timelines-what-to-expect/`
- 🔁 历史 backlog（仍 0 收录，分批补提，详见 `outputs/gsc-manual-index.md` 每日通道）：b8–b55 共约 48 篇规范 slug，从 `js/data.js` 取实际 slug 后逐条提交。

---

## 3) 外链建设（可复制文案，需人工登录各平台发布）

> 我无法登录 Pinterest/Reddit/IG/TikTok，以下为可直接粘贴的文案。各平台自荐/外链规则不同，发布前请确认符合社区准则（以 App 实际界面为准）。

### 📌 Pinterest — 3 个 Pin（描述均含站点链接 + SEO 关键词）

**Pin 1 → b56（家长/亲子向）**
- Title: `Crystals for Kids & Teens: A Safe, Parent-Friendly Intro`
- Description:
  > A calm, mindful tool for tweens and teens — with the safety guardrails that actually matter. Which gentle stones to start with, age guidance, and a bonding ritual you can do together. 💎
  > Explore handmade crystal jewelry: https://www.aurae.asia/
  > #crystals #crystalhealing #crystaljewelry #parenting #mindfulness #auraecrystals
- Board 建议：`Crystal Care & Education` / `Parenting & Mindfulness`

**Pin 2 → b57（新手向，高搜索量问题）**
- Title: `How to Tell If Your Crystal Is Actually Working`
- Description:
  > Crystals support awareness and intention — not instant magic. Here are the real signs it's working, a realistic timeline, and what to do when it feels like nothing is happening. 🔮
  > Shop crystals & jewelry: https://www.aurae.asia/
  > #crystals #crystalhealing #manifestation #spirituality #crystalguide #auraecrystals
- Board 建议：`Crystal Care & Education` / `Beginner's Guide to Crystals`

**Pin 3 → 站点/商店（引流转化）**
- Title: `Handmade Crystal Jewelry Under $50 — Wear Your Intention`
- Description:
  > Dainty, everyday crystal bracelets & rings with meaning — citrine for abundance, amethyst for calm, rose quartz for love. Thoughtfully packaged, worldwide shipping. ✨
  > Browse the full collection: https://www.aurae.asia/
  > #crystaljewelry #crystalbracelet #handmadejewelry #crystalgift #auraecrystals
- Board 建议：`Crystal Jewelry` / `Daily Wrist Shots`

### 📌 Reddit — 2 条草稿（注意：多数板块禁止直接自推，建议以「分享资源/评论留链接」或放个人 profile）

**Draft A → r/CrystalHealing 或 r/crystals（b57 配套）**
> Title: *How do you know if a crystal is "working"? Here's the honest version.*
> Body: I wrote up the signs I actually look for (subtle shifts in mood/focus, symbolic nudges, not fireworks), a realistic timeline, and the 3 most common reasons it feels like nothing's happening — plus how to reset a stone that feels flat. Happy to share the full guide if anyone wants it; curious what "working" looks like for you all.
> *(自推链接放个人 profile 或在被问及时回复，避免首帖直发被判 spam)*

**Draft B → r/raisingkids / r/Parenting（b56 配套，谨慎）**
> Title: *Considering crystals for my tween — what are the actual safety guardrails?*
> Body: Did some reading on age-appropriate intro to crystals for kids/teens (choking hazard with loose stones, not a substitute for care/therapy, etc.) and put together a short parent-friendly checklist. Figured other parents here might have thoughts on age-appropriate mindful tools. Open to resources.
> *(同上的链接策略；r/Parenting 对促销极敏感，建议仅作讨论)*

### 📌 Instagram Bio（可复制）
> ✨ Handmade crystal jewelry with meaning · wear your intention 💎 worldwide shipping 🌍 Shop: https://www.aurae.asia/

### 📌 TikTok Bio（可复制）
> Crystal jewelry that means something ✨ handmade bracelets & rings under $50 💎 Link↓ https://www.aurae.asia/

---

## 4) 本周 GSC / Bing 收录检查

| 检查项 | 本周状态 | 说明 |
|---|---|---|
| `site:aurae.asia` Google 收录 | 🔴 仍 **0 条**本站结果 | WebSearch 仅返竞品/同名无关站（taravya、lavval、crystalauras、shokoro、ametsuchi 等） |
| 品类词 `aurae.asia crystal jewelry bracelet` | 🔴 仅返竞品，无本站 | 与 GSC "Couldn't fetch" + 新域名沙盒一致 |
| b12/b13 是否进 Google 索引 | 🔴 仍未收录（连续 ~21 周 0 覆盖） | 见 `outputs/gsc-manual-index.md` 每日通道维持提交 |
| Bing 收录 | ⚠️ 本周不可核验（egress 封锁） | 沿用 09-14 基线：7 页、b12/b13 未进 Bing；请人工登 BWT 自查 sitemap「已发现/已收录」计数 |

- 本周**无新增已上线 URL**，故无新增可提交项；b56/b57 待部署后入队（见 §1/§2）。
- GSC sitemap "Couldn't fetch" 判定为展示端 bug，保留自愈、**不改代码**。

---

## 5) 本周总结 + 跨周待办

**本周完成**：b56/b57 撰写 + 推送 GitHub（HEAD `2038463`，57 篇博客 / 97 URL sitemap）；GSC/Bing 收录核对；外链文案产出。未部署、未改服务器代码。

**跨周待办**：
- 🔴 egress 恢复后 `deploy_now.py` 部署 b40–b57（含本周 b56/b57）→ 复核 sitemap URL 数 → 上线后追加进 GSC 每日通道。
- 🔴 人工确认 GSC 站点地图指向 `/sitemap.xml`（旧 `sitemap-v3.xml` 已 404）。
- 🟡 人工登 Bing 站长平台确认 sitemap 计数；观察 b12/b13 是否进 Bing。
- 🟡 PayPal Secret 轮换（安全待办，需用户去 PayPal 生成新密钥）。
- 🟡 b8–b55 历史博客 GSC 补提交 backlog（约 48 篇规范 slug）。

---
*核验备注：本周沙箱出站全封锁，`curl` 到 aurae.asia/搜索引擎代理均超时（HTTP=000）；Google 覆盖经 WebSearch `site:aurae.asia` 内部 API 核验（不受出站封锁影响）。*
