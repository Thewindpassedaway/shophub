#!/bin/bash
# ========================================
# ShopHub 服务器端部署脚本
# 在服务器上自动执行
# ========================================

echo "🚀 开始部署 ShopHub..."
echo ""

# 检查是否以root权限运行
if [ "$EUID" -ne 0 ]; then 
  echo "❌ 请使用 sudo 运行此脚本"
  echo "   使用方法: sudo bash deploy-to-server.sh"
  exit 1
fi

echo "📦 步骤 1/7: 更新系统..."
yum update -y
echo "✅ 系统更新完成"
echo ""

echo "📦 步骤 2/7: 安装 Node.js..."
curl -fsSL https://rpm.nodesource.com/setup_18.x | bash -
yum install -y nodejs
echo "✅ Node.js 版本: $(node -v)"
echo ""

echo "📦 步骤 3/7: 安装 PM2..."
npm install -g pm2
echo "✅ PM2 安装完成"
echo ""

echo "📦 步骤 4/7: 安装 MySQL..."
yum install -y mysql-server
systemctl start mysqld
systemctl enable mysqld
echo "✅ MySQL 安装完成并启动"
echo ""

echo "🔐 步骤 5/7: 配置 MySQL..."
echo ""
echo "请设置 MySQL root 密码:"
read -s -p "输入新密码: " MYSQL_PASSWORD
echo ""
read -s -p "确认密码: " MYSQL_PASSWORD_CONFIRM
echo ""

if [ "$MYSQL_PASSWORD" != "$MYSQL_PASSWORD_CONFIRM" ]; then
  echo "❌ 两次密码不一致,请重新运行脚本"
  exit 1
fi

# 设置MySQL密码
mysql -e "ALTER USER 'root'@'localhost' IDENTIFIED WITH mysql_native_password BY '$MYSQL_PASSWORD';"
mysql -e "FLUSH PRIVILEGES;"

echo "✅ MySQL 密码已设置"
echo ""

# 创建数据库
echo "📊 创建数据库..."
mysql -u root -p"$MYSQL_PASSWORD" -e "CREATE DATABASE IF NOT EXISTS shophub DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
echo "✅ 数据库创建完成"
echo ""

echo "📦 步骤 6/7: 克隆项目代码..."

# 进入用户目录
cd /home/opc || {
  echo "❌ 无法进入/home/opc目录"
  exit 1
}

# 提示输入Gitee仓库地址
read -p "请输入你的Gitee仓库地址: " GITEE_URL

# 如果项目目录已存在,先删除
if [ -d "merchant-collection" ]; then
  echo "⚠️ 检测到旧的项目文件,正在清理..."
  rm -rf merchant-collection
fi

# 克隆项目
echo "📥 正在从Gitee克隆项目..."
git clone "$GITEE_URL" merchant-collection

if [ $? -ne 0 ]; then
  echo "❌ 克隆失败!请检查仓库地址是否正确"
  exit 1
fi

cd merchant-collection || {
  echo "❌ 无法进入项目目录"
  exit 1
}

echo "✅ 项目克隆完成"
echo ""

echo "📦 步骤 7/7: 安装依赖并配置..."

# 安装Node.js依赖
echo "📦 安装 Node.js 依赖..."
npm install --production
echo "✅ 依赖安装完成"
echo ""

# 创建 .env 文件
echo "⚙️  配置应用..."
cat > backend/.env << EOF
MYSQL_HOST=localhost
MYSQL_PORT=3306
MYSQL_USER=root
MYSQL_PASSWORD=$MYSQL_PASSWORD
MYSQL_DATABASE=shophub
PORT=3000
EOF
echo "✅ 配置文件创建完成"
echo ""

# 运行数据库迁移脚本
echo "🗄️  执行数据库迁移..."
cd backend/scripts

# 检查是否有createShopChecksTable.js脚本
if [ -f "createShopChecksTable.js" ]; then
  node createShopChecksTable.js
  echo "✅ 数据表创建完成"
else
  echo "⚠️  未找到createShopChecksTable.js,跳过"
fi

# 检查是否有addIsDeletedColumn.js脚本
if [ -f "addIsDeletedColumn.js" ]; then
  node addIsDeletedColumn.js
  echo "✅ 字段更新完成"
else
  echo "⚠️  未找到addIsDeletedColumn.js,跳过"
fi

cd ../..
echo ""

# 配置防火墙
echo "🔥 配置防火墙..."
firewall-cmd --permanent --add-port=3000/tcp
firewall-cmd --permanent --add-port=22/tcp
firewall-cmd --reload
echo "✅ 防火墙配置完成"
echo ""

# 启动应用
echo "🚀 启动应用..."
pm2 start backend/server.js --name shophub
pm2 save
env PATH=$PATH:/usr/bin pm2 startup systemd -u opc --hp /home/opc
echo "✅ 应用启动完成"
echo ""

# 获取服务器IP
SERVER_IP=$(curl -s ifconfig.me)

echo ""
echo "========================================="
echo "  🎉 部署成功!"
echo "========================================="
echo ""
echo "📱 访问地址: http://$SERVER_IP:3000"
echo ""
echo "🔑 初始管理员账号:"
echo "   用户名: admin"
echo "   密码: admin123"
echo ""
echo "⚠️  重要: 首次登录后请立即修改密码!"
echo ""
echo "📊 常用命令:"
echo "   查看状态: pm2 status"
echo "   查看日志: pm2 logs shophub"
echo "   重启应用: pm2 restart shophub"
echo ""
echo "========================================="
echo ""
