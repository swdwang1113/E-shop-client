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
        <a href="javascript:void(0)" @click="navigateTo('/chat')" class="nav-item">
          <el-badge :value="unreadCount" :hidden="unreadCount === 0" :max="99">
            <el-icon><ChatDotRound /></el-icon> 在线客服
          </el-badge>
        </a>
        
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
import { ref, onMounted, watch, onBeforeUnmount, computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { Search, ShoppingCart, ArrowDown, ChatDotRound } from '@element-plus/icons-vue'
import { ElMessageBox, ElMessage } from 'element-plus'
import { useUserStore } from '../store/user'
import { useCartStore } from '../store/cart'
import { getUnreadCount } from '../api/chat'
import { useRequestCancellation } from '../hooks/useRequestCancellation'
import { axios } from '../plugins/axios'

const router = useRouter()
const route = useRoute()
const userStore = useUserStore()
const cartStore = useCartStore()
const keyword = ref('')
const unreadCount = ref(0)
const lastFetchTime = ref(0)
let unreadCountTimer = null

// 使用请求取消钩子
const { createRequestConfig, cancelAllRequests, isRequestCancelled } = useRequestCancellation()

// 当前用户信息
const currentUser = computed(() => {
  return JSON.parse(localStorage.getItem('userInfo') || '{}')
})

// 是否在聊天页面
const isInChatPage = computed(() => {
  return route.path === '/chat'
})

onMounted(() => {
  if (userStore.isLoggedIn) {
    loadCart()
    // 初始获取一次未读消息数量
    fetchUnreadCount()
  }
  
  // 监听路由变化
  router.afterEach((to, from) => {
    // 如果从聊天页面离开，停止轮询
    if (from.path === '/chat' && to.path !== '/chat') {
      stopUnreadCountTimer()
    }
    // 如果进入聊天页面，停止轮询（由聊天页面自己负责更新）
    else if (to.path === '/chat') {
      stopUnreadCountTimer()
    }
    // 如果不在聊天页面，但需要显示未读消息数，启动轮询
    else if (to.path !== '/chat' && userStore.isLoggedIn) {
      startUnreadCountTimer()
    }
  })

  // 监听页面可见性变化
  document.addEventListener('visibilitychange', handleVisibilityChange)
})

// 监听用户登录状态变化，重新加载购物车和未读消息
watch(() => userStore.isLoggedIn, (newValue) => {
  if (newValue) {
    loadCart()
    fetchUnreadCount()
    
    // 如果不在聊天页面，启动轮询
    if (!isInChatPage.value) {
      startUnreadCountTimer()
    }
  } else {
    cartStore.cartItems = []
    unreadCount.value = 0
    stopUnreadCountTimer()
  }
})

// 获取未读消息数量
const fetchUnreadCount = async () => {
  // 如果用户未登录，直接返回
  if (!currentUser.value.id) {
    return
  }
  
  // 如果在聊天页面，不需要获取未读消息数量
  if (isInChatPage.value) {
    return
  }
  
  // 检查是否需要节流（5秒内不重复请求）
  const now = Date.now()
  if (now - lastFetchTime.value < 5000) {
    console.log('获取未读消息数量过于频繁，跳过请求')
    return
  }
  
  try {
    lastFetchTime.value = now
    const result = await axios.get(`/chat/unread/${currentUser.value.id}`, {
      ...createRequestConfig('HEADER_UNREAD_COUNT')
    })
    
    if (result.data.success) {
      // 计算总未读消息数量
      let total = 0
      if (result.data.data) {
        Object.values(result.data.data).forEach(count => {
          total += count
        })
      }
      unreadCount.value = total
    }
  } catch (error) {
    if (!isRequestCancelled(error)) {
      console.error('获取未读消息数量失败:', error)
    }
  }
}

// 开始未读消息数量定时器
const startUnreadCountTimer = () => {
  // 先清除可能存在的定时器
  stopUnreadCountTimer()
  
  // 如果用户未登录，不启动定时器
  if (!currentUser.value.id) {
    return
  }
  
  // 如果在聊天页面，不启动定时器
  if (isInChatPage.value) {
    return
  }
  
  // 立即获取一次
  fetchUnreadCount()
  
  // 每60秒获取一次
  unreadCountTimer = setInterval(() => {
    // 只有页面可见时才获取
    if (document.visibilityState === 'visible') {
      fetchUnreadCount()
    }
  }, 60000)
}

// 停止未读消息数量定时器
const stopUnreadCountTimer = () => {
  if (unreadCountTimer) {
    clearInterval(unreadCountTimer)
    unreadCountTimer = null
  }
  
  // 取消正在进行的请求
  cancelAllRequests()
}

// 处理页面可见性变化
const handleVisibilityChange = () => {
  if (document.visibilityState === 'visible') {
    // 页面变为可见时，获取未读消息数量
    fetchUnreadCount()
  } else {
    // 页面不可见时，取消所有请求
    cancelAllRequests()
  }
}

// 监听路由变化
watch(() => route.path, (newPath) => {
  if (newPath === '/chat') {
    // 进入聊天页面，停止定时器
    stopUnreadCountTimer()
  } else {
    // 离开聊天页面，启动定时器
    startUnreadCountTimer()
  }
})

// 监听用户登录状态变化
watch(() => currentUser.value.id, (newUserId) => {
  if (newUserId) {
    // 用户登录，启动定时器
    startUnreadCountTimer()
  } else {
    // 用户登出，停止定时器
    stopUnreadCountTimer()
  }
})

// 组件卸载前清除定时器
onBeforeUnmount(() => {
  stopUnreadCountTimer()
  // 移除页面可见性变化监听器
  document.removeEventListener('visibilitychange', handleVisibilityChange)
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