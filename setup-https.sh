#!/usr/bin/env bash
# ============================================================
#  Aurae HTTPS 一键配置脚本 (Ubuntu on 阿里云轻量应用服务器)
#  前置: 域名(如 aurae.asia) 已解析到本机 IP, 且 80 端口可访问
#  用法:  curl -fsSL https://raw.githubusercontent.com/K543312739/aurae-store/main/setup-https.sh | sudo bash
# ============================================================
set -e

echo "========================================="
echo "   Aurae HTTPS 配置开始"
echo "========================================="

export DEBIAN_FRONTEND=noninteractive

DOMAIN="aurae.asia"
WWWDOMAIN="www.aurae.asia"

# 1) 安装 certbot
echo "[1/6] 安装 certbot..."
apt-get update -y
apt-get install -y certbot

# 2) 先写入临时 80 配置, 让域名访问正常, 同时支持 certbot 验证
echo "[2/6] 写入临时 nginx 配置(域名 + certbot 验证路径)..."
mkdir -p /var/www/html
cat > /etc/nginx/sites-available/aurae << 'EOF'
server {
    listen 80;
    server_name aurae.asia www.aurae.asia;
    client_max_body_size 10M;

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
nginx -t && systemctl reload nginx

# 3) 申请免费证书 (webroot 方式)
echo "[3/6] 申请 Let's Encrypt 免费证书..."
certbot certonly --webroot -w /var/www/html \
    -d aurae.asia -d www.aurae.asia \
    --non-interactive --agree-tos --register-unsafely-without-email

# 4) 应用完整 HTTPS 配置(来自仓库版本化文件, 含 gzip + 静态缓存 + 443 SSL)
echo "[4/6] 应用完整 nginx 配置(80->443 + SSL, 从 infra/nginx-aurae.conf)..."
# 单一可信源: 生产 nginx 配置集中在 infra/nginx-aurae.conf(含 gzip + 静态缓存 + 443),
# 直接复制应用, 不再内联模板, 避免与已下发的优化配置漂移。
if [ ! -f /opt/aurae-store/infra/nginx-aurae.conf ]; then
    echo "错误: 未找到 /opt/aurae-store/infra/nginx-aurae.conf, 请确认代码已克隆到 /opt/aurae-store"
    exit 1
fi
cp /opt/aurae-store/infra/nginx-aurae.conf /etc/nginx/sites-available/aurae
nginx -t && systemctl reload nginx
systemctl enable nginx

# 5) 更新 .env 的 DOMAIN
echo "[5/6] 更新 .env -> DOMAIN=https://www.aurae.asia"
cd /opt/aurae-store
sed -i "s#^DOMAIN=.*#DOMAIN=https://www.aurae.asia#" server/.env

# 6) 重启 Node 服务使 DOMAIN 生效
echo "[6/6] 重启服务 (pm2)..."
pm2 restart aurae

# 设置证书自动续期(每天检测, 到期前自动续)
( crontab -l 2>/dev/null | grep -v "certbot renew"; echo "0 3 * * * certbot renew --quiet --nginx && systemctl reload nginx" ) | crontab -

echo ""
echo "========================================="
echo "   HTTPS 配置完成 ✅"
echo "   前台首页:  https://www.aurae.asia"
echo "   管理后台:  https://www.aurae.asia/admin.html"
echo "   健康检查:  https://www.aurae.asia/api/health"
echo "========================================="
echo "提示: 证书 90 天有效, 已配置自动续期, 无需手动操作。"
