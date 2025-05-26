<template>
  <div class="layout">
    <Header />
    
    <div class="main-content">
      <div class="container">
        <router-view v-slot="{ Component, route }">
          <keep-alive :include="cachedViews">
            <component :is="Component" :key="route.fullPath" />
          </keep-alive>
        </router-view>
      </div>
    </div>
    
    <Footer />
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { useRoute } from 'vue-router'
import Header from '../components/Header.vue'
import Footer from '../components/Footer.vue'

const route = useRoute()
const cachedComponents = ref(['Home', 'Category', 'Search'])

// 计算需要缓存的组件
const cachedViews = computed(() => {
  return cachedComponents.value
})

// 监听路由变化，处理页面刷新问题
watch(() => route.path, (newPath, oldPath) => {
  console.log('路由变化:', { newPath, oldPath })
  
  // 确保oldPath和newPath都是字符串，防止undefined错误
  if (oldPath && newPath) {
    // 如果从订单相关页面跳转到其他页面，强制刷新目标页面
    if (oldPath.includes('/orders') && !newPath.includes('/orders')) {
      console.log('从订单页面跳转到其他页面，强制刷新目标页面')
      
      // 如果目标页面是首页、分类页或搜索页，从缓存中移除它，确保重新渲染
      if (newPath === '/' || newPath.includes('/category') || newPath.includes('/search')) {
        const targetComponent = newPath === '/' ? 'Home' : 
                               newPath.includes('/category') ? 'Category' : 
                               'Search'
        
        // 临时从缓存中移除目标组件
        const index = cachedComponents.value.indexOf(targetComponent)
        if (index !== -1) {
          console.log(`临时从缓存中移除组件: ${targetComponent}`)
          cachedComponents.value.splice(index, 1)
          
          // 200ms后重新添加到缓存中
          setTimeout(() => {
            console.log(`重新将组件添加到缓存: ${targetComponent}`)
            cachedComponents.value.push(targetComponent)
          }, 200)
        }
      }
      
      // 不再在这里触发页面刷新事件，由Header.vue的navigateTo函数处理
    }
  }
}, { immediate: false }) // 改为false，避免初始化时执行
</script>

<style scoped>
.layout {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

.main-content {
  flex: 1;
  padding-top: 60px;
  padding-bottom: 20px;
}

.container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style> 