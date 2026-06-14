const bcrypt = require('bcrypt');

async function upgradeToAdmin() {
  const username = 'lirui';
  const password = 'liruisilent.9';
  
  console.log('===========================================');
  console.log('将 lirui 升级为管理员');
  console.log('===========================================\n');
  
  // 生成密码哈希
  const saltRounds = 10;
  const passwordHash = await bcrypt.hash(password, saltRounds);
  
  console.log('更新信息：');
  console.log('  用户名:', username);
  console.log('  新密码:', password);
  console.log('  密码哈希:', passwordHash);
  console.log('  新角色: root (管理员)\n');
  
  console.log('===========================================');
  console.log('SQL 语句（请复制执行）：');
  console.log('===========================================\n');
  
  console.log(`UPDATE app_users SET password_hash = '${passwordHash}', role = 'root' WHERE username = '${username}';`);
  
  console.log('\n===========================================');
  console.log('验证命令：');
  console.log('===========================================\n');
  console.log(`SELECT id, username, display_name, role FROM app_users WHERE username = '${username}';`);
  console.log('\n===========================================');
  console.log('更新后登录信息：');
  console.log('  用户名: lirui');
  console.log('  密码: liruisilent.9');
  console.log('  角色: root (管理员)');
  console.log('===========================================');
}

upgradeToAdmin();
