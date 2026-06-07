const express = require('express');
const router = express.Router();
const mysql = require('mysql2/promise');
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
 * GET /api/shops
 * 获取店铺列表
 */
router.get('/', async (req, res) => {
  try {
    const { grade, search } = req.query;

    let query = 'SELECT id, name, number, grade FROM app_shop_list WHERE 1=1';
    const params = [];

    if (grade) {
      query += ' AND grade = ?';
      params.push(grade);
    }

    if (search) {
      query += ' AND (name LIKE ? OR number LIKE ?)';
      params.push(`%${search}%`, `%${search}%`);
    }

    query += ' ORDER BY grade, number';

    const [rows] = await pool.execute(query, params);

    res.json({
      success: true,
      data: rows,
      total: rows.length
    });

  } catch (error) {
    console.error('获取店铺列表失败:', error);
    res.status(500).json({
      success: false,
      message: '服务器错误: ' + error.message
    });
  }
});

/**
 * POST /api/shops
 * 添加新店铺
 */
router.post('/', async (req, res) => {
  try {
    const { number, name, grade } = req.body;

    if (!number || !name || !grade) {
      return res.status(400).json({
        success: false,
        message: '请填写完整信息'
      });
    }

    // 检查店铺编号是否已存在
    const [existing] = await pool.execute(
      'SELECT id FROM app_shop_list WHERE number = ?',
      [number]
    );

    if (existing.length > 0) {
      return res.status(400).json({
        success: false,
        message: '店铺编号已存在'
      });
    }

    // 插入新店铺（_openid 设置为空字符串）
    const [result] = await pool.execute(
      'INSERT INTO app_shop_list (number, name, grade, _openid) VALUES (?, ?, ?, ?)',
      [number, name, grade, '']
    );

    res.json({
      success: true,
      message: '店铺添加成功',
      data: { id: result.insertId, number, name, grade }
    });

  } catch (error) {
    console.error('添加店铺失败:', error);
    res.status(500).json({
      success: false,
      message: '服务器错误: ' + error.message
    });
  }
});

/**
 * PUT /api/shops/:id
 * 更新店铺信息
 */
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { number, name, grade } = req.body;

    if (!number || !name || !grade) {
      return res.status(400).json({
        success: false,
        message: '请填写完整信息'
      });
    }

    // 检查店铺是否存在
    const [existing] = await pool.execute(
      'SELECT id FROM app_shop_list WHERE id = ?',
      [id]
    );

    if (existing.length === 0) {
      return res.status(404).json({
        success: false,
        message: '店铺不存在'
      });
    }

    // 检查店铺编号是否与其他店铺重复
    const [duplicate] = await pool.execute(
      'SELECT id FROM app_shop_list WHERE number = ? AND id != ?',
      [number, id]
    );

    if (duplicate.length > 0) {
      return res.status(400).json({
        success: false,
        message: '店铺编号已存在'
      });
    }

    // 更新店铺
    await pool.execute(
      'UPDATE app_shop_list SET number = ?, name = ?, grade = ? WHERE id = ?',
      [number, name, grade, id]
    );

    res.json({
      success: true,
      message: '店铺更新成功',
      data: { id, number, name, grade }
    });

  } catch (error) {
    console.error('更新店铺失败:', error);
    res.status(500).json({
      success: false,
      message: '服务器错误: ' + error.message
    });
  }
});

/**
 * DELETE /api/shops/:id
 * 删除店铺
 */
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // 检查店铺是否存在
    const [existing] = await pool.execute(
      'SELECT id FROM app_shop_list WHERE id = ?',
      [id]
    );

    if (existing.length === 0) {
      return res.status(404).json({
        success: false,
        message: '店铺不存在'
      });
    }
    
    // 检查该店铺是否有检查记录
    const [checkRecords] = await pool.execute(
      'SELECT COUNT(*) as count FROM shop_checks WHERE shopId = ?',
      [id]
    );
    
    const recordCount = checkRecords[0].count;
    
    // 删除店铺(注意：不会删除shop_checks中的检查记录，保留历史记录)
    await pool.execute(
      'DELETE FROM app_shop_list WHERE id = ?',
      [id]
    );
    
    console.log(`店铺${id}已删除，该店铺的检查记录${recordCount}条已保留`);

    res.json({
      success: true,
      message: '店铺删除成功，检查记录已保留',
      data: { recordCount }
    });

  } catch (error) {
    console.error('删除店铺失败:', error);
    res.status(500).json({
      success: false,
      message: '服务器错误: ' + error.message
    });
  }
});

module.exports = router;
