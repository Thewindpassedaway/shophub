# 📖 ShopHub Oracle Cloud 部署完整指南

## 🎯 部署目标

- ✅ 7-8人内部使用
- ✅ 24小时运行,不占用本地电脑
- ✅ Oracle Cloud 永久免费套餐
- ✅ 公网访问,有固定IP

---

## 第一步: 注册 Oracle Cloud

### 1.1 注册账号
1. 访问: https://www.oracle.com/cloud/free/
2. 点击 "Start for free"
3. 填写注册信息:
   - 邮箱地址
   - 密码
   - 国家/地区: 选择你所在的国家
   - 云账号名称: 自定义(如: shophub-account)

### 1.2 填写信用卡信息
⚠️ **重要**: Oracle需要验证信用卡(不会扣费)
- 支持: Visa, MasterCard
- 用途: 仅验证身份,注册成功后不会扣费
- 验证金额: $1 (会自动退还)

### 1.3 验证身份
- 填写手机号接收验证码
- 填写家庭住址
- 同意服务条款

---

## 第二步: 创建免费云服务器

### 2.1 创建实例
1. 登录 Oracle Cloud 控制台
2. 点击左侧菜单: **Compute** → **Instances**
3. 点击 **Create Instance**

### 2.2 配置实例(重要!)
**名称**: shophub-server

**映像和形状**:
- 映像: Oracle Linux 8.x
- 形状: VM.Standard.E2.1.Micro (Always Free Eligible)
  - ✅ 1 OCPU (2 vCPUs)
  - ✅ 1 GB 内存
  - ✅ 50 GB 存储

> ⚠️ **注意**: 必须选择 "Always Free Eligible" 标记的形状!

**网络**:
- VCN: 使用默认的
- 子网: Public Subnet
- 公共IP: 分配公共IPv4地址 ✅

**SSH密钥**:
- 选择: "Generate a key pair for me"
- 下载: 私钥文件 (.pem)
- ⚠️ **重要**: 保存好私钥文件,后面连接服务器需要用到!

**点击**: Create Instance

### 2.3 等待创建完成
- 大约需要 2-5 分钟
- 状态变为 "Running" 表示创建成功
- 记录以下信息:
  - **公共IP地址**: 如 `129.213.xxx.xxx`
  - **用户名**: opc (Oracle Linux)

---

## 第三步: 配置安全规则

### 3.1 配置入站规则
1. 点击实例名称,进入详情
2. 点击 **Primary VNIC** 下的子网链接
3. 点击 **Default Security List**
4. 点击 **Add Ingress Rules**

### 3.2 添加防火墙规则
**规则1: 允许HTTP访问**
- Source CIDR: `0.0.0.0/0`
- IP Protocol: TCP
- Destination Port Range: `3000`
- Description: ShopHub应用端口

**规则2: 允许HTTPS访问**(可选)
- Source CIDR: `0.0.0.0/0`
- IP Protocol: TCP
- Destination Port Range: `443`
- Description: HTTPS

**规则3: 允许SSH访问**
- Source CIDR: `0.0.0.0/0`
- IP Protocol: TCP
- Destination Port Range: `22`
- Description: SSH远程连接

---

## 第四步: 连接服务器

### 4.1 Windows用户 (使用PuTTY)

**下载PuTTY**:
- 官网: https://www.putty.org/
- 下载: putty.exe 和 puttygen.exe

**转换密钥格式**:
1. 打开 puttygen.exe
2. 点击 "Load"
3. 选择下载的 .pem 文件
4. 点击 "Save private key"
5. 保存为 .ppk 文件

**连接服务器**:
1. 打开 putty.exe
2. Host Name: `opc@你的服务器IP`
   - 例如: `opc@129.213.xxx.xxx`
3. Port: 22
4. 左侧: Connection → SSH → Auth
5. 点击 "Browse",选择刚保存的 .ppk 文件
6. 点击 "Open"
7. 首次连接会提示,点击 "Yes"

### 4.2 Mac/Linux用户

```bash
# 设置密钥权限
chmod 400 你的密钥文件.pem

# 连接服务器
ssh -i 你的密钥文件.pem opc@你的服务器IP
```

---

## 第五步: 上传项目文件

### 5.1 方法一: 使用SCP (推荐)

**Windows (使用Git Bash)**:
```bash
# 打包项目文件
cd C:/Users/L2604/IdeaProjects/untitled1
tar -czf shophub.tar.gz merchant collection

# 上传到服务器
scp -i 你的密钥.pem shophub.tar.gz opc@你的服务器IP:~/
```

**Mac/Linux**:
```bash
# 打包并上传
cd ~/IdeaProjects/untitled1
tar -czf shophub.tar.gz merchant collection
scp -i 你的密钥.pem shophub.tar.gz opc@你的服务器IP:~/
```

### 5.2 方法二: 使用Git

**在服务器上执行**:
```bash
# 安装Git
sudo yum install -y git

# 克隆项目(如果你已推送到GitHub/Gitee)
git clone 你的仓库地址 merchant-collection
cd merchant-collection
```

---

## 第六步: 部署应用

### 6.1 在服务器上执行部署脚本

