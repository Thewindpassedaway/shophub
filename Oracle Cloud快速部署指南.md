# 🚀 ShopHub Oracle Cloud 快速部署指南 (7-8人使用)

## 📋 准备工作

### 你需要准备:
1. ✅ 一张信用卡(Visa/MasterCard,仅验证用)
2. ✅ 一个邮箱地址
3. ✅ 5分钟时间完成注册
4. ✅ 你的ShopHub项目文件夹

---

## 第一步: 注册Oracle Cloud账号 (5分钟)

### 1. 访问官网
打开浏览器访问: **https://www.oracle.com/cloud/free/**

### 2. 点击"Start for free"

### 3. 填写信息
- **邮箱**: 你的常用邮箱
- **密码**: 设置一个强密码
- **国家/地区**: 中国
- **云账号名称**: shophub-account (自定义)

### 4. 填写信用卡
⚠️ **重要提示**: 
- Oracle需要验证信用卡身份,**不会扣费**
- 验证时会冻结$1,几天后自动退还
- 支持Visa、MasterCard

### 5. 手机验证
- 输入你的手机号
- 接收短信验证码
- 填写家庭住址

✅ **注册完成!** 你会收到一封确认邮件

---

## 第二步: 创建免费云服务器 (3分钟)

### 1. 登录控制台
访问: https://cloud.oracle.com/

### 2. 创建实例
1. 点击左侧菜单: **Compute** → **Instances**
2. 点击蓝色按钮: **Create instance**

### 3. 配置服务器(重要!)

**名称**: `shophub-server`

**位置**(Placement):
- 可用域: 默认即可

**映像和形状**(Image and shape):
- 点击 "Change image"
- 选择: **Oracle Linux 8.x**
- 点击 "Change shape"
- ⚠️ **必须选择**: VM.Standard.E2.1.Micro (**Always Free Eligible**)
  - 1 OCPU
  - 1 GB 内存
  - 50 GB 存储

**网络**(Networking):
- VCN: 使用默认的
- 子网: Public subnet
- ✅ **分配公共IPv4地址**: 勾选

**SSH密钥**(Add SSH keys):
- 选择: **Generate a key pair for me**
- 点击下载: **Save private key** (保存为 oracle-key.pem)
- ⚠️ **重要**: 这个文件要保存好!后面连接服务器需要用到!

**点击**: **Create** 按钮

### 4. 等待创建
- 大约2-5分钟
- 状态变为 **Running** 表示成功
- **记录公共IP地址**: 如 `129.213.xxx.xxx`

---

## 第三步: 配置防火墙规则 (2分钟)

### 1. 进入安全配置
1. 点击刚创建的实例名称
2. 找到 **Primary VNIC**,点击下面的子网链接(蓝色)
3. 点击 **Default Security List**
4. 点击 **Add Ingress Rules**

### 2. 添加三条规则

**规则1 - ShopHub应用端口**:
```
Source CIDR: 0.0.0.0/0
Destination Port Range: 3000
Description: ShopHub应用
```

**规则2 - SSH远程连接**:
```
Source CIDR: 0.0.0.0/0
Destination Port Range: 22
Description: SSH连接
```

**规则3 - HTTP访问**(可选):
```
Source CIDR: 0.0.0.0/0
Destination Port Range: 80
Description: HTTP访问
```

点击 **Add Ingress Rules** 保存

---

## 第四步: 上传项目到服务器 (5分钟)

### 方法一: 使用Git推送(推荐,最简单!)

#### 4.1 在本地电脑上操作

**1. 安装Git**(如果还没安装)
- 下载: https://git-scm.com/download/win
- 安装时全部默认选项即可

**2. 初始化Git仓库**
打开PowerShell,执行:
```powershell
cd C:\Users\L2604\IdeaProjects\untitled1\merchant collection
git init
```

