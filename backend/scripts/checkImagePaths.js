const mysql = require('mysql2/promise');
require('dotenv').config({ path: './backend/.env' });

async function checkImagePaths() {
  const connection = await mysql.createConnection({
    host: process.env.MYSQL_HOST,
    port: parseInt(process.env.MYSQL_PORT),
    user: process.env.MYSQL_USER,
    password: process.env.MYSQL_PASSWORD,
    database: process.env.MYSQL_DATABASE
  });

  try {
    // 查询最近的几条检查记录
    const [rows] = await connection.execute(
      'SELECT id, shop_id, problems FROM shop_checks ORDER BY created_at DESC LIMIT 5'
    );

    console.log('=== 最近的检查记录 ===');
    rows.forEach((row, idx) => {
      console.log(`\n记录 ${idx + 1} (ID: ${row.id}):`);
      try {
        const problems = JSON.parse(row.problems || '[]');
        if (problems.length > 0) {
          problems.forEach((problem, pIdx) => {
            console.log(`  问题 ${pIdx + 1}:`);
            console.log(`    - photoUrl: ${problem.photoUrl || '无'}`);
            if (problem.rectification && problem.rectification.photoUrl) {
              console.log(`    - rectification.photoUrl: ${problem.rectification.photoUrl}`);
            }
          });
        } else {
          console.log('  无问题记录');
        }
      } catch (e) {
        console.log('  解析 problems 失败:', e.message);
      }
    });
  } catch (error) {
    console.error('查询失败:', error);
  } finally {
    await connection.end();
  }
}

checkImagePaths();
