const API_BASE_URL = '/api';

class ShopManager {
  constructor() {
    this.currentUser = null;
    this.shops = [];
    this.users = [];
    this.records = [];
    this.currentGrade = '';
    this.currentView = 'home';
    this.manageGrade = '';
    this.editingShopId = null;
    this.editingUserId = null;
    this.checkingShopId = null;
    this.problemCount = 0;
    this.init();
  }

  // ==================== Toast 提示系统 ====================
  showToast(message, type = 'info', duration = 3000) {
    const container = document.getElementById('toastContainer');
    if (!container) return;

    const icons = {
      success: '✅',
      error: '❌',
      warning: '⚠️',
      info: 'ℹ️'
    };

    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.innerHTML = `
      <span class="toast-icon">${icons[type] || icons.info}</span>
      <div class="toast-content">
        <div class="toast-message">${message}</div>
      </div>
      <button class="toast-close" onclick="this.parentElement.remove()">&times;</button>
    `;

    container.appendChild(toast);

    // 自动移除
    setTimeout(() => {
      toast.style.animation = 'fadeOut 0.3s ease';
      setTimeout(() => toast.remove(), 300);
    }, duration);
  }

  async init() {
    console.log(' 初始化ShopHub...');
    console.log('API地址:', API_BASE_URL);
    
    const savedUser = localStorage.getItem('currentUser');
    if (savedUser) {
      this.currentUser = JSON.parse(savedUser);
      console.log(' 从本地存储恢复登录:', this.currentUser.username);
      
      // 先加载数据，再显示界面
      console.log(' 开始加载店铺数据...');
      await this.loadShops();
      console.log(' 数据加载完成，显示界面');
      this.showMainInterface();
    } else {
      console.log(' 未找到登录信息，显示登录页面');
      this.showLoginInterface();
    }
    
    // 添加全局点击事件，点击外部关闭导出下拉菜单
    document.addEventListener('click', (e) => {
      const exportDropdown = document.getElementById('exportDropdown');
      const exportButton = e.target.closest('.btn-export-all');
      const dropdownContent = e.target.closest('.dropdown-content');
      
      if (exportDropdown && !exportButton && !dropdownContent) {
        this.closeExportDropdown();
      }
    });
  }

  // ==================== 登录功能 ====================
  showLoginInterface() {
    const appContainer = document.getElementById('app-container');
    appContainer.innerHTML = `
      <div class="login-view">
        <div class="login-card">
          <div class="login-logo">
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
        localStorage.setItem('currentUser', JSON.stringify(result.data));
        
        // 先加载数据，再显示界面
        await this.loadShops();
        
        // 检查是否已同意过声明
        const hasAgreedToTerms = localStorage.getItem('shophub_terms_agreed');
        if (!hasAgreedToTerms) {
          // 首次登录，显示声明弹窗
          this.showCopyrightModal();
        } else {
          // 已同意过，直接显示主界面
          this.showMainInterface();
        }
      } else {
        errorDiv.textContent = result.message || '用户名或密码错误';
      }
    } catch (error) {
      errorDiv.textContent = '无法连接后端服务';
      console.error('登录失败:', error);
    }
  }

  handleLogout() {
    this.currentUser = null;
    this.shops = [];
    this.users = [];
    this.records = [];
    this.currentGrade = '';
    this.currentView = 'home';
    localStorage.removeItem('currentUser');
    this.showLoginInterface();
  }

  // ==================== 导航功能 ====================
  navigate(view) {
    this.currentView = view;
    if (view === 'home') {
      this.showMainInterface();
      // 确保数据已加载
      if (this.shops.length === 0) {
        this.loadShops();
      } else {
        this.renderShops(this.shops);
        this.updateStats();
      }
    } else if (view === 'admin') {
      this.showAdminInterface();
    } else if (view === 'records') {
      this.showRecordsInterface();
    }
  }

  // ==================== 首页功能 ====================
  showMainInterface() {
    this.currentView = 'home';
    const appContainer = document.getElementById('app-container');
    appContainer.innerHTML = this.buildMainHTML();
  }

  buildMainHTML() {
    return `
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
          <button class="grade-btn grade-a ${this.currentGrade === 'A' ? 'selected' : ''}" onclick="window.shopManager.selectGrade('A')">
            A级
            <span>优秀</span>
          </button>
          <button class="grade-btn grade-b ${this.currentGrade === 'B' ? 'selected' : ''}" onclick="window.shopManager.selectGrade('B')">
            B级
            <span>良好</span>
          </button>
          <button class="grade-btn grade-c ${this.currentGrade === 'C' ? 'selected' : ''}" onclick="window.shopManager.selectGrade('C')">
            C级
            <span>一般</span>
          </button>
        </div>
      </div>

      <div class="stats-bar">
        <span id="shop-count">共 ${this.shops.length} 家店铺</span>
      </div>

      <div id="shopListContainer" class="shop-list"></div>

      <nav class="nav-bar">
        <button class="nav-item active" onclick="window.shopManager.navigate('home')">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
            <polyline points="9 22 9 12 15 12 15 22"></polyline>
          </svg>
          <div>首页</div>
        </button>
        <button class="nav-item" onclick="window.shopManager.navigate('admin')">
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

      ${this.buildModals()}
    `;
  }

  async selectGrade(grade) {
    this.currentGrade = grade;
    
    // 显示加载状态
    const container = document.getElementById('shopListContainer');
    if (container) {
      container.innerHTML = '<div class="empty-state"><p>加载中...</p></div>';
    }
    
    // 重新加载对应等级的数据
    await this.loadShops();
    
    // 更新界面
    this.showMainInterface();
  }

  async loadShops() {
    try {
      console.log('📦 开始加载店铺数据...');
      console.log(' 当前视图:', this.currentView);
      console.log(' 当前等级筛选:', this.currentGrade || '无');
        
      const startTime = Date.now();
        
      const params = new URLSearchParams();
      if (this.currentGrade) params.append('grade', this.currentGrade);
  
      const url = `${API_BASE_URL}/shops?${params}`;
      console.log(' 请求URL:', url);
        
      const response = await fetch(url);
      console.log(' 响应状态:', response.status);
        
      const result = await response.json();
        
      const loadTime = Date.now() - startTime;
      console.log(`⏱️ 加载耗时: ${loadTime}ms`);
      console.log('📊 返回结果:', result);
      console.log('  success:', result.success);
      console.log('  data.length:', result.data ? result.data.length : 'undefined');
  
      if (result.success) {
        this.shops = result.data || [];
        console.log(`✅ 成功加载 ${this.shops.length} 个店铺`);
        console.log(' 前3个店铺:', this.shops.slice(0, 3));
          
        // 确保DOM已经存在，然后渲染
        if (this.currentView === 'home') {
          console.log(' 当前在首页，检查DOM后渲染');
          // 使用setTimeout确保DOM更新完成
          setTimeout(() => {
            this.renderShops(this.shops);
            this.updateStats();
            console.log(' 渲染完成');
          }, 100);
        } else {
          console.log(' 当前不在首页，暂不渲染');
        }
      } else {
        console.error('❌ 加载失败:', result.message);
      }
    } catch (error) {
      console.error('❌ 加载店铺失败:', error);
      console.error(' 错误详情:', error.message);
      this.shops = [];
      if (this.currentView === 'home') {
        setTimeout(() => {
          this.renderShops([]);
        }, 100);
      }
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
    console.log(' 渲染店铺列表...');
    console.log('  店铺数量:', shops.length);
    
    const container = document.getElementById('shopListContainer');
    console.log('  容器是否存在:', !!container);
    
    if (!container) {
      console.error('❌ 容器 shopListContainer 不存在！');
      return;
    }

    if (shops.length === 0) {
      console.log('  店铺为空，显示空状态');
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

    console.log('  开始生成HTML...');
    const html = shops.map(shop => `
      <div class="shop-item">
        <div class="shop-item-left">
          <div class="shop-item-name">${shop.name}</div>
          <div class="shop-item-number">店铺号: ${shop.number}</div>
        </div>
        <div class="shop-actions">
          <button class="btn-check" onclick="window.shopManager.openCheckModal(${shop.id})">检查</button>
        </div>
        <span class="shop-grade-badge grade-badge-${shop.grade.toLowerCase()}">${shop.grade}级</span>
      </div>
    `).join('');
    
    console.log('  设置容器innerHTML...');
    container.innerHTML = html;
    console.log('  渲染完成！');
  }

  updateStats(count) {
    const countElement = document.getElementById('shop-count');
    if (countElement) {
      countElement.textContent = `共 ${count !== undefined ? count : this.shops.length} 家店铺`;
    }
  }

  // ==================== 管理页面功能 ====================
  showAdminInterface() {
    this.currentView = 'admin';
    const appContainer = document.getElementById('app-container');
    const isAdmin = this.currentUser.role === 'admin' || this.currentUser.role === 'root';

    appContainer.innerHTML = `
      <div class="header admin-header">
        <button class="logout-btn" onclick="window.shopManager.handleLogout()">退出</button>
        <h1>️ 管理后台</h1>
        <div class="header-small">${isAdmin ? '管理员权限' : '普通用户'}</div>
      </div>

      <div class="admin-section">
        <div class="section-header">
          <span class="section-icon">👥</span>
          <h3>用户管理</h3>
        </div>
        <div class="admin-buttons">
          <button class="admin-btn" onclick="window.shopManager.showUserList()">
            <span class="btn-icon">👤</span>
            用户列表
          </button>
          ${isAdmin ? `<button class="admin-btn" onclick="window.shopManager.showDataHistory()">
            <span class="btn-icon">📊</span>
            数据历史
          </button>` : ''}
        </div>
      </div>

      <div class="admin-section">
        <div class="section-header">
          <span class="section-icon">🏪</span>
          <h3>店铺管理</h3>
        </div>
        <div class="grade-title">选择要管理的店铺等级</div>
        <div class="grade-buttons">
          <button class="grade-btn grade-a" onclick="window.shopManager.showManageGrade('A')">
            A级
            <span>管理</span>
          </button>
          <button class="grade-btn grade-b" onclick="window.shopManager.showManageGrade('B')">
            B级
            <span>管理</span>
          </button>
          <button class="grade-btn grade-c" onclick="window.shopManager.showManageGrade('C')">
            C级
            <span>管理</span>
          </button>
        </div>
      </div>

      <div id="manageShopListContainer" class="admin-section" style="display:none;">
        <div class="section-header">
          <h3 id="manageGradeTitle">A级店铺管理</h3>
          <button class="btn-add" onclick="window.shopManager.openAddShopModal()">+ 添加店铺</button>
        </div>
        <div id="manageShopList"></div>
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

      ${this.buildModals()}
    `;
  }

  buildModals() {
    return `
      <!-- 用户管理模态框 -->
      <div id="userModal" class="modal">
        <div class="modal-content">
          <div class="modal-header">
            <h3 id="userModalTitle">用户列表</h3>
            <button class="modal-close" onclick="window.shopManager.closeUserModal()">&times;</button>
          </div>
          <div id="userListContent" class="modal-body"></div>
        </div>
      </div>

      <!-- 店铺编辑模态框 -->
      <div id="shopModal" class="modal">
        <div class="modal-content">
          <div class="modal-header">
            <h3 id="shopModalTitle">添加店铺</h3>
            <button class="modal-close" onclick="window.shopManager.closeShopModal()">&times;</button>
          </div>
          <div class="modal-body">
            <div class="form-group">
              <label>店铺编号</label>
              <input type="text" id="shopNumber" class="form-input" placeholder="例如: L0501N01">
            </div>
            <div class="form-group">
              <label>店铺名称</label>
              <input type="text" id="shopName" class="form-input" placeholder="例如: 喜庭">
            </div>
            <div class="form-group">
              <label>店铺等级</label>
              <select id="shopGrade" class="form-input">
                <option value="A">A级</option>
                <option value="B">B级</option>
                <option value="C">C级</option>
              </select>
            </div>
            <button class="btn-save" onclick="window.shopManager.saveShop()">保存</button>
          </div>
        </div>
      </div>

      <!-- 店铺检查模态框 -->
      <div id="checkModal" class="modal">
        <div class="modal-content" style="max-width: 800px;">
          <div class="modal-header">
            <h3 id="checkModalTitle">检查信息填写</h3>
            <button class="modal-close" onclick="window.shopManager.closeCheckModal()">&times;</button>
          </div>
          <div class="modal-body">
            <!-- 基本信息 -->
            <div class="check-basic-info">
              <h4>基本信息</h4>
              <div class="form-row">
                <div class="form-group">
                  <label>序号 *</label>
                  <input type="text" id="checkSerial" class="form-input" readonly>
                </div>
                <div class="form-group">
                  <label>检查时间 *</label>
                  <input type="datetime-local" id="checkTime" class="form-input">
                </div>
              </div>
              <div class="form-group">
                <label>检查人 *</label>
                <input type="text" id="checkInspector" class="form-input" readonly>
              </div>
            </div>

            <!-- 问题清单 -->
            <div class="check-problems-section">
              <h4>问题清单</h4>
              <div id="problemsContainer"></div>
              <button class="btn-add-problem" onclick="window.shopManager.addProblem()">
                + 添加问题
              </button>
            </div>

            <button class="btn-save" onclick="window.shopManager.saveCheck()">提交检查记录</button>
          </div>
        </div>
      </div>

      <!-- 问题模板（隐藏） -->
      <template id="problemTemplate">
        <div class="problem-item">
          <div class="problem-header">
            <span class="problem-title">问题 {index}</span>
            <button class="btn-delete-problem" onclick="window.shopManager.removeProblem(this)">删除</button>
          </div>
          <div class="problem-body">
            <div class="form-group">
              <label>问题描述 *</label>
              <textarea class="form-input problem-description" rows="3" placeholder="请描述发现的问题"></textarea>
            </div>
            <div class="form-group">
              <label>隐患位置 *</label>
              <input type="text" class="form-input problem-location" placeholder="请描述隐患位置">
            </div>
            <div class="form-group">
              <label>风险等级 *</label>
              <select class="form-input problem-risk">
                <option value="">请选择风险等级</option>
                <option value="high">高风险</option>
                <option value="medium">中风险</option>
                <option value="low">低风险</option>
              </select>
            </div>
            <div class="form-group">
              <label>问题照片</label>
              <div class="photo-upload">
                <input type="file" class="problem-photo" accept="image/*" style="display:none;" onchange="window.shopManager.previewPhoto(this)">
                <button class="btn-upload-photo" onclick="this.previousElementSibling.click()">
                  📷 添加照片
                </button>
                <div class="photo-preview"></div>
              </div>
            </div>
            <div class="form-group">
              <label>整改状态 *</label>
              <div class="radio-group">
                <label class="radio-label">
                  <input type="radio" name="status-{index}" value="completed" class="problem-status" onchange="window.shopManager.toggleRectification(this)">
                  <span>已整改</span>
                </label>
                <label class="radio-label">
                  <input type="radio" name="status-{index}" value="pending_3" class="problem-status" checked onchange="window.shopManager.toggleRectification(this)">
                  <span>待整改(3日内)</span>
                </label>
                <label class="radio-label">
                  <input type="radio" name="status-{index}" value="pending_7" class="problem-status" onchange="window.shopManager.toggleRectification(this)">
                  <span>待整改(7日内)</span>
                </label>
              </div>
            </div>
            <div class="form-group">
              <label>整改截止日期</label>
              <input type="date" class="form-input problem-deadline">
            </div>
            
            <!-- 整改详情（仅当选择已整改时显示） -->
            <div class="rectification-details" style="display:none;">
              <div class="rectification-header">
                <h5> 整改详情</h5>
              </div>
              <div class="form-row">
                <div class="form-group">
                  <label>整改时间 *</label>
                  <input type="datetime-local" class="form-input rectification-time">
                </div>
                <div class="form-group">
                  <label>整改确认人 *</label>
                  <input type="text" class="form-input rectification-confirm" readonly>
                </div>
              </div>
              <div class="form-group">
                <label>整改照片</label>
                <div class="photo-upload">
                  <input type="file" class="rectification-photo" accept="image/*" style="display:none;" onchange="window.shopManager.previewRectificationPhoto(this)">
                  <button class="btn-upload-photo" onclick="this.previousElementSibling.click()">
                    📷 添加整改照片
                  </button>
                  <div class="photo-preview rectification-photo-preview"></div>
                </div>
              </div>
              <div class="form-group">
                <label>是否完成整改 *</label>
                <div class="radio-group">
                  <label class="radio-label">
                    <input type="radio" name="rectification-complete-{index}" value="yes" class="rectification-complete" checked>
                    <span>是</span>
                  </label>
                  <label class="radio-label">
                    <input type="radio" name="rectification-complete-{index}" value="no" class="rectification-complete">
                    <span>否</span>
                  </label>
                </div>
              </div>
              <div class="form-group">
                <label>备注</label>
                <textarea class="form-input rectification-notes" rows="3" placeholder="其他备注信息"></textarea>
              </div>
            </div>
          </div>
        </div>
      </template>

      <!-- 数据历史模态框 -->
      <div id="historyModal" class="modal">
        <div class="modal-content">
          <div class="modal-header">
            <h3>数据历史</h3>
            <button class="modal-close" onclick="window.shopManager.closeHistoryModal()">&times;</button>
          </div>
          <div id="historyListContent" class="modal-body"></div>
        </div>
      </div>
    `;
  }

  // ==================== 用户管理 ====================
  async showUserList() {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/users`);
      const result = await response.json();

