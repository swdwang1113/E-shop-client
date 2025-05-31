<template>
  <div class="admin-container">
    <el-container class="admin-layout">
      <!-- 侧边栏 -->
      <el-aside width="250px" :style="{ width: isCollapse ? '64px' : '250px' }">
        <div class="admin-logo">
          <h2>{{ isCollapse ? '商城' : '商城管理系统' }}</h2>
        </div>
        
        <el-menu
          :default-active="activeMenu"
          class="admin-menu"
          background-color="#001529"
          text-color="#fff"
          active-text-color="#1890ff"
          :collapse="isCollapse"
          router
        >
          <el-menu-item index="/admin">
            <el-icon><Odometer /></el-icon>
            <span>控制台</span>
          </el-menu-item>
          
          <el-menu-item index="/admin/goods">
            <el-icon><Goods /></el-icon>
            <span>商品管理</span>
          </el-menu-item>
          
          <el-menu-item index="/admin/orders">
            <el-icon><List /></el-icon>
            <span>订单管理</span>
          </el-menu-item>
          
          <el-menu-item index="/admin/refunds">
            <el-icon><RefreshRight /></el-icon>
            <span>退款管理</span>
          </el-menu-item>
          
          <el-menu-item index="/admin/categories">
            <el-icon><IconMenu /></el-icon>
            <span>分类管理</span>
          </el-menu-item>
          
          <el-menu-item index="/admin/users">
            <el-icon><User /></el-icon>
            <span>用户管理</span>
          </el-menu-item>
        </el-menu>
      </el-aside>
      
      <!-- 主内容区 -->
      <el-container class="main-container" :style="mainContainerStyle">
        <!-- 顶部导航 -->
        <el-header height="60px">
          <div class="admin-header">
            <div class="header-left">
              <el-icon class="collapse-icon" @click="isCollapse = !isCollapse">
                <Fold v-if="!isCollapse" />
                <Expand v-else />
              </el-icon>
            </div>
            
            <div class="header-right">
              <el-dropdown trigger="click" @command="handleCommand">
                <div class="admin-user">
                  <el-avatar :size="32" :src="adminInfo.avatar || ''" />
                  <span class="username">{{ adminInfo.username }}</span>
                  <el-icon><ArrowDown /></el-icon>
                </div>
                
                <template #dropdown>
                  <el-dropdown-menu>
                    <el-dropdown-item command="profile">个人信息</el-dropdown-item>
                    <el-dropdown-item command="settings">系统设置</el-dropdown-item>
                    <el-dropdown-item divided command="logout">退出登录</el-dropdown-item>
                  </el-dropdown-menu>
                </template>
              </el-dropdown>
            </div>
          </div>
        </el-header>
        
        <!-- 内容区域 -->
        <el-main>
          <div class="admin-breadcrumb">
            <el-breadcrumb separator="/">
              <el-breadcrumb-item :to="{ path: '/admin' }">首页</el-breadcrumb-item>
              <el-breadcrumb-item v-for="(item, index) in breadcrumbs" :key="index">
                {{ item }}
              </el-breadcrumb-item>
            </el-breadcrumb>
          </div>
          
          <div class="admin-content">
            <router-view />
          </div>
        </el-main>
        
        <!-- 页脚 -->
        <el-footer height="50px">
          <div class="admin-footer">
            <p>© 2023 电商管理系统 版权所有</p>
          </div>
        </el-footer>
      </el-container>
    </el-container>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useUserStore } from '../../store/user'
import { 
  Odometer, 
  Goods, 
  List, 
  Menu as IconMenu, 
  User, 
  Fold, 
  Expand, 
  ArrowDown,
  RefreshRight
} from '@element-plus/icons-vue'
import { ElMessageBox, ElMessage } from 'element-plus'

const router = useRouter()
const route = useRoute()
const userStore = useUserStore()

// 管理员信息
const adminInfo = computed(() => userStore.userInfo || {})

// 菜单收缩状态
const isCollapse = ref(false)

// 当前激活的菜单项
const activeMenu = computed(() => {
  return route.path
})

// 计算主内容区域的宽度样式
const mainContainerStyle = computed(() => {
  return {
    width: isCollapse.value ? 'calc(100% - 64px)' : 'calc(100% - 250px)'
  }
})

