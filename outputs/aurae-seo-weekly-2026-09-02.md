# Aurae 站点收录周检 — 2026-09-02 (周三)

## 1. GSC 站点地图状态
- 服务器端 `/sitemap.xml`：**200 OK / 79 URL** / 响应头干净（no-cache、无 `x-powered-by`、`Content-Type: application/xml`）/ 含 b12/b13 规范 slug：
  - `https://www.aurae.asia/blog/crystals-for-manifestation-a-practical-step-by-step-guide/`
  - `https://www.aurae.asia/blog/the-best-crystals-for-protection-grounding-and-how-to-use-them-daily/`
- GSC 后台 "Couldn't fetch" 仍为**展示端 bug（约第 15 周）** → 保留等待自愈，**本周未改任何代码**。
- 🔴 持续待办：人工登 GSC 确认站点地图指向 `/sitemap.xml`（勿指向已失效的旧 URL），以免展示 bug 掩盖真实故障。

## 2. Google 索引状态
- `site:aurae.asia`：仍 **0 条真实页**（仅 WHOIS + 无关 Aurae 品牌站）。
- b12 / b13 精确标题检索：均只返回竞品 / 其他水晶站，**b12/b13 仍未收录（连续约 15 周）**。
- 根因持续：新域名沙盒（注册于 2026-08-08，现约 25 天）+ SPA 抓取 / 渲染摩擦。
- 🔴 根治建议：排期 SSR / 预渲染（连续 15 周 Google 0 收录，手动提交无效）。

## 3. Bing 收录状态
- 核验方式：DuckDuckGo 代理本周起触发 CAPTCHA 拦截，改用 **Yahoo（同走 Bing 索引）** 核验。
- `site:aurae.asia` via Yahoo：**稳定 4 个真实页**（首页 + contact.html + faq.html + privacy-policy.html），与 2026-08-31 完全一致、无回退无新增。
- b12/b13 仍未进 Bing 博客页。
- 注：直接 Bing WebFetch 查询会返回无关站点的「零结果兜底页」，并非真实去索引信号；Yahoo 代理结论更可靠。

## 4. 新增 URL 与手动索引通道
- 本周 sitemap **无新增 URL**（79 = 79，本周无新博客部署）→ **无新待提交项**。
- 每日手动索引通道维持现有优先级队列：**b12/b13 → 首页 → /shop/ → 其余博客**。

## 结论
- GSC sitemap 健康、无需改动；"Couldn't fetch" 继续等待自愈。
- Google 全站 0 收录、b12/b13 缺失（约 15 周），Bing 稳定 4 页但博客页未进 → 收录瓶颈在抓取 / 渲染侧，建议排期 SSR / prerender 根治。
