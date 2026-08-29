# Aurae SEO 周报 — 2026-08-29（第 14 跑）

## 1. 博客发布（已 commit + push 到 GitHub `main`，待部署上线）

| ID | 标题 | Canonical URL | 分类 | 关键词 |
|----|------|--------------|------|--------|
| b38 | Crystals for Grief, Loss & Comforting the Heart | `https://www.aurae.asia/blog/crystals-for-grief-loss-comforting-the-heart/` | crystals | grief, loss, comfort, rose quartz, amethyst, healing |
| b39 | Crystals to Welcome a New Home: Placement Ideas for Every Room | `https://www.aurae.asia/blog/crystals-to-welcome-a-new-home-placement-ideas-for-every-room/` | guides | new home, house blessing, room by room, crystal decor, moving |

- Commit：`7c5de7f`（`js/data.js` 现 39 篇博客；`sitemap.xml` 79 URL / 39 篇 blog；`sitemap-v3.xml` 同步本地 65 URL）。
- 旧式 `index.html?blog=b38` / `index.html?blog=b39` 仍 301 跳转到上面的 canonical（静态化已落地，无需改服务器代码）。
- **部署后博客才对外可见，GSC 单 URL 提交才能生效**（见第 4 节部署步骤）。

## 2. GSC 单 URL 提交清单（部署后点 Request indexing）

本周新增 2 条（在 GSC → URL 检查 粘贴 →「请求编入索引」）：
1. `https://www.aurae.asia/blog/crystals-for-grief-loss-comforting-the-heart/`
2. `https://www.aurae.asia/blog/crystals-to-welcome-a-new-home-placement-ideas-for-every-room/`

历史 backlog（仍未提交，建议每日 1–2 条分批补提）：b8–b37 共 30 篇，重点先补高意图词 b10(睡眠/焦虑)、b11(脉轮)、b14(爱情/自爱)、b16(防护)、b22(事业)、b32(星座)、b36(直觉)。

## 3. 外链文案（Agent 无法登录平台，请手动发）

### Pinterest — 3 个 Pin（描述含站点链接 + SEO 词，英文）

**Pin 1 — 对应 b38（Grief/Loss）**
- Board：`Crystal Healing` / `Self Care`
- Title：*Crystals for Grief & Loss: A Gentle Way to Hold Space for the Heart*
- Description：
  > When words aren't enough, a stone can be the anchor. These crystals won't erase a loss — they hold space for it. Rose Quartz for tenderness, Amethyst for a racing 3 a.m. mind, Black Obsidian for the heaviness you can't name. 💎 Read the full guide: https://www.aurae.asia/ #crystals #griefsupport #crystalhealing #selflove #amethyst #rosequartz #mentalhealth

**Pin 2 — 对应 b39（New Home）**
- Board：`Crystals for the Home` / `Home Decor`
- Title：*Set the Energy of Your New Home, Room by Room (with Crystals)*
- Description：
  > Moving? Before the boxes are even unpacked, set the vibe of every room with a few intentional stones. Entryway = protection, bedroom = calm + love, office = focus. A beginner-friendly room-by-room guide 🏡✨ https://www.aurae.asia/ #crystals #homedecor #newhome #crystalhealing #interiordesign #manifestation

**Pin 3 —  evergreen 引流（Sleep/Focus/Anxiety）**
- Board：`Crystal Healing` / `Wellness`
- Title：*5 Crystals for Calm, Focus & Better Sleep (Beginner-Friendly)*
- Description：
  > Struggling to switch off? These beginner-friendly crystals help with anxiety, focus and sleep — Amethyst, Clear Quartz, Tiger's Eye and more. Simple, no-nonsense guide 😴⚡ https://www.aurae.asia/ #crystalsforanxiety #sleepbetter #crystalhealing #selfcare #amazonfinds

### Reddit — 2 条草稿（价值优先，链接自然植入，遵守各 sub 规则避免被删）

**Draft 1 — r/Crystals / r/CrystalCollectors（新家/空间能量）**
> Title: *I made a free room-by-room guide to placing crystals when you move into a new home — sharing the method*
> Body: 搬家用晶体定空间能量是我一直用的小仪式，整理成了一份按房间走的入门指南（玄关防护、卧室安睡、书房专注等），纯分享无付费。需要的朋友我可以贴链接 / 回复里放。欢迎补充你们对新家的石头摆放习惯。
> （在评论里自然放 `https://www.aurae.asia/` 或对应博客链接，不要首楼硬广）

**Draft 2 — r/Crystals / r/CrystalHelp（悲伤/慰藉，价值优先）**
> Title: *A gentler way to work with grief: the stones I keep on my nightstand*
> Body: 失去之后大脑停不下来，我试了用石头当「容器」——Rose Quartz 给柔软、Amethyst 压 3am 的回旋、Obsidian 装说不出的沉重。不是治愈，只是有个抓手。写了一份很私人的小指南，想看的我发链接。也想知道大家怎么用石头陪自己度过低谷。
> （同样把站点/博客链接放评论，首楼只给价值）

### Instagram Bio（放链接）
> Aurae ✦ Handmade crystal jewelry with intention 💎 Bracelets, necklaces & rings for calm, love & focus 🌙 Shop & free crystal guides 👇 https://www.aurae.asia/

### TikTok Bio（放链接）
> Aurae 💎 Crystal jewelry that means something ✨ Calm · Love · Focus · Protection 🌙 Guides & shop 👉 https://www.aurae.asia/

> 提示：若使用 Linktree / Beacons，把 `https://www.aurae.asia/` 设为首要链接；小红书/微博 bio 同理放主域。

## 4. 收录检查（本周）

- **Google**：`site:aurae.asia` → **0 条本站结果**（与 GSC sitemap「Couldn't fetch」一致，仍无新增收录）。品牌/品类词 `aurae.asia crystal jewelry` 返回的全是竞品（aurracrystal / crystaldestiny / dylansden / auratara），无本站 → 本周 Google 无新增。
- **Bing**：外部无法直接确认；请在 **Bing Webmaster Tools** 自查此前 38 URL 是否已从「Processing」转「已编入索引」，并手动提交本周 2 篇 blog URL。

## 5. 部署步骤（博客上线需用户执行，Agent 无 SSH 权限）

```bash
ssh admin@47.253.245.165
cd /opt/aurae-store/server
git pull --ff-only          # 拉取 7c5de7f
chown -R admin:admin /opt/aurae-store/server
fuser -k 3000/tcp           # 杀掉占用 3000 的旧进程（防 pm2 静默失败）
pm2 restart aurae
```
部署完成 → 博客可见 → 回第 2 节在 GSC 点「Request indexing」。

## 跨周待办
- GSC sitemap 抓取周期等待（nginx 头已修，等 GSC 抓取）；可考虑在 GSC 重新提交 `sitemap-v3.xml` 绕过缓存。
- Bing 38 URL 自查 + 本周 2 blog 提交。
- PayPal Secret 轮换仍待办。
- b8–b37 历史博客 GSC 补提交 backlog（约 30 篇）。
