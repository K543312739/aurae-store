# 结构与 HTML 标签审计 + GSC 影响逆向分析

**审计对象（GSC 报出的 5 个 URL）**
- `https://www.aurae.asia/index.html?blog=b11`
- `https://www.aurae.asia/index.html?blog=b10`
- `https://www.aurae.asia/index.html?blog=b9`
- `https://www.aurae.asia/index.html?blog=b8`
- `https://www.aurae.asia/sitemap.xml`

**方法**：真实抓取（Googlebot UA + **不自动跟随重定向**，以暴露首跳真实响应）+ HTML 解析器（标签闭合/嵌套平衡）+ 正则关键标签统计 + XML 良构校验。脚本：`examine_pages.py`。

---

## 一、核心发现：这 4 个 `?blog=` 变体并不"发 HTML"

最关键的一点先说破：**`/index.html?blog=bX` 不会输出任何 HTML 正文**，而是统一 **301 重定向**到规范的静态博客页：

| 旧 URL | 首跳状态 | 301 目标（规范页） |
|---|---|---|
| `/index.html?blog=b11` | 301 | `/blog/chakra-healing-with-crystals-a-beginner-s-map-of-the-7-energy-centers/` |
| `/index.html?blog=b10` | 301 | `/blog/crystals-for-sleep-anxiety-calm-a-practical-nighttime-ritual/` |
| `/index.html?blog=b9`  | 301 | `/blog/crystal-pairings-the-best-stone-combinations-for-love-protection-abundance/` |
| `/index.html?blog=b8`  | 301 | `/blog/crystal-care-101-how-to-cleanse-charge-store-your-stones/` |

> 重定向来自 `server.js:203` 的 `legacyRedirectTarget` 中间件（**无 UA 判断**，对爬虫和真实浏览器一视同仁），先于 SSR 预渲染中间件执行。所以"含 blog 参数的 index.html 变体"在结构上无内容可审——它的唯一职责是把权重归集到规范页。

因此真正的"结构审计"落在三处：**① 重定向本身是否正确；② 落地规范页 + 首页的 HTML；③ sitemap.xml 格式**。

---

## 二、逐项检查结果

### 1. 重定向正确性 ✅
- 4 个变体全部 301 到**存在且可索引**的规范博客页。
- 无 UA 差异（爬虫/浏览器一致 301），不存在隐藏分叉或软 404。
- 4 个规范博客页**均已收录进 `sitemap.xml`**（已逐一验证 loc 存在）。

### 2. 规范目标页 + 首页 HTML 结构 ✅
对 `/`、`/blog/chakra-.../`、`/blog/crystal-care-101.../` 三页做完整解析：

| 检查项 | 结果 |
|---|---|
| `<html>` / `<head>` / `<body>` 完整 | 全部存在 |
| 标签闭合（未闭合/错位） | **平衡** ✅（最大嵌套深度 7） |
| 关键标签计数（title / canonical / description / charset / viewport） | 每个均 **恰好 1 个** |
| 重复关键标签 | 无 ✅ |
| 缺失关键标签 | 无 ✅ |
| head 内混入 body 级元素（div/p/a/img 等） | 无 ✅（head 内仅 script/link/meta，属正常） |
| 实测 canonical 自指向 | 正确（首页→`/`，博客页→自身 slug） |

### 3. sitemap.xml 格式 ✅
- 根元素 `<urlset>` 命名空间 `http://www.sitemaps.org/schemas/sitemap/0.9` 正确。
- 共 **65 个 `<url>`**（规范上限 50000），全部 `https://`，**无重复 `<loc>`**。
- `lastmod` 格式全部合法（`YYYY-MM-DD`）；根下无非 `<url>` 杂元素。
- `Content-Type: text/xml; charset=utf-8`，无缓存污染头。

---

## 三、是否存在 bug / 错误？—— 结论：**无**

- HTML 结构：**无 bug**（闭合规范、嵌套正确、关键标签齐全且不重复不缺失）。
- sitemap 格式：**合规**。
- 全过程**未**发现：标签未闭合、head/body 嵌套错位、重复或缺失的关键标签、XML 格式错误。

> 说明：首轮脚本因 `urllib` 默认跟随 3xx 重定向，曾误把"最终落地的 200 博客页"当成变体自身响应；已改用不跟随重定向的处理器（NoRedirect Handler）复测，结论不变且更精确。

---

## 四、GSC 报错逆向分析：结构/标签问题 ≠ 抓取失败原因

GSC 对上述 5 个 URL 报 **"Crawled - currently not indexed"**。结合实测，真实成因与"HTML 结构/标签"**无关**：

1. **4 个 `/index.html?blog=bX`**：它们是**旧 URL 形式**，现已 301→规范页。GSC 的 "not indexed" 是**部署重定向（2026-08-20）之前的旧抓取残留（stale）**——已确认 Googlebot 近 2 天对该站 **0 次重抓**（谷歌抓取冷却节奏），状态尚未刷新。一旦重抓见到 301，变体会自动从索引报告中移除。
2. **`/sitemap.xml`**：sitemap 本身**不是网页**，不应被编入搜索索引。它在 GSC「网页索引」报告里显示 "Crawled - currently not indexed" 是**完全正常、预期内**的现象，**不影响** sitemap 被读取与处理。

### 关键澄清：sitemap.xml 的抓取与这些页面完全独立
Google 通过 `robots.txt` 的 `Sitemap:` 指令或 GSC 手动提交**直接抓取 `https://www.aurae.asia/sitemap.xml`**，与 `/index.html?blog=bX` 的 HTML 结构毫无关联。因此"这些页面的结构/标签问题影响谷歌对 sitemap.xml 的抓取与收录"这一假设**不成立**——何况这些页面本身并不存在结构问题。

---

## 五、潜在影响范围

- **实际影响：无 SEO 损失。**
- 即便 Google 暂时把 4 个旧 `?blog=` 变体标为 not indexed，它们 301 到规范页，而规范页已在 `sitemap.xml` 中（已验证），会被正常索引。
- `sitemap.xml` 自身被正常抓取处理，65 个 URL 均可被发现。
- 不存在"重复内容 / 错误 canonical / 软 404"等会引发降权或抓取浪费的风险。

---

## 六、建议（非必须，纯加速项）

1. **无需任何代码改动**——结构、标签、sitemap 格式均已验证健康。
2. 加速刷新：在 GSC 对 4 个规范博客页点「请求编入索引」；或重新提交 `sitemap.xml`。
3. 重抓后，旧的 `/index.html?blog=bX` 变体会从索引报告中消失，验证 pending 自动解除。

---

*附：可复用审计脚本 `examine_pages.py`（拉取首跳响应、HTML 结构平衡/关键标签校验、sitemap XML 校验）。*
