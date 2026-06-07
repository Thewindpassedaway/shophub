const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
const mysql = require('mysql2/promise');

async function createShopChecksTable() {
  console.log('🔍 环境变量检查:');
  console.log('  .env 文件路径:', path.join(__dirname, '..', '.env'));
  console.log('  MYSQL_HOST:', process.env.MYSQL_HOST || '(使用默认值)');
  console.log('  MYSQL_PORT:', process.env.MYSQL_PORT || '(使用默认值)');
  console.log('  MYSQL_USER:', process.env.MYSQL_USER || '(使用默认值)');
  console.log('  MYSQL_PASSWORD:', process.env.MYSQL_PASSWORD ? '***已设置***' : '❌ 未设置');
  console.log('  MYSQL_DATABASE:', process.env.MYSQL_DATABASE || '(使用默认值)');
  console.log('');
  
  // 创建数据库连接
  const connection = await mysql.createConnection({
    host: process.env.MYSQL_HOST || 'sh-cynosdbmysql-grp-3ax8uroe.sql.tencentcdb.com',
    port: parseInt(process.env.MYSQL_PORT) || 29213,
    user: process.env.MYSQL_USER || 'lirui001',
    password: process.env.MYSQL_PASSWORD,
    database: process.env.MYSQL_DATABASE || 'shopdata-d7g3puonddd82282c'
  });

  try {
    console.log('✅ 数据库连接成功');

    // 创建 shop_checks 表的 SQL 语句
    const createTableSQL = `
      CREATE TABLE IF NOT EXISTS shop_checks (
        id BIGINT AUTO_INCREMENT PRIMARY KEY COMMENT '记录ID',
        shopId VARCHAR(50) NOT NULL COMMENT '店铺ID',
        serial VARCHAR(50) DEFAULT '' COMMENT '检查序号',
        checkTime DATETIME NOT NULL COMMENT '检查时间',
        inspector VARCHAR(100) NOT NULL COMMENT '检查人',
        problems JSON COMMENT '问题清单（JSON格式）',
        problemCount INT DEFAULT 0 COMMENT '问题数量',
        submitTime DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '提交时间',
        INDEX idx_shopId (shopId),
        INDEX idx_checkTime (checkTime),
        INDEX idx_inspector (inspector),
        INDEX idx_submitTime (submitTime)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='店铺检查记录表';
    `;

    // 执行创建表
    await connection.execute(createTableSQL);
    console.log('✅ shop_checks 表创建成功！');

    // 验证表是否创建成功
    const [tables] = await connection.execute('SHOW TABLES LIKE "shop_checks"');
    if (tables.length > 0) {
      console.log('✅ 验证成功：shop_checks 表已存在');
      
      // 显示表结构
      const [columns] = await connection.execute('DESCRIBE shop_checks');
      console.log('\n 表结构：');
      columns.forEach(col => {
        console.log(`  - ${col.Field}: ${col.Type} ${col.Null === 'NO' ? 'NOT NULL' : 'NULL'} ${col.Key === 'PRI' ? '(主键)' : ''}`);
      });
    } else {
      console.log('❌ 验证失败：shop_checks 表创建失败');
    }

  } catch (error) {
    console.error('❌ 创建表失败:', error.message);
    console.error('详细错误:', error);
  } finally {
    // 关闭数据库连接
    await connection.end();
    console.log('\n✅ 数据库连接已关闭');
  }
}

// 执行创建表
console.log('🚀 开始创建 shop_checks 表...\n');
createShopChecksTable();
