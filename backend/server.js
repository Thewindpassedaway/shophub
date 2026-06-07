const express = require('express');
const cors = require('cors');
const config = require('./config');
const path = require('path');

const app = express();

// 中间件
app.use(cors());
app.use(express.json());

// 静态文件服务（上传的图片和前端资源）
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use(express.static(path.join(__dirname, '..')));

// 健康检查
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    message: '后端服务运行正常',
    timestamp: new Date().toISOString()
  });
});

// 路由
app.use('/api/auth', require('./routes/auth'));
app.use('/api/shops', require('./routes/shops'));
app.use('/api/checks', require('./routes/checks'));
app.use('/api/upload', require('./routes/upload'));
app.use('/api/sts', require('./routes/sts'));

// 错误处理中间件
app.use((err, req, res, next) => {
  console.error('服务器错误:', err);
  res.status(500).json({
    success: false,
    message: '服务器内部错误'
  });
});

// 启动服务器
const PORT = config.PORT;
app.listen(PORT, () => {
  console.log(`🚀 后端服务启动成功！`);
  console.log(`📍 服务地址: http://localhost:${PORT}`);
  console.log(`🔍 健康检查: http://localhost:${PORT}/api/health`);
});

module.exports = app;
