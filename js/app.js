const API_BASE_URL = '/api';

class ShopManager {
  constructor() {
    this.currentUser = null;
    this.shops = [];
    this.currentGrade = '';
    this.currentView = 'home';
    this.init();
  }

  async init() {
    console.log(' 初始化ShopHub...');
    this.showLoginInterface();
  }

  showLoginInterface() {
    const appContainer = document.getElementById('app-container');
    appContainer.innerHTML = `
      <div class="login-view">
        <div class="login-card">
          <div class="login-logo">
            <span class="emoji">🏪</span>
            <h1>ShopHub</h1>
            <p>请登录后使用</p>
          </div>
          <div class="login-form">
            <input type="text" class="login-input" id="username" placeholder="用户名">
            <input type="password" class="login-input" id="password" placeholder="密码">
            <button class="login-btn" onclick="window.shopManager.handleLogin()">登 录</button>
            <div class="login-error" id="login-error"></div>
          </div>
        </div>
      </div>
    `;

    document.getElementById('password').addEventListener('keypress', (e) => {
      if (e.key === 'Enter') this.handleLogin();
    });
  }

  async handleLogin() {
    const username = document.getElementById('username').value.trim();
    const password = document.getElementById('password').value.trim();
    const errorDiv = document.getElementById('login-error');

    if (!username || !password) {
      errorDiv.textContent = '请输入用户名和密码';
      errorDiv.classList.add('show');
      return;
    }

    try {
      errorDiv.textContent = '登录中...';
      errorDiv.classList.add('show');

      const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
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
      errorDiv.textContent = '无法连接后端服务';
    }
  }

  showMainInterface() {
    this.currentView = 'home';
    const appContainer = document.getElementById('app-container');
    appContainer.innerHTML = `
      <div class="header">
        <button class="logout-btn" onclick="window.shopManager.handleLogout()">退出</button>
        <h1> ShopHub</h1>
        <div class="header-small">欢迎, ${this.currentUser.displayName || this.currentUser.username}</div>
      </div>

      <div class="search-bar">
        <input type="text" class="search-input" id="searchInput" placeholder="搜索店铺名称或编号..." oninput="window.shopManager.filterShops()">
      </div>

      <div class="grade-section">
        <div class="grade-title">请选择店铺等级</div>
        <div class="grade-buttons">
          <button class="grade-btn grade-a" onclick="window.shopManager.selectGrade('A')">
            A级
            <span>优秀</span>
          </button>
          <button class="grade-btn grade-b" onclick="window.shopManager.selectGrade('B')">
            B级
            <span>良好</span>
          </button>
          <button class="grade-btn grade-c" onclick="window.shopManager.selectGrade('C')">
            C级
            <span>一般</span>
          </button>
        </div>
      </div>

      <div class="stats-bar">
        <span id="shop-count">共 0 家店铺</span>
      </div>

      <div id="shopListContainer" class="shop-list"></div>

      <nav class="nav-bar">
        <button class="nav-item ${this.currentView === 'home' ? 'active' : ''}" onclick="window.shopManager.navigate('home')">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
            <polyline points="9 22 9 12 15 12 15 22"></polyline>
          </svg>
          <div>首页</div>
        </button>
        <button class="nav-item ${this.currentView === 'admin' ? 'active' : ''}" onclick="window.shopManager.navigate('admin')">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="3"></circle>
            <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9c.26.604.852.997 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
          </svg>
          <div>管理</div>
        </button>
        <button class="nav-item ${this.currentView === 'records' ? 'active' : ''}" onclick="window.shopManager.navigate('records')">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
            <polyline points="14 2 14 8 20 8"></polyline>
            <line x1="16" y1="13" x2="8" y2="13"></line>
            <line x1="16" y1="17" x2="8" y2="17"></line>
          </svg>
          <div>记录</div>
        </button>
      </nav>
    `;
  }

