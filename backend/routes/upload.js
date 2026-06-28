const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const COS = require('cos-nodejs-sdk-v5');
require('dotenv').config();

// 配置腾讯云 COS
const cos = new COS({
  SecretId: process.env.TENCENT_SECRET_ID,
  SecretKey: process.env.TENCENT_SECRET_KEY,
});

const COS_BUCKET = process.env.COS_BUCKET || 'shophub-1309231456';
const COS_REGION = process.env.COS_REGION || 'ap-guangzhou';
const COS_PROTOCOL = process.env.COS_PROTOCOL || 'https';

// 配置存储
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    // 创建 uploads 目录
    const uploadDir = path.join(__dirname, '..', 'uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    // 生成唯一文件名: timestamp-random.ext
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, uniqueSuffix + ext);
  }
});

// 文件过滤器
const fileFilter = (req, file, cb) => {
  // 只允许图片文件
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('只允许上传图片文件'), false);
  }
};

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024 // 限制5MB
  }
});

/**
 * POST /api/upload
 * 上传图片文件到腾讯云 COS
 */
router.post('/', upload.single('image'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: '没有上传文件'
      });
    }

    // 读取本地文件
    const filePath = req.file.path;
    const fileName = req.file.filename;
    const fileContent = fs.readFileSync(filePath);

    // 上传到腾讯云 COS
    cos.putObject({
      Bucket: COS_BUCKET,
      Region: COS_REGION,
      Key: `uploads/${fileName}`, // 存储路径
      Body: fileContent,
    }, (err, data) => {
      // 删除本地临时文件
      fs.unlinkSync(filePath);

      if (err) {
        console.error('COS 上传失败:', err);
        return res.status(500).json({
          success: false,
          message: '图片上传到云端失败: ' + err.message
        });
      }

      // 生成完整的 COS URL
      const imageUrl = `${COS_PROTOCOL}://${COS_BUCKET}.cos.${COS_REGION}.myqcloud.com/uploads/${fileName}`;

      res.json({
        success: true,
        data: {
          filename: fileName,
          originalname: req.file.originalname,
          size: req.file.size,
          url: imageUrl, // 返回完整的 COS URL
          mimetype: req.file.mimetype
        },
        message: '图片上传成功'
      });
    });

  } catch (error) {
    console.error('图片上传失败:', error);
    res.status(500).json({
      success: false,
      message: '图片上传失败: ' + error.message
    });
  }
});

module.exports = router;
