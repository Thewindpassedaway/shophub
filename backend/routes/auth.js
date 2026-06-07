const express = require('express');
const router = express.Router();
const mysql = require('mysql2/promise');
const bcrypt = require('bcrypt');
const config = require('../config');

// 创建数据库连接池
const pool = mysql.createPool({
  host: config.MYSQL.host,
  port: config.MYSQL.port,
  user: config.MYSQL.user,
  password: config.MYSQL.password,
  database: config.MYSQL.database,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

/**
 * POST /api/auth/login
 * 用户登录 - 从 SQL 数据库验证
 */
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({
        success: false,
        message: '用户名和密码不能为空'
      });
    }

    // 从 SQL 数据库查询用户
    const [rows] = await pool.execute(
      'SELECT id, username, password_hash, display_name, role FROM app_users WHERE username = ?',
      [username]
    );

    if (rows.length === 0) {
      return res.status(401).json({
        success: false,
        message: '用户名或密码错误'
      });
    }

    const user = rows[0];

    // 验证密码(使用 bcrypt 比较哈希密码)
    const isPasswordValid = await bcrypt.compare(password, user.password_hash);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: '用户名或密码错误'
      });
    }

    // 登录成功
    res.json({
      success: true,
      data: {
        id: user.id,
        username: user.username,
        displayName: user.display_name,
        role: user.role || 'user',
        token: `token-${Date.now()}-${user.id}`,
        mode: 'mysql'
      },
      message: '登录成功'
    });

  } catch (error) {
    console.error('登录接口错误:', error);

    res.status(500).json({
      success: false,
      message: '服务器错误: ' + error.message
    });
  }
});

/**
 * GET /api/auth/users
 * 获取用户列表(仅管理员)
 */
router.get('/users', async (req, res) => {
  try {
    const [rows] = await pool.execute(
      'SELECT id, username, display_name, role FROM app_users ORDER BY id'
    );

    res.json({
      success: true,
      data: rows
    });
  } catch (error) {
    console.error('获取用户列表失败:', error);
    res.status(500).json({
      success: false,
      message: '服务器错误'
    });
  }
});

/**
 * POST /api/auth/users
 * 添加新用户(仅管理员)
 */
router.post('/users', async (req, res) => {
  try {
    const { username, displayName, password, role } = req.body;

    // 验证必填字段
    if (!username || !displayName || !password) {
      return res.status(400).json({
        success: false,
        message: '用户名、显示名称和密码不能为空'
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: '密码长度至少6位'
      });
    }

    // 验证用户名格式
    if (!/^[a-zA-Z0-9_]+$/.test(username)) {
      return res.status(400).json({
        success: false,
        message: '用户名只能包含英文字母、数字和下划线'
      });
    }

    // 检查用户名是否已存在
    const [existing] = await pool.execute(
      'SELECT id FROM app_users WHERE username = ?',
      [username]
    );

    if (existing.length > 0) {
      return res.status(400).json({
        success: false,
        message: '用户名已存在'
      });
    }

    // 加密密码
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    // 插入新用户
    const [result] = await pool.execute(
      'INSERT INTO app_users (username, password_hash, display_name, role, _openid) VALUES (?, ?, ?, ?, ?)',
      [username, passwordHash, displayName, role || 'user', '']
    );

    res.json({
      success: true,
      message: '用户添加成功',
      data: {
        id: result.insertId,
        username,
        displayName,
        role: role || 'user'
      }
    });

  } catch (error) {
    console.error('添加用户失败:', error);
    res.status(500).json({
      success: false,
      message: '服务器错误: ' + error.message
    });
  }
});

/**
 * PUT /api/auth/users/:username
 * 更新用户信息(仅管理员)
 */
router.put('/users/:username', async (req, res) => {
  try {
    const { username } = req.params;
    const { displayName, role, password } = req.body;

    if (!displayName) {
      return res.status(400).json({
        success: false,
        message: '显示名称不能为空'
      });
    }

    // 检查用户是否存在
    const [existing] = await pool.execute(
      'SELECT id FROM app_users WHERE username = ?',
      [username]
    );

    if (existing.length === 0) {
      return res.status(404).json({
        success: false,
        message: '用户不存在'
      });
    }

    // 构建更新SQL
    let updateQuery = 'UPDATE app_users SET display_name = ?, role = ?';
    let updateParams = [displayName, role || 'user'];

    // 如果提供了新密码，则更新密码
    if (password && password.length > 0) {
      if (password.length < 6) {
        return res.status(400).json({
          success: false,
          message: '密码长度至少6位'
        });
      }
      const saltRounds = 10;
      const passwordHash = await bcrypt.hash(password, saltRounds);
      updateQuery += ', password_hash = ?';
      updateParams.push(passwordHash);
    }

    updateQuery += ' WHERE username = ?';
    updateParams.push(username);

    await pool.execute(updateQuery, updateParams);

    res.json({
      success: true,
      message: '用户信息更新成功',
      data: { username, displayName, role: role || 'user' }
    });

  } catch (error) {
    console.error('更新用户失败:', error);
    res.status(500).json({
      success: false,
      message: '服务器错误: ' + error.message
    });
  }
});

/**
 * DELETE /api/auth/users/:username
 * 删除用户(仅管理员)
 */
router.delete('/users/:username', async (req, res) => {
  try {
    const { username } = req.params;

    // 不允许删除admin用户
    if (username === 'admin') {
      return res.status(400).json({
        success: false,
        message: '不能删除系统管理员账户'
      });
    }

    // 检查用户是否存在
    const [existing] = await pool.execute(
      'SELECT id FROM app_users WHERE username = ?',
      [username]
    );

    if (existing.length === 0) {
      return res.status(404).json({
        success: false,
        message: '用户不存在'
      });
    }

    // 删除用户
    await pool.execute(
      'DELETE FROM app_users WHERE username = ?',
      [username]
    );

    res.json({
      success: true,
      message: '用户删除成功'
    });

  } catch (error) {
    console.error('删除用户失败:', error);
    res.status(500).json({
      success: false,
      message: '服务器错误: ' + error.message
    });
  }
});

module.exports = router;
