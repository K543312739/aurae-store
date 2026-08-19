#!/usr/bin/env bash
# ============================================================
#  Aurae 一键部署脚本 (Ubuntu 22.04 / 24.04  on 阿里云轻量应用服务器)
#  用法:  curl -fsSL https://raw.githubusercontent.com/K543312739/aurae-store/main/deploy.sh | bash
# ============================================================
set -e

echo "========================================="
echo "   Aurae 一键部署开始"
echo "========================================="

export DEBIAN_FRONTEND=noninteractive

# 1) 系统更新
echo "[1/9] 更新系统..."
apt-get update -y
apt-get upgrade -y || true

# 2) 安装基础工具
echo "[2/9] 安装 git / nginx / curl..."
apt-get install -y git nginx curl ca-certificates gnupg

# 3) 安装 Node.js 20
echo "[3/9] 安装 Node.js 20..."
if ! command -v node >/dev/null 2>&1; then
  curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
  apt-get install -y nodejs
fi
node -v
npm -v

# 4) 安装 pm2 进程守护
echo "[4/9] 安装 pm2..."
npm install -g pm2

# 5) 克隆代码
echo "[5/9] 克隆仓库..."
cd /opt
rm -rf aurae-store
git clone https://github.com/K543312739/aurae-store.git
cd aurae-store

# 6) 安装依赖
echo "[6/9] 安装 npm 依赖..."
npm install --omit=dev

# 7) 生成 .env（含随机强管理员密码）
echo "[7/9] 生成 .env..."
ADMIN_PW=$(openssl rand -base64 18 | tr -dc 'A-Za-z0-9' | head -c 16)
cat > server/.env << 'EOF'
PORT=3000
# 上线后改成你的真实域名（如 https://www.aurae.shop）
DOMAIN=http://47.253.245.165

# Stripe（留空则 Stripe 支付不可用，可用 PayPal 沙箱先测试）
STRIPE_SECRET_KEY=
STRIPE_PUBLISHABLE_KEY=
STRIPE_WEBHOOK_SECRET=

# PayPal 沙箱（测试用，不会扣真实钱）
PAYPAL_CLIENT_ID=AdzDir2h0Kh89yhbS-O7xMUixyiQahX6XQdCoZTMcv3ijEnwkCJ0JzzEOjLCdaRA7OGGNL4kr_Hz_J0_
PAYPAL_CLIENT_SECRET=EAt9hwSaRwfSJKCK96xhBWdhWYdImB-qUsblhH0HpwW5lxgM6wEiJSMnajPVu2Ju3XTzwivoG0zA7QuM
PAYPAL_MODE=sandbox

# 管理员登录密码（已自动随机生成，见部署结束提示）
ADMIN_PASSWORD=__ADMIN_PW__

# 邮件 SMTP（留空则运行在开发模式，邮件只打印到服务器日志）
EMAIL_HOST=
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=
EMAIL_PASS=
EMAIL_FROM=no-reply@aurae.shop
EOF
sed -i "s/__ADMIN_PW__/$ADMIN_PW/" server/.env

# 8) 配置 nginx 反向代理(80 引导; 完整 HTTPS + gzip + 静态缓存由 setup-https.sh 从 infra/nginx-aurae.conf 应用)
echo "[8/9] 配置 nginx 反向代理(80 引导 + gzip)..."
# 说明: 完整生产配置(含 gzip + 静态缓存 + 443 SSL)集中在仓库 infra/nginx-aurae.conf,
#       证书签发后由 setup-https.sh 复制应用, 避免脚本内联模板漂移导致优化配置丢失。
cat > /etc/nginx/sites-available/aurae << 'EOF'
server {
    listen 80;
    server_name aurae.asia www.aurae.asia;

    client_max_body_size 10M;

    # gzip 压缩(80 引导阶段也开启, 减少初始传输)
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_proxied any;
    gzip_comp_level 6;
    gzip_types text/plain text/css application/javascript application/json application/xml image/svg+xml image/x-icon;

    # Let's Encrypt 验证用
    location /.well-known/acme-challenge/ {
        root /var/www/html;
    }

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
EOF
ln -sf /etc/nginx/sites-available/aurae /etc/nginx/sites-enabled/aurae
rm -f /etc/nginx/sites-enabled/default
nginx -t
systemctl restart nginx
systemctl enable nginx

# 9) 用 pm2 启动并设为开机自启
echo "[9/9] 启动服务 (pm2)..."
cd /opt/aurae-store
pm2 delete aurae 2>/dev/null || true
pm2 start server/server.js --name aurae
pm2 save
pm2 startup | tail -n 3 || true

echo ""
echo "========================================="
echo "   部署完成 ✅"
echo "   前台首页:  http://47.253.245.165"
echo "   管理后台:  http://47.253.245.165/admin.html"
echo "   管理员密码: $ADMIN_PW"
echo "   健康检查:  http://47.253.245.165/api/health"
echo "========================================="
echo "提示: 若无法访问，请到阿里云控制台确认防火墙已放行 80 端口。"
