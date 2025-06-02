<script setup>
import { defineComponent, provide, onBeforeUnmount } from 'vue'
import { useRouter } from 'vue-router'

// App component

// 全局请求取消控制器
const pendingRequests = new Map()

// 提供给子组件使用的请求控制方法
provide('requestControl', {
  // 添加请求到待处理列表
  addRequest: (key, controller) => {
    // 如果已存在相同key的请求，先取消它
    if (pendingRequests.has(key)) {
      pendingRequests.get(key).abort()
    }
    pendingRequests.set(key, controller)
  },
  
  // 移除已完成的请求
  removeRequest: (key) => {
    if (pendingRequests.has(key)) {
      pendingRequests.delete(key)
    }
  },
  
  // 取消指定的请求
  cancelRequest: (key) => {
    if (pendingRequests.has(key)) {
      pendingRequests.get(key).abort()
      pendingRequests.delete(key)
    }
  },
  
  // 取消所有请求
  cancelAllRequests: () => {
    pendingRequests.forEach(controller => {
      controller.abort()
    })
    pendingRequests.clear()
  }
})

// 监听路由变化，取消之前页面的请求
const router = useRouter()
router.beforeEach((to, from) => {
  // 如果路由发生变化，取消所有未完成的请求
  if (to.path !== from.path) {
    pendingRequests.forEach(controller => {
      controller.abort()
    })
    pendingRequests.clear()
  }
  return true
})

// 组件卸载前取消所有请求
onBeforeUnmount(() => {
  pendingRequests.forEach(controller => {
    controller.abort()
  })
  pendingRequests.clear()
})
</script>

<template>
  <router-view v-slot="{ Component }">
    <component :is="Component" />
  </router-view>
</template>

<style>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: "Helvetica Neue", Helvetica, "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  color: #333;
  background-color: #f5f5f5;
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
