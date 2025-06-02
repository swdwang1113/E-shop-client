<template>
  <div class="chat-window">
    <div v-if="!session" class="chat-empty">
      <el-empty description="请选择或创建一个会话"></el-empty>
    </div>
    
    <template v-else>
      <div class="chat-header">
        <div class="chat-title">
          <span>{{ session.title || '在线客服' }}</span>
          <el-tag size="small" :type="getStatusType(session.status)" class="ml-2">
            {{ getStatusText(session.status) }}
          </el-tag>
        </div>
        <div class="chat-actions">
          <el-button v-if="session.status === 0" type="danger" size="small" @click="handleEndSession">
            结束会话
          </el-button>
          <el-button type="danger" size="small" @click="handleDeleteSession">
            删除会话
          </el-button>
        </div>
      </div>
      
      <div class="chat-messages" ref="messageListRef">
        <div v-if="loading" class="chat-loading">
          <el-skeleton :rows="3" animated />
        </div>
        
        <el-empty v-else-if="messages.length === 0" description="暂无消息"></el-empty>
        
        <template v-else>
          <ChatMessage
            v-for="message in messages"
            :key="message.id"
            :message="message"
            :current-user="currentUser"
          />
        </template>
      </div>
      
      <div class="chat-input">
        <el-input
          v-model="inputContent"
          type="textarea"
          :rows="3"
          placeholder="请输入消息..."
          resize="none"
          :disabled="session.status !== 0"
          @keydown.enter.exact.prevent="sendMessage"
        ></el-input>
        <div class="chat-input-actions">
          <el-button
            type="primary"
            :disabled="!inputContent.trim() || sending || session.status !== 0"
            @click="sendMessage"
          >
            发送
          </el-button>
        </div>
      </div>
    </template>
  </div>
</template>

<script>
import { defineComponent, ref, watch, nextTick, onMounted, onBeforeUnmount, computed, onUpdated } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import ChatMessage from './ChatMessage.vue'
import { getChatMessages, sendChatMessage, markSessionRead, endChatSession, deleteChatSession } from '../../api/chat'
import { useRequestCancellation } from '../../hooks/useRequestCancellation'
import { axios } from '../../plugins/axios'
import dayjs from 'dayjs'