  async showAdminInterface() {
    this.currentView = 'admin';
    const appContainer = document.getElementById('app-container');
    const isAdmin = this.currentUser.role === 'admin';

    appContainer.innerHTML = `
      <div class="header">
        <button class="logout-btn" onclick="window.shopManager.handleLogout()">退出</button>
        <h1>⚙️ 管理后台</h1>
        <div class="header-small">${isAdmin ? '管理员权限' : '普通用户'}</div>
      </div>

      <div class="admin-section">
        <div class="section-header">
          <span class="section-icon">👥</span>
          <h3>用户管理</h3>
        </div>
        <div class="admin-buttons">
          <button class="admin-btn" onclick="window.shopManager.showUserList()">用户列表</button>
          ${isAdmin ? '<button class="admin-btn" onclick="window.shopManager.showDataHistory()">数据历史</button>' : ''}
          <button class="admin-btn export-btn" onclick="window.shopManager.exportExcel()">导出Excel</button>
        </div>
      </div>

      <div class="grade-section">
        <div class="grade-title">选择要管理的店铺等级</div>
        <div class="grade-buttons">
          <button class="grade-btn grade-a" onclick="window.shopManager.manageGrade('A')">
            A级
            <span>管理</span>
          </button>
          <button class="grade-btn grade-b" onclick="window.shopManager.manageGrade('B')">
            B级
            <span>管理</span>
          </button>
          <button class="grade-btn grade-c" onclick="window.shopManager.manageGrade('C')">
            C级
            <span>管理</span>
          </button>
        </div>
      </div>

      <nav class="nav-bar">
        <button class="nav-item" onclick="window.shopManager.navigate('home')">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
            <polyline points="9 22 9 12 15 12 15 22"></polyline>
          </svg>
          <div>首页</div>
        </button>
        <button class="nav-item active" onclick="window.shopManager.navigate('admin')">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="3"></circle>
            <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9c.26.604.852.997 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
          </svg>
          <div>管理</div>
        </button>
        <button class="nav-item" onclick="window.shopManager.navigate('records')">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
            <polyline points="14 2 14 8 20 8"></polyline>
            <line x1="16" y1="13" x2="8" y2="13"></line>
            <line x1="16" y1="17" x2="8" y2="17"></line>
          </svg>
          <div>记录</div>
        </button>
      </nav>
    `;
  }

  selectGrade(grade) {
    this.currentGrade = grade;
    document.querySelectorAll('.grade-btn').forEach(btn => btn.classList.remove('selected'));
    event.target.closest('.grade-btn').classList.add('selected');
    this.filterShops();
  }

  manageGrade(grade) {
    this.currentGrade = grade;
    alert(`管理${grade}级店铺（功能开发中）`);
  }

  navigate(view) {
    this.currentView = view;
    if (view === 'home') {
      this.showMainInterface();
      this.loadShops();
    } else if (view === 'admin') {
      this.showAdminInterface();
    } else if (view === 'records') {
      alert('记录页面（功能开发中）');
    }
  }

  showUserList() {
    alert('用户列表（功能开发中）');
  }

  showDataHistory() {
    alert('数据历史（功能开发中）');
  }

  exportExcel() {
    alert('导出Excel（功能开发中）');
  }

  async loadShops() {
    try {
      const params = new URLSearchParams();
      if (this.currentGrade) params.append('grade', this.currentGrade);

      const response = await fetch(`${API_BASE_URL}/shops?${params}`);
      const result = await response.json();

      if (result.success) {
        this.shops = result.data || [];
        this.renderShops(this.shops);
        this.updateStats();
      }
    } catch (error) {
      console.error('加载店铺失败:', error);
      this.shops = [];
      this.renderShops([]);
    }
  }

  filterShops() {
    const searchText = document.getElementById('searchInput')?.value.toLowerCase() || '';
    let filtered = this.shops;

    if (this.currentGrade) {
      filtered = filtered.filter(shop => shop.grade === this.currentGrade);
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
    const container = document.getElementById('shopListContainer');
    if (!container) return;

    if (shops.length === 0) {
      container.innerHTML = `
        <div class="empty-state">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
          </svg>
          <p>暂无店铺数据</p>
        </div>
      `;
      return;
    }

    container.innerHTML = shops.map(shop => `
      <div class="shop-item">
        <div class="shop-item-left">
          <div class="shop-item-name">${shop.name}</div>
          <div class="shop-item-number">店铺号: ${shop.number}</div>
        </div>
        <span class="shop-grade-badge grade-badge-${shop.grade.toLowerCase()}">${shop.grade}级</span>
      </div>
    `).join('');
  }

  updateStats(count) {
    const countElement = document.getElementById('shop-count');
    if (countElement) {
      countElement.textContent = `共 ${count !== undefined ? count : this.shops.length} 家店铺`;
    }
  }

  handleLogout() {
    this.currentUser = null;
    this.shops = [];
    this.currentGrade = '';
    this.currentView = 'home';
    this.showLoginInterface();
  }
}

window.shopManager = new ShopManager();
