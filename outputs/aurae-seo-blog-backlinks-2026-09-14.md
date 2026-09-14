# Aurae SEO 周报 — 2026-09-14（博客 + 外链建设）

> 自动化任务：「每周博客与外链建设」第 19 跑。本周新增 2 篇博客（已 commit+push 到 GitHub `main`，commit `faa09d3`），未改服务器代码（遵守指令）。

## 1. 本周新增博客（已入库，待部署上线）

| ID | 标题 | Canonical URL | 话题 | 字数 |
|----|------|---------------|------|------|
| b48 | Crystals for Anger, Irritability and Finding Patience | https://www.aurae.asia/blog/crystals-for-anger-irritability-and-finding-patience/ | crystals（情绪/耐心，高意图 + Pinterest 友好） | ~9 min |
| b49 | Crystals for New Beginnings, Fresh Starts and Big Transitions | https://www.aurae.asia/blog/crystals-for-new-beginnings-fresh-starts-and-big-transitions/ | guides（人生转折/新起点，常青话题） | ~10 min |

- 已写入 `js/data.js` BLOG_POSTS（现 49 篇）+ 同步静态 `sitemap.xml`（现 **89 总 URL / 49 篇 blog**）。
- 校验全部通过：`node --check` 通过；slug（`slugify()`）与 sitemap 逐字节一致；XML 可解析。
- 两篇均含站内互链（应力/睡眠/情绪/防护/显化/幸运/ abundance/旅行/沟通 等既有博客）+ 商品页链接（Rose Quartz、Amethyst、Aquamarine、Moonstone、Clear Quartz、Citrine、Tiger's Eye 等真实 slug）。

## 2. GSC「Request indexing」提交清单（本周 2 篇）

> ⚠️ 重要：URL 静态化已于 2026-08-19 上线，旧式 `index.html?blog=bXX` 已 301 跳转到下方 canonical `/blog/<slug>/`。请在 GSC **URL 检查**里提交 canonical 地址（提交旧 query URL 会 301，无效）。
> ⚠️ 前置条件：博客已 commit 但**尚未部署**到服务器（本次无 SSH + 指令「简单汇报、不改服务器代码」），live `data.js` 仍停留在约 b43。提交索引前请先部署（见第 5 节），否则 GSC 取到的是 SPA 兜底页、提交无效。

本周提交（2 条）：
1. https://www.aurae.asia/blog/crystals-for-anger-irritability-and-finding-patience/
2. https://www.aurae.asia/blog/crystals-for-new-beginnings-fresh-starts-and-big-transitions/

历史 backlog（仍未提交，建议分批补提，约 40 篇：b8–b47）：
- 在 GSC「URL 检查」逐条粘贴 → 「请求编入索引」。每天手动 1–2 条，避免被限流。
- 也可在 GSC 提交 `sitemap-v3.xml`（绕过 sitemap 缓存）一次性覆盖全部规范 URL。

## 3. 外链建设文案（需用户手动发布 — Agent 无法登录这些平台）

### 3.1 Pinterest — 3 个 Pin（描述里放 https://www.aurae.asia/）

**Pin 1 — 情绪/耐心（对应 b48）**
- Title: Crystals for When You're Spiraling: 9 Stones to Cool the Heat
- Description: Short fuse? These calming crystals (amethyst, blue quartz, rose quartz) help you pause before you react. Free guide + shop: https://www.aurae.asia/  #crystalhealing #crystals #selfcare #anger #mindfulness
- Board: Daily Wrist Shots / Crystal Care & Rituals
- Image: 用 Rose Quartz 或 Amethyst 手链实拍图

**Pin 2 — 新起点（对应 b49）**
- Title: Starting Over? The Crystals to Carry Into a Fresh Chapter
- Description: New job, move, or blank page? Carry one grounding stone + one opening stone to walk in steadier. Full guide: https://www.aurae.asia/  #newbeginnings #crystals #manifestation #crystaljewelry
- Board: Submariner & Diver Style / Crystal Care & Rituals（按你 board 体系放）
- Image: Clear Quartz + Moonstone 叠戴图

