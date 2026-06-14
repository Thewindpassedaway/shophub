const bcrypt = require('bcrypt');

async function verifyPassword() {
  const password = 'liruisilent.9';
  // 请从数据库中复制完整的哈希值（包括 $2b$10$ 开头的所有字符）
  const hashFromDB = '$2b$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcif7p92ldGxad68L...'; // 替换为完整哈希
  
  console.log('===========================================');
  console.log('密码验证测试');
  console.log('===========================================');
  console.log('输入的密码:', password);
  console.log('数据库哈希:', hashFromDB);
  console.log('-------------------------------------------');
  
  try {
    const isValid = await bcrypt.compare(password, hashFromDB);
    console.log('验证结果:', isValid ? '✅ 密码匹配' : '❌ 密码不匹配');
    
    if (!isValid) {
      console.log('\n⚠️  哈希值不匹配！可能的原因：');
      console.log('1. 哈希值不完整或被截断');
      console.log('2. 哈希值复制时有误');
      console.log('3. 使用的密码不是 liruisilent.9');
      
      console.log('\n 解决方案：');
      console.log('1. 从数据库完整复制 password_hash 字段的所有字符');
      console.log('2. 或运行 fixPassword.js 生成新的哈希');
      console.log('3. 用新哈希更新数据库');
    }
  } catch (error) {
    console.log('❌ 验证失败:', error.message);
    console.log('\n提示：哈希值格式应该是 $2b$10$ 开头，总共60个字符');
  }
  
  console.log('===========================================');
  
  // 生成一个新的正确哈希
  console.log('\n📝 生成新的哈希（供参考）：');
  const newHash = await bcrypt.hash(password, 10);
  console.log('新哈希:', newHash);
  console.log('哈希长度:', newHash.length, '字符');
  console.log('\n请使用这个新哈希更新数据库！');
}

verifyPassword();
