const bcrypt = require('bcrypt');

async function hashPassword() {
  const password = 'liruisilent.9';
  const saltRounds = 10;
  
  try {
    const hash = await bcrypt.hash(password, saltRounds);
    console.log('原始密码:', password);
    console.log('bcrypt哈希:', hash);
    console.log('\n可以直接将此哈希值插入数据库的 password_hash 字段');
    
    // 验证哈希是否正确
    const isValid = await bcrypt.compare(password, hash);
    console.log('\n验证结果:', isValid ? '✓ 密码匹配' : '✗ 密码不匹配');
  } catch (error) {
    console.error('错误:', error.message);
  }
}

hashPassword();