**Pin 3 — 电商引流（通用）**
- Title: Everyday Crystal Jewelry That Actually Means Something ($20–50)
- Description: Handmade bracelets & necklaces mapped to intention — love, focus, protection, calm. Shop + free crystal guides: https://www.aurae.asia/  #crystaljewelry #jewelryaddict #gifting #crystals
- Board: Daily Wrist Shots
- Image: 多款手链拼图

### 3.2 Reddit — 2 条草稿（价值优先，软性带链接）

**Draft 1 — r/Crystals（对应 b49）**
> Title: I made a free guide on which crystals to carry for big life transitions (new job, move, breakup)
> Body: Sharing a no-fluff writeup I put together — one stone to stay grounded, one to stay open, plus a simple "threshold ritual" to mark the start. Feedback welcome. [link: https://www.aurae.asia/blog/crystals-for-new-beginnings-fresh-starts-and-big-transitions/]
> 注意：先参与社区、正文价值为主，链接放评论，避免硬广被删。

**Draft 2 — r/selfimprovement 或 r/Anger（对应 b48）**
> Title: Crystals that helped me lengthen the pause between trigger and reaction
> Body: Not a cure, but a few stones (amethyst, blue quartz) became a physical anchor for a 2-minute "patience reset" when I feel the heat rise. Writeup here if useful: [link: https://www.aurae.asia/blog/crystals-for-anger-irritability-and-finding-patience/]

### 3.3 Instagram / TikTok Bio（放站点链接）

- **Instagram bio**: Handmade crystal jewelry & free guides on what each stone actually does ✦ Shop + learn 👇
  link: https://www.aurae.asia/
- **TikTok bio**: Crystal jewelry that means something • everyday wear $20–50 • guides & care 🔗
  link: https://www.aurae.asia/

## 4. 本周 GSC / Bing 收录检查

- **Google**：`site:aurae.asia` 仍 **0 条本站结果**（仅返回 WHOIS + 同名无关站 ASUS Armoury Crate / Aurean Islands / WorldAnvil Aurae）；`aurae.asia crystal jewelry bracelet` 仅返竞品（aurracrystal / auracrystalau / luxnarajewelry / taravya）。**本周 Google 无新增收录**，与 GSC「Couldn't fetch」/ 新域抓取周期一致。
- **Bing**：外部无法直接确认（WebSearch 不区分引擎且同样未返本站）。请在 **Bing Webmaster Tools** 自查此前 38 URL(Processing) 是否转「已编入索引」，并手动提交本周 2 篇 blog canonical URL。
- 结论：收录瓶颈不在内容量（已 49 篇 blog / 89 URL），而在 GSC sitemap 抓取未自愈 + 新域信任期。继续靠「GSC 单 URL 提交 + 外链」双线推进。

## 5. 部署步骤（用户手动，部署后博客才上线、GSC 提交方生效）

```bash
# 服务器（阿里云，需用户 SSH；Agent 无权限）
cd /opt/aurae-store && git pull --ff-only
chown -R admin:admin /opt/aurae-store
fuser -k 3000/tcp        # 杀掉占用 3000 的旧 root 进程，避免 pm2 restart 静默失败
pm2 restart aurae
```
部署后：① 验证 `/js/data.js` 含 b49；② 到 GSC 提交第 2 节 2 条 canonical URL；③ Bing WBT 同步提交。

## 6. 跨周待办
- 部署 b44–b49（6 篇已 commit 未上线）；
- GSC sitemap「Couldn't fetch」根因等待自愈（建议提 `sitemap-v3.xml` 绕过缓存）；
- Bing 38 URL 自查 + 本周 2 blog 提交；
- PayPal Secret 轮换（安全待办，未关）；
- b8–b47 历史博客 GSC 单 URL 补提交 backlog（约 40 篇）。