// 面包屑导航
const breadcrumbs = computed(() => {
  const path = route.path
  const pathParts = path.split('/').filter(Boolean)
  
  // 第一个元素是 'admin'，我们不需要它出现在面包屑中
  if (pathParts.length > 1) {
    const result = []
    const lastPart = pathParts[pathParts.length - 1]
    
    // 翻译路径为中文
    const translations = {
      'goods': '商品管理',
      'orders': '订单管理',
      'users': '用户管理',
      'categories': '分类管理',
      'refunds': '退款管理'
    }
    
    if (translations[lastPart]) {
      result.push(translations[lastPart])
    }
    
    return result
  }
  
  return []
})

// 检查用户是否是管理员
onMounted(async () => {
  if (!userStore.isLoggedIn) {
    ElMessage.error('请先登录')
    router.push('/login')
    return
  }
  
  if (!adminInfo.value || adminInfo.value.role !== 1) {
    ElMessage.error('您没有管理员权限')
    router.push('/')
  }
})

// 处理下拉菜单命令
const handleCommand = async (command) => {
  if (command === 'logout') {
    try {
      await ElMessageBox.confirm('确定要退出登录吗？', '提示', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      })
      
      await userStore.logout()
      router.push('/login')
    } catch (error) {
      if (error !== 'cancel') {
        ElMessage.error('退出失败: ' + error.message)
      }
    }
  } else if (command === 'profile') {
    // 处理个人信息
    router.push('/user')
  } else if (command === 'settings') {
    // 处理系统设置
    ElMessage.info('系统设置功能正在开发中')
  }
}
</script>

<style scoped>
.admin-container {
  height: 100vh;
  width: 100vw;
  overflow: hidden;
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
}

.admin-layout {
  height: 100%;
  width: 100%;
  display: flex;
}

.admin-logo {
  height: 60px;
  display: flex;
  justify-content: center;
  align-items: center;
  background-color: #001529;
  color: white;
  overflow: hidden;
  white-space: nowrap;
}

.admin-logo h2 {
  margin: 0;
  font-size: 20px;
}

.admin-menu {
  height: calc(100% - 60px);
  border-right: none;
}

.el-aside {
  background-color: #001529;
  color: white;
  box-shadow: 2px 0 6px rgba(0, 21, 41, 0.35);
  transition: width 0.3s;
  overflow: hidden;
  flex-shrink: 0;
}

.el-header {
  background-color: white;
  box-shadow: 0 1px 4px rgba(0, 21, 41, 0.08);
  padding: 0;
}

.admin-header {
  height: 100%;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 20px;
}

.header-left, .header-right {
  display: flex;
  align-items: center;
}

.collapse-icon {
  font-size: 20px;
  cursor: pointer;
  color: #333;
}

.admin-user {
  display: flex;
  align-items: center;
  cursor: pointer;
}

.username {
  margin: 0 8px;
  color: #333;
}

.admin-breadcrumb {
  margin-bottom: 20px;
  padding: 10px 0;
  border-bottom: 1px solid #f0f0f0;
}

.admin-content {
  min-height: calc(100vh - 190px);
  background-color: white;
  width: 100%;
  box-sizing: border-box;
  padding: 0;
}

.admin-footer {
  display: flex;
  justify-content: center;
  align-items: center;
  color: #999;
  padding: 15px 0;
  font-size: 14px;
  border-top: 1px solid #f0f0f0;
}

.el-main {
  background-color: #f0f2f5;
  padding: 15px;
  overflow-x: hidden;
  width: 100%;
  box-sizing: border-box;
  flex: 1;
}

.el-footer {
  padding: 0;
  background-color: white;
}

.main-container {
  transition: width 0.3s;
  flex: 1;
  display: flex;
  flex-direction: column;
  width: 100% !important;
  overflow: hidden;
}

/* 确保el-row和el-col占满宽度 */
:deep(.el-row) {
  width: 100% !important;
  margin-left: 0 !important;
  margin-right: 0 !important;
}

:deep(.el-col) {
  padding-left: 7.5px !important;
  padding-right: 7.5px !important;
}

:deep(.el-card__body) {
  width: 100%;
}

/* 响应式布局调整 */
@media screen and (max-width: 768px) {
  .el-aside {
    width: 64px !important;
  }
  
  .admin-logo h2 {
    font-size: 16px;
  }
  
  .el-main {
    padding: 10px;
  }
}
</style> 