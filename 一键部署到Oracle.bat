@echo off
chcp 65001 >nul
echo ========================================
echo   ShopHub 一键部署到 Oracle Cloud
echo ========================================
echo.

REM 检查是否安装了Git
where git >nul 2>nul
if %errorlevel% neq 0 (
    echo [错误] 未检测到Git,请先安装Git!
    echo.
    echo 下载地址: https://git-scm.com/download/win
    echo.
    pause
    exit /b 1
)

echo 步骤 1/4: 推送代码到Gitee...
echo.

cd /d "%~dp0"

REM 检查是否已初始化Git
if not exist ".git" (
    echo 正在初始化Git仓库...
    git init
    
    REM 创建.gitignore文件
    if not exist ".gitignore" (
        echo node_modules/ >> .gitignore
        echo .env >> .gitignore
        echo backend/uploads/* >> .gitignore
        echo !backend/uploads/.gitkeep >> .gitignore
        echo .idea/ >> .gitignore
        echo *.iml >> .gitignore
        echo test-temp-key.html >> .gitignore
        echo backup_*.sql >> .gitignore
    )
    
    git add .
    git commit -m "初始提交 - ShopHub项目"
    
    echo.
    echo ✓ Git仓库初始化完成
    echo.
) else (
    echo Git仓库已存在,更新代码...
    git add .
    git commit -m "更新代码"
    echo.
)

echo 请确认以下信息:
echo.
echo 1. 你是否已经在Gitee创建了仓库?
echo 2. 仓库地址格式: https://gitee.com/你的用户名/shophub.git
echo.

set /p GITEE_URL="请输入你的Gitee仓库地址: "

REM 检查是否已配置远程仓库
git remote -v | findstr origin >nul 2>nul
if %errorlevel% neq 0 (
    git remote add origin %GITEE_URL%
) else (
    echo.
    echo 检测到已配置的远程仓库,是否修改?
    set /p CHANGE_REMOTE="修改(y/n): "
    if /i "!CHANGE_REMOTE!"=="y" (
        git remote set-url origin %GITEE_URL%
    )
)

echo.
echo 正在推送到Gitee...
git push -u origin master

if %errorlevel% neq 0 (
    echo.
    echo [错误] 推送失败!请检查:
    echo 1. Gitee仓库地址是否正确
    echo 2. 是否有推送权限
    echo 3. 网络连接是否正常
    echo.
    pause
    exit /b 1
)

echo.
echo ✓ 代码推送成功!
echo.
echo ========================================
echo 步骤 2/4: 连接Oracle Cloud服务器
echo ========================================
echo.

set /p SERVER_IP="请输入服务器IP地址: "
set /p KEY_FILE="请输入私钥文件路径(如: C:\keys\oracle-key.pem): "

echo.
echo 正在连接到服务器...
echo.
echo 提示: 首次连接会询问是否信任该主机,输入 yes
echo.

ssh -i "%KEY_FILE%" opc@%SERVER_IP% "bash -s" < deploy-to-server.sh

if %errorlevel% neq 0 (
    echo.
    echo [错误] 连接失败!请检查:
    echo 1. 服务器IP是否正确
    echo 2. 私钥文件路径是否正确
    echo 3. 防火墙是否开放了22端口
    echo.
    pause
    exit /b 1
)

echo.
echo ========================================
echo 部署完成!
echo ========================================
echo.
echo 📱 访问地址: http://%SERVER_IP%:3000
echo.
echo 🔑 初始管理员账号:
echo    用户名: admin
echo    密码: admin123
echo.
echo ⚠️ 重要: 首次登录后请立即修改密码!
echo.
pause
