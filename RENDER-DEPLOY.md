# 一键上线：Render 免费层（只需一个邮箱，免信用卡）

本文件让你用**一个免费邮箱账号**把 Aurae 永久部署到公网，全部功能可用。
（当前临时演示地址 https://aurae-store.loca.lt 仅在本会话存活，关掉就失效；Render 才是永久方案。）

## 你需要做的（全程免费，约 10 分钟）

### 1. 把代码推到 GitHub
- 注册 GitHub（免费）：https://github.com
- 新建一个**私有**仓库，比如 `aurae-store`
- 在本机（或让助手帮你）把 `crystal-store` 整个文件夹推送上去

### 2. 注册 Render（免费，只需邮箱，不要信用卡）
- 打开 https://render.com → Sign Up → 用 GitHub 登录
- 右上角 **New + → Web Service** → 关联刚才的 GitHub 仓库

### 3. 填服务配置（照抄）
| 项目 | 值 |
|---|---|
| Name | aurae-store |
| Runtime | Node |
| Build Command | `npm install` |
| Start Command | `node server/server.js` |
| Instance Type | **Free** |
| Health Check Path | `/api/health` |

### 4. 在 Render 的 Environment（环境变量）里粘贴下面这一整块
（把括号里的值换成你自己的；不会的先照抄，站点也能跑，只是支付/邮件先不可用）

```ini
PORT=3000
DOMAIN=https://你的render域名.onrender.com
ADMIN_PASSWORD=改成你的强密码
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
PAYPAL_CLIENT_ID=
PAYPAL_CLIENT_SECRET=
PAYPAL_MODE=sandbox
EMAIL_HOST=
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=
EMAIL_PASS=
EMAIL_FROM=no-reply@你的域名
```

### 5. 点 Create Web Service
Render 会自动 `npm install` 并启动。约 1–2 分钟后，访问它给你的 `https://aurae-store.onrender.com` 即可。

## 之后让"收钱/发邮件"真正可用（各自免费注册）
- **域名（可选，想用自己的品牌域名如 aurae.shop）**：去 Namecheap / Cloudflare / 阿里云买，DNS 指向 Render 给你的地址，在 Render 里绑定自定义域名即可（自动 HTTPS）。
- **Stripe 收真实货款**：https://stripe.com 注册商家号 → 拿到 `sk_live_...` 填到 `STRIPE_SECRET_KEY`；后台配 Webhook 指向 `https://你的域名/api/stripe-webhook`，把签名密钥填到 `STRIPE_WEBHOOK_SECRET`。
- **PayPal 收真实货款**：后台切到 live，填 live 的 `PAYPAL_CLIENT_ID/SECRET`，`PAYPAL_MODE=live`。
- **邮件（订单/发货/回复通知）**：用 Mailgun / SendGrid / 阿里云邮件推送，拿到 SMTP 填 `EMAIL_*`。不填也能跑，只是邮件走控制台日志。

> 不填 Stripe/PayPal/SMTP 时，站点照常浏览、加购、用优惠码、留言、评价、物流追踪、管理员后台都可用；只是"真实扣款"和"自动邮件"要等你在对应平台注册好填进去。
