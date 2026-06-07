const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
const mysql = require('mysql2/promise');

async function addIsDeletedColumn() {
  console.log('🔍 开始为 shop_checks 表添加 isDeleted 字段...\n');
  
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

    // 检查字段是否已存在
    const [columns] = await connection.execute(
      "SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'shop_checks' AND COLUMN_NAME = 'isDeleted'"
    );

    if (columns.length > 0) {
      console.log('⚠️  isDeleted 字段已存在,无需添加');
      return;
    }

    // 添加 isDeleted 字段
    const alterTableSQL = `
      ALTER TABLE shop_checks 
      ADD COLUMN isDeleted TINYINT(1) DEFAULT 0 COMMENT '是否已删除(0:未删除,1:已删除)',
      ADD INDEX idx_isDeleted (isDeleted);
    `;

    await connection.execute(alterTableSQL);
    console.log('✅ isDeleted 字段添加成功！');
    console.log('✅ 已添加索引 idx_isDeleted');

    // 验证字段是否添加成功
    const [newColumns] = await connection.execute(
      "SELECT COLUMN_NAME, COLUMN_TYPE, COLUMN_DEFAULT, COLUMN_COMMENT FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'shop_checks'"
    );

    console.log('\n📋 当前表结构：');
    newColumns.forEach(col => {
      console.log(`  - ${col.COLUMN_NAME}: ${col.COLUMN_TYPE} ${col.COLUMN_DEFAULT ? 'DEFAULT ' + col.COLUMN_DEFAULT : ''} ${col.COLUMN_COMMENT ? '(' + col.COLUMN_COMMENT + ')' : ''}`);
    });

  } catch (error) {
    console.error(' 添加字段失败:', error.message);
    console.error('详细错误:', error);
  } finally {
    // 关闭数据库连接
    await connection.end();
    console.log('\n✅ 数据库连接已关闭');
  }
}

// 执行添加字段
addIsDeletedColumn();
