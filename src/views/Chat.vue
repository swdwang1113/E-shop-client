<template>
  <div class="chat-container">
    <div class="chat-sidebar">
      <ChatSessionList
        :sessions="sessions"
        :current-session-id="currentSession?.id"
        :unread-counts="unreadCounts"
        @select-session="handleSelectSession"
        @refresh-sessions="fetchSessions"
      />
    </div>
    
    <div class="chat-main">
      <ChatWindow
        ref="chatWindowRef"
        :session="currentSession"
        @refresh-sessions="fetchSessions"
        @message-sent="handleMessageSent"
        @session-deleted="handleSessionDeleted"
      />
    </div>
  </div>
</template>

<script>
import { defineComponent, ref, onMounted, onBeforeUnmount, computed, onActivated, onDeactivated } from 'vue'
import { useRoute } from 'vue-router'
import { ElMessage } from 'element-plus'
import ChatSessionList from '../components/chat/ChatSessionList.vue'
import ChatWindow from '../components/chat/ChatWindow.vue'
import { useRequestCancellation } from '../hooks/useRequestCancellation'
import webSocketService from '../utils/websocket'
// 导入聊天相关API
import { getChatSessions, getChatMessages, markSessionRead, getUnreadCount } from '../api/chat'

export default defineComponent({
  name: 'Chat',
  components: {
    ChatSessionList,
    ChatWindow
  },
  setup() {
    // 会话列表
    const sessions = ref([])
    
    // 当前选中的会话
    const currentSession = ref(null)
    
    // 未读消息数量
    const unreadCounts = ref({})
    
    // 聊天窗口组件引用
    const chatWindowRef = ref(null)
    
    // 当前路由
    const route = useRoute()
    
    // 页面是否激活（是否是当前显示的页面）
    const isPageActive = ref(true)
    
    // 使用请求取消钩子
    const { createRequestConfig, cancelAllRequests, isRequestCancelled } = useRequestCancellation()
    
    // 当前用户信息
    const currentUser = computed(() => {
      return JSON.parse(localStorage.getItem('userInfo') || '{}')
    })
    
    // 是否正在获取会话列表
    const isFetchingSessions = ref(false)
    
    // 获取会话列表
    const fetchSessions = async () => {
      // 如果页面不活跃或用户未登录或正在获取，则不请求
      if (!isPageActive.value || !currentUser.value.id || isFetchingSessions.value) return
      
      try {
        isFetchingSessions.value = true
        
        // 使用API函数替代直接axios调用
        const result = await getChatSessions(currentUser.value.id)
        
        if (result.success) {
          // 确保正确处理响应数据
          const responseData = result.data || [];
          sessions.value = Array.isArray(responseData) ? responseData : [];
          
          // 如果当前会话在列表中，更新它的信息
          if (currentSession.value) {
            const updatedSession = sessions.value.find(s => s.id === currentSession.value.id)
            if (updatedSession) {
              currentSession.value = updatedSession
            }
          }
          
          // 获取未读消息数量
          await fetchUnreadCounts()
        }
      } catch (error) {
        if (!isRequestCancelled(error)) {
          if (error.response && error.response.status === 401) {
            ElMessage.error('会话授权失败，请重新登录')
            setTimeout(() => {
              window.location.href = '/login'
            }, 1500)
          }
        }
      } finally {
        isFetchingSessions.value = false
      }
    }
    
    // 获取未读消息数量
    const fetchUnreadCounts = async () => {
      // 如果页面不活跃或用户未登录，则不请求
      if (!isPageActive.value || !currentUser.value.id) return
      
      try {
        // 使用API函数获取总的未读消息数量
        const result = await getUnreadCount(currentUser.value.id)
        
        if (result.success) {
          // 接口返回的是总的未读消息数量
          const totalUnread = result.data || 0
          
          // 如果有未读消息，则获取每个会话的未读消息数量
          if (totalUnread > 0) {
            await fetchSessionUnreadCounts()
          } else {
            // 如果没有未读消息，则清空未读消息计数
            unreadCounts.value = {}
          }
        }
      } catch (error) {
        if (!isRequestCancelled(error)) {
          console.error('获取未读消息数量失败:', error)
        }
      }
    }
    
    // 获取每个会话的未读消息数量 - 简化版本
    const fetchSessionUnreadCounts = async () => {
      // 如果没有会话，则不请求
      if (!sessions.value.length) return
      
      try {
        const sessionUnreadCounts = {}
        
        // 遍历所有会话，获取每个会话的未读消息数量
        for (const session of sessions.value) {
          try {
            const result = await getChatMessages(session.id)
            
            if (result.success && Array.isArray(result.data)) {
              // 计算未读消息数量
              const unreadCount = result.data.filter(msg => 
                msg.receiverId === currentUser.value.id && 
                msg.status === 0
              ).length
              
              if (unreadCount > 0) {
                sessionUnreadCounts[session.id] = unreadCount
              }
            }
          } catch (error) {
            console.error(`获取会话 ${session.id} 的未读消息数量失败:`, error)
          }
        }
        
        // 更新未读消息数量
        unreadCounts.value = sessionUnreadCounts
      } catch (error) {
        console.error('获取会话未读消息数量失败:', error)
      }
    }
    
    // 选择会话
    const handleSelectSession = (session) => {
      // 如果session为null，清除当前会话
      if (!session) {
        currentSession.value = null
        return
      }
      
      // 如果已经选中该会话，则不重复选择
      if (currentSession.value && currentSession.value.id === session.id) {
        return
      }
      
      // 无论会话状态如何，都允许查看
      currentSession.value = { ...session }  // 使用解构复制会话对象，确保引用更新
      
      // 清除该会话的未读消息计数
      if (unreadCounts.value[session.id]) {
        unreadCounts.value = { ...unreadCounts.value, [session.id]: 0 }
      }
      
      // 强制刷新聊天窗口
      if (chatWindowRef.value && typeof chatWindowRef.value.fetchMessages === 'function') {
        setTimeout(() => {
          chatWindowRef.value.fetchMessages()
        }, 100)
      }
    }
    
    // 处理消息发送
    const handleMessageSent = () => {
      // 发送消息后更新会话列表
      setTimeout(() => {
        if (isPageActive.value) {
          fetchSessions()
        }
      }, 1000)
    }
    
    // 处理WebSocket消息
    const handleWebSocketMessage = (data) => {
      // 如果页面不活跃，则不处理消息
      if (!isPageActive.value) return
      
      // 如果是聊天消息
      if (data.type === 'CHAT') {
        // 如果是当前会话的消息，通知聊天窗口组件刷新消息
        if (currentSession.value && data.sessionId === currentSession.value.id && chatWindowRef.value) {
          chatWindowRef.value.receiveNewMessage()
        } else {
          // 如果不是当前会话的消息，增加未读消息计数
          if (data.sessionId) {
            unreadCounts.value = { 
              ...unreadCounts.value, 
              [data.sessionId]: (unreadCounts.value[data.sessionId] || 0) + 1 
            }
          }
        }
        
        // 更新会话列表，但使用防抖避免频繁刷新
        clearTimeout(refreshSessionsTimer)
        refreshSessionsTimer = setTimeout(() => {
          if (isPageActive.value) {
            fetchSessions()
          }
        }, 1000)
      }
    }
    
    // 用于防抖的定时器
    let refreshSessionsTimer = null
    
    // 初始化WebSocket
    const initWebSocket = () => {
      if (currentUser.value.id) {
        webSocketService.connect(currentUser.value.id)
        webSocketService.onMessage(handleWebSocketMessage)
      }
    }
    
    // 清理所有资源
    const cleanup = () => {
      webSocketService.offMessage(handleWebSocketMessage)
      clearTimeout(refreshSessionsTimer)
      isPageActive.value = false
      cancelAllRequests() // 取消所有未完成的请求
    }
    
    // 组件挂载
    onMounted(() => {
      // 初始化页面状态
      isPageActive.value = true
      
      // 初始加载会话列表
      fetchSessions()
      
      // 初始化WebSocket
      initWebSocket()
      
      // 监听页面可见性变化
      document.addEventListener('visibilitychange', handleVisibilityChange)
    })
    
    // 处理页面可见性变化
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        // 页面变为可见且组件已挂载时，更新数据
        if (isPageActive.value) {
          fetchSessions()
        }
      } else {
        // 页面不可见时，取消所有未完成的请求
        cancelAllRequests()
      }
    }
    
    // 组件被激活（keep-alive）
    onActivated(() => {
      isPageActive.value = true
      fetchSessions()
    })
    
    // 组件被停用（keep-alive）
    onDeactivated(() => {
      isPageActive.value = false
      cancelAllRequests() // 取消所有未完成的请求
    })
    
    // 组件卸载前
    onBeforeUnmount(() => {
      cleanup()
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    })
    
    // 处理会话删除事件
    const handleSessionDeleted = (sessionId) => {
      // 如果删除的是当前会话，清除当前会话
      if (currentSession.value && currentSession.value.id === sessionId) {
        currentSession.value = null
      }
      
      // 刷新会话列表
      fetchSessions()
    }
    
    return {
      sessions,
      currentSession,
      unreadCounts,
      chatWindowRef,
      handleSelectSession,
      fetchSessions,
      handleMessageSent,
      handleSessionDeleted
    }
  }
})
</script>

<style scoped>
.chat-container {
  display: flex;
  height: calc(100vh - 200px);
  min-height: 500px;
  border: 1px solid #eee;
  border-radius: 4px;
  overflow: hidden;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
  margin: 20px 0;
}

.chat-sidebar {
  width: 280px;
  border-right: 1px solid #eee;
  overflow: hidden;
}

.chat-main {
  flex: 1;
  overflow: hidden;
}

@media (max-width: 768px) {
  .chat-container {
    flex-direction: column;
    height: calc(100vh - 150px);
  }
  
  .chat-sidebar {
    width: 100%;
    height: 200px;
    border-right: none;
    border-bottom: 1px solid #eee;
  }
  
  .chat-main {
    flex: 1;
  }
}
</style> 