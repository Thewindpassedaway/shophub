# 🚀 Vercel + 腾讯云MySQL 部署指南

## 💡 方案说明

- **前端**: 托管在 Vercel (免费,速度快)
- **后端**: 需要单独部署(因为Vercel不支持Node.js后端长时间运行)
- **数据库**: 继续使用腾讯云的MySQL

---

## ⚠️ 重要提示

Vercel **只适合部署静态网站**(HTML/CSS/JS),但你的ShopHub有Node.js后端,所以有两种选择:

### 选择1: 前后端分离部署 (推荐)
- **前端页面** → Vercel (免费)
- **后端API** → Railway/Render (免费)
- **数据库** → 腾讯云MySQL (已有)

### 选择2: 全栈部署到Railway (更简单!)
- **前后端一起** → Railway ($5免费额度)
- **数据库** → 腾讯云MySQL (已有)

---

## 🎯 我的建议: 直接使用 Railway

既然你已经有腾讯云MySQL,**最简单的方式是直接用Railway部署后端**:

### ✅ 优势
1. **不需要信用卡**
2. **部署超简单**,一键完成
3. **继续使用腾讯云MySQL**,不用迁移
4. **$5免费额度**,对7-8人团队够用
5. **24小时运行**,不占用电脑

### 📋 部署步骤

---

## 🚀 Railway 部署完整教程

### 第1步: 注册Railway (2分钟)

1. 访问: https://railway.app/
2. 点击 "Login" → 选择 "Sign in with GitHub"
3. 授权GitHub账号
4. ✅ 完成!不需要绑定信用卡

---

### 第2步: 准备项目代码 (3分钟)

#### 2.1 确保代码已推送到GitHub

打开PowerShell执行:
```powershell
cd C:\Users\L2604\IdeaProjects\untitled1\merchant collection

# 初始化Git(如果还没有)
git init

# 添加所有文件
git add .

# 提交
git commit -m "准备部署到Railway"

# 推送到GitHub
git remote add origin https://github.com/你的用户名/shophub.git
git push -u origin master
```

#### 2.2 创建Railway配置文件

在项目根目录创建 `Procfile`:

```
web: node backend/server.js
```

---

### 第3步: 配置腾讯云MySQL (重要!)

#### 3.1 获取腾讯云MySQL连接信息

登录腾讯云控制台,找到你的MySQL数据库,记录以下信息:

- **主机地址**: 如 `cdb-xxxx.bj.tencentcdb.com`
- **端口**: 通常是 `3306`
- **用户名**: 如 `root` 或自定义用户
- **密码**: 你的数据库密码
- **数据库名**: 如 `shophub`

#### 3.2 配置远程访问权限

⚠️ **重要**: 确保腾讯云MySQL允许远程连接!

**方法1: 腾讯云控制台配置**
1. 登录腾讯云控制台
2. 进入 MySQL 管理页面
3. 找到 "安全组" 或 "外网访问"
4. 添加规则: 允许所有IP访问3306端口
   - 源IP: `0.0.0.0/0`
   - 端口: `3306`

**方法2: 检查用户权限**

在本地连接腾讯云MySQL,执行:
```sql
-- 查看当前用户权限
SELECT user, host FROM mysql.user;

-- 如果host不是'%',需要修改
GRANT ALL PRIVILEGES ON shophub.* TO '你的用户名'@'%' IDENTIFIED BY '你的密码';
FLUSH PRIVILEGES;
```

---

### 第4步: 在Railway创建项目 (5分钟)

#### 4.1 创建新项目

1. 登录 Railway 后,点击 **"New Project"**
2. 选择 **"Deploy from GitHub repo"**
3. 选择你的仓库: `shophub`
4. Railway会自动检测Node.js项目

#### 4.2 配置环境变量

在Railway项目页面:

1. 点击 **"Variables"** 标签
2. 添加以下变量:

```
MYSQL_HOST=你的腾讯云MySQL主机地址
MYSQL_PORT=3306
MYSQL_USER=你的数据库用户名
MYSQL_PASSWORD=你的数据库密码
MYSQL_DATABASE=shophub
PORT=3000
NODE_ENV=production
```

⚠️ **注意**: 
- 不要加引号
- 直接填写值
- 密码中的特殊字符可能需要URL编码

#### 4.3 配置启动命令

1. 点击 **"Settings"** 标签
2. 找到 "Start Command"
3. 设置为: `node backend/server.js`