      if (result.success) {
        this.users = result.data;
        this.renderUserList();
        document.getElementById('userModal').style.display = 'block';
      }
    } catch (error) {
      console.error('加载用户失败:', error);
      this.showToast('加载用户列表失败', 'error');
    }
  }

  renderUserList() {
    const list = document.getElementById('userListContent');
    const isAdmin = this.currentUser.role === 'admin' || this.currentUser.role === 'root';

    // 构建用户列表HTML
    let html = this.users.map(user => `
      <div class="user-item">
        <div class="user-info">
          <div class="user-name">${user.display_name || user.username}</div>
          <div class="user-username">@${user.username}</div>
          <div class="user-role ${user.role === 'admin' || user.role === 'root' ? 'role-admin' : 'role-user'}">
            ${user.role === 'admin' || user.role === 'root' ? ' 管理员' : '👤 普通用户'}
          </div>
        </div>
        <div class="user-actions">
          ${user.username !== 'admin' && isAdmin ? `
            <button class="btn-edit" onclick="window.shopManager.editUser('${user.username}')">编辑</button>
            <button class="btn-delete" onclick="window.shopManager.deleteUser('${user.username}')">删除</button>
          ` : user.username === 'admin' ? '<span class="system-user">系统用户</span>' : ''}
        </div>
      </div>
    `).join('');

    // 如果是管理员，在顶部添加“添加用户”按钮
    if (isAdmin) {
      html = `
        <div class="user-list-header">
          <h3>用户列表 (${this.users.length})</h3>
          <button class="btn-add" onclick="window.shopManager.showAddUserModal()">+ 添加用户</button>
        </div>
        ${html}
      `;
    }

    list.innerHTML = html;
  }

  closeUserModal() {
    document.getElementById('userModal').style.display = 'none';
  }

  editUser(username) {
    const user = this.users.find(u => u.username === username);
    if (!user) return;

    this.editingUserId = username;
    document.getElementById('userModalTitle').textContent = '编辑用户';

    const content = document.getElementById('userListContent');
    content.innerHTML = `
      <div class="form-group">
        <label>用户名</label>
        <input type="text" id="editUsername" class="form-input" value="${user.username}" disabled>
      </div>
      <div class="form-group">
        <label>显示名称</label>
        <input type="text" id="editDisplayName" class="form-input" value="${user.display_name || ''}">
      </div>
      <div class="form-group">
        <label>角色</label>
        <select id="editRole" class="form-input">
          <option value="user" ${user.role === 'user' ? 'selected' : ''}>普通用户</option>
          <option value="admin" ${user.role === 'admin' ? 'selected' : ''}>管理员</option>
        </select>
      </div>
      <div class="form-group">
        <label>新密码 (留空不修改)</label>
        <input type="password" id="editPassword" class="form-input" placeholder="输入新密码">
      </div>
      <button class="btn-save" onclick="window.shopManager.saveUser()">保存修改</button>
    `;
  }

  async saveUser() {
    const displayName = document.getElementById('editDisplayName').value.trim();
    const role = document.getElementById('editRole').value;
    const password = document.getElementById('editPassword').value.trim();

    if (!displayName) {
      this.showToast('请填写显示名称', 'warning');
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/auth/users/${this.editingUserId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ displayName, role, password })
      });

      const result = await response.json();

      if (result.success) {
        this.showToast('用户信息更新成功', 'success');
        this.closeUserModal();
        this.showUserList();
      } else {
        this.showToast('更新失败: ' + result.message, 'error');
      }
    } catch (error) {
      console.error('保存用户失败:', error);
      this.showToast('保存失败', 'error');
    }
  }

  async deleteUser(username) {
    this.showConfirm(`确定要删除用户 ${username} 吗？此操作不可恢复！`, async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/auth/users/${username}`, {
          method: 'DELETE'
        });

        const result = await response.json();

        if (result.success) {
          this.showToast('用户删除成功', 'success');
          this.showUserList();
        } else {
          this.showToast('删除失败: ' + result.message, 'error');
        }
      } catch (error) {
        console.error('删除用户失败:', error);
        this.showToast('删除失败', 'error');
      }
    });
  }

  // 显示添加用户弹窗
  showAddUserModal() {
    document.getElementById('userModalTitle').textContent = '添加用户';
    
    const content = document.getElementById('userListContent');
    content.innerHTML = `
      <div class="form-group">
        <label>用户名 *</label>
        <input type="text" id="newUsername" class="form-input" placeholder="请输入用户名（英文/数字）">
      </div>
      <div class="form-group">
        <label>显示名称 *</label>
        <input type="text" id="newDisplayName" class="form-input" placeholder="请输入显示名称">
      </div>
      <div class="form-group">
        <label>密码 *</label>
        <input type="password" id="newPassword" class="form-input" placeholder="请输入密码（至少6位）">
      </div>
      <div class="form-group">
        <label>角色</label>
        <select id="newRole" class="form-input">
          <option value="user">普通用户</option>
          <option value="admin">管理员</option>
        </select>
      </div>
      <div class="form-actions">
        <button class="btn-cancel" onclick="window.shopManager.showUserList()">取消</button>
        <button class="btn-save" onclick="window.shopManager.addUser()">添加用户</button>
      </div>
    `;
  }

  // 添加新用户
  async addUser() {
    const username = document.getElementById('newUsername').value.trim();
    const displayName = document.getElementById('newDisplayName').value.trim();
    const password = document.getElementById('newPassword').value.trim();
    const role = document.getElementById('newRole').value;

    // 验证
    if (!username || !displayName || !password) {
      this.showToast('请填写所有必填字段', 'warning');
      return;
    }

    if (password.length < 6) {
      this.showToast('密码长度至少6位', 'warning');
      return;
    }

    if (!/^[a-zA-Z0-9_]+$/.test(username)) {
      this.showToast('用户名只能包含英文字母、数字和下划线', 'warning');
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/auth/users`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, displayName, password, role })
      });

      const result = await response.json();

      if (result.success) {
        this.showToast('用户添加成功', 'success');
        this.showUserList();
      } else {
        this.showToast('添加失败: ' + result.message, 'error');
      }
    } catch (error) {
      console.error('添加用户失败:', error);
      this.showToast('添加失败', 'error');
    }
  }

  // ==================== 店铺管理 ====================
  
  // 打开检查模态框
  openCheckModal(shopId) {
    const shop = this.shops.find(s => s.id == shopId);
    if (!shop) {
      this.showToast('找不到店铺数据', 'error');
      return;
    }

    this.checkingShopId = shopId;
    this.problemCount = 0;
    
    // 生成序号：日期 + 时间戳
    const now = new Date();
    const serial = now.getFullYear().toString() + 
                   String(now.getMonth() + 1).padStart(2, '0') + 
                   String(now.getDate()).padStart(2, '0') + 
                   String(now.getHours()).padStart(2, '0') + 
                   String(now.getMinutes()).padStart(2, '0') + 
                   String(now.getSeconds()).padStart(2, '0');
    
    const timeStr = now.toISOString().slice(0, 16);
    
    // 设置基本信息
    document.getElementById('checkSerial').value = serial;
    document.getElementById('checkTime').value = timeStr;
    document.getElementById('checkInspector').value = this.currentUser.displayName || this.currentUser.username;
    
    // 清空问题列表
    document.getElementById('problemsContainer').innerHTML = '';
    
    // 添加第一个问题
    this.addProblem();
    
    document.getElementById('checkModal').style.display = 'block';
  }

  // 关闭检查模态框
  closeCheckModal() {
    document.getElementById('checkModal').style.display = 'none';
  }

  // 添加问题
  addProblem(existingProblem = null) {
    this.problemCount++;
    const container = document.getElementById('problemsContainer');
    const template = document.getElementById('problemTemplate');
    const clone = template.content.cloneNode(true);
    
    // 更新问题编号
    const title = clone.querySelector('.problem-title');
    title.textContent = `问题 ${this.problemCount}`;
    
    // 更新 radio name
    const radios = clone.querySelectorAll('.problem-status');
    radios.forEach(radio => {
      radio.name = `status-${this.problemCount}`;
    });
    
    // 更新整改完成 radio name
    const rectificationRadios = clone.querySelectorAll('.rectification-complete');
    rectificationRadios.forEach(radio => {
      radio.name = `rectification-complete-${this.problemCount}`;
    });
    
    // 设置整改确认人
    const rectificationConfirm = clone.querySelector('.rectification-confirm');
    rectificationConfirm.value = this.currentUser.displayName || this.currentUser.username;
    
    // 如果有已有问题数据，填充表单
    if (existingProblem) {
      clone.querySelector('.problem-description').value = existingProblem.description || '';
      clone.querySelector('.problem-location').value = existingProblem.location || '';
      clone.querySelector('.problem-risk').value = existingProblem.risk || '';
      clone.querySelector('.problem-deadline').value = existingProblem.deadline || '';
      
      // 设置整改状态
      const statusValue = existingProblem.status || 'pending_3';
      const statusRadio = clone.querySelector(`input[name="status-${this.problemCount}"][value="${statusValue}"]`);
      if (statusRadio) {
        statusRadio.checked = true;
        if (statusValue === 'completed') {
          clone.querySelector('.rectification-details').style.display = 'block';
        }
      }
      
      // 填充整改详情
      if (existingProblem.rectification) {
        const rectDetails = clone.querySelector('.rectification-details');
        const rectTime = existingProblem.rectification.time || '';
        if (rectTime) {
          rectDetails.querySelector('.rectification-time').value = rectTime.slice(0, 16);
        }
        rectDetails.querySelector('.rectification-confirm').value = existingProblem.rectification.confirmer || '';
        rectDetails.querySelector('.rectification-notes').value = existingProblem.rectification.notes || '';
        
        if (existingProblem.rectification.completed !== undefined) {
          const completeValue = existingProblem.rectification.completed ? 'yes' : 'no';
          const completeRadio = rectDetails.querySelector(`input[name="rectification-complete-${this.problemCount}"][value="${completeValue}"]`);
          if (completeRadio) completeRadio.checked = true;
        }
      }
    } else {
      // 设置默认整改时间为当前时间
      const now = new Date();
      const timeStr = now.toISOString().slice(0, 16);
      const rectificationTime = clone.querySelector('.rectification-time');
      rectificationTime.value = timeStr;
    }
    
    container.appendChild(clone);
  }

  // 删除问题
  removeProblem(button) {
    const problemItem = button.closest('.problem-item');
    if (document.querySelectorAll('.problem-item').length > 1) {
      problemItem.remove();
      // 重新编号
      this.renumberProblems();
    } else {
      this.showToast('至少保留一个问题', 'warning');
    }
  }

  // 重新编号问题
  renumberProblems() {
    const problems = document.querySelectorAll('.problem-item');
    problems.forEach((item, index) => {
      const title = item.querySelector('.problem-title');
      title.textContent = `问题 ${index + 1}`;
      
      // 更新整改状态 radio name
      const statusRadios = item.querySelectorAll('.problem-status');
      statusRadios.forEach(radio => {
        radio.name = `status-${index + 1}`;
      });
      
      // 更新整改完成 radio name
      const completeRadios = item.querySelectorAll('.rectification-complete');
      completeRadios.forEach(radio => {
        radio.name = `rectification-complete-${index + 1}`;
      });
    });
    this.problemCount = problems.length;
  }

  // 预览照片
  previewPhoto(input) {
    const preview = input.parentElement.querySelector('.photo-preview');
    if (input.files && input.files[0]) {
      const reader = new FileReader();
      reader.onload = function(e) {
        preview.innerHTML = `
          <div class="photo-preview-container">
            <img src="${e.target.result}" style="max-width: 100%; max-height: 200px; border-radius: 8px; margin-top: 10px;">
            <div class="upload-progress" style="display: none;">
              <div class="progress-bar">
                <div class="progress-fill" style="width: 0%"></div>
              </div>
              <div class="progress-text">0%</div>
            </div>
          </div>
        `;
      };
      reader.readAsDataURL(input.files[0]);
    }
  }

  // 预览整改照片
  previewRectificationPhoto(input) {
    const preview = input.parentElement.querySelector('.photo-preview');
    if (input.files && input.files[0]) {
      const reader = new FileReader();
      reader.onload = function(e) {
        preview.innerHTML = `
          <div class="photo-preview-container">
            <img src="${e.target.result}" style="max-width: 100%; max-height: 200px; border-radius: 8px; margin-top: 10px;">
            <div class="upload-progress" style="display: none;">
              <div class="progress-bar">
                <div class="progress-fill" style="width: 0%"></div>
              </div>
              <div class="progress-text">0%</div>
            </div>
          </div>
        `;
      };
      reader.readAsDataURL(input.files[0]);
    }
  }

  // 切换整改详情显示/隐藏
  toggleRectification(radio) {
    const problemItem = radio.closest('.problem-item');
    const rectificationDetails = problemItem.querySelector('.rectification-details');
    
    if (radio.value === 'completed') {
      rectificationDetails.style.display = 'block';
    } else {
      rectificationDetails.style.display = 'none';
    }
  }

  // 保存检查记录
  async saveCheck() {
    const shopId = this.checkingShopId;
    const serial = document.getElementById('checkSerial').value;
    const checkTime = document.getElementById('checkTime').value;
    const inspector = document.getElementById('checkInspector').value.trim();

    // 显示加载提示
    this.showToast('正在提交，请稍候...', 'info', 999999);
    
    // 收集所有问题
    const problems = [];
    const problemItems = document.querySelectorAll('.problem-item');
    
    for (let i = 0; i < problemItems.length; i++) {
      const item = problemItems[i];
      const description = item.querySelector('.problem-description').value.trim();
      const location = item.querySelector('.problem-location').value.trim();
      const risk = item.querySelector('.problem-risk').value;
      const status = item.querySelector('.problem-status:checked').value;
      const deadline = item.querySelector('.problem-deadline').value;
      const photoInput = item.querySelector('.problem-photo');
      
      // 检查是否为"无异常"关键词(表示检查合格)
      const noIssueKeywords = ['无异常', '无问题', '合格', '正常', '无'];
      const isNoIssue = noIssueKeywords.some(keyword => description.includes(keyword));
            
      // 如果是无异常,视为店铺合格,跳过验证
      if (isNoIssue) {
        const problem = {
          description: '无异常',
          location: '-',
          risk: '无',
          status: 'completed',
          deadline: '',
          photoUrl: null,
          rectification: {
            time: new Date().toISOString().split('T')[0],
            confirmer: inspector,
            completed: true,
            notes: '检查无异常',
            photoUrl: null
          }
        };
        problems.push(problem);
        continue;
      }
            
      // 如果问题的必填字段都为空,视为没有添加问题(店铺合格)
      if (!description && !location && risk === '请选择风险等级') {
        continue; // 跳过空白问题
      }
            
      // 验证必填字段(只有填写了部分字段才需要验证)
      if (!description || !location || !risk || !status) {
        this.showToast(`问题 ${i + 1} 的必填字段未填写完整`, 'warning');
        return;
      }
      
      // 处理问题照片（上传到服务器获取URL）- 并行上传
      let photoUrl = null;
      if (photoInput.files && photoInput.files[0]) {
        photoUrl = await this.uploadImage(photoInput.files[0]);
        if (!photoUrl) {
          this.closeLoadingToast();
          this.showToast(`问题 ${i + 1} 的照片上传失败`, 'error');
          return;
        }
      }
      
      // 构建问题对象
      const problem = {
        description,
        location,
        risk,
        status,
        deadline,
        photoUrl: photoUrl  // 保存URL而不是base64
      };
      
      // 如果是已整改状态，收集整改详情
      if (status === 'completed') {
        const rectificationDetails = item.querySelector('.rectification-details');
        const rectTime = rectificationDetails.querySelector('.rectification-time').value;
        const rectConfirm = rectificationDetails.querySelector('.rectification-confirm').value.trim();
        const rectComplete = rectificationDetails.querySelector('.rectification-complete:checked').value;
        const rectNotes = rectificationDetails.querySelector('.rectification-notes').value.trim();
        const rectPhotoInput = rectificationDetails.querySelector('.rectification-photo');
        
        // 验证整改必填字段
        if (!rectTime || !rectConfirm || !rectComplete) {
          this.showToast(`问题 ${i + 1} 的整改信息未填写完整`, 'warning');
          return;
        }
        
        // 处理整改照片（上传到服务器获取URL）- 并行上传
        let rectPhotoUrl = null;
        if (rectPhotoInput.files && rectPhotoInput.files[0]) {
          rectPhotoUrl = await this.uploadImage(rectPhotoInput.files[0]);
          if (!rectPhotoUrl) {
            this.closeLoadingToast();
            this.showToast(`问题 ${i + 1} 的整改照片上传失败`, 'error');
            return;
          }
        }
        
        problem.rectification = {
          time: rectTime,
          confirmer: rectConfirm,
          completed: rectComplete === 'yes',
          notes: rectNotes,
          photoUrl: rectPhotoUrl  // 保存URL而不是base64
        };
      }
      
      problems.push(problem);
    }

    // 允许零问题提交（店铺检查合格）
    if (problems.length === 0) {
      this.closeLoadingToast();
      this.showConfirm('当前没有添加任何问题,\n确认店铺检查合格并提交吗?', async () => {
        this.showToast('正在提交，请稍候...', 'info', 999999);
        await this.submitCheckRecord(shopId, serial, checkTime, inspector, problems);
      });
      return;
    }

    // 有问题时直接提交
    await this.submitCheckRecord(shopId, serial, checkTime, inspector, problems);
  }

  // 提交检查记录（独立函数）
  async submitCheckRecord(shopId, serial, checkTime, inspector, problems) {
    try {
      const response = await fetch(`${API_BASE_URL}/checks`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          shopId,
          serial,
          checkTime,
          inspector,
          problems
        })
      });

      const result = await response.json();

      if (result.success) {
        this.closeLoadingToast();
        this.showToast('检查记录提交成功', 'success');
        this.closeCheckModal();
        // 切换到记录页面并加载数据
        this.showRecordsInterface();
      } else {
        this.closeLoadingToast();
        this.showToast('提交失败: ' + result.message, 'error');
      }
    } catch (error) {
      console.error('提交检查记录失败:', error);
      this.closeLoadingToast();
      this.showToast('提交失败', 'error');
    }
  }

  // 关闭加载提示
  closeLoadingToast() {
    const toasts = document.querySelectorAll('.toast');
    toasts.forEach(toast => {
      if (toast.querySelector('.toast-message')?.textContent === '正在提交，请稍候...') {
        toast.remove();
      }
    });
  }

  // 更新检查记录(修改/复查)
  async updateCheck() {
    const recordId = this.editingRecordId;
    if (!recordId) {
      this.showToast('记录ID不存在', 'error');
      return;
    }
    
    const serial = document.getElementById('checkSerial').value;
    const checkTime = document.getElementById('checkTime').value;
    const inspector = document.getElementById('checkInspector').value.trim();

    // 收集所有问题（与 saveCheck 相同的逻辑）
    const problems = [];
    const problemItems = document.querySelectorAll('.problem-item');
    
    for (let i = 0; i < problemItems.length; i++) {
      const item = problemItems[i];
      const description = item.querySelector('.problem-description').value.trim();
      const location = item.querySelector('.problem-location').value.trim();
      const risk = item.querySelector('.problem-risk').value;
      const status = item.querySelector('.problem-status:checked').value;
      const deadline = item.querySelector('.problem-deadline').value;
      const photoInput = item.querySelector('.problem-photo');
      
      // 检查是否为"无异常"关键词(表示检查合格)
      const noIssueKeywords = ['无异常', '无问题', '合格', '正常', '无'];
      const isNoIssue = noIssueKeywords.some(keyword => description.includes(keyword));
            
      // 如果是无异常,视为店铺合格,跳过验证
      if (isNoIssue) {
        const problem = {
          description: '无异常',
          location: '-',
          risk: '无',
          status: 'completed',
          deadline: '',
          photoUrl: null,
          rectification: {
            time: new Date().toISOString().split('T')[0],
            confirmer: inspector,
            completed: true,
            notes: '检查无异常',
            photoUrl: null
          }
        };
        problems.push(problem);
        continue;
      }
            
      // 如果问题的必填字段都为空,视为没有添加问题(店铺合格)
      if (!description && !location && risk === '请选择风险等级') {
        continue; // 跳过空白问题
      }
            
      // 验证必填字段(只有填写了部分字段才需要验证)
      if (!description || !location || !risk || !status) {
        this.showToast(`问题 ${i + 1} 的必填字段未填写完整`, 'warning');
        return;
      }
      
      // 处理问题照片（上传到服务器获取URL）- 并行上传
      let photoUrl = null;
      if (photoInput.files && photoInput.files[0]) {
        photoUrl = await this.uploadImage(photoInput.files[0]);
        if (!photoUrl) {
          this.closeLoadingToast();
          this.showToast(`问题 ${i + 1} 的照片上传失败`, 'error');
          return;
        }
      }
      
      // 构建问题对象
      const problem = {
        description,
        location,
        risk,
        status,
        deadline,
        photoUrl: photoUrl  // 保存URL而不是base64
      };
      
      // 如果是已整改状态，收集整改详情
      if (status === 'completed') {
        const rectificationDetails = item.querySelector('.rectification-details');
        const rectTime = rectificationDetails.querySelector('.rectification-time').value;
        const rectConfirm = rectificationDetails.querySelector('.rectification-confirm').value.trim();
        const rectComplete = rectificationDetails.querySelector('.rectification-complete:checked').value;
        const rectNotes = rectificationDetails.querySelector('.rectification-notes').value.trim();
        const rectPhotoInput = rectificationDetails.querySelector('.rectification-photo');
        
        // 验证整改必填字段
        if (!rectTime || !rectConfirm || !rectComplete) {
          this.showToast(`问题 ${i + 1} 的整改信息未填写完整`, 'warning');
          return;
        }
        
        // 处理整改照片（上传到服务器获取URL）- 并行上传
        let rectPhotoUrl = null;
        if (rectPhotoInput.files && rectPhotoInput.files[0]) {
          rectPhotoUrl = await this.uploadImage(rectPhotoInput.files[0]);
          if (!rectPhotoUrl) {
            this.closeLoadingToast();
            this.showToast(`问题 ${i + 1} 的整改照片上传失败`, 'error');
            return;
          }
        }
        
        problem.rectification = {
          time: rectTime,
          confirmer: rectConfirm,
          completed: rectComplete === 'yes',
          notes: rectNotes,
          photoUrl: rectPhotoUrl  // 保存URL而不是base64
        };
      }
      
      problems.push(problem);
    }

    // 允许零问题提交（店铺检查合格）
    if (problems.length === 0) {
      this.showConfirm('当前没有添加任何问题,\n确认店铺检查合格并提交吗?', async () => {
        await this.submitUpdateRecord(recordId, serial, checkTime, inspector, problems);
      });
      return;
    }

    // 有问题时直接提交
    await this.submitUpdateRecord(recordId, serial, checkTime, inspector, problems);
  }

  // 提交更新记录(独立函数)
  async submitUpdateRecord(recordId, serial, checkTime, inspector, problems) {
    try {
      const response = await fetch(`${API_BASE_URL}/checks/${recordId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          serial,
          checkTime,
          inspector,
          problems
        })
      });
  
      const result = await response.json();
  
      if (result.success) {
        this.showToast('更新成功', 'success');
        this.closeCheckModal();
        // 切换到记录页面并加载数据
        this.showRecordsInterface();
      } else {
        this.showToast('更新失败: ' + result.message, 'error');
      }
    } catch (error) {
      console.error('更新检查记录失败:', error);
      this.showToast('更新失败', 'error');
    }
  }
  
  // 文件转 Base64
  fileToBase64(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result);
      reader.onerror = error => reject(error);
    });
  }

  // 上传图片到服务器
  // 上传图片（带压缩）
  async uploadImage(file) {
    try {
      // 压缩图片
      const compressedFile = await this.compressImage(file);
      
      const formData = new FormData();
      formData.append('image', compressedFile);
      
      const response = await fetch(`${API_BASE_URL}/upload`, {
        method: 'POST',
        body: formData
      });
      
      const result = await response.json();
      
      if (result.success) {
        return result.data.url;  // 返回图片URL
      } else {
        this.showToast('图片上传失败: ' + result.message, 'error');
        return null;
      }
    } catch (error) {
      console.error('图片上传失败:', error);
      this.showToast('图片上传失败', 'error');
      return null;
    }
  }

  // 获取完整的图片URL（处理相对路径）
  getFullImageUrl(imageUrl) {
    if (!imageUrl) return '';
    
    // 如果已经是完整URL，直接返回
    if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) {
      return imageUrl;
    }
    
    // 如果是相对路径（以 /uploads/ 开头），转换为完整URL
    if (imageUrl.startsWith('/uploads/')) {
      let serverUrl = window.location.origin;
      // 处理 file:// 协议或空的情况
      if (!serverUrl || serverUrl === 'null' || serverUrl === 'file://') {
        serverUrl = 'http://localhost:3000';
      }
      return serverUrl + imageUrl;
    }
    
    // 其他情况，尝试拼接
    return imageUrl;
  }

  // 压缩图片
  compressImage(file, maxWidth = 1920, quality = 0.7) {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (e) => {
        const img = new Image();
        img.src = e.target.result;
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;
          
          // 计算新尺寸
          if (width > maxWidth) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          }
          
          canvas.width = width;
          canvas.height = height;
          
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, width, height);
          
          // 转换为Blob
          canvas.toBlob((blob) => {
            // 创建新的File对象
            const compressedFile = new File([blob], file.name, {
              type: 'image/jpeg',
              lastModified: Date.now()
            });
            resolve(compressedFile);
          }, 'image/jpeg', quality);
        };
      };
    });
  }

  async showManageGrade(grade) {
    console.log('📦 开始加载管理页面店铺数据，等级:', grade);
    
    this.manageGrade = grade;
    
    // 显示加载状态
    const listContainer = document.getElementById('manageShopList');
    if (listContainer) {
      listContainer.innerHTML = '<div class="empty-state"><p>加载中...</p></div>';
    }
    
    // 从服务器加载对应等级的数据
    try {
      const response = await fetch(`${API_BASE_URL}/shops?grade=${grade}`);
      const result = await response.json();
      
      console.log('📊 管理页面返回数据:', result);
      
      if (result.success) {
        const shops = result.data || [];
        console.log(`✅ 加载了 ${shops.length} 个${grade}级店铺`);
        console.log(' 前3个:', shops.slice(0, 3));
        
        // 更新本地数据
        // 移除旧的该等级店铺
        this.shops = this.shops.filter(s => s.grade !== grade);
        // 添加新加载的店铺
        this.shops = [...this.shops, ...shops];
        
        // 渲染管理列表
        document.getElementById('manageShopListContainer').style.display = 'block';
        document.getElementById('manageGradeTitle').textContent = `${grade}级店铺管理 (${shops.length})`;
        
        this.renderManageShopList(shops);
      } else {
        console.error('❌ 加载失败:', result.message);
        listContainer.innerHTML = '<div class="empty-state"><p>加载失败</p></div>';
      }
    } catch (error) {
      console.error('❌ 加载店铺失败:', error);
      if (listContainer) {
        listContainer.innerHTML = '<div class="empty-state"><p>加载失败</p></div>';
      }
    }
  }

  renderManageShopList(shops) {
    console.log('📦 渲染管理店铺列表...');
    console.log('  店铺数量:', shops.length);
    
    const container = document.getElementById('manageShopList');
    console.log('  容器是否存在:', !!container);
    
    if (!container) {
      console.error('❌ 容器 manageShopList 不存在！');
      return;
    }

    if (shops.length === 0) {
      console.log('  店铺为空，显示空状态');
      container.innerHTML = '<div class="empty-state"><p>暂无店铺</p></div>';
      return;
    }

    console.log('  开始生成HTML...');
    container.innerHTML = shops.map(shop => `
      <div class="shop-item manage-shop-item">
        <div class="shop-item-left">
          <div class="shop-item-name">${shop.name}</div>
          <div class="shop-item-number">店铺号: ${shop.number}</div>
        </div>
        <div class="shop-actions">
          <button class="btn-edit" onclick="window.shopManager.editShop('${shop.id}')">编辑</button>
          <button class="btn-delete" onclick="window.shopManager.deleteShop('${shop.id}')">删除</button>
        </div>
      </div>
    `).join('');
    
    console.log('  渲染完成！');
  }

  openAddShopModal() {
    this.editingShopId = null;
    document.getElementById('shopModalTitle').textContent = '添加店铺';
    document.getElementById('shopNumber').value = '';
    document.getElementById('shopName').value = '';
    document.getElementById('shopGrade').value = this.manageGrade;
    document.getElementById('shopModal').style.display = 'block';
  }

  editShop(shopId) {
    console.log('📦 编辑店铺，ID:', shopId, '类型:', typeof shopId);
    
    // 使用 == 进行宽松匹配（数字和字符串）
    const shop = this.shops.find(s => s.id == shopId);
    
    if (!shop) {
      console.error('❌ 找不到店铺，ID:', shopId);
      console.log(' 当前店铺列表ID:', this.shops.map(s => s.id));
      this.showToast('找不到店铺数据，请刷新页面重试', 'error');
      return;
    }
    
    console.log('✅ 找到店铺:', shop);

    this.editingShopId = shop.id;
    document.getElementById('shopModalTitle').textContent = '编辑店铺';
    document.getElementById('shopNumber').value = shop.number;
    document.getElementById('shopName').value = shop.name;
    document.getElementById('shopGrade').value = shop.grade;
    document.getElementById('shopModal').style.display = 'block';
  }

  closeShopModal() {
    document.getElementById('shopModal').style.display = 'none';
  }

  async saveShop() {
    const number = document.getElementById('shopNumber').value.trim();
    const name = document.getElementById('shopName').value.trim();
    const grade = document.getElementById('shopGrade').value;

    if (!number || !name) {
      this.showToast('请填写完整信息', 'warning');
      return;
    }

    try {
      let response;
      if (this.editingShopId) {
        // 更新店铺
        response = await fetch(`${API_BASE_URL}/shops/${this.editingShopId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ number, name, grade })
        });
      } else {
        // 添加店铺
        response = await fetch(`${API_BASE_URL}/shops`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ number, name, grade })
        });
      }

      const result = await response.json();

      if (result.success) {
        this.showToast(this.editingShopId ? '店铺更新成功' : '店铺添加成功', 'success');
        this.closeShopModal();
        this.loadShops();
        this.showManageGrade(this.manageGrade);
      } else {
        this.showToast('操作失败: ' + result.message, 'error');
      }
    } catch (error) {
      console.error('保存店铺失败:', error);
      this.showToast('保存失败', 'error');
    }
  }

  async deleteShop(shopId) {
    this.showConfirm('确定要删除这个店铺吗？\n\n注意：店铺删除后，该店铺的检查记录将会保留，但在数据历史中会显示为"店铺{ID}"。', async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/shops/${shopId}`, {
          method: 'DELETE'
        });

        const result = await response.json();

        if (result.success) {
          const recordInfo = result.data && result.data.recordCount ? `\n\n该店铺有 ${result.data.recordCount} 条检查记录已保留。` : '';
          this.showToast('店铺删除成功' + recordInfo, 'success');
          this.loadShops();
          this.showManageGrade(this.manageGrade);
        } else {
          this.showToast('删除失败: ' + result.message, 'error');
        }
      } catch (error) {
        console.error('删除店铺失败:', error);
        this.showToast('删除失败', 'error');
      }
    });
  }

  // ==================== 数据历史 ====================
  async showDataHistory() {
    try {
      console.log('加载数据历史...');
      
      // 确保店铺数据已加载
      if (this.shops.length === 0) {
        console.log('加载店铺数据...');
        await this.loadShops();
      }
      
      const response = await fetch(`${API_BASE_URL}/checks/history`);
      const result = await response.json();
      
      console.log('数据历史响应:', result);

      if (result.success) {
        console.log('渲染历史数据:', result.data);
        this.renderHistoryModal(result.data);
        document.getElementById('historyModal').style.display = 'block';
      } else {
        console.error('加载失败:', result.message);
        this.showToast('加载失败: ' + result.message, 'error');
      }
    } catch (error) {
      console.error('加载历史失败:', error);
      this.showToast('加载数据历史失败', 'error');
    }
  }

  renderHistoryModal(data) {
    const content = document.getElementById('historyListContent');
    
    const { operationLogs, monthlyStats, inspectorStats } = data;
    
    let html = `
      <!-- 统计概览 -->
      <div class="history-overview">
        <h3>📊 数据概览</h3>
        <div class="stats-grid">
          <div class="stat-card">
            <div class="stat-number">${monthlyStats.reduce((sum, s) => sum + s.totalRecords, 0)}</div>
            <div class="stat-label">总检查记录</div>
          </div>
          <div class="stat-card">
            <div class="stat-number">${monthlyStats.reduce((sum, s) => sum + s.totalProblems, 0)}</div>
            <div class="stat-label">总问题数</div>
          </div>
          <div class="stat-card">
            <div class="stat-number">${monthlyStats.reduce((sum, s) => sum + s.totalShops, 0)}</div>
            <div class="stat-label">检查店铺数</div>
          </div>
          <div class="stat-card">
            <div class="stat-number">${monthlyStats.reduce((sum, s) => sum + s.totalInspectors, 0)}</div>
            <div class="stat-label">检查人员数</div>
          </div>
        </div>
      </div>

      <!-- 月度统计 -->
      <div class="history-section">
        <h3>📅 月度统计</h3>
        ${monthlyStats.length > 0 ? `
          <div class="monthly-stats-table">
            <div class="table-header">
              <div>年月</div>
              <div>检查记录</div>
              <div>问题总数</div>
              <div>检查店铺</div>
              <div>检查人员</div>
            </div>
            ${monthlyStats.map(stat => `
              <div class="table-row">
                <div>${stat.year}年${String(stat.month).padStart(2, '0')}月</div>
                <div>${stat.totalRecords}条</div>
                <div>${stat.totalProblems}个</div>
                <div>${stat.totalShops}家</div>
                <div>${stat.totalInspectors}人</div>
              </div>
            `).join('')}
          </div>
        ` : '<div class="empty-state"><p>暂无月度数据</p></div>'}
      </div>

      <!-- 检查人员统计 -->
      <div class="history-section">
        <h3>👥 检查人员统计</h3>
        ${inspectorStats.length > 0 ? `
          <div class="inspector-stats">
            ${inspectorStats.map((stat, index) => `
              <div class="inspector-stat-item">
                <div class="inspector-rank">${index + 1}</div>
                <div class="inspector-info">
                  <div class="inspector-name">${stat.inspector}</div>
                  <div class="inspector-detail">检查${stat.checkCount}次，发现问题${stat.totalProblems}个</div>
                </div>
              </div>
            `).join('')}
          </div>
        ` : '<div class="empty-state"><p>暂无人员数据</p></div>'}
      </div>

      <!-- 操作记录 -->
      <div class="history-section">
        <h3>📝 操作记录</h3>
        ${operationLogs.length > 0 ? `
          <div class="recent-records">
            ${operationLogs.map(record => {
              // 根据 shopId 查找店铺名称
              const shop = this.shops.find(s => s.id == record.shopId);
              const shopName = shop ? shop.name : `店铺${record.shopId}`;
              
              // 判断是否已删除
              const isDeleted = record.isDeleted === 1;
              
              return `
              <div class="recent-record-item ${isDeleted ? 'record-deleted' : ''}">
                <div class="record-action-badge ${record.actionType === '新增检查' ? 'action-add' : 'action-edit'}">
                  ${record.actionType === '新增检查' ? '➕' : '✏️'} ${record.actionType}
                </div>
                ${isDeleted ? '<div class="record-deleted-badge">已删除</div>' : ''}
                <div class="record-detail">
                  <div class="record-shop">${shopName}</div>
                  <div class="record-meta">
                    <span>${record.inspector}</span>
                    <span> ${new Date(record.checkTime).toLocaleString()}</span>
                    <span>${record.problemCount}个问题</span>
                  </div>
                </div>
                ${isDeleted ? `
                  <button class="btn-restore" onclick="window.shopManager.restoreRecord(${record.id})" title="恢复此记录">
                    🔄 恢复
                  </button>
                ` : ''}
              </div>
              `;
            }).join('')}
          </div>
        ` : '<div class="empty-state"><p>暂无操作记录</p></div>'}
      </div>
    `;
    
    content.innerHTML = html;
  }

  closeHistoryModal() {
    document.getElementById('historyModal').style.display = 'none';
  }

  // 恢复记录(软删除恢复)
  async restoreRecord(recordId) {
    // 先关闭历史模态框
    this.closeHistoryModal();
      
    this.showConfirm('确定要恢复这条检查记录吗?', async () => {
      try {
        console.log('恢复记录...', recordId);
          
        const response = await fetch(`${API_BASE_URL}/checks/history/restore`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ recordId })
        });
          
        const result = await response.json();
          
        console.log('恢复结果:', result);
          
        if (result.success) {
          this.showToast('记录恢复成功', 'success');
          // 如果在记录页面,重新加载记录
          if (this.currentView === 'records') {
            this.loadRecords();
          }
        } else {
          this.showToast('恢复失败: ' + result.message, 'error');
        }
      } catch (error) {
        console.error('恢复记录失败:', error);
        this.showToast('恢复失败', 'error');
      }
    });
  }

  // ==================== 导出Excel ====================
  exportExcel() {
    console.log('=== 开始导出Excel ===');
    console.log('XLSX库是否存在:', typeof XLSX !== 'undefined');
    console.log('店铺数据:', this.shops);
    
    const shops = this.shops;

    if (shops.length === 0) {
      this.showToast('暂无数据可导出', 'warning');
      return;
    }

    try {
      // 检查XLSX库是否加载
      if (typeof XLSX === 'undefined') {
        console.error('XLSX库未加载!');
        this.showToast('Excel库加载失败,请刷新页面重试', 'error');
        return;
      }
      
      console.log('XLSX库版本:', XLSX.version);
      
      // 准备数据
      const data = shops.map((shop, index) => ({
        '序号': index + 1,
        '店铺编号': shop.number || '',
        '店铺名称': shop.name || '',
        '店铺等级': shop.grade || ''
      }));
      
      console.log('准备导出的数据:', data);

      // 创建工作簿和工作表
      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.json_to_sheet(data);

      // 设置列宽
      ws['!cols'] = [
        { wch: 8 },  // 序号
        { wch: 15 }, // 店铺编号
        { wch: 25 }, // 店铺名称
        { wch: 10 }  // 店铺等级
      ];

      // 将工作表添加到工作簿
      XLSX.utils.book_append_sheet(wb, ws, '店铺数据');

      // 生成文件名
      const filename = `店铺数据_${new Date().toISOString().split('T')[0]}.xlsx`;
      console.log('文件名:', filename);

      try {
        // 使用Blob方式导出(兼容所有设备)
        console.log('开始生成Blob...');
        const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
        console.log('Blob大小:', wbout.byteLength || wbout.length, 'bytes');
        
        const blob = new Blob([wbout], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
        console.log('Blob创建成功,大小:', blob.size, 'bytes');
        
        // 创建下载链接
        const url = URL.createObjectURL(blob);
        console.log('创建ObjectURL:', url);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        a.style.display = 'none';
        
        // 触发下载
        console.log('开始触发下载...');
        document.body.appendChild(a);
        a.click();
        console.log('下载链接已点击');
        
        // 清理
        setTimeout(() => {
          document.body.removeChild(a);
          URL.revokeObjectURL(url);
          console.log('资源已清理');
        }, 100);
        
        // 给用户更明确的提示
        this.showToast('导出成功!请在文件管理的"下载"文件夹中查找', 'success');
      } catch (downloadError) {
        console.error('下载失败:', downloadError);
        this.showToast('下载失败: ' + downloadError.message, 'error');
      }
    } catch (error) {
      console.error('导出失败:', error);
      console.error('错误堆栈:', error.stack);
      this.showToast('导出失败: ' + error.message, 'error');
    }
  }

  // ==================== 检查记录页面 ====================
  showRecordsInterface() {
    this.currentView = 'records';
    const appContainer = document.getElementById('app-container');

    appContainer.innerHTML = `
      <div class="header">
        <button class="logout-btn" onclick="window.shopManager.handleLogout()">退出</button>
        <h1>📋 检查记录</h1>
        <div class="header-small">查看和管理检查记录</div>
      </div>

      <div class="records-tabs">
        <button class="tab-btn active" id="tabChecked" onclick="window.shopManager.switchRecordTab('checked')">已检查店铺</button>
        <button class="tab-btn" id="tabUnchecked" onclick="window.shopManager.switchRecordTab('unchecked')">未检查店铺</button>
      </div>

      <div class="records-filter">
        <div class="filter-group">
          <label>年月:</label>
          <input type="month" id="monthFilter" class="filter-select" onchange="window.shopManager.filterRecords()">
        </div>
        <div class="filter-group">
          <label>整改状态:</label>
          <select id="statusFilter" class="filter-select" onchange="window.shopManager.filterRecords()">
            <option value="">全部</option>
            <option value="completed">已整改</option>
            <option value="pending">未整改</option>
          </select>
        </div>
        <div class="filter-group">
          <label>店铺等级:</label>
          <select id="gradeFilter" class="filter-select" onchange="window.shopManager.filterRecords()">
            <option value="">全部</option>
            <option value="A">A级</option>
            <option value="B">B级</option>
            <option value="C">C级</option>
          </select>
        </div>
      </div>

      <div class="records-actions">
        <div class="export-dropdown">
          <button class="btn-export-all" onclick="window.shopManager.toggleExportDropdown()">📥 批量导出 ▼</button>
          <div id="exportDropdown" class="dropdown-content" style="display: none;">
            <button onclick="window.shopManager.exportAllRecords()">全部导出</button>
            <button onclick="window.shopManager.exportByGrade('A')">导出A级店铺</button>
            <button onclick="window.shopManager.exportByGrade('B')">导出B级店铺</button>
            <button onclick="window.shopManager.exportByGrade('C')">导出C级店铺</button>
            <button onclick="window.shopManager.exportByMonth()">导出当前月份</button>
          </div>
        </div>
        <button class="btn-clear-records" onclick="window.shopManager.showClearRecordsModal()">🗑️ 清空所有记录</button>
      </div>

      <div id="recordsList" class="records-list"></div>

      <nav class="nav-bar">
        <button class="nav-item" onclick="window.shopManager.navigate('home')">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
            <polyline points="9 22 9 12 15 12 15 22"></polyline>
          </svg>
          <div>首页</div>
        </button>
        <button class="nav-item" onclick="window.shopManager.navigate('admin')">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="3"></circle>
            <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9c.26.604.852.997 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
          </svg>
          <div>管理</div>
        </button>
        <button class="nav-item active" onclick="window.shopManager.navigate('records')">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
            <polyline points="14 2 14 8 20 8"></polyline>
            <line x1="16" y1="13" x2="8" y2="13"></line>
            <line x1="16" y1="17" x2="8" y2="17"></line>
          </svg>
          <div>记录</div>
        </button>
      </nav>

      <!-- 清空记录模态框 -->
      <div id="clearRecordsModal" class="modal">
        <div class="modal-content">
          <div class="modal-header">
            <h3>清空记录</h3>
            <button class="modal-close" onclick="window.shopManager.closeClearRecordsModal()">&times;</button>
          </div>
          <div class="modal-body">
            <div class="form-group">
              <label>选择要清空的年月 (留空则清空所有)</label>
              <input type="month" id="clearMonth" class="form-input">
            </div>
            <div class="form-actions">
              <button class="btn-cancel" onclick="window.shopManager.closeClearRecordsModal()">取消</button>
              <button class="btn-delete" onclick="window.shopManager.clearRecords()">确认清空</button>
            </div>
          </div>
        </div>
      </div>

      <!-- 查看记录模态框 -->
      <div id="viewRecordModal" class="modal">
        <div class="modal-content modal-large">
          <div class="modal-header">
            <h3>📋 检查记录详情</h3>
            <button class="modal-close" onclick="window.shopManager.closeViewRecordModal()">&times;</button>
          </div>
          <div class="modal-body" id="viewRecordContent">
            <!-- 内容动态生成 -->
          </div>
        </div>
      </div>

      <!-- 图片预览模态框 -->
      <div id="imagePreviewModal" class="modal">
        <div class="modal-content modal-image">
          <div class="modal-header">
            <h3>🖼️ 图片预览</h3>
            <button class="modal-close" onclick="window.shopManager.closeImagePreview()">&times;</button>
          </div>
          <div class="modal-body image-preview-body">
            <img id="previewImage" src="" alt="预览图片" class="preview-image">
          </div>
        </div>
      </div>

      ${this.buildModals()}
    `;

    this.currentRecordTab = 'checked';
    this.loadRecords();
  }

  async loadRecords() {
    try {
      const monthFilter = document.getElementById('monthFilter')?.value;
      const statusFilter = document.getElementById('statusFilter')?.value;
      const gradeFilter = document.getElementById('gradeFilter')?.value;
      
      const params = new URLSearchParams();
      if (monthFilter) {
        const [year, month] = monthFilter.split('-');
        params.append('year', year);
        params.append('month', month);
      }
      if (statusFilter) {
        params.append('status', statusFilter);
      }
      
      const response = await fetch(`${API_BASE_URL}/checks?${params}`);
      const result = await response.json();

      if (result.success) {
        this.records = result.data || [];
        
        // 如果选择了店铺等级，进行前端过滤
        if (gradeFilter && this.shops.length > 0) {
          const gradeShopIds = new Set(
            this.shops.filter(s => s.grade === gradeFilter).map(s => s.id)
          );
          this.records = this.records.filter(r => gradeShopIds.has(r.shopId));
        }
        
        if (this.currentRecordTab === 'checked') {
          this.renderRecords(this.records);
        } else {
          this.renderUncheckedShops();
        }
      }
    } catch (error) {
      console.error('加载记录失败:', error);
      this.records = [];
      this.renderRecords([]);
    }
  }

  switchRecordTab(tab) {
    this.currentRecordTab = tab;
    
    // 更新按钮样式
    document.getElementById('tabChecked').className = tab === 'checked' ? 'tab-btn active' : 'tab-btn';
    document.getElementById('tabUnchecked').className = tab === 'unchecked' ? 'tab-btn active' : 'tab-btn';
    
    if (tab === 'checked') {
      this.loadRecords();
    } else {
      this.renderUncheckedShops();
    }
  }

  renderUncheckedShops() {
    const container = document.getElementById('recordsList');
    
    if (!container) {
      console.error('recordsList 容器不存在');
      return;
    }
    
    // 获取所有已检查的店铺ID
    const checkedShopIds = new Set(this.records.map(r => r.shopId));
    
    // 过滤出未检查的店铺
    const uncheckedShops = this.shops.filter(shop => !checkedShopIds.has(shop.id));
    
    if (uncheckedShops.length === 0) {
      container.innerHTML = '<div class="empty-state"><p>所有店铺都已检查</p></div>';
      return;
    }
    
    container.innerHTML = uncheckedShops.map(shop => `
      <div class="record-item unchecked-item">
        <div class="record-header">
          <div class="record-shop">${shop.name} (${shop.number})</div>
          <span class="record-grade grade-badge-${shop.grade.toLowerCase()}">${shop.grade}级</span>
        </div>
        <div class="record-info">
          <div>状态: <span class="status-pending">未检查</span></div>
        </div>
        <div class="record-actions">
          <button class="btn-check" onclick="window.shopManager.openCheckModal('${shop.id}')">去检查</button>
        </div>
      </div>
    `).join('');
  }

  filterRecords() {
    this.loadRecords();
  }

  renderRecords(records) {
    const container = document.getElementById('recordsList');
    
    if (!container) {
      console.error('recordsList 容器不存在');
      return;
    }

    if (records.length === 0) {
      container.innerHTML = '<div class="empty-state"><p>暂无检查记录</p></div>';
      return;
    }

    container.innerHTML = records.map(record => {
      const checkDate = new Date(record.checkTime);
      const yearMonth = `${checkDate.getFullYear()}/${String(checkDate.getMonth() + 1).padStart(2, '0')}`;
      
      // 根据 shopId 查找店铺名称
      const shop = this.shops.find(s => s.id == record.shopId);
      const shopName = shop ? shop.name : '未知店铺';
      const shopGrade = shop ? shop.grade : 'A';
      
      // 判断是否有问题
      const problems = record.problems || [];
      const hasPending = problems.some(p => p.status !== 'completed');
      const allCompleted = problems.length > 0 && !hasPending;
      
      return `
        <div class="record-item">
          <div class="record-header">
            <div>
              <div class="record-shop">${shopName}</div>
              <div class="record-date">📅 ${yearMonth}</div>
            </div>
            <span class="record-grade grade-badge-${shopGrade.toLowerCase()}">${shopGrade}级</span>
          </div>
          <div class="record-problems">
            ${problems.map((problem, idx) => `
              <div class="problem-summary">
                <div class="problem-main">
                  <span class="problem-number">问题${idx + 1}</span>
                  <span class="problem-desc">${problem.description}</span>
                </div>
                <div class="problem-meta">
                  <span class="risk-badge risk-${problem.risk}">${problem.risk === 'high' ? '高风险' : problem.risk === 'medium' ? '中风险' : '低风险'}</span>
                  <span class="status-badge ${problem.status === 'completed' ? 'status-completed' : 'status-pending'}">
                    ${problem.status === 'completed' ? '✓ 已整改' : '⏳ 未整改'}
                  </span>
                </div>
              </div>
            `).join('')}
          </div>
          <div class="record-info">
            <div>检查人: ${record.inspector}</div>
            <div>问题数量: ${problems.length} 个</div>
            <div>整改状态: ${allCompleted ? '✅ 全部已整改' : hasPending ? '⚠️ 部分未整改' : '暂无问题'}</div>
          </div>
          <div class="record-actions">
            <button class="btn-view" onclick="window.shopManager.viewRecord(${record.id})">
              ️ 查看
            </button>
            <button class="${allCompleted ? 'btn-edit' : 'btn-review'}" onclick="window.shopManager.${allCompleted ? 'editRecord' : 'reviewRecord'}(${record.id})">
              ${allCompleted ? ' 修改' : ' 复查'}
            </button>
            <button class="btn-delete" onclick="window.shopManager.deleteRecord(${record.id})">🗑️ 删除</button>
          </div>
        </div>
      `;
    }).join('');
  }

  // 查看记录（只读模式）
  async viewRecord(recordId) {
    const record = this.records.find(r => r.id === recordId);
    if (!record) {
      this.showToast('记录不存在', 'error');
      return;
    }
    
    // 根据 shopId 查找店铺名称
    const shop = this.shops.find(s => s.id == record.shopId);
    const shopName = shop ? shop.name : `店铺${record.shopId}`;
    const shopGrade = shop ? shop.grade : 'A';
    
    const problems = record.problems || [];
    const checkDate = new Date(record.checkTime);
    const yearMonth = `${checkDate.getFullYear()}/${String(checkDate.getMonth() + 1).padStart(2, '0')}`;
    
    // 构建查看内容
    let html = `
      <div class="view-record-content">
        <!-- 基本信息 -->
        <div class="view-section">
          <h3>📋 基本信息</h3>
          <div class="view-info-grid">
            <div class="view-info-item">
              <label>店铺名称</label>
              <div class="view-value">${shopName}</div>
            </div>
            <div class="view-info-item">
              <label>店铺等级</label>
              <div class="view-value">
                <span class="grade-badge-${shopGrade.toLowerCase()}">${shopGrade}级</span>
              </div>
            </div>
            <div class="view-info-item">
              <label>检查时间</label>
              <div class="view-value">${yearMonth}</div>
            </div>
            <div class="view-info-item">
              <label>检查人</label>
              <div class="view-value">${record.inspector}</div>
            </div>
            <div class="view-info-item">
              <label>检查编号</label>
              <div class="view-value">${record.serial || '无'}</div>
            </div>
            <div class="view-info-item">
              <label>问题数量</label>
              <div class="view-value">${problems.length} 个</div>
            </div>
          </div>
        </div>
        
        <!-- 问题列表 -->
        ${problems.length > 0 ? `
        <div class="view-section">
          <h3>⚠️ 问题详情</h3>
          <div class="view-problems-list">
            ${problems.map((problem, idx) => `
              <div class="view-problem-item">
                <div class="view-problem-header">
                  <span class="view-problem-number">问题 ${idx + 1}</span>
                  <span class="risk-badge risk-${problem.risk}">
                    ${problem.risk === 'high' ? '高风险' : problem.risk === 'medium' ? '中风险' : '低风险'}
                  </span>
                  <span class="status-badge ${problem.status === 'completed' ? 'status-completed' : 'status-pending'}">
                    ${problem.status === 'completed' ? '✓ 已整改' : '⏳ 未整改'}
                  </span>
                </div>
                <div class="view-problem-detail">
                  <div class="view-detail-row">
                    <label>问题描述：</label>
                    <div class="view-detail-content">${problem.description || '无'}</div>
                  </div>
                  <div class="view-detail-row">
                    <label>隐患位置：</label>
                    <div class="view-detail-content">${problem.location || '无'}</div>
                  </div>
                  <div class="view-detail-row">
                    <label>风险等级：</label>
                    <div class="view-detail-content">
                      <span class="risk-badge risk-${problem.risk}">
                        ${problem.risk === 'high' ? '高风险' : problem.risk === 'medium' ? '中风险' : '低风险'}
                      </span>
                    </div>
                  </div>
                  <div class="view-detail-row">
                    <label>问题照片：</label>
                    <div class="view-detail-content">
                      ${problem.photoUrl ? `<img src="${window.shopManager.getFullImageUrl(problem.photoUrl)}" alt="问题照片" class="view-photo" onclick="window.shopManager.previewImage('${problem.photoUrl}')">` : '无'}
                    </div>
                  </div>
                  ${problem.deadline ? `
                  <div class="view-detail-row">
                    <label>整改截止日期：</label>
                    <div class="view-detail-content">${problem.deadline}</div>
                  </div>
                  ` : ''}
                  <div class="view-detail-row">
                    <label>整改状态：</label>
                    <div class="view-detail-content">
                      <span class="status-badge ${problem.status === 'completed' ? 'status-completed' : 'status-pending'}">
                        ${problem.status === 'completed' ? ' 已整改' : ' 未整改'}
                      </span>
                    </div>
                  </div>
                  ${problem.status === 'completed' && problem.rectification ? `
                  <div class="view-detail-row">
                    <label>整改时间：</label>
                    <div class="view-detail-content">${problem.rectification.time || '无'}</div>
                  </div>
                  <div class="view-detail-row">
                    <label>整改照片：</label>
                    <div class="view-detail-content">
                      ${problem.rectification.photoUrl ? `<img src="${window.shopManager.getFullImageUrl(problem.rectification.photoUrl)}" alt="整改照片" class="view-photo" onclick="window.shopManager.previewImage('${problem.rectification.photoUrl}')">` : '无'}
                    </div>
                  </div>
                  <div class="view-detail-row">
                    <label>整改确认人：</label>
                    <div class="view-detail-content">${problem.rectification.confirmer || '无'}</div>
                  </div>
                  <div class="view-detail-row">
                    <label>是否完成整改：</label>
                    <div class="view-detail-content">${problem.rectification.completed ? '是' : '否'}</div>
                  </div>
                  ${problem.rectification.notes ? `
                  <div class="view-detail-row">
                    <label>整改备注：</label>
                    <div class="view-detail-content">${problem.rectification.notes}</div>
                  </div>
                  ` : ''}
                  ` : ''}
                </div>
              </div>
            `).join('')}
          </div>
        </div>
        ` : `
        <div class="view-section">
          <h3>️ 问题详情</h3>
          <div class="empty-state"><p>暂无问题记录</p></div>
        </div>
        `}
      </div>
    `;
    
    // 显示查看模态框
    const modal = document.getElementById('viewRecordModal');
    const modalContent = document.getElementById('viewRecordContent');
    
    if (!modal || !modalContent) {
      console.error('查看模态框元素不存在');
      this.showToast('页面未完全加载，请刷新页面', 'error');
      return;
    }
    
    modalContent.innerHTML = html;
    modal.style.display = 'block';
  }
  
  // 预览图片
  previewImage(imageUrl) {
    console.log(' 预览图片 URL:', imageUrl);
      
    const previewModal = document.getElementById('imagePreviewModal');
    const previewImage = document.getElementById('previewImage');
      
    if (!previewModal || !previewImage) {
      console.error('图片预览模态框元素不存在');
      this.showToast('页面未完全加载，请刷新页面', 'error');
      return;
    }
      
    // 处理相对路径，转换为完整URL
    let fullUrl = imageUrl;
    if (imageUrl && imageUrl.startsWith('/uploads/')) {
      // 获取服务器地址
      let serverUrl = window.location.origin;
      if (!serverUrl || serverUrl === 'null' || serverUrl === 'file://') {
        // 如果是 file:// 协议，使用默认地址
        serverUrl = 'http://localhost:3000';
      }
      fullUrl = serverUrl + imageUrl;
      console.log(' 转换后的完整 URL:', fullUrl);
    }
      
    // 设置图片源
    previewImage.src = fullUrl;
      
    // 监听图片加载错误
    previewImage.onerror = function() {
      console.error(' 图片加载失败:', fullUrl);
      previewImage.src = '';
      previewImage.alt = '图片加载失败';
    };
      
    // 监听图片加载成功
    previewImage.onload = function() {
      console.log('✅ 图片加载成功');
    };
      
    // 显示模态框
    previewModal.style.display = 'block';
  }
  
  // 关闭图片预览
  closeImagePreview() {
    const previewModal = document.getElementById('imagePreviewModal');
    if (previewModal) {
      previewModal.style.display = 'none';
    }
  }
  
  // 关闭查看模态框
  closeViewRecordModal() {
    const modal = document.getElementById('viewRecordModal');
    if (modal) {
      modal.style.display = 'none';
    }
  }

  // 修改记录(已整改的店铺)
  async editRecord(recordId) {
    const record = this.records.find(r => r.id === recordId);
    if (!record) {
      this.showToast('记录不存在', 'error');
      return;
    }
      
    // 检查模态框是否存在
    const modalTitle = document.getElementById('checkModalTitle');
    if (!modalTitle) {
      this.showToast('页面未完全加载，请刷新页面后重试', 'error');
      console.error('checkModalTitle 元素不存在');
      return;
    }
      
    this.editingRecordId = recordId;
    this.checkingShopId = record.shopId;
    this.problemCount = 0;
      
    // 设置模态框标题
    modalTitle.textContent = '修改检查记录';
    
    // 填充基本信息
    document.getElementById('checkSerial').value = record.serial || '';
    document.getElementById('checkTime').value = new Date(record.checkTime).toISOString().slice(0, 16);
    document.getElementById('checkInspector').value = record.inspector;
    
    // 清空并重新填充问题
    document.getElementById('problemsContainer').innerHTML = '';
    
    // 加载已有问题
    if (record.problems && record.problems.length > 0) {
      record.problems.forEach(problem => {
        this.addProblem(problem);
      });
    } else {
      this.addProblem();
    }
    
    // 修改提交按钮
    const modalBody = document.querySelector('#checkModal .modal-body');
    const saveBtn = modalBody.querySelector('.btn-save');
    if (saveBtn) {
      saveBtn.textContent = ' 保存修改';
      saveBtn.onclick = () => this.updateCheck();
    }
    
    document.getElementById('checkModal').style.display = 'block';
  }

  // 复查记录(未整改的店铺)
  async reviewRecord(recordId) {
    const record = this.records.find(r => r.id === recordId);
    if (!record) {
      this.showToast('记录不存在', 'error');
      return;
    }
      
    // 检查模态框是否存在
    const modalTitle = document.getElementById('checkModalTitle');
    if (!modalTitle) {
      this.showToast('页面未完全加载，请刷新页面后重试', 'error');
      console.error('checkModalTitle 元素不存在');
      return;
    }
      
    this.editingRecordId = recordId;
    this.checkingShopId = record.shopId;
    this.problemCount = 0;
      
    // 设置模态框标题
    modalTitle.textContent = '复查检查记录';
    
    // 填充基本信息
    document.getElementById('checkSerial').value = record.serial || '';
    document.getElementById('checkTime').value = new Date(record.checkTime).toISOString().slice(0, 16);
    document.getElementById('checkInspector').value = record.inspector;
    
    // 清空并重新填充问题
    document.getElementById('problemsContainer').innerHTML = '';
    
    // 加载已有问题
    if (record.problems && record.problems.length > 0) {
      record.problems.forEach(problem => {
        this.addProblem(problem);
      });
    } else {
      this.addProblem();
    }
    
    // 修改提交按钮
    const modalBody = document.querySelector('#checkModal .modal-body');
    const saveBtn = modalBody.querySelector('.btn-save');
    if (saveBtn) {
      saveBtn.textContent = ' 保存复查';
      saveBtn.onclick = () => this.updateCheck();
    }
    
    document.getElementById('checkModal').style.display = 'block';
  }

  // 批量导出所有记录
  async exportAllRecords() {
    if (this.records.length === 0) {
      this.showToast('暂无记录可导出', 'warning');
      return;
    }
    
    // 确保店铺数据已加载
    if (this.shops.length === 0) {
      console.log('导出前加载店铺数据...');
      await this.loadShops();
    }
    
    // 关闭下拉菜单
    this.closeExportDropdown();
    
    // 获取当前页面的筛选条件
    const gradeFilter = document.getElementById('gradeFilter')?.value;
    
    let recordsToExport = this.records;
    let filename = '检查记录汇总';
    
    // 如果当前有等级筛选，在文件名中体现
    if (gradeFilter) {
      filename = `${gradeFilter}级店铺检查记录`;
    }
    
    this.generateExcel(recordsToExport, filename);
  }

  // 按等级导出
  async exportByGrade(grade) {
    console.log('=== exportByGrade 开始 ===');
    console.log('要导出的等级:', grade);
    console.log('当前记录数量:', this.records.length);
    console.log('当前店铺数量:', this.shops.length);
    
    if (this.records.length === 0) {
      this.showToast('暂无记录可导出', 'warning');
      return;
    }
    
    // 确保店铺数据已加载
    if (this.shops.length === 0) {
      console.log('导出前加载店铺数据...');
      await this.loadShops();
    }
    
    // 获取当前页面的筛选条件
    const monthFilter = document.getElementById('monthFilter')?.value;
    const statusFilter = document.getElementById('statusFilter')?.value;
    const gradeFilter = document.getElementById('gradeFilter')?.value;
    
    console.log('页面筛选条件 - 月份:', monthFilter, '状态:', statusFilter, '等级:', gradeFilter);
    
    // 如果当前已经按等级筛选了，且与要导出的等级一致，直接使用当前记录
    let recordsToExport = this.records;
    
    // 如果当前没有按等级筛选，或者筛选的等级与要导出的不同，需要重新过滤
    if (!gradeFilter || gradeFilter !== grade) {
      console.log('需要重新过滤等级...');
      const gradeShops = this.shops.filter(s => s.grade === grade);
      console.log(`${grade}级店铺数量:`, gradeShops.length);
      console.log(`${grade}级店铺列表:`, gradeShops.map(s => ({ id: s.id, name: s.name, grade: s.grade })));
      
      const gradeShopIds = new Set(gradeShops.map(s => String(s.id)));
      console.log(`${grade}级店铺ID集合(字符串):`, Array.from(gradeShopIds));
      
      // 打印所有记录的shopId和对应的店铺信息
      console.log('\n=== 检查所有记录的shopId ===');
      this.records.forEach((record, idx) => {
        const shop = this.shops.find(s => String(s.id) === String(record.shopId));
        if (idx < 5) { // 只打印前5条
          console.log(`记录${idx + 1}: shopId=${record.shopId}, 找到店铺:`, shop ? { id: shop.id, name: shop.name, grade: shop.grade } : '未找到');
        }
      });
      
      recordsToExport = this.records.filter(r => {
        const hasMatch = gradeShopIds.has(String(r.shopId));
        if (!hasMatch) {
          const shop = this.shops.find(s => String(s.id) === String(r.shopId));
          console.log(`记录 shopId=${r.shopId} 不在${grade}级店铺列表中, 实际店铺等级:`, shop ? shop.grade : '店铺不存在');
        }
        return hasMatch;
      });
      
      console.log('过滤后的记录数量:', recordsToExport.length);
    } else {
      console.log('使用当前已筛选的记录');
    }
    
    if (recordsToExport.length === 0) {
      console.log('没有找到记录,准备显示提示');
      this.showToast(`暂无${grade}级店铺的检查记录`, 'warning');
      return;
    }
    
    // 关闭下拉菜单
    this.closeExportDropdown();
    
    console.log('开始生成Excel...');
    this.generateExcel(recordsToExport, `${grade}级店铺检查记录`);
  }

  // 按月份导出（使用当前筛选的月份）
  async exportByMonth() {
    if (this.records.length === 0) {
      this.showToast('暂无记录可导出', 'warning');
      return;
    }
    
    const monthFilter = document.getElementById('monthFilter')?.value;
    if (!monthFilter) {
      this.showToast('请先选择要导出的月份', 'warning');
      return;
    }
    
    // 关闭下拉菜单
    this.closeExportDropdown();
    
    const [year, month] = monthFilter.split('-');
    
    // 获取当前页面的等级筛选条件
    const gradeFilter = document.getElementById('gradeFilter')?.value;
    
    let filename = `${year}年${month}月检查记录`;
    if (gradeFilter) {
      filename = `${year}年${month}月${gradeFilter}级店铺检查记录`;
    }
    
    this.generateExcel(this.records, filename);
  }

  // 切换导出下拉菜单
  toggleExportDropdown() {
    const dropdown = document.getElementById('exportDropdown');
    if (dropdown) {
      dropdown.style.display = dropdown.style.display === 'none' ? 'block' : 'none';
    }
  }

  // 关闭导出下拉菜单
  closeExportDropdown() {
    const dropdown = document.getElementById('exportDropdown');
    if (dropdown) {
      dropdown.style.display = 'none';
    }
  }

  // 导出单条记录
  async exportSingleRecord(recordId) {
    const record = this.records.find(r => r.id === recordId);
    if (!record) {
      this.showToast('记录不存在', 'error');
      return;
    }
    
    // 确保店铺数据已加载
    if (this.shops.length === 0) {
      console.log('导出前加载店铺数据...');
      await this.loadShops();
    }
    
    // 根据 shopId 查找店铺名称
    const shop = this.shops.find(s => s.id == record.shopId);
    const shopName = shop ? shop.name : `店铺${record.shopId}`;
    
    this.generateExcel([record], `检查记录_${shopName}`);
  }

  // 生成Excel文件
  generateExcel(records, filename) {
    console.log('=== generateExcel 开始 ===');
    console.log('记录数量:', records.length);
    console.log('文件名:', filename);
    console.log('XLSX库是否可用:', typeof XLSX !== 'undefined');
    
    try {
      // 检查XLSX库
      if (typeof XLSX === 'undefined') {
        console.error('XLSX库未加载!');
        this.showToast('Excel库加载失败,请刷新页面', 'error');
        return;
      }
      
      const excelData = [];
      let globalIndex = 1;
      
      records.forEach((record) => {
        const problems = record.problems || [];
        
        // 根据 shopId 查找店铺信息
        const shop = this.shops.find(s => s.id == record.shopId);
        const shopName = shop ? shop.name : '未知店铺';
        const shopNumber = shop ? shop.number : '';
        const shopGrade = shop ? shop.grade : '';
        
        // 修复检查时间格式
        const checkDate = new Date(record.checkTime);
        const checkTime = `${checkDate.getFullYear()}-${String(checkDate.getMonth() + 1).padStart(2, '0')}-${String(checkDate.getDate()).padStart(2, '0')} ${String(checkDate.getHours()).padStart(2, '0')}:${String(checkDate.getMinutes()).padStart(2, '0')}:${String(checkDate.getSeconds()).padStart(2, '0')}`;
        const inspector = record.inspector || '';
        
        // 获取服务器完整URL
        let serverUrl = window.location.origin;
        if (!serverUrl || serverUrl === 'null' || serverUrl === 'file://') {
          serverUrl = 'http://localhost:3000';
        }
        
        // 如果没有问题，也导出一条记录
        if (problems.length === 0) {
          excelData.push({
            '序号': globalIndex,
            '店铺编号': shopNumber,
            '店铺名称': shopName,
            '店铺等级': shopGrade,
            '问题描述': '',
            '隐患位置': '',
            '风险等级': '',
            '检查时间': checkTime,
            '检查人': inspector,
            '问题照片': '',
            '整改时间': '',
            '整改照片': '',
            '是否完成整改': '',
            '整改确认人': '',
            '备注': ''
          });
          globalIndex++;
        } else {
          // 每个问题导出一行
          problems.forEach((problem) => {
            const riskLevel = problem.risk === 'high' ? '高' : problem.risk === 'medium' ? '中' : '低';
            const isCompleted = problem.status === 'completed' ? '是' : '否';
            
            // 照片URL（兼容旧数据和新数据）
            let problemPhotoUrl = '';
            if (problem.photoUrl) {
              problemPhotoUrl = `${serverUrl}${problem.photoUrl}`;
            } else if (problem.photo) {
              problemPhotoUrl = '有';
            }
            
            // 整改信息可能嵌套在 rectification 对象中
            const rectification = problem.rectification || {};
            const rectifyTime = rectification.time ? (() => {
              const rectDate = new Date(rectification.time);
              return `${rectDate.getFullYear()}-${String(rectDate.getMonth() + 1).padStart(2, '0')}-${String(rectDate.getDate()).padStart(2, '0')} ${String(rectDate.getHours()).padStart(2, '0')}:${String(rectDate.getMinutes()).padStart(2, '0')}:${String(rectDate.getSeconds()).padStart(2, '0')}`;
            })() : '';
            const rectifyPerson = rectification.confirmer || '';
            const remark = rectification.notes || '';
            
            // 整改照片URL（同样兼容新旧数据）
            let rectifyPhotoUrl = '';
            if (rectification.photoUrl) {
              rectifyPhotoUrl = `${serverUrl}${rectification.photoUrl}`;
            } else if (rectification.photo) {
              rectifyPhotoUrl = '有';
            }
            
            excelData.push({
              '序号': globalIndex,
              '店铺编号': shopNumber,
              '店铺名称': shopName,
              '店铺等级': shopGrade,
              '问题描述': problem.description || '',
              '隐患位置': problem.location || '',
              '风险等级': riskLevel,
              '检查时间': checkTime,
              '检查人': inspector,
              '问题照片': problemPhotoUrl,
              '整改时间': rectifyTime,
              '整改照片': rectifyPhotoUrl,
              '是否完成整改': isCompleted,
              '整改确认人': rectifyPerson,
              '备注': remark
            });
            globalIndex++;
          });
        }
      });
      
      console.log('Excel数据准备完成,记录数:', excelData.length);
      
      // 创建工作簿和工作表
      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.json_to_sheet(excelData);
      
      console.log('工作表创建成功');
      
      // 设置列宽
      ws['!cols'] = [
        { wch: 8 },   // 序号
        { wch: 15 },  // 店铺编号
        { wch: 20 },  // 店铺名称
        { wch: 10 },  // 店铺等级
        { wch: 30 },  // 问题描述
        { wch: 20 },  // 隐患位置
        { wch: 10 },  // 风险等级
        { wch: 20 },  // 检查时间
        { wch: 12 },  // 检查人
        { wch: 50 },  // 问题照片
        { wch: 20 },  // 整改时间
        { wch: 50 },  // 整改照片
        { wch: 12 },  // 是否完成整改
        { wch: 12 },  // 整改确认人
        { wch: 30 }   // 备注
      ];
      
      // 将工作表添加到工作簿
      XLSX.utils.book_append_sheet(wb, ws, '检查记录');
      
      console.log('工作簿创建完成');
      
      // 生成文件名
      const downloadName = `${filename}_${new Date().toISOString().split('T')[0]}.xlsx`;
      console.log('最终文件名:', downloadName);
      
      try {
        // 使用Blob方式导出(兼容所有设备)
        console.log('开始生成Blob...');
        const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
        console.log('Blob大小:', wbout.byteLength || wbout.length, 'bytes');
        
        const blob = new Blob([wbout], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
        console.log('Blob创建成功,大小:', blob.size, 'bytes');
        
        // 创建下载链接
        const url = URL.createObjectURL(blob);
        console.log('创建ObjectURL:', url);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = downloadName;
        a.style.display = 'none';
        
        // 触发下载
        console.log('开始触发下载...');
        document.body.appendChild(a);
        a.click();
        console.log('下载链接已点击');
        
        // 清理
        setTimeout(() => {
          document.body.removeChild(a);
          URL.revokeObjectURL(url);
          console.log('资源已清理');
        }, 100);
        
        // 给用户更明确的提示
        this.showToast('导出成功!请在手机“下载”或“文件管理”应用中查找', 'success');
      } catch (downloadError) {
        console.error('下载失败:', downloadError);
        this.showToast('下载失败: ' + downloadError.message, 'error');
      }
    } catch (error) {
      console.error('导出失败:', error);
      console.error('错误堆栈:', error.stack);
      this.showToast('导出失败: ' + error.message, 'error');
    }
  }

  // 显示清空记录模态框
  showClearRecordsModal() {
    document.getElementById('clearRecordsModal').style.display = 'block';
  }

  // 关闭清空记录模态框
  closeClearRecordsModal() {
    document.getElementById('clearRecordsModal').style.display = 'none';
  }

  // 清空记录(软删除)
  async clearRecords() {
    const clearMonth = document.getElementById('clearMonth').value;
    
    // 先关闭模态框
    this.closeClearRecordsModal();
    
    if (!clearMonth) {
      this.showConfirm('确定要清空所有记录吗?\n\n记录将被标记为已删除,\n可在数据历史中恢复。', async () => {
        await this.executeClearRecords({ year: 2000 });
      });
    } else {
      const [year, month] = clearMonth.split('-');
      this.showConfirm(`确定要清空 ${clearMonth} 的记录吗?\n\n记录将被标记为已删除,\n可在数据历史中恢复。`, async () => {
        await this.executeClearRecords({ 
          year: parseInt(year), 
          month: parseInt(month) 
        });
      });
    }
  }
  
  // 执行清空记录
  async executeClearRecords(body) {
    try {
      const response = await fetch(`${API_BASE_URL}/checks`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
        
      const result = await response.json();
        
      if (result.success) {
        // 先关闭模态框
        this.closeClearRecordsModal();
        // 然后显示成功提示
        this.showToast(result.message, 'success');
        // 最后刷新记录列表
        this.loadRecords();
      } else {
        this.showToast('清空失败: ' + result.message, 'error');
      }
    } catch (error) {
      console.error('清空记录失败:', error);
      this.showToast('清空失败', 'error');
    }
  }

  // 删除单条记录
  async deleteRecord(recordId) {
    this.showConfirm('确定要删除这条检查记录吗？此操作不可恢复！', async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/checks/${recordId}`, {
          method: 'DELETE'
        });
        
        const result = await response.json();
        
        if (result.success) {
          this.showToast('记录删除成功', 'success');
          this.loadRecords();
        } else {
          this.showToast('删除失败: ' + result.message, 'error');
        }
      } catch (error) {
        console.error('删除记录失败:', error);
        this.showToast('删除失败', 'error');
      }
    });
  }

  // 显示确认对话框
  showConfirm(message, onConfirm) {
    const modal = document.getElementById('confirmModal');
    const messageEl = document.getElementById('confirmMessage');
    const okBtn = document.getElementById('confirmOk');
    const cancelBtn = document.getElementById('confirmCancel');
    
    if (!modal || !messageEl || !okBtn || !cancelBtn) {
      console.error('确认对话框元素不存在');
      // 降级到原生confirm
      if (confirm(message)) {
        onConfirm();
      }
      return;
    }
    
    // 设置消息
    messageEl.textContent = message;
    
    // 显示对话框
    modal.style.display = 'block';
    
    // 克隆按钮以避免重复绑定事件
    const newOkBtn = okBtn.cloneNode(true);
    const newCancelBtn = cancelBtn.cloneNode(true);
    okBtn.parentNode.replaceChild(newOkBtn, okBtn);
    cancelBtn.parentNode.replaceChild(newCancelBtn, cancelBtn);
    
    // 确定按钮事件
    newOkBtn.addEventListener('click', () => {
      modal.style.display = 'none';
      onConfirm();
    });
    
    // 取消按钮事件
    newCancelBtn.addEventListener('click', () => {
      modal.style.display = 'none';
    });
    
    // ESC键关闭
    const handleEsc = (e) => {
      if (e.key === 'Escape') {
        modal.style.display = 'none';
        document.removeEventListener('keydown', handleEsc);
      }
    };
    document.addEventListener('keydown', handleEsc);
  }

  // ==================== 版权声明弹窗 ====================
  showCopyrightModal() {
    // 创建声明弹窗HTML
    const modalHTML = `
      <div id="copyrightModal" class="modal" style="display: block; z-index: 3000;">
        <div class="copyright-dialog">
          <div class="copyright-header">
            <h2>📜 ShopHub 使用声明</h2>
          </div>
          <div class="copyright-content">
            <div class="section">
              <h3>一、版权声明</h3>
              <p><strong>Copyright 2026 李睿 All Rights Reserved</strong></p>
              <ol>
                <li>《ShopHub》由李睿独立开发，源代码、UI设计、业务逻辑等全部知识产权归开发者李睿个人所有。</li>
                <li>本软件仅限个人内部店铺巡检工作自用，禁止私自转发、分享、反编译、破解、复制源码、商用售卖、对外分发。</li>
                <li>项目所用开源框架、第三方组件版权归属原作者，遵守对应开源协议。</li>
              </ol>
            </div>
            
            <div class="section">
              <h3>二、免责声明</h3>
              <ol>
                <li>ShopHub为个人自研自用工具，不上架应用市场、不对外收费、不对外开放商用。</li>
                <li>使用人自行填写巡检数据，填报信息真实性由填写人负责；因误操作、设备故障、程序调试导致的数据丢失，开发者不承担赔偿责任。</li>
                <li>开发者李睿可根据使用需求，随时更新、调整、暂停或终止本软件服务。</li>
              </ol>
            </div>
            
            <div class="section">
              <h3>三、隐私说明</h3>
              <ol>
                <li>软件仅保存店铺巡检业务资料，不会采集身份证、通讯录、银行卡等无关个人隐私信息。</li>
                <li>数据私有存储，未接入广告、第三方统计SDK，所有业务数据不外泄、不倒卖。</li>
              </ol>
            </div>
            
            <div class="notice-box">
              <strong>⚠️ 重要提示：</strong>
              <p>本软件ShopHub为李睿个人自研内部自用巡检工具，严禁私自外传，使用即代表同意以上全部声明。</p>
            </div>
          </div>
          <div class="copyright-footer">
            <button class="btn-agree" onclick="window.shopManager.agreeToTerms()">我已知晓并同意</button>
          </div>
        </div>
      </div>
    `;

    // 将弹窗添加到body
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = modalHTML;
    while (tempDiv.firstChild) {
      document.body.appendChild(tempDiv.firstChild);
    }
  }

  agreeToTerms() {
    // 保存同意状态
    localStorage.setItem('shophub_terms_agreed', 'true');
    
    // 关闭弹窗
    const modal = document.getElementById('copyrightModal');
    if (modal) {
      modal.remove();
    }
    
    // 显示主界面
    this.showMainInterface();
    
    // 显示提示
    this.showToast('欢迎使用ShopHub！', 'success');
  }
}

window.shopManager = new ShopManager();