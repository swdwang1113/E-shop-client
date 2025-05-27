<template>
  <div class="header">
    <div class="container">
      <div class="logo">
        <a href="javascript:void(0)" @click="navigateTo('/')">
          <h1>购了么</h1>
        </a>
      </div>
      
      <div class="search">
        <el-input
          v-model="keyword"
          placeholder="请输入搜索关键词"
          class="search-input"
          @keyup.enter="handleSearch"
        >
          <template #append>
            <el-button @click="handleSearch">
              <el-icon><Search /></el-icon>
            </el-button>
          </template>
        </el-input>
      </div>
      
      <div class="nav">
        <a href="javascript:void(0)" @click="navigateTo('/')" class="nav-item">首页</a>
        <a href="javascript:void(0)" @click="navigateTo('/cart')" class="nav-item">
          <el-badge :value="cartStore.totalCount" :hidden="cartStore.totalCount === 0" :max="99">
            <el-icon><ShoppingCart /></el-icon> 购物车
          </el-badge>
        </a>
        <a href="javascript:void(0)" @click="navigateTo('/orders')" class="nav-item">我的订单</a>
        
        <template v-if="userStore.isLoggedIn">
          <el-dropdown trigger="click">
            <span class="nav-item user-dropdown">
              {{ userStore.userInfo.username }}
              <el-icon><ArrowDown /></el-icon>
            </span>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item @click="navigateTo('/user')">
                  个人中心
                </el-dropdown-item>
                <el-dropdown-item v-if="userStore.isAdmin" @click="navigateTo('/admin')">
                  管理后台
                </el-dropdown-item>
                <el-dropdown-item divided @click="handleLogout">退出登录</el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </template>
        <template v-else>
          <a href="javascript:void(0)" @click="navigateTo('/login')" class="nav-item">登录</a>
          <a href="javascript:void(0)" @click="navigateTo('/register')" class="nav-item">注册</a>
        </template>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { Search, ShoppingCart, ArrowDown } from '@element-plus/icons-vue'
import { ElMessageBox, ElMessage } from 'element-plus'
import { useUserStore } from '../store/user'
import { useCartStore } from '../store/cart'

const router = useRouter()
const userStore = useUserStore()
const cartStore = useCartStore()
const keyword = ref('')

onMounted(() => {
  if (userStore.isLoggedIn) {
    loadCart()
  }
})

// 监听用户登录状态变化，重新加载购物车
watch(() => userStore.isLoggedIn, (newValue) => {
  if (newValue) {
    loadCart()
  } else {
    cartStore.cartItems = []
  }
})

// 通用导航函数
const navigateTo = (path, query = {}) => {
  console.log(`导航到: ${path}`)
  
  // 如果是从订单页面跳转出来，先触发刷新事件
  if (router.currentRoute.value.path.includes('/orders') && !path.includes('/orders')) {
    console.log('从订单页面跳转到其他页面，触发刷新事件')
    
    // 先触发刷新事件
    window.dispatchEvent(new Event('reload-page'))
    
    // 延迟导航，确保事件处理完成
    setTimeout(() => {
      router.push({ path, query }).catch(err => {
        if (err.name !== 'NavigationDuplicated') {
          console.error('导航错误:', err)
          // 使用window.location作为备用
          const queryString = Object.keys(query).length > 0 
            ? '?' + new URLSearchParams(query).toString() 
            : ''
          window.location.href = path + queryString
        }
      })
    }, 50)
    
    return
  }
  
  // 正常导航
  router.push({ path, query }).catch(err => {
    if (err.name !== 'NavigationDuplicated') {
      console.error('导航错误:', err)
      // 使用window.location作为备用
      const queryString = Object.keys(query).length > 0 
        ? '?' + new URLSearchParams(query).toString() 
        : ''
      window.location.href = path + queryString
    }
  })
}

// 加载购物车数据
const loadCart = async () => {
  try {
    await cartStore.getCartList()
  } catch (error) {
    console.error('加载购物车失败:', error)
  }
}

const handleSearch = () => {
  if (keyword.value.trim()) {
    navigateTo('/search', { keyword: keyword.value })
  }
}

const handleLogout = () => {
  ElMessageBox.confirm('确定要退出登录吗?', '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(() => {
    userStore.logout()
    ElMessage.success('已退出登录')
    navigateTo('/')
  }).catch(() => {})
}
</script>

<style scoped>
.header {
  width: 100%;
  height: 60px;
  background-color: #fff;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  position: fixed;
  top: 0;
  left: 0;
  z-index: 100;
}

.container {
  max-width: 1200px;
  margin: 0 auto;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 20px;
}

.logo {
  flex: 1;
}

.logo a {
  text-decoration: none;
  color: #409EFF;
  cursor: pointer;
}

.search {
  flex: 2;
  padding: 0 20px;
}

.search-input {
  width: 100%;
}

.nav {
  flex: 2;
  display: flex;
  justify-content: flex-end;
  align-items: center;
}

.nav-item {
  margin-left: 20px;
  text-decoration: none;
  color: #333;
  transition: all 0.3s;
  cursor: pointer;
}

.nav-item:hover {
  color: #409EFF;
}

.user-dropdown {
  cursor: pointer;
  display: flex;
  align-items: center;
}

.el-dropdown-menu a {
  text-decoration: none;
  color: #333;
  display: block;
  width: 100%;
}
</style> 