export default defineComponent({
  name: 'ChatWindow',
  components: {
    ChatMessage
  },
  props: {
    session: {
      type: Object,
      default: () => ({})
    }
  },
  emits: ['messageSent', 'sessionDeleted'],
  setup(props, { emit }) {
    // 消息列表
    const messages = ref([])
    
    // 输入框内容
    const inputContent = ref('')
    
    // 消息列表容器引用
    const messageListRef = ref(null)
    
    // 是否正在加载消息
    const loading = ref(false)
    
    // 是否已将会话标记为已读
    const hasMarkedRead = ref(false)
    
    // 使用请求取消钩子
    const { createRequestConfig, cancelAllRequests, isRequestCancelled } = useRequestCancellation()
    
    // 当前用户信息
    const currentUser = computed(() => {
      return JSON.parse(localStorage.getItem('userInfo') || '{}')
    })
    
    // 获取消息列表
    const fetchMessages = async () => {
      // 如果没有会话或用户未登录，则不请求
      if (!props.session?.id || !currentUser.value.id) {
        console.log('无法获取消息：会话ID或用户ID为空')
        return
      }
      
      console.log('准备获取会话消息:', props.session.id, '会话状态:', props.session.status)
      console.log('会话完整信息:', JSON.stringify(props.session))
      
      try {
        loading.value = true
        // 使用API函数替代直接axios调用
        console.log('发起获取消息请求...')
        const result = await getChatMessages(props.session.id)
        
        console.log('获取消息结果:', result)
        
        if (result.success) {
          // 保存本地发送的消息（没有id的消息）
          const localMessages = messages.value.filter(msg => msg.id.toString().startsWith('local_'))
          
          // 获取服务器消息
          const serverMessages = result.data || []
          console.log('获取到服务器消息数量:', serverMessages.length)
          
          // 合并服务器消息和本地消息
          // 如果本地消息已经在服务器消息中有对应，则不添加本地消息
          const serverMessageIds = serverMessages.map(msg => msg.id)
          const missingLocalMessages = localMessages.filter(
            localMsg => !serverMessageIds.includes(localMsg.id)
          )
          
          // 更新消息列表
          messages.value = [...serverMessages, ...missingLocalMessages]
          console.log('更新后的消息数量:', messages.value.length)
          
          // 滚动到底部
          await nextTick()
          scrollToBottom()
          
          // 如果有消息且未标记为已读，则标记会话为已读
          if (messages.value.length > 0 && !hasMarkedRead.value) {
            markSessionAsRead()
          }
        } else {
          console.error('获取消息失败:', result.message)
          ElMessage.error(result.message || '获取消息失败')
        }
      } catch (error) {
        console.error('获取消息异常:', error)
        if (!isRequestCancelled(error)) {
          console.error('获取消息失败:', error)
          ElMessage.error('获取消息失败: ' + (error.message || '未知错误'))
        }
      } finally {
        loading.value = false
      }
    }
    
    // 标记会话为已读
    const markSessionAsRead = async () => {
      if (!props.session?.id || hasMarkedRead.value) {
        return
      }
      
      try {
        // 使用API函数替代直接axios调用
        const result = await markSessionRead(props.session.id, currentUser.value.id)
        
        if (result.success) {
          hasMarkedRead.value = true
          console.log('会话已标记为已读')
        }
      } catch (error) {
        if (!isRequestCancelled(error)) {
          console.error('标记会话已读失败:', error)
        }
      }
    }
    
    // 发送消息
    const sendMessage = async () => {
      if (!inputContent.value.trim()) {
        ElMessage.warning('消息不能为空')
        return
      }
      
      if (!props.session?.id) {
        ElMessage.warning('请先选择会话')
        return
      }
      
      const content = inputContent.value.trim()
      inputContent.value = ''
      
      // 先添加一条本地消息，确保立即显示在右侧
      const localMessageId = `local_${Date.now()}`
      const localMessage = {
        id: localMessageId,
        sessionId: props.session.id,
        content,
        senderId: currentUser.value.id,
        senderType: 'customer',
        senderName: currentUser.value.username || '我',
        receiverId: props.session.adminId || null,
        receiverType: 'admin',
        createTime: new Date().toISOString(),
        status: 0
      }
      
      // 使用新数组替换，确保触发响应式更新
      messages.value = [...messages.value, localMessage]
      
      // 立即滚动到底部
      await nextTick()
      scrollToBottom()
      
      try {
        // 使用API函数替代直接axios调用
        const result = await sendChatMessage({
          content,
          senderId: currentUser.value.id,
          senderType: 'customer',
          receiverId: props.session.adminId || null,
          receiverType: 'admin',
          senderName: currentUser.value.username || '我',
          sessionId: props.session.id,
          type: 'CHAT'
        })
        
        console.log('发送消息结果:', result)
        
        if (result.success) {
          // 替换本地消息为服务器返回的消息
          const serverMessage = {
            id: result.data?.id || Date.now().toString(),
            sessionId: props.session.id,
            content,
            senderId: currentUser.value.id,
            senderType: 'customer',
            senderName: currentUser.value.username || '我',
            receiverId: props.session.adminId || null,
            receiverType: 'admin',
            createTime: result.data?.createTime || new Date().toISOString(),
            status: 0
          }
          
          // 替换本地消息
          messages.value = messages.value.map(msg => 
            msg.id === localMessageId ? serverMessage : msg
          )
          
          // 通知父组件消息已发送
          emit('messageSent')
        } else {
          // 发送失败，移除本地消息
          messages.value = messages.value.filter(msg => msg.id !== localMessageId)
          ElMessage.error(result.message || '发送失败')
        }
      } catch (error) {
        // 发送失败，移除本地消息
        messages.value = messages.value.filter(msg => msg.id !== localMessageId)
        if (!isRequestCancelled(error)) {
          console.error('发送消息失败:', error)
          ElMessage.error('发送消息失败: ' + (error.message || '未知错误'))
        }
      }
    }
    
    // 滚动到底部
    const scrollToBottom = () => {
      if (messageListRef.value) {
        messageListRef.value.scrollTop = messageListRef.value.scrollHeight
      }
    }
    
    // 接收新消息的方法（供父组件调用）
    const receiveNewMessage = async () => {
      // 保存当前的消息列表，以便在获取新消息后可以进行比较
      const currentMessages = [...messages.value]
      
      try {
        // 获取最新消息
        const result = await getChatMessages(props.session.id)
        
        if (result.success) {
          // 保存本地发送的消息（没有id的消息）
          const localMessages = currentMessages.filter(msg => msg.id.toString().startsWith('local_'))
          
          // 获取服务器消息
          const serverMessages = result.data || []
          console.log('WebSocket通知后获取到服务器消息数量:', serverMessages.length)
          
          // 合并服务器消息和本地消息
          const serverMessageIds = serverMessages.map(msg => msg.id)
          const missingLocalMessages = localMessages.filter(
            localMsg => !serverMessageIds.includes(localMsg.id)
          )
          
          // 更新消息列表，保留本地消息
          messages.value = [...serverMessages, ...missingLocalMessages]
          
          // 如果有新消息，滚动到底部
          if (serverMessages.length > currentMessages.length) {
            await nextTick()
            scrollToBottom()
          }
          
          // 标记为已读
          if (!hasMarkedRead.value) {
            markSessionAsRead()
          }
        }
      } catch (error) {
        console.error('接收新消息失败:', error)
      }
    }
    
    // 监听会话变化
    watch(() => props.session, (newSession, oldSession) => {
      console.log('会话对象变化:', oldSession?.id, '->', newSession?.id)
      console.log('新会话完整信息:', newSession)
      
      if (newSession && (!oldSession || newSession.id !== oldSession.id)) {
        // 会话变化时，重置状态
        messages.value = []
        hasMarkedRead.value = false
        console.log('会话已变化，重置消息列表和已读状态')
        
        // 获取新会话的消息
        fetchMessages()
      }
    }, { deep: true })
    
    // 组件挂载
    onMounted(() => {
      // 初始获取消息
      console.log('ChatWindow组件挂载，会话信息:', props.session)
      if (props.session?.id) {
        console.log('组件挂载，初始获取消息:', props.session.id)
        fetchMessages()
      } else {
        console.log('组件挂载时没有会话ID')
      }
    })
    
    // 在组件更新时也检查会话
    onUpdated(() => {
      console.log('ChatWindow组件更新，会话信息:', props.session)
    })
    
    // 结束会话
    const handleEndSession = async () => {
      try {
        await ElMessageBox.confirm('确定要结束当前会话吗？结束后将无法继续发送消息。', '结束会话', {
          confirmButtonText: '确认',
          cancelButtonText: '取消',
          type: 'warning'
        })
        
        // 使用API函数替代直接axios调用
        const result = await endChatSession(props.session.id)
        
        if (result.success) {
          ElMessage.success('会话已结束')
          emit('messageSent')
        }
      } catch (error) {
        if (error !== 'cancel') {
          console.error('结束会话失败:', error)
          ElMessage.error('结束会话失败，请重试')
        }
      }
    }
    
    // 获取状态文本
    const getStatusText = (status) => {
      const statusMap = {
        0: '进行中',
        1: '已结束'
      }
      return statusMap[status] || '未知'
    }
    
    // 获取状态类型
    const getStatusType = (status) => {
      const typeMap = {
        0: 'success',
        1: 'info'
      }
      return typeMap[status] || ''
    }
    
    // 删除会话
    const handleDeleteSession = async () => {
      try {
        await ElMessageBox.confirm('确定要删除当前会话吗？删除后将无法恢复。', '删除会话', {
          confirmButtonText: '确认',
          cancelButtonText: '取消',
          type: 'warning'
        })
        
        // 确保用户ID不为空
        if (!currentUser.value.id) {
          ElMessage.warning('请先登录')
          return
        }
        
        // 使用API函数替代直接axios调用
        const result = await deleteChatSession(props.session.id, currentUser.value.id)
        
        if (result.success) {
          ElMessage.success('会话已删除')
          emit('messageSent')
          // 通知父组件会话已删除
          emit('sessionDeleted', props.session.id)
        } else {
          ElMessage.error(result.message || '删除失败')
        }
      } catch (error) {
        if (error !== 'cancel') {
          console.error('删除会话失败:', error)
          ElMessage.error('删除会话失败: ' + (error.message || '请重试'))
        }
      }
    }
    
    return {
      messages,
      inputContent,
      messageListRef,
      loading,
      currentUser,
      sendMessage,
      scrollToBottom,
      receiveNewMessage,
      handleEndSession,
      getStatusText,
      getStatusType,
      fetchMessages,
      handleDeleteSession
    }
  }
})
</script>

<style scoped>
.chat-window {
  height: 100%;
  display: flex;
  flex-direction: column;
  background-color: #f9f9f9;
}

.chat-empty {
  flex: 1;
  display: flex;
  justify-content: center;
  align-items: center;
}

.chat-header {
  padding: 15px;
  border-bottom: 1px solid #eee;
  background-color: #fff;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.chat-title {
  font-size: 16px;
  font-weight: bold;
  display: flex;
  align-items: center;
}

.ml-2 {
  margin-left: 8px;
}

.chat-messages {
  flex: 1;
  overflow-y: auto;
  padding: 15px 0;
}

.chat-loading {
  padding: 0 15px;
}

.chat-input {
  border-top: 1px solid #eee;
  padding: 15px;
  background-color: #fff;
}

.chat-input-actions {
  margin-top: 10px;
  display: flex;
  justify-content: flex-end;
}
</style> 