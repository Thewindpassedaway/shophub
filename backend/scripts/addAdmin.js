const bcrypt = require('bcrypt');

async function generateAdminSQL() {
  const username = 'silent';  // 用户名
  const displayName = '管理员';
  const password = 'liruiSilent.9';  // 密码
  const role = 'root';  // root = 管理员
  
  console.log('===========================================');
  console.log('管理员账号 SQL 生成器');
  console.log('===========================================\n');
  
  // 生成密码哈希
  const saltRounds = 10;
  const passwordHash = await bcrypt.hash(password, saltRounds);
  
  console.log('账号信息：');
  console.log('  用户名:', username);
  console.log('  显示名称:', displayName);
  console.log('  密码:', password);
  console.log('  角色:', role);
  console.log('  密码哈希:', passwordHash);
  
  console.log('\n===========================================');
  console.log('SQL 语句（请复制执行）：');
  console.log('===========================================\n');
  
  console.log(`INSERT INTO app_users (username, password_hash, display_name, role, _openid) VALUES ('${username}', '${passwordHash}', '${displayName}', '${role}', '');`);
  
  console.log('\n===========================================');
  console.log('验证命令（可选）：');
  console.log('===========================================\n');
  console.log(`SELECT * FROM app_users WHERE username = '${username}';`);
  console.log('\n===========================================');
}

generateAdminSQL();
