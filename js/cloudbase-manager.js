const API_BASE_URL = '/api';

class ShopManager {
  constructor() {
    this.currentUser = null;
    this.shops = [];
    this.init();
  }

  async init() {
    try {
      console.log('🔄 初始化ShopHub...');

      this.showLoginInterface();
      console.log('✅ 系统初始化完成');
    } catch (error) {
      console.error('❌ 初始化失败:', error);
      alert('系统初始化失败,请刷新页面重试');
    }
  }

  showLoginInterface() {
    const appContainer = document.getElementById('app-container');
    if (!appContainer) return;

    appContainer.innerHTML = `
      <div class="login-container">
        <div class="login-box">
          <h1>ShopHub</h1>
          <div class="login-form">
            <div class="form-group">
              <label for="username">用户名</label>
              <input type="text" id="username" placeholder="请输入用户名" autocomplete="username">
            </div>
            <div class="form-group">
              <label for="password">密码</label>
              <input type="password" id="password" placeholder="请输入密码" autocomplete="current-password">
            </div>
            <button class="btn-login" onclick="window.shopManager.handleLogin()">登录</button>
            <div id="login-error" class="error-message"></div>
          </div>
        </div>
      </div>
    `;

    document.getElementById('password').addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        this.handleLogin();
      }
    });
  }

  async handleLogin() {
    const username = document.getElementById('username').value.trim();
    const password = document.getElementById('password').value.trim();
    const errorDiv = document.getElementById('login-error');

    if (!username || !password) {
      errorDiv.textContent = '请输入用户名和密码';
      return;
    }

    try {
      errorDiv.textContent = '登录中...';

      const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ username, password })
      });

      const result = await response.json();

      if (result.success) {
        this.currentUser = result.data;
        this.showMainInterface();
        await this.loadShops();
      } else {
        errorDiv.textContent = result.message || '用户名或密码错误';
      }
    } catch (error) {
      console.error('登录失败:', error);
      errorDiv.textContent = '服务器连接失败,请稍后重试';
    }
  }

  showMainInterface() {
    const appContainer = document.getElementById('app-container');
    appContainer.innerHTML = `
      <header class="main-header">
        <h1>ShopHub</h1>
        <div class="user-info">
          <span>欢迎, ${this.currentUser.displayName || this.currentUser.username}</span>
          <button class="btn-logout" onclick="window.shopManager.handleLogout()">退出登录</button>
        </div>
      </header>

      <div class="filter-bar">
        <div class="filter-group">
          <label>店铺等级:</label>
          <select id="grade-filter" onchange="window.shopManager.filterShops()">
            <option value="">全部</option>
            <option value="A">A级</option>
            <option value="B">B级</option>
            <option value="C">C级</option>
          </select>
        </div>
        <div class="search-group">
          <input type="text" id="search-input" placeholder="搜索店铺名称或编号..." oninput="window.shopManager.filterShops()">
        </div>
      </div>

      <div class="stats-bar">
        <span id="shop-count">共 0 家店铺</span>
      </div>

      <div id="shop-container" class="shop-grid"></div>
    `;
  }

  async loadShops() {
    try {
      console.log('📦 加载店铺数据...');

      const response = await fetch(`${API_BASE_URL}/shops`);
      const result = await response.json();

      if (result.success) {
        this.shops = result.data || [];
        console.log(`✅ 成功加载 ${this.shops.length} 个店铺`);
      } else {
        console.warn('⚠️ 加载店铺失败:', result.message);
        this.shops = [];
      }

      this.renderShops(this.shops);
      this.updateStats();
    } catch (error) {
      console.error('❌ 加载店铺失败:', error);
      this.shops = [];
      this.renderShops([]);
      this.updateStats();
    }
  }

  filterShops() {
    const gradeFilter = document.getElementById('grade-filter').value;
    const searchText = document.getElementById('search-input').value.toLowerCase();

    let filtered = this.shops;

    if (gradeFilter) {
      filtered = filtered.filter(shop => shop.grade === gradeFilter);
    }

    if (searchText) {
      filtered = filtered.filter(shop =>
        shop.name.toLowerCase().includes(searchText) ||
        shop.number.toLowerCase().includes(searchText)
      );
    }

    this.renderShops(filtered);
    this.updateStats(filtered.length);
  }

  renderShops(shops) {
    const container = document.getElementById('shop-container');
    if (!container) return;

    if (shops.length === 0) {
      container.innerHTML = '<div class="empty-state">暂无店铺数据</div>';
      return;
    }

    container.innerHTML = shops.map(shop => `
      <div class="shop-card grade-${shop.grade.toLowerCase()}">
        <div class="shop-header">
          <h3>${shop.name}</h3>
          <span class="grade-badge grade-${shop.grade.toLowerCase()}">${shop.grade}级</span>
        </div>
        <div class="shop-info">
          <p><strong>编号:</strong> ${shop.number}</p>
          <p><strong>ID:</strong> ${shop._id || shop.id}</p>
        </div>
      </div>
    `).join('');
  }

  updateStats(count) {
    const countElement = document.getElementById('shop-count');
    if (countElement) {
      countElement.textContent = `共 ${count !== undefined ? count : this.shops.length} 家店铺`;
    }
  }

  async handleLogout() {
    try {
      this.currentUser = null;
      this.shops = [];
      this.showLoginInterface();
      console.log('✅ 退出登录成功');
    } catch (error) {
      console.error('❌ 退出失败:', error);
      alert('退出失败,请刷新页面');
    }
  }
}

window.shopManager = new ShopManager();
