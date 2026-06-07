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
 * POST /api/checks
 * 提交检查记录
 */
router.post('/', async (req, res) => {
  try {
    const {
      shopId,
      serial,
      checkTime,
      inspector,
      problems
    } = req.body;

    if (!shopId || !inspector) {
      return res.status(400).json({
        success: false,
        message: '店铺ID和检查人不能为空'
      });
    }

    // 验证每个问题（如果有问题的话）
    if (problems && problems.length > 0) {
      for (let i = 0; i < problems.length; i++) {
        const problem = problems[i];
        if (!problem.description || !problem.location || !problem.risk || !problem.status) {
          return res.status(400).json({
            success: false,
            message: `问题 ${i + 1} 的必填字段未填写完整`
          });
        }
        
        // 如果是已整改状态，验证整改信息
        if (problem.status === 'completed' && problem.rectification) {
          const rect = problem.rectification;
          if (!rect.time || !rect.confirmer || rect.completed === undefined) {
            return res.status(400).json({
              success: false,
              message: `问题 ${i + 1} 的整改信息未填写完整`
            });
          }
        }
      }
    }

    const result = await pool.execute(
      'INSERT INTO shop_checks (shopId, serial, checkTime, inspector, problems, problemCount, submitTime) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [
        shopId,
        serial || '',
        checkTime ? new Date(checkTime) : new Date(),
        inspector,
        JSON.stringify(problems || []),
        problems.length,
        new Date()
      ]
    );

    res.json({
      success: true,
      data: { id: result[0].insertId, problemCount: problems.length },
      message: '检查记录提交成功'
    });

  } catch (error) {
    console.error('提交检查记录失败:', error);
    res.status(500).json({
      success: false,
      message: '服务器错误: ' + error.message
    });
  }
});

/**
 * GET /api/checks
 * 获取检查记录列表
 */
router.get('/', async (req, res) => {
  try {
    const { year, month, status } = req.query;
    
    let query = 'SELECT * FROM shop_checks WHERE isDeleted = 0';
    const params = [];
    const conditions = [];
    
    // 按年月筛选
    if (year && month) {
      conditions.push('YEAR(checkTime) = ? AND MONTH(checkTime) = ?');
      params.push(parseInt(year), parseInt(month));
    } else if (year) {
      conditions.push('YEAR(checkTime) = ?');
      params.push(parseInt(year));
    }
    
    // 按整改状态筛选
    if (status) {
      if (status === 'completed') {
        conditions.push("JSON_CONTAINS(problems, '{\"status\": \"completed\"}', '$[*]')");
      } else if (status === 'pending') {
        conditions.push("NOT JSON_CONTAINS(problems, '{\"status\": \"completed\"}', '$[*]')");
      }
    }
    
    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
    }
    
    query += ' ORDER BY checkTime DESC';
    
    const [rows] = await pool.execute(query, params);

    // 解析 JSON 字段
    const data = rows.map(row => ({
      ...row,
      problems: typeof row.problems === 'string' ? JSON.parse(row.problems) : row.problems
    }));

    res.json({
      success: true,
      data: data,
      total: data.length
    });

  } catch (error) {
    console.error('获取检查记录失败:', error);
    res.status(500).json({
      success: false,
      message: '服务器错误: ' + error.message
    });
  }
});

/**
 * PUT /api/checks/:id
 * 更新检查记录（修改/复查）
 */
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const {
      serial,
      checkTime,
      inspector,
      problems
    } = req.body;

    if (!inspector) {
      return res.status(400).json({
        success: false,
        message: '检查人不能为空'
      });
    }

    // 验证每个问题（如果有问题的话）
    if (problems && problems.length > 0) {
      for (let i = 0; i < problems.length; i++) {
        const problem = problems[i];
        if (!problem.description || !problem.location || !problem.risk || !problem.status) {
          return res.status(400).json({
            success: false,
            message: `问题 ${i + 1} 的必填字段未填写完整`
          });
        }
        
        // 如果是已整改状态，验证整改信息
        if (problem.status === 'completed' && problem.rectification) {
          const rect = problem.rectification;
          if (!rect.time || !rect.confirmer || rect.completed === undefined) {
            return res.status(400).json({
              success: false,
              message: `问题 ${i + 1} 的整改信息未填写完整`
            });
          }
        }
      }
    }

    // 先查询原记录
    const [rows] = await pool.execute('SELECT * FROM shop_checks WHERE id = ?', [id]);
    
    if (rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: '检查记录不存在'
      });
    }

    // 更新记录
    await pool.execute(
      'UPDATE shop_checks SET serial = ?, checkTime = ?, inspector = ?, problems = ?, problemCount = ? WHERE id = ?',
      [
        serial || '',
        checkTime ? new Date(checkTime) : new Date(),
        inspector,
        JSON.stringify(problems || []),
        problems.length,
        id
      ]
    );

    res.json({
      success: true,
      data: { id: parseInt(id), problemCount: problems.length },
      message: '检查记录更新成功'
    });

  } catch (error) {
    console.error('更新检查记录失败:', error);
    res.status(500).json({
      success: false,
      message: '服务器错误: ' + error.message
    });
  }
});

