# PayPal 支付接入指南 — 从零到上线

> 本指南将手把手带你完成 PayPal 支付接入，无需任何编程知识。

---

## 第一步：登录 PayPal Developer Dashboard

1. 打开浏览器，访问：**https://developer.paypal.com**
2. 点击右上角 **"Log into Dashboard"**
3. 用你已注册的 PayPal 账号登录（企业账号或个人账号均可）

---

## 第二步：创建 REST API Application

### 2.1 进入应用管理页面

登录后，你会看到 Dashboard 页面。在左侧菜单找到：

```
Apps & Credentials
```

### 2.2 选择环境

页面顶部有两个选项卡：

| 环境 | 用途 |
|------|------|
| **Sandbox** | 测试环境，用虚拟账号测试支付流程，不扣真钱 |
| **Live** | 正式环境，真实交易扣款 |

> **先选 Sandbox 做测试，测试通过后再切换到 Live。**

### 2.3 创建新应用

1. 在 Sandbox 选项卡下，找到 **"Create App"** 按钮，点击
2. 填写应用信息：
   - **App Name**：`CrystalMuse Store`（随意命名）
   - **App Type**：选择 `Merchant`（商家）
3. 点击 **"Create App"**

### 2.4 获取凭证

创建成功后，页面会显示你的应用详情。找到以下两个关键信息：

```
Client ID:    AYxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
Secret:       EOxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

> ⚠️ **请妥善保管 Secret，不要泄露给任何人。**

---

## 第三步：配置到网站

### 3.1 打开配置文件

用文本编辑器（记事本即可）打开：

```
crystal-store/server/.env
```

### 3.2 填入凭证

将你获取到的 Client ID 和 Secret 填入对应位置：

```env
PORT=3000
DOMAIN=http://localhost:3000

# PayPal
PAYPAL_CLIENT_ID=你的Client_ID粘贴在这里
PAYPAL_CLIENT_SECRET=你的Secret粘贴在这里
PAYPAL_MODE=sandbox
```

> 注意：等号 `=` 两边不要有空格，值不要加引号。

### 3.3 重启服务器

保存文件后，在终端中重启服务器（我会帮你完成这一步）。

---

## 第四步：测试支付

### 4.1 Sandbox 测试账号

在 Sandbox 环境下，你需要用 PayPal 提供的测试买家账号来支付：

1. 回到 PayPal Developer Dashboard
2. 左侧菜单 → **Testing** → **Sandbox Accounts**
3. 你会看到一个默认的 **Personal（个人）** 测试账号
4. 记住这个账号的邮箱和密码（可以点击修改密码）

测试账号格式示例：
```
邮箱：sb-xxxxx@personal.example.com
密码：12345678
```

> 如果没有测试账号，点击 "Create Account" 创建一个 Personal 类型的账号。

### 4.2 测试流程

1. 打开网站 http://localhost:3000
2. 选择产品 → 加入购物车 → 进入结算页
3. 填写收货信息（随便填）
4. 点击 "Place Order"
5. 会弹出 PayPal 登录窗口
6. 用 Sandbox 测试买家账号登录并确认支付
7. 支付成功后自动跳转到成功页面

---

## 第五步：切换到正式环境（Live）

测试通过后，切换到真实收款模式：

### 5.1 获取 Live 凭证

1. 回到 PayPal Developer Dashboard → **Apps & Credentials**
2. 切换到 **"Live"** 选项卡
3. 如果还没有 Live 应用，点击 **"Create App"** 创建一个
4. 获取 Live 环境的 **Client ID** 和 **Secret**

### 5.2 更新配置文件

打开 `crystal-store/server/.env`，修改为：

```env
PAYPAL_CLIENT_ID=你的Live_Client_ID
PAYPAL_CLIENT_SECRET=你的Live_Secret
PAYPAL_MODE=live
```

### 5.3 重启服务器

重启后，网站将使用真实 PayPal 收款。

---

## 常见问题

### Q: PayPal 支付费率是多少？
- 国际交易：4.4% + 固定费用（约 $0.30）
- 国内交易（美国境内）：3.49% + $0.49
- 提现到中国银行账户：每次 $35 手续费（建议积累后提现）

### Q: 客户没有 PayPal 账号可以用信用卡支付吗？
可以。PayPal Checkout 支持客人信用卡支付，客户在 PayPal 支付页面选择 "Pay with Debit or Credit Card" 即可。

### Q: Sandbox 和 Live 的区别？
- Sandbox：虚拟环境，用测试账号支付，不扣真钱，用于开发调试
- Live：真实环境，真金白银，客户付的钱直接进入你的 PayPal 余额

### Q: 支付成功后钱到哪里了？
钱进入你的 PayPal 账户余额。你可以：
- 在 PayPal Dashboard 查看交易记录
- 提现到绑定的银行账户
- 使用 PayPal 余额直接支付其他费用

### Q: 如何设置 Webhook 通知？
在 PayPal Developer Dashboard → 你的 App → **Webhooks** 中添加：
```
Webhook URL: https://你的域名/api/paypal-webhook
```
（当前版本使用前端回调确认支付，Webhook 为可选增强功能）

---

## 配置检查清单

- [ ] 登录 https://developer.paypal.com
- [ ] 在 Sandbox 下创建 REST API App
- [ ] 复制 Client ID 和 Secret
- [ ] 填入 server/.env 文件
- [ ] 重启服务器
- [ ] 用 Sandbox 测试账号完成一次测试支付
- [ ] 测试通过后切换到 Live 模式
- [ ] 正式上线！

---

*如有问题，随时问我。*
