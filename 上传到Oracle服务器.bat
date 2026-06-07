@echo off
chcp 65001 >nul
echo ========================================
echo  ShopHub 文件上传到 Oracle Cloud
echo ========================================
echo.

set /p SERVER_IP="请输入服务器IP地址: "
set /p KEY_FILE="请输入密钥文件路径(如: C:\keys\oracle-key.pem): "

echo.
echo  正在打包项目文件...
echo.

REM 进入项目上级目录
cd /d "%~dp0.."

REM 打包项目文件(排除node_modules)
tar -czf shophub.tar.gz ^
  --exclude=node_modules ^
  --exclude=.git ^
  --exclude=.idea ^
  --exclude=*.iml ^
  --exclude=test-temp-key.html ^
  merchant collection

if %errorlevel% neq 0 (
  echo  打包失败!
  pause
  exit /b 1
)

echo  打包完成: shophub.tar.gz
echo.
echo  正在上传到服务器...
echo.

REM 使用SCP上传
scp -i "%KEY_FILE%" shophub.tar.gz opc@%SERVER_IP%:~/

if %errorlevel% neq 0 (
  echo  上传失败!
  echo.
  echo 请检查:
  echo 1. 服务器IP是否正确
  echo 2. 密钥文件路径是否正确
  echo 3. 是否已配置SSH连接
  pause
  exit /b 1
)

echo.
echo ========================================
echo  上传完成!
echo ========================================
echo.
echo  下一步:
echo  1. SSH连接服务器: ssh -i %KEY_FILE% opc@%SERVER_IP%
echo  2. 解压文件: tar -xzf shophub.tar.gz
echo  3. 运行部署脚本:
echo     cd merchant-collection
echo     sudo chmod +x deploy-oracle.sh
echo     sudo ./deploy-oracle.sh
echo.
echo ========================================
echo.

pause
