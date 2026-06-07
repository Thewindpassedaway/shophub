# 🚀 ShopHub Railway 一键部署指南

## 💡 方案说明

- **后端应用**: Railway部署(免费,$5额度)
- **数据库**: 继续使用腾讯云CloudBase MySQL(已有)
- **前端页面**: 和后端一起部署到Railway
- **不需要**: 信用卡、数据库迁移

---

## ✅ 准备工作检查清单

在开始之前,请确认:

- [ ] GitHub账号: `Thewindpassedaway`
- [ ] 代码已推送到GitHub
- [ ] 腾讯云MySQL可以正常连接
- [ ] 知道MySQL的连接信息(已在.env文件中)

---

## 📋 部署步骤(超简单!)

### 第1步: 推送代码到GitHub (3分钟)

打开PowerShell,执行:

```powershell
cd C:\Users\L2604\IdeaProjects\untitled1\merchant collection

# 初始化Git(如果还没有)
git init

# 添加所有文件
git add .

# 提交
git commit -m "准备部署到Railway"

# 关联远程仓库
git remote add origin https://github.com/Thewindpassedaway/shophub.git

# 推送到GitHub
git push -u origin master
```

如果遇到错误,告诉我!

---

### 第2步: 注册Railway (2分钟)

1. 访问: https://railway.app/
2. 点击 **"Login"**
3. 选择 **"Sign in with GitHub"**
4. 授权GitHub账号(`Thewindpassedaway`)
5. ✅ 完成!不需要绑定信用卡

---

### 第3步: 创建Railway项目 (5分钟)

#### 3.1 新建项目

1. 登录后,点击 **"New Project"**
2. 选择 **"Deploy from GitHub repo"**
3. 在列表中找到并选择: `shophub`
4. Railway会自动检测Node.js项目

#### 3.2 配置环境变量(重要!)

在项目页面,点击 **"Variables"** 标签,添加以下变量:

点击 **"Add Variable"**,逐个添加:

```env
MYSQL_HOST=sh-cynosdbmysql-grp-3ax8uroe.sql.tencentcdb.com
MYSQL_PORT=29213
MYSQL_USER=lirui001
MYSQL_PASSWORD=liruisilent.9
MYSQL_DATABASE=shopdata-d7g3puonddd82282c
PORT=3000
NODE_ENV=production
CLOUDBASE_ENV=shopdata-d7g3puonddd82282c
TENCENT_SECRET_ID=AKIDukP0Ro07IMLOJGk37xYv4yJTPI2Ys0vm
TENCENT_SECRET_KEY=nNr7A5phLkxxkLkxveR5ZzOd6MYIvKhw
```

⚠️ **注意**:
- 每个变量单独添加
- 不要加引号
- 直接复制粘贴值
- 确保没有多余空格

#### 3.3 配置启动命令

1. 点击 **"Settings"** 标签
2. 找到 **"Start Command"**
3. 设置为: `node backend/server.js`

或者Railway会自动读取 `Procfile` 文件(我已经帮你创建好了)

---

### 第4步: 部署应用 (3分钟)

1. 点击右上角的 **"Deploy"** 按钮
2. 等待部署完成(大约2-3分钟)
3. 看到绿色的 **"Live"** 状态表示成功!

#### 获取访问地址

部署完成后,Railway会给你一个公网地址:

```
https://shophub-production.up.railway.app
```

(具体地址可能不同,以实际为准)

---

### 第5步: 测试访问

1. 在浏览器打开Railway给你的地址
2. 应该能看到ShopHub的登录界面
3. 用admin账号登录测试

**初始账号**:
- 用户名: `admin`
- 密码: `admin123`

⚠️ **重要**: 首次登录后立即修改密码!

---

### 第6步: 分享给团队

将访问地址分享给7-8个团队成员:

```
https://你的应用地址.railway.app
```

每个人都可以:
- 用独立账号登录
- 同时进行店铺检查
- 查看历史记录
- 导出Excel数据

---

## 🔧 常见问题解决

### Q1: 部署失败?

**查看日志**:
1. 在Railway项目页面,点击 **"Logs"** 标签
2. 查看红色错误信息
3. 截图发给我,我帮你分析

**常见原因**:
- [ ] 环境变量配置错误(检查拼写)
- [ ] 数据库连接失败(检查腾讯云防火墙)
- [ ] package.json缺少依赖
- [ ] 启动命令错误

---

### Q2: 连接数据库失败?

**检查腾讯云MySQL配置**:

1. 登录腾讯云控制台
2. 进入 **云数据库 MySQL** 管理页面
3. 找到你的数据库实例
4. 点击 **"外网地址"** 标签
5. 确保已开启外网访问

