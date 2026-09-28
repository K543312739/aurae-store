# Aurae 站点收录周检报告 — 2026-09-29 (周二)

> 自动化任务：GSC/Bing 收录周检（RRULE: 每周三，本次因排程提前至周二补跑）
> 执行方式：本地仓库核对 + 内部 WebSearch API（沙箱出站 egress 持续封锁，curl 到 aurae.asia / google / duckduckgo 均 TLS 超时）

## 结论速览
| 检查项 | 本周状态 | 变化 |
|---|---|---|
| 1. GSC 站点地图 `Couldn't fetch` | 仍为展示端 bug（约第 25–26 周） | 持平，保留自愈、未改代码 |
| 2. b12/b13 是否进 Google 索引 | **仍未收录**（`site:aurae.asia` 返回 0 条本站页） | 连续约 21 周 0 收录，持平 |
| 3. Bing 站长平台 sitemap 发现/收录 | **本周不可核验**（egress 封锁，DuckDuckGo 代理不可用） | 沿用 09-14 末次核验：7 页、b12/b13 未进 Bing |
| 新增可提交 URL | **无**（服务器自 08-29 起冻结，无新部署） | 本地博客漂移继续累积至 b53（~14 篇未上线） |

## 1) GSC 站点地图 `Couldn't fetch`
- 沙箱出站网络持续封锁（`curl https://www.aurae.asia/sitemap.xml` 12s 超时，`http=000`），**无法做服务器端 URL 数复核**。
- 沿用最近一次成功复核（08-29 部署后）：`/sitemap.xml` 200 OK / 79 URL / 干净头 / 含 b12/b13 规范 slug。
- GSC 后台「Couldn't fetch」判定为**展示端 bug**（持续约第 25–26 周），本自动化不改代码，保留等待自愈。
- 🔴 持续待办（需人工）：登 GSC 确认站点地图指向 `/sitemap.xml`（旧的 `sitemap-v3.xml` 已服务器硬 404）。若仍指向旧 URL 则是真失败而非纯展示 bug。

## 2) Google 索引 — b12/b13 及全站
- 通过内部 WebSearch API 查询 `site:aurae.asia`：**返回 0 条 aurae.asia 页面**，仅混入无关的 "Aurelia Asia"（aurelia-asia.com）、"Aurea condos"（aureacondos.com）、ASUS Armoury Crate 等噪声结果。
- 判定：全站 `site:aurae.asia` 仍 **0 真实页**；b12/b13 规范 URL 定向检索无 aurae 结果 → **b12/b13 仍未收录**（连续约 21 周）。
- 根因（已多次排查排除站点侧）：新域名沙盒（注册 2026-08-08）+ SPA 抓取/渲染摩擦。站点自身 robots/index/follow、200、bot SSR 均正常 → 问题在 Google 抓取/渲染侧。
- 根治建议（连续 21 周 0 收录）：排期 SSR / 预渲染（prerender）。

## 3) Bing 站长平台
- **本周不可核验**：egress 封锁使 DuckDuckGo HTML（Bing 索引代理）同样 TLS 超时，无法读取 Bing 公开收录页。
- 沿用最近一次成功核验（09-14，经 DuckDuckGo 代理）：稳定 **7 页**（首页 + /shop/ + contact.html + faq.html + shipping-returns.html + products/citrine-merchant-s-ring/ + privacy-policy.html）；b12/b13 未进 Bing 博客页。
- sitemap 已被 Bing 发现并持续处理（页数从早期 3–4 页逐步增至 7 页），但博客 slug 页尚未进入。
- 🔴 待人工：登录 Bing 站长平台确认 sitemap「已发现/已收录」计数。

## 部署漂移（关键）— 本地新增博客全部未上线
- 最近一次成功部署 + 复核为 **08-29**（79 URL / 39 博客）。自 09-03 起每周自动化在本地新增博客，**但 egress 封锁使 `deploy_now.py` 从未跑成** → 服务器侧仍冻结在 08-29 状态。
- 本地仓库现状（HEAD = origin/main = `78fd171`，工作树干净）：sitemap.xml 列 **53 篇博客 / 93 条 URL**；其中 **b40–b53 共约 14 篇仅存于本地、从未部署上线**。
- 含义：这些 URL 不是「待提交索引的新 URL」，而是「未上线 URL」——若直接走每日手动通道会被 Google 判 404，反而伤害抓取信誉。**不得提交未上线 URL。**
- 🔴 动作：egress 恢复后立即 `deploy_now.py` 把 b40–b53 推上线（再 `apply_nginx.py` 若有 nginx 变更），部署后复核 `/sitemap.xml` 实际 URL 数（预期 ≈93）。上线后再把 b40–b53 追加进每日手动索引队列。

## 每日手动索引通道（本周维持）
- 优先级不变：**b12/b13 → 首页 → /shop/ → 其余已上线页**。
- 本周**无新增待提交项**（服务器无变更、无新部署）。
- b12/b13 已上线（08-29 即部署，规范 URL 200 + 正确 canonical），持续每日 1–2 个提交等待 Google 抓取队列消化；仍 0 收录属 Google 侧沙盒，非提交失效。

## 历史趋势（Google 收录）
- 连续约 21 周（自 2026-05 初起）`site:aurae.asia` 0 真实索引页。
- b12/b13 自首次提交起连续约 21 周未收录。
- Bing 公开收录自 08-21 起从 0 爬升，末次核验（09-14）达 7 页，博客 slug 页仍未进。

## 后续排期
1. 🔴 egress 恢复 → 立即部署 b40–b53（消除累积漂移），部署后复核 sitemap 实际 URL 数。
2. 🔴 人工确认 GSC 站点地图指向 `/sitemap.xml`、Bing 站长平台 sitemap 计数。
3. 🟡 根治：排期 SSR / prerender，打破连续 21 周 Google 0 收录。
4. 🟡 每日手动通道维持 b12/b13 → 首页 → /shop/，egress 恢复部署后追加 b40–b53。
