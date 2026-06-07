const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

// 调试信息
console.log('📁 .env 文件路径:', path.join(__dirname, '.env'));
console.log(' MYSQL_PASSWORD 是否加载:', process.env.MYSQL_PASSWORD ? '✅ 已加载' : '❌ 未加载');

module.exports = {
  // CloudBase 配置
  CLOUDBASE: {
    env: process.env.CLOUDBASE_ENV || 'shopdata-d7g3puonddd82282c',
    SECRET_ID: process.env.TENCENT_SECRET_ID,
    SECRET_KEY: process.env.TENCENT_SECRET_KEY
  },

  // MySQL 数据库配置（SQL型数据库）
  MYSQL: {
    host: process.env.MYSQL_HOST || 'sh-cynosdbmysql-grp-3ax8uroe.sql.tencentcdb.com',
    port: process.env.MYSQL_PORT || 29213,
    user: process.env.MYSQL_USER || 'lirui001',
    password: process.env.MYSQL_PASSWORD,
    database: process.env.MYSQL_DATABASE ||  'shopdata-d7g3puonddd82282c'
  },

  // 服务器配置
  PORT: process.env.PORT || 3000
};