**检查安全组**:
1. 进入 **"安全组"** 配置
2. 添加入站规则:
   - 源IP: `0.0.0.0/0` (允许所有IP)
   - 端口: `29213` (你的MySQL端口)
   - 协议: TCP

---

### Q3: 访问速度慢?

**原因**: Railway服务器在国外

**解决方案**:
- 对于7-8人内部使用,通常可以接受
- 如果只是偶尔使用,速度影响不大
- 如果确实很慢,可以考虑国内平台(见下方备选方案)

---

### Q4: $5额度够用吗?

**计算**:
- Railway按资源使用量计费(CPU + 内存 + 网络流量)
- 对于7-8人小团队,月访问量不大
- $5额度通常可以用 **1-2个月**
- 如果不够,可以:
  - 升级到付费计划($5/月起)
  - 或换用其他免费平台

---

### Q5: 应用会休眠吗?

**不会!** 
- Railway的应用是24小时运行的
- 不像某些免费平台会每小时休眠
- 团队成员随时可以访问

---

## 🎯 环境变量配置示例

在Railway的Variables页面,应该看到:

| 变量名 | 值 |
|--------|-----|
| MYSQL_HOST | sh-cynosdbmysql-grp-3ax8uroe.sql.tencentcdb.com |
| MYSQL_PORT | 29213 |
| MYSQL_USER | lirui001 |
| MYSQL_PASSWORD | liruisilent.9 |
| MYSQL_DATABASE | shopdata-d7g3puonddd82282c |
| PORT | 3000 |
| NODE_ENV | production |
| CLOUDBASE_ENV | shopdata-d7g3puonddd82282c |
| TENCENT_SECRET_ID | AKIDukP0Ro07IMLOJGk37xYv4yJTPI2Ys0vm |
| TENCENT_SECRET_KEY | nNr7A5phLkxxkLkxveR5ZzOd6MYIvKhw |

---

## 📊 部署后的维护

### 更新代码

当你修改了本地代码后:

```powershell
# 提交更改
git add .
git commit -m "更新内容描述"
git push

# Railway会自动重新部署!
```

### 查看日志

在Railway项目页面:
- 点击 **"Logs"** 标签
- 实时查看应用运行日志
- 排查问题

### 重启应用

如果需要重启:
1. 点击 **"Settings"** 标签
2. 找到 **"Restart"** 按钮
3. 点击确认

---

## 💰 费用说明

### Railway免费额度
- **$5/月** 免费额度
- 不需要绑定信用卡
- 超出后可以:
  - 等待下月重置
  - 或升级到付费计划

### 估算使用情况
对于7-8人团队:
- 每天访问量不大
- $5额度通常够用1-2个月
- 如果不够,升级费用约$5-10/月

### 腾讯云MySQL
- 你已经有了,继续免费使用
- 不会产生额外费用

---

## 🆘 遇到问题?

### 调试步骤

1. **查看Railway日志**
   ```
   Railway项目页面 → Logs标签
   ```

2. **检查环境变量**
   ```
   Railway项目页面 → Variables标签
   确认所有变量都正确填写
   ```

3. **测试数据库连接**
   - 在本地运行应用,看是否能连接腾讯云MySQL
   - 如果能,说明数据库配置没问题

4. **截图发给我**
   - 把错误信息截图
   - 我帮你分析问题

---

## ✅ 部署完成检查清单

部署完成后,请确认:

- [ ] 能访问Railway提供的网址
- [ ] 能看到ShopHub登录界面
- [ ] 能用admin账号登录
- [ ] 能查看店铺列表
- [ ] 能提交检查记录
- [ ] 能导出Excel数据
- [ ] 团队成员都能访问

如果以上都OK,恭喜!🎉

---

## 🎁 额外优化(可选)

### 1. 绑定自定义域名

如果你有域名,可以绑定到Railway:
1. 在Railway点击 **"Settings"**
2. 找到 **"Domains"**
3. 添加你的域名
4. 配置DNS解析

### 2. 配置HTTPS

Railway自动提供HTTPS证书,无需额外配置!

### 3. 设置备份

定期备份腾讯云MySQL:
```bash
mysqldump -h sh-cynosdbmysql-grp-3ax8uroe.sql.tencentcdb.com \
  -P 29213 -u lirui001 -p shopdata-d7g3puonddd82282c > backup.sql
```

---

## 🚀 现在开始!

准备好了吗?按照上面的步骤开始部署吧!

**预计总耗时**: 15-20分钟

**遇到任何问题**,随时告诉我,我会帮你解决! 😊
