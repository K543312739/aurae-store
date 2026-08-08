# Aurae 水晶电商 — 生产部署指南

本应用是 **Node (Express) 后端 + 静态前端** 的全栈站点。所有业务功能（下单、优惠码、库存、留言、评价、物流追踪、管理员后台）都依赖后端运行，**必须部署在能运行 Node 的主机上**。纯静态托管只能展示页面，下单/留言等接口会失效。

---

## 一、上线前必须准备好的东西

| 项目 | 说明 |
|---|---|
| 域名 | 如 `aurae.shop`，并把 DNS A 记录指向你的服务器 IP |
| Node 主机 | 任意能跑 Node 18+ 的环境（VPS / Render / Railway / Fly.io / 阿里云轻量等） |
| HTTPS 证书 | Let's Encrypt 免费证书（Stripe / PayPal 强制要求 https） |
| Stripe 密钥 | `STRIPE_SECRET_KEY`（正式用 `sk_live_...`）+ Webhook 签名密钥 |
| PayPal | 切换到 `live` 模式，填 `PAYPAL_CLIENT_ID` / `PAYPAL_CLIENT_SECRET`（live 凭据） |
| 邮件 SMTP | `EMAIL_HOST/PORT/USER/PASS/FROM`（如 Mailgun / SendGrid / 阿里云邮件推送） |
| 管理员密码 | 把 `.env` 里的 `ADMIN_PASSWORD` 改成强密码 |

---

## 二、`.env` 上线模板（复制 `.env.example` 为 `.env` 后填写）

```ini
PORT=3000
DOMAIN=https://your-domain.com

# 管理员后台密码（务必修改！）
ADMIN_PASSWORD=换成你的强密码

# Stripe（正式环境用 sk_live_ 开头）
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=

# PayPal：live 为正式，sandbox 为测试
PAYPAL_CLIENT_ID=
PAYPAL_CLIENT_SECRET=
PAYPAL_MODE=live

# 邮件（未配置时走控制台日志，便于本地排错）
EMAIL_HOST=
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=
EMAIL_PASS=
EMAIL_FROM=no-reply@your-domain.com
```

---

## 三、方式 A：自己的 VPS（Ubuntu 示例，最稳）

```bash
# 1. 上传整个 crystal-store 目录到服务器（rsync / scp / git clone）
# 2. 安装 Node 18+（nvm 或 apt）
# 3. 安装依赖并启动
cd crystal-store
npm install --production
cp .env.example .env   # 然后编辑填写上面的密钥
npm install -g pm2
pm2 start server/server.js --name aurae
pm2 save && pm2 startup

# 4. 用 Nginx 反代 + HTTPS（Certbot）
# Nginx 站点配置核心：
#   location / {
#     proxy_pass http://127.0.0.1:3000;
#     proxy_set_header Host $host;
#     proxy_set_header X-Real-IP $remote_addr;
#   }
# 然后：sudo certbot --nginx -d your-domain.com
```

---

## 四、方式 B：Render.com（免费/低价，最省事）

1. 把 `crystal-store` 推到 GitHub 仓库。
2. 在 Render 新建 **Web Service**，关联仓库。
3. 设置：
   - Build Command: `npm install`
   - Start Command: `node server/server.js`
   - 在 **Environment** 里粘贴上面 `.env` 的全部变量。
4. Render 会分配 `https://aurae.onrender.com`，绑定自定义域名即可。
5. Stripe / PayPal 后台把 Webhook 指向 `https://your-domain.com/api/stripe-webhook` 与对应 PayPal 事件回调。

---

## 五、方式 C：Railway / Fly.io

同样上传仓库，平台会自动读取 `package.json` 的 `start` 脚本（`node server/server.js`），在环境变量面板填入 `.env` 内容，平台提供默认 https 域名，可绑定自定义域名。

---

## 六、Webhook 配置（收真实货款 + 真实物流进度）

- **Stripe**：后台 → Developers → Webhooks → 添加端点 `https://your-domain.com/api/stripe-webhook`，订阅 `checkout.session.completed`；把 Signing Secret 填到 `STRIPE_WEBHOOK_SECRET`。
- **PayPal**：在 PayPal 后台配置 IPN / Webhook 指向后端捕获接口（代码中 `/api/paypal/capture` 已完成）。
- Webhook 触发后后端会：扣库存 → 发确认邮件 → 标记订单 `paid`。管理员在 `/admin.html` 把订单推进到 `shipped` 并填快递单号，客户在 `/track.html` 即可看到真实物流。

---

## 七、上线后自检清单

- [ ] 访问 `https://your-domain.com` 首页正常
- [ ] 加购 → 用 `CRYSTAL10` 优惠码 → 运费/折扣计算正确
- [ ] 用 PayPal sandbox / Stripe test 卡走通一次下单（验证 Webhook 扣库存+邮件）
- [ ] `/admin.html` 登录，能看到订单/库存/优惠券，推进发货并填单号
- [ ] `/track.html` 用订单号+邮箱查到真实物流时间轴
- [ ] 联系留言提交后，后台能看并回复，客户收到回复邮件

> 本地未配置 Stripe / SMTP 时，相关功能会降级（Stripe 不可用、邮件打印到控制台日志），不影响其他功能联调。