**3. 推送到Gitee**(码云,国内速度快)
- 访问: https://gitee.com/
- 注册账号并登录
- 点击右上角 **+** → **新建仓库**
- 仓库名称: `shophub`
- 设为私有仓库
- 复制仓库地址(如: https://gitee.com/你的用户名/shophub.git)

**4. 提交代码**
```powershell
# 添加所有文件
git add .

# 提交
git commit -m "初始提交"

# 关联远程仓库
git remote add origin https://gitee.com/你的用户名/shophub.git

# 推送
git push -u origin master
```

#### 4.2 在服务器上操作

**1. 连接服务器**(Windows用户)

使用PuTTY(需要先转换密钥格式):

**转换密钥**:
1. 下载 PuTTY: https://www.putty.org/
2. 运行 `puttygen.exe`
3. 点击 **Load**,选择下载的 `oracle-key.pem` 文件
4. 点击 **Save private key**,保存为 `oracle-key.ppk`

**连接**:
1. 运行 `putty.exe`
2. Host Name: `opc@你的服务器IP`
   - 例如: `opc@129.213.123.456`
3. Port: `22`
4. 左侧展开: **Connection** → **SSH** → **Auth**
5. 点击 **Browse**,选择刚保存的 `.ppk` 文件
6. 点击 **Open**
7. 首次连接会提示,点击 **Yes**

**Mac/Linux用户直接执行**:
```bash
chmod 400 oracle-key.pem
ssh -i oracle-key.pem opc@你的服务器IP
```

**2. 在服务器上克隆项目**
```bash
# 安装Git
sudo yum install -y git

# 克隆项目
git clone https://gitee.com/你的用户名/shophub.git merchant-collection

# 进入项目目录
cd merchant-collection
```

---

## 第五步: 一键部署脚本 (3分钟)

### 1. 运行部署脚本

在服务器上执行:
```bash
# 进入项目目录
cd ~/merchant-collection

# 给脚本执行权限
chmod +x deploy-oracle.sh

# 运行部署脚本
sudo ./deploy-oracle.sh
```

### 2. 按提示操作

脚本会自动:
1. ✅ 更新系统
2. ✅ 安装Node.js
3. ✅ 安装PM2(进程管理器)
4. ✅ 安装MySQL数据库
5. ✅ 配置防火墙
6. ✅ 启动应用

**过程中会提示你**:
- 设置MySQL root密码(记住这个密码!)
- 确认密码

### 3. 等待部署完成
- 大约需要3-5分钟
- 看到 "部署完成!" 表示成功
- 会显示访问地址: `http://你的IP:3000`

---

## 第六步: 测试访问 (1分钟)

### 1. 在浏览器访问
```
http://你的服务器IP:3000
```

应该能看到ShopHub的登录界面!

### 2. 首次登录
- **用户名**: `admin`
- **密码**: `admin123`

⚠️ **重要**: 登录后立即修改密码!

### 3. 添加团队成员
1. 点击顶部菜单 **"管理"**
2. 点击 **"用户管理"**
3. 添加其他7-8个用户的账号和密码
4. 将访问地址和账号分享给团队成员

---

## 第七步: 配置开机自启 (1分钟)

确保服务器重启后自动运行:

```bash
# 配置PM2开机自启
sudo env PATH=$PATH:/usr/bin pm2 startup systemd -u opc --hp /home/opc

# 保存当前进程
pm2 save
```

---

## ✅ 部署完成!

现在你可以:
- ✅ 24小时访问ShopHub,不占用本地电脑
- ✅ 7-8个团队成员同时使用
- ✅ 通过 `http://你的IP:3000` 访问
- ✅ 数据存储在云端,安全可靠

---

## 🔧 常用维护命令

### 查看应用状态
```bash
pm2 status
```

### 查看日志
```bash
pm2 logs shophub
```

### 重启应用
```bash
pm2 restart shophub
```

### 停止应用
```bash
pm2 stop shophub
```

### 备份数据库
```bash
mysqldump -u root -p shophub > backup_$(date +%Y%m%d).sql
```

---

## ❓ 常见问题

### Q1: 无法连接服务器?
**检查**:
1. 防火墙是否开放了22端口
2. 私钥文件是否正确
3. IP地址是否正确

### Q2: 应用无法访问?
**检查**:
1. 防火墙是否开放了3000端口
2. 应用是否正常运行: `pm2 status`
3. 查看日志: `pm2 logs shophub`

### Q3: 数据库连接失败?
**检查**:
1. MySQL是否运行: `sudo systemctl status mysqld`
2. `.env`文件配置是否正确
3. 数据库密码是否正确

### Q4: 如何更新代码?
```bash
cd ~/merchant-collection
git pull
pm2 restart shophub
```

### Q5: Oracle Cloud会收费吗?
只要使用 **Always Free Eligible** 的资源,就**完全免费**:
- ✅ 1 OCPU CPU
- ✅ 1 GB 内存
- ✅ 50 GB 存储
- ✅ 每月10 TB流量
- ✅ 1个公网IP

---

## 🎉 恭喜!

你现在拥有了一个:
- 🌐 24小时运行的云端ShopHub
- 👥 支持7-8人团队使用
- 💰 完全免费(Oracle Cloud永久免费套餐)
- 📱 可通过网址随时随地访问
- 🔒 数据存储在独立服务器

**祝你使用愉快!** 🚀
