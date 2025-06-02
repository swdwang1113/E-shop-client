<template>
  <div class="admin-chat-container">
    <div class="chat-sidebar">
      <AdminChatSessionList
        :sessions="sessions"
        :current-session-id="currentSession?.id"
        :unread-counts="unreadCounts"
        @select-session="handleSelectSession"
        @refresh-sessions="fetchSessions"
      />
    </div>
    
    <div class="chat-main">
      <AdminChatWindow
        ref="chatWindowRef"
        :session="currentSession"
        @message-sent="handleMessageSent"
        @session-deleted="handleSessionDeleted"
      />
    </div>
  </div>
</template>

<script>
import { defineComponent, ref, onMounted, onBeforeUnmount, computed, onActivated, onDeactivated } from 'vue'
import { ElMessage } from 'element-plus'
import { getAdminChatSessions, getAdminUnreadCount, markAdminSessionRead, getPendingChatSessions, getAdminChatMessages } from '../../api/adminChat'
import AdminChatSessionList from '../../components/admin/chat/AdminChatSessionList.vue'
import AdminChatWindow from '../../components/admin/chat/AdminChatWindow.vue'
import { adminWebSocketService } from '../../utils/adminWebsocket'
import { useUserStore } from '../../store/user'

export default defineComponent({
  name: 'AdminChat',
  components: {
    AdminChatSessionList,
    AdminChatWindow
  },
  setup() {
    // 获取用户Store
    const userStore = useUserStore()
    
    // 会话列表
    const sessions = ref([])
    
    // 当前选中的会话
    const currentSession = ref(null)
    
    // 未读消息数量
    const unreadCounts = ref({})
    
    // 聊天窗口组件引用
    const chatWindowRef = ref(null)
    
    // 页面是否激活
    const isPageActive = ref(true)
    
    // 是否正在获取会话列表
    const isFetchingSessions = ref(false)
    
    // 当前管理员信息
    const currentAdmin = computed(() => {
      return userStore.userInfo || {}
    })
    
    // 获取会话列表
    const fetchSessions = async () => {
      // 如果页面不活跃或管理员未登录或正在获取，则不请求
      if (!isPageActive.value || !currentAdmin.value.id || isFetchingSessions.value) return
      
      try {
        isFetchingSessions.value = true
        
        // 获取管理员的会话列表
        const result = await getAdminChatSessions(currentAdmin.value.id)
        
        // 获取待接入的会话列表
        const pendingResult = await getPendingChatSessions()
        
        let allSessions = []
        
        if (result.success) {
          // 确保正确处理响应数据
          const responseData = result.data || []
          allSessions = Array.isArray(responseData) ? responseData : []
        }
        
        if (pendingResult.success) {
          // 确保正确处理待接入会话数据
          const pendingSessions = pendingResult.data || []
          
          // 合并会话列表，确保不重复
          const existingIds = new Set(allSessions.map(s => s.id))
          const newPendingSessions = pendingSessions.filter(s => !existingIds.has(s.id))
          
          allSessions = [...allSessions, ...newPendingSessions]
        }
        
        // 更新会话列表
        sessions.value = allSessions
        
        // 如果当前会话在列表中，更新它的信息
        if (currentSession.value) {
          const updatedSession = sessions.value.find(s => s.id === currentSession.value.id)
          if (updatedSession) {
            currentSession.value = updatedSession
          }
        }
        
        // 获取未读消息数量
        await fetchUnreadCounts()
      } catch (error) {
        if (error.response && error.response.status === 401) {
          ElMessage.error('会话授权失败，请重新登录')
          setTimeout(() => {
            window.location.href = '/admin/login'
          }, 1500)
        }
      } finally {
        isFetchingSessions.value = false
      }
    }
    
    // 获取未读消息数量
    const fetchUnreadCounts = async () => {
      // 如果页面不活跃或管理员未登录，则不请求
      if (!isPageActive.value || !currentAdmin.value.id) return
      
      try {
        // 使用API函数获取总的未读消息数量
        const result = await getAdminUnreadCount(currentAdmin.value.id)
        
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
        console.error('获取未读消息数量失败:', error)
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
            const result = await getAdminChatMessages(session.id)
            
            if (result.success && Array.isArray(result.data)) {
              // 计算未读消息数量
              const unreadCount = result.data.filter(msg => 
                msg.receiverType === 'admin' && 
                msg.receiverId === currentAdmin.value.id && 
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
          // 如果不是当前会话的消息，且消息是发给管理员的，增加未读消息计数
          if (data.sessionId && data.receiverType === 'admin' && data.receiverId === currentAdmin.value.id) {
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
      if (currentAdmin.value.id) {
        adminWebSocketService.connect(currentAdmin.value.id)
        adminWebSocketService.onMessage(handleWebSocketMessage)
      }
    }
    
    // 清理所有资源
    const cleanup = () => {
      adminWebSocketService.offMessage(handleWebSocketMessage)
      clearTimeout(refreshSessionsTimer)
      isPageActive.value = false
    }
    
    // 组件挂载
    onMounted(() => {
      // 初始化页面状态
      isPageActive.value = true
      
      // 检查管理员信息
      if (!currentAdmin.value.id) {
        ElMessage.warning('请先登录管理员账号')
        return
      }
      
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
.admin-chat-container {
  display: flex;
  height: calc(100vh - 150px);
  min-height: 500px;
  border: 1px solid #eee;
  border-radius: 4px;
  overflow: hidden;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
  margin: 20px 0;
}

.chat-sidebar {
  width: 300px;
  border-right: 1px solid #eee;
  overflow: hidden;
}

.chat-main {
  flex: 1;
  overflow: hidden;
}

@media (max-width: 768px) {
  .admin-chat-container {
    flex-direction: column;
    height: calc(100vh - 120px);
  }
  
  .chat-sidebar {
    width: 100%;
    height: 250px;
    border-right: none;
    border-bottom: 1px solid #eee;
  }
  
  .chat-main {
    flex: 1;
  }
}
</style> 