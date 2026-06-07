/**
 * 腾讯云临时密钥管理器
 * 自动获取和刷新临时密钥
 */
class TempKeyManager {
  constructor() {
    this.tempCredentials = null;
    this.refreshTimer = null;
    this.API_BASE_URL = 'http://localhost:3000/api';
  }

  /**
   * 获取临时密钥
   */
  async getTempCredentials(forceRefresh = false) {
    // 如果已有有效密钥且不强制刷新，直接返回
    if (!forceRefresh && this.tempCredentials && this.isCredentialsValid()) {
      return this.tempCredentials;
    }

    try {
      console.log('🔄 正在获取临时密钥...');
      
      const response = await fetch(`${this.API_BASE_URL}/sts/temp-credentials`);
      const result = await response.json();

      if (!result.success) {
        throw new Error(result.message || '获取临时密钥失败');
      }

      this.tempCredentials = result.data;
      
      // 设置自动刷新（在过期前5分钟刷新）
      this.scheduleRefresh();
      
      console.log('✅ 临时密钥获取成功，有效期至:', new Date(this.tempCredentials.expiration).toLocaleString());
      
      return this.tempCredentials;
    } catch (error) {
      console.error('❌ 获取临时密钥失败:', error);
      throw error;
    }
  }

  /**
   * 检查当前密钥是否有效
   */
  isCredentialsValid() {
    if (!this.tempCredentials) {
      return false;
    }

    const now = Math.floor(Date.now() / 1000);
    const expiredTime = this.tempCredentials.expiredTime;
    
    // 提前5分钟判断为无效，避免边界情况
    return now < (expiredTime - 300);
  }

  /**
   * 安排自动刷新
   */
  scheduleRefresh() {
    // 清除之前的定时器
    if (this.refreshTimer) {
      clearTimeout(this.refreshTimer);
    }

    if (!this.tempCredentials) {
      return;
    }

    const now = Math.floor(Date.now() / 1000);
    const expiredTime = this.tempCredentials.expiredTime;
    
    // 计算刷新时间（过期前5分钟）
    const refreshDelay = Math.max((expiredTime - now - 300) * 1000, 1000);
    
    console.log(`⏰ 计划在 ${Math.floor(refreshDelay / 1000)} 秒后刷新临时密钥`);
    
    this.refreshTimer = setTimeout(() => {
      console.log('🔄 自动刷新临时密钥...');
      this.getTempCredentials(true);
    }, refreshDelay);
  }

  /**
   * 获取 CloudBase SDK 配置
   */
  async getCloudbaseConfig() {
    const credentials = await this.getTempCredentials();
    
    return {
      env: 'shopdata-d7g3puonddd82282c',
      secretId: credentials.tmpSecretId,
      secretKey: credentials.tmpSecretKey,
      sessionToken: credentials.sessionToken
    };
  }

  /**
   * 清理资源
   */
  destroy() {
    if (this.refreshTimer) {
      clearTimeout(this.refreshTimer);
      this.refreshTimer = null;
    }
    this.tempCredentials = null;
  }
}

// 创建全局实例
window.tempKeyManager = new TempKeyManager();