/**
 * DELETE /api/checks/:id
 * 删除单条检查记录（软删除）
 */
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    // 软删除：标记为已删除，而不是真正删除
    await pool.execute('UPDATE shop_checks SET isDeleted = 1 WHERE id = ?', [id]);
    
    res.json({
      success: true,
      message: '检查记录已删除（可在数据历史中查看和恢复）'
    });
    
  } catch (error) {
    console.error('删除检查记录失败:', error);
    res.status(500).json({
      success: false,
      message: '服务器错误: ' + error.message
    });
  }
});

/**
 * DELETE /api/checks
 * 批量删除检查记录(按年月)（软删除）
 */
router.delete('/', async (req, res) => {
  try {
    const { year, month } = req.body;
    
    if (!year) {
      return res.status(400).json({
        success: false,
        message: '请提供年份'
      });
    }
    
    let query = 'UPDATE shop_checks SET isDeleted = 1 WHERE YEAR(checkTime) = ? AND isDeleted = 0';
    const params = [parseInt(year)];
    
    if (month) {
      query = query.replace('AND isDeleted = 0', 'AND MONTH(checkTime) = ? AND isDeleted = 0');
      params.push(parseInt(month));
    }
    
    await pool.execute(query, params);
    
    res.json({
      success: true,
      message: month ? `${year}年${month}月的记录已删除（可在数据历史中查看）` : `${year}年的记录已删除（可在数据历史中查看）`
    });
    
  } catch (error) {
    console.error('清空检查记录失败:', error);
    res.status(500).json({
      success: false,
      message: '服务器错误: ' + error.message
    });
  }
});

/**
 * GET /api/checks/history
 * 获取数据历史（操作审计日志）
 */
router.get('/history', async (req, res) => {
  try {
    // 从 shop_checks 表查询所有操作记录（包含已删除的）
    const [operationLogs] = await pool.execute(`
      SELECT 
        id,
        shopId,
        serial,
        inspector,
        checkTime,
        problemCount,
        submitTime,
        isDeleted,
        CASE 
          WHEN submitTime = checkTime THEN '新增检查'
          ELSE '修改记录'
        END as actionType,
        problems
      FROM shop_checks
      ORDER BY submitTime DESC
    `);
    
    // 查询被删除的记录（如果有的话，需要单独的记录表）
    // 目前 shop_checks 只保留现有记录，删除的记录不在这里
    
    // 按月份统计（只统计未删除的）
    const [monthlyStats] = await pool.execute(`
      SELECT 
        YEAR(checkTime) as year,
        MONTH(checkTime) as month,
        COUNT(*) as totalRecords,
        SUM(problemCount) as totalProblems,
        COUNT(DISTINCT shopId) as totalShops,
        COUNT(DISTINCT inspector) as totalInspectors
      FROM shop_checks
      WHERE isDeleted = 0
      GROUP BY YEAR(checkTime), MONTH(checkTime)
      ORDER BY year DESC, month DESC
    `);
    
    // 按检查人统计（只统计未删除的）
    const [inspectorStats] = await pool.execute(`
      SELECT 
        inspector,
        COUNT(*) as checkCount,
        SUM(problemCount) as totalProblems
      FROM shop_checks
      WHERE isDeleted = 0
      GROUP BY inspector
      ORDER BY checkCount DESC
    `);
    res.json({
      success: true,
      data: {
        operationLogs: operationLogs.map(log => ({
          ...log,
          problems: typeof log.problems === 'string' ? JSON.parse(log.problems) : log.problems
        })),
        monthlyStats,
        inspectorStats
      },
      message: '数据历史加载成功'
    });
    
  } catch (error) {
    console.error('获取数据历史失败:', error);
    res.status(500).json({
      success: false,
      message: '服务器错误: ' + error.message
    });
  }
});

/**
 * GET /api/checks/history/backup
 * 获取某个时间点的备份数据（用于恢复）
 */
router.get('/history/backup/:recordId', async (req, res) => {
  try {
    const { recordId } = req.params;
    
    const [rows] = await pool.execute(
      'SELECT * FROM shop_checks WHERE id = ?',
      [recordId]
    );
    
    if (rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: '记录不存在'
      });
    }
    
    const record = rows[0];
    
    res.json({
      success: true,
      data: {
        ...record,
        problems: typeof record.problems === 'string' ? JSON.parse(record.problems) : record.problems
      },
      message: '备份数据获取成功'
    });
    
  } catch (error) {
    console.error('获取备份数据失败:', error);
    res.status(500).json({
      success: false,
      message: '服务器错误: ' + error.message
    });
  }
});

/**
 * POST /api/checks/history/restore
 * 恢复某个时间点的记录（软删除恢复）
 */
router.post('/history/restore', async (req, res) => {
  try {
    const { recordId } = req.body;
    
    if (!recordId) {
      return res.status(400).json({
        success: false,
        message: '记录ID不能为空'
      });
    }
    
    // 恢复记录：将isDeleted标记为0
    await pool.execute('UPDATE shop_checks SET isDeleted = 0 WHERE id = ?', [recordId]);
    
    res.json({
      success: true,
      message: '记录恢复成功'
    });
    
  } catch (error) {
    console.error('恢复记录失败:', error);
    res.status(500).json({
      success: false,
      message: '服务器错误: ' + error.message
    });
  }
});

module.exports = router;
