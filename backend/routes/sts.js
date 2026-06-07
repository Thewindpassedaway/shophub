const express = require('express');
const router = express.Router();
const STS = require('qcloud-cos-sts');
const config = require('../config');

/**
 * GET /api/sts/temp-credentials
 * 获取腾讯云临时密钥 (STS)
 */
router.get('/temp-credentials', async (req, res) => {
  try {
    // 配置临时密钥参数
    const stsConfig = {
      secretId: config.CLOUDBASE.SECRET_ID,     // 固定密钥 ID
      secretKey: config.CLOUDBASE.SECRET_KEY,   // 固定密钥 Key
      durationSeconds: 7200,                    // 临时密钥有效期，单位秒（2小时）
      scope: null                               // 不指定资源，使用 policy
    };

    // 定义权限策略
    const policy = {
      version: '2.0',
      statement: [
        {
          action: [
            // CloudBase 相关权限
            'tcb:DescribeCloudBaseRunService',
            'tcb:DescribeCloudBaseRunVersions',
            'tcb:InvokeCloudBaseRunService',
            // 根据需要添加更多权限
            'cos:GetObject',
            'cos:PutObject',
            'cos:DeleteObject'
          ],
          effect: 'allow',
          resource: [
            '*'  // 可以限制为特定资源，如 'qcs::cos:*:*/*'
          ]
        }
      ]
    };

    stsConfig.policy = policy;

    // 获取临时密钥
    STS.getCredential(stsConfig, (err, result) => {
      if (err) {
        console.error('获取临时密钥失败:', err);
        return res.status(500).json({
          success: false,
          message: '获取临时密钥失败: ' + err.message
        });
      }

      // 返回临时密钥
      res.json({
        success: true,
        data: {
          tmpSecretId: result.credentials.tmpSecretId,
          tmpSecretKey: result.credentials.tmpSecretKey,
          sessionToken: result.credentials.sessionToken,
          expiredTime: result.expiredTime,
          expiration: result.expiration,
          startTime: result.startTime
        },
        message: '临时密钥获取成功'
      });
    });

  } catch (error) {
    console.error('临时密钥接口错误:', error);
    res.status(500).json({
      success: false,
      message: '服务器错误: ' + error.message
    });
  }
});

module.exports = router;