```bash
# SSH连接服务器后执行:

# 1. 解压项目文件
tar -xzf shophub.tar.gz
cd merchant-collection

# 2. 运行部署脚本
chmod +x deploy-oracle.sh
./deploy-oracle.sh

# 3. 按照提示配置数据库密码
# 4. 按照提示编辑 .env 文件
```

### 6.2 手动部署(如果脚本失败)

```bash
# 1. 更新系统
sudo yum update -y

# 2. 安装 Node.js
curl -fsSL https://rpm.nodesource.com/setup_18.x | sudo bash -
sudo yum install -y nodejs

# 3. 安装 PM2
sudo npm install -g pm2

# 4. 安装 MySQL
sudo yum install -y mysql-server
sudo systemctl start mysqld
sudo systemctl enable mysqld

# 5. 进入项目目录
cd ~/merchant-collection

# 6. 安装依赖
npm install --production

# 7. 配置数据库
cd backend/scripts
node createShopChecksTable.js
cd ../..

# 8. 编辑 .env 文件
nano backend/.env

# 填写数据库配置:
# MYSQL_HOST=localhost
# MYSQL_PORT=3306
# MYSQL_USER=root
# MYSQL_PASSWORD=你的MySQL密码
# MYSQL_DATABASE=shophub
# PORT=3000

# 9. 启动应用
pm2 start backend/server.js --name shophub
pm2 save
```

---

## 第七步: 配置数据库

### 7.1 MySQL初始化

```bash
# 设置MySQL root密码
sudo mysql_secure_installation

# 创建数据库
mysql -u root -p

# 在MySQL中执行:
CREATE DATABASE shophub DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
EXIT;

# 运行迁移脚本
cd ~/merchant-collection/backend/scripts
node createShopChecksTable.js
node addIsDeletedColumn.js
```

### 7.2 修改数据库配置

```bash
# 编辑 .env 文件
nano backend/.env

# 修改为:
MYSQL_HOST=localhost
MYSQL_PORT=3306
MYSQL_USER=root
MYSQL_PASSWORD=你设置的MySQL密码
MYSQL_DATABASE=shophub
PORT=3000
```

---

## 第八步: 启动并测试

### 8.1 启动应用

```bash
# 重启应用使配置生效
pm2 restart shophub

# 查看状态
pm2 status

# 查看日志
pm2 logs shophub
```

### 8.2 测试访问

**在浏览器访问**:
```
http://你的服务器IP:3000
```

应该能看到ShopHub的登录界面!

### 8.3 首次使用

1. **初始管理员账号**:
   - 用户名: `admin`
   - 密码: `admin123` (首次登录后立即修改)

2. **添加用户**:
   - 进入"管理"页面
   - 添加其他7-8个用户的账号

3. **分享访问地址**:
   - 将 `http://你的服务器IP:3000` 分享给团队成员

---

## 第九步: 配置开机自启动

```bash
# 配置PM2开机自启
sudo env PATH=$PATH:/usr/bin pm2 startup systemd -u opc --hp /home/opc

# 保存当前进程列表
pm2 save
```

---

## 第十步: 日常维护

### 常用命令

```bash
# 查看应用状态
pm2 status

# 查看日志
pm2 logs shophub

# 重启应用
pm2 restart shophub

# 停止应用
pm2 stop shophub

# 启动应用
pm2 start shophub

# 更新代码后重启
cd ~/merchant-collection
git pull  # 如果使用了Git
pm2 restart shophub
```

### 备份数据库

```bash
# 备份数据库
mysqldump -u root -p shophub > backup_$(date +%Y%m%d).sql

# 查看备份文件
ls -lh backup_*.sql
```

---

## ⚠️ 注意事项

### 安全建议

1. **修改默认密码**: 首次登录后立即修改admin密码
2. **定期更新**: 每月运行 `sudo yum update -y`
3. **数据库备份**: 每周备份一次数据库
4. **防火墙**: 只开放必要的端口(22, 3000)
5. **监控**: 定期检查服务器资源使用情况

### Oracle Cloud 免费额度

- ✅ CPU: 1 OCPU (Always Free)
- ✅ 内存: 1 GB (Always Free)
- ✅ 存储: 50 GB (Always Free)
- ✅ 流量: 每月 10 TB (Always Free)
- ✅ 公网IP: 1个 (Always Free)

> ⚠️ **重要**: 只使用 "Always Free Eligible" 的资源,不会收费!

---

##  常见问题

### Q1: 无法连接服务器?
**A**: 检查:
1. 安全规则是否配置了SSH端口(22)
2. 私钥文件是否正确
3. IP地址是否正确

### Q2: 应用无法访问?
**A**: 检查:
1. 安全规则是否配置了3000端口
2. 应用是否正常运行: `pm2 status`
3. 防火墙是否开放: `sudo firewall-cmd --list-all`

### Q3: 数据库连接失败?
**A**: 检查:
1. MySQL是否运行: `sudo systemctl status mysqld`
2. .env文件配置是否正确
3. 数据库密码是否正确

### Q4: 如何修改端口?
**A**: 编辑 `.env` 文件中的 `PORT=3000`,然后重启应用

---

##  技术支持

部署过程中遇到问题? 

1. 查看日志: `pm2 logs shophub`
2. 检查系统状态: `pm2 status`
3. 联系开发者: 李睿

---

**ShopHub - 店铺管理平台**  
Copyright 2026 李睿 All Rights Reserved

 祝你部署成功!
