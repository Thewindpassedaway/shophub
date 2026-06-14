console.log('===========================================');
console.log('将 lirui 的角色改为 admin');
console.log('===========================================\n');

console.log('SQL 语句（请复制执行）：');
console.log('===========================================\n');

console.log("UPDATE app_users SET role = 'admin' WHERE username = 'lirui';");

console.log('\n===========================================');
console.log('验证命令：');
console.log('===========================================\n');

console.log("SELECT id, username, display_name, role FROM app_users WHERE username = 'lirui';");

console.log('\n===========================================');
console.log('完成后请刷新页面并重新登录！');
console.log('===========================================');