或者在项目根目录创建 `Procfile` 文件:
```
web: node backend/server.js
```

---

### 第5步: 部署应用 (3分钟)

1. 点击 **"Deploy"** 按钮
2. 等待部署完成(大约2-3分钟)
3. 看到绿色 "Live" 表示成功!

#### 获取访问地址

Railway会给你一个地址:
```
https://shophub-production.up.railway.app
```

---

### 第6步: 测试访问

1. 在浏览器打开Railway给你的地址
2. 应该能看到ShopHub的登录界面
3. 用admin账号登录测试

---

### 第7步: 初始化数据库表

如果是第一次部署,需要创建数据表:

#### 方法1: 在Railway中执行

1. 在Railway项目页面,点击 **"Console"** 标签
2. 输入以下命令:

```bash
node backend/scripts/createShopChecksTable.js
```

#### 方法2: 在本地执行

修改 `backend/.env` 为腾讯云的数据库配置,然后在本地运行:
```powershell
cd backend/scripts
node createShopChecksTable.js
```

---

## 🔧 常见问题解决

### Q1: 连接数据库失败?

**检查清单**:
- [ ] 腾讯云MySQL是否开启了外网访问?
- [ ] 防火墙是否开放了3306端口?
- [ ] 用户名和密码是否正确?
- [ ] 主机地址是否正确?(注意不是内网地址)
- [ ] 数据库是否存在?

**调试方法**:
在Railway的 "Logs" 标签查看错误信息

---

### Q2: 部署失败?

**检查**:
- [ ] GitHub仓库是否是公开的?(或已授权Railway)
- [ ] 是否有 `package.json` 文件?
- [ ] 启动命令是否正确?
- [ ] 环境变量是否配置正确?

---

### Q3: 访问速度慢?

**原因**: Railway服务器在国外

**解决方案**:
- 对于7-8人内部使用,速度通常可以接受
- 如果确实慢,可以考虑国内平台(见下方备选方案)

---

### Q4: $5额度够用吗?

**计算**:
- Railway按资源使用量计费(CPU+内存+网络)
- 对于7-8人小团队,月访问量不大
- $5额度通常可以用1-2个月
- 如果不够,可以考虑升级或换其他平台

---

## 🎯 备选方案对比

如果Railway不合适,还有其他选择:

| 平台 | 优点 | 缺点 | 是否需要信用卡 |
|------|------|------|---------------|
| **Railway** | 简单,一站式 | $5额度限制 | ❌ 不需要 |
| **Render** | 完全免费 | 速度慢,冷启动 | ❌ 不需要 |
| **Fly.io** | 性能好 | 需要信用卡验证 | ✅ 需要 |
| **Glitch** | 简单易用 | 每小时休眠 | ❌ 不需要 |
| **Replit** | 在线IDE | 公开项目免费 | ❌ 不需要 |

---

## 💡 国内替代方案 (可选)

如果访问速度慢,可以考虑国内平台:

### 1. 阿里云函数计算 + API网关
- 费用: 免费额度够用
- 速度: 国内快
- 难度: 中等

### 2. 腾讯云云函数(SCF)
- 费用: 免费额度
- 速度: 国内快
- 难度: 中等

### 3. 华为云FunctionGraph
- 费用: 免费额度
- 速度: 国内快
- 难度: 中等

需要我提供国内平台的部署教程吗?

---

## ✅ 总结

### 最佳方案: Railway + 腾讯云MySQL

**步骤回顾**:
1. ✅ 注册Railway (2分钟)
2. ✅ 推送代码到GitHub (3分钟)
3. ✅ 配置腾讯云MySQL外网访问 (5分钟)
4. ✅ 在Railway创建项目并配置环境变量 (5分钟)
5. ✅ 部署并测试 (3分钟)

**总耗时**: 约20分钟

**费用**: $5免费额度(可用1-2个月)

**不需要**: 信用卡

---

## 🚀 需要我帮你吗?

我可以:
1. ✅ 帮你准备Railway配置文件
2. ✅ 检查腾讯云MySQL配置
3. ✅ 提供详细的图文教程
4. ✅ 协助排查部署问题

**你想现在开始吗?** 告诉我你是否已经:
- [ ] 有GitHub账号
- [ ] 代码已推送到GitHub
- [ ] 知道腾讯云MySQL的连接信息
- [ ] 开启了腾讯云MySQL的外网访问
