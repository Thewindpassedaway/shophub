const bcrypt = require('bcrypt');

async function generateHash() {
  const password = 'liruisilent.9';
  const saltRounds = 10;
  
  const hash = await bcrypt.hash(password, saltRounds);
  
  console.log('===========================================');
  console.log('密码哈希生成结果');
  console.log('===========================================');
  console.log('原始密码:', password);
  console.log('bcrypt哈希:', hash);
  console.log('===========================================');
  console.log('\n请复制上面的哈希值，然后执行以下SQL:');
  console.log('\nUPDATE app_users SET password_hash = \'' + hash + '\' WHERE username = \'您的用户名\';');
  console.log('\n===========================================');
}

generateHash();
