<template>
  <div class="admin-chat-window">
    <div v-if="!session" class="chat-empty">
      <el-empty description="请选择或接入一个会话"></el-empty>
    </div>
    
    <template v-else>
      <div class="chat-header">
        <div class="chat-title">
          <span>{{ session.title || '客户咨询' }}</span>
          <span class="customer-name" v-if="session.customerName">({{ session.customerName }})</span>
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
        
        <el-empty v-else-if="processedMessages.length === 0" description="暂无消息"></el-empty>
        
        <template v-else>
          <div
            v-for="message in processedMessages"
            :key="message.id"
            class="message-item"
            :class="{
              'message-mine': message.isMine,
              'message-customer': !message.isMine
            }"
          >
            <div class="message-avatar">
              <el-avatar 
                :size="40" 
                :src="message.isMine ? adminAvatar : customerAvatar"
              ></el-avatar>
            </div>
            <div class="message-content">
              <div class="message-sender">
                {{ message.isMine ? (message.senderName || '客服') : (message.senderName || '客户') }}
              </div>
              <div class="message-text">{{ message.content }}</div>
              <div class="message-time">{{ formatMessageTime(message.createTime) }}</div>
            </div>
          </div>
        </template>
      </div>
      
      <div class="chat-input">
        <el-input
          v-model="inputContent"
          type="textarea"
          :rows="3"
          placeholder="请输入消息..."
          resize="none"
          :disabled="session.status !== 0 || session.adminId !== currentAdmin.id"
          @keydown.enter.exact.prevent="sendMessage"
        ></el-input>
        <div class="chat-input-actions">
          <el-button
            type="primary"
            :disabled="!inputContent.trim() || sending || session.status !== 0 || session.adminId !== currentAdmin.id"
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
import { defineComponent, ref, watch, nextTick, onMounted, computed } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import dayjs from 'dayjs'
import { getAdminChatMessages, sendAdminChatMessage, markAdminSessionRead, endAdminChatSession, deleteAdminChatSession } from '../../../api/adminChat'
import { useUserStore } from '../../../store/user'

export default defineComponent({
  name: 'AdminChatWindow',
  props: {
    session: {
      type: Object,
      default: () => ({})
    }
  },
  emits: ['messageSent', 'sessionDeleted'],
  setup(props, { emit }) {
    // 获取用户Store
    const userStore = useUserStore()
    
    // 消息列表
    const messages = ref([])
    
    // 输入框内容
    const inputContent = ref('')
    
    // 消息列表容器引用
    const messageListRef = ref(null)
    
    // 是否正在加载消息
    const loading = ref(false)
    
    // 是否正在发送消息
    const sending = ref(false)
    
    // 是否已将会话标记为已读
    const hasMarkedRead = ref(false)
    
    // 头像
    const adminAvatar = 'https://cube.elemecdn.com/3/7c/3ea6beec64369c2642b92c6726f1epng.png'
    const customerAvatar = 'https://cube.elemecdn.com/0/88/03b0d39583f48206768a7534e55bcpng.png'
    
    // 当前管理员信息
    const currentAdmin = computed(() => {
      return userStore.userInfo || {}
    })
    
    // 预处理消息，确保正确的显示位置
    const processedMessages = computed(() => {
      const result = messages.value.map(message => ({
        ...message,
        // 管理员自己发送的消息显示在右侧
        isMine: (message.senderType === 'admin' && 
                (message.senderId === currentAdmin.value.id || 
                 message.isLocal === true))
      }));
      
      console.log('处理后的消息列表:', 
        result.map(msg => ({
          id: msg.id, 
          content: msg.content.substring(0, 10) + '...',
          senderType: msg.senderType,
          senderId: msg.senderId,
          isMine: msg.isMine,
          isLocal: msg.isLocal
        }))
      );
      
      return result;
    });
    
    // 获取消息列表
    const fetchMessages = async () => {
      // 如果没有会话或管理员未登录，则不请求
      if (!props.session?.id || !currentAdmin.value.id) {
        console.log('无法获取消息：会话ID或管理员ID为空')
        return
      }
      
      console.log('准备获取会话消息:', props.session.id, '会话状态:', props.session.status)
      console.log('当前管理员ID:', currentAdmin.value.id)
      
      try {
        loading.value = true
        const result = await getAdminChatMessages(props.session.id)
        
        if (result.success) {
          // 保存本地发送的消息
          const localMessages = messages.value.filter(msg => msg.isLocal)
          
          // 处理从服务器获取的消息
          const serverMessages = result.data || []
          console.log('获取到消息数量:', serverMessages.length)
          
          // 标记哪些消息是管理员自己发送的
          const processedMessages = serverMessages.map(msg => {
            const isAdminMessage = msg.senderType === 'admin' && msg.senderId === currentAdmin.value.id;
            console.log('处理初始消息:', {
              id: msg.id,
              content: msg.content.substring(0, 10) + '...',
              senderType: msg.senderType,
              senderId: msg.senderId,
              currentAdminId: currentAdmin.value.id,
              isAdminMessage
            });
            
            return {
              ...msg,
              // 确保管理员自己发送的消息有正确的标记
              isMine: isAdminMessage
            };
          })
          
          // 合并服务器消息和本地消息
          // 如果本地消息已经在服务器消息中有对应，则不添加本地消息
          const serverMessageIds = processedMessages.map(msg => msg.id)
          const missingLocalMessages = localMessages.filter(
            localMsg => !serverMessageIds.includes(localMsg.id)
          )
          
          // 更新消息列表
          messages.value = [...processedMessages, ...missingLocalMessages]
          
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
        console.error('获取消息失败:', error)
        ElMessage.error('获取消息失败: ' + (error.message || '未知错误'))
      } finally {
        loading.value = false
      }
    }
    
    // 标记会话为已读
    const markSessionAsRead = async () => {
      if (!props.session?.id || hasMarkedRead.value || !currentAdmin.value.id) {
        return
      }
      
      try {
        const result = await markAdminSessionRead(props.session.id, currentAdmin.value.id)
        
        if (result.success) {
          hasMarkedRead.value = true
          console.log('会话已标记为已读')
        }
      } catch (error) {
        console.error('标记会话已读失败:', error)
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
      
      if (props.session.adminId !== currentAdmin.value.id) {
        ElMessage.warning('只能在您接入的会话中发送消息')
        return
      }
      
      const content = inputContent.value.trim()
      inputContent.value = ''
      sending.value = true
      
      console.log('发送消息 - 当前管理员ID:', currentAdmin.value.id)
      
      // 先添加一条本地消息，确保立即显示在右侧
      const localMessageId = `local_${Date.now()}`
      const localMessage = {
        id: localMessageId,
        sessionId: props.session.id,
        content,
        senderId: currentAdmin.value.id,
        senderType: 'admin',
        senderName: currentAdmin.value.username || '客服',
        receiverId: props.session.customerId,
        receiverType: 'customer',
        createTime: new Date().toISOString(),
        status: 0,
        isLocal: true, // 标记为本地消息
        isMine: true // 明确标记为我的消息
      }
      
      console.log('添加本地消息:', {
        id: localMessage.id,
        content: localMessage.content,
        senderId: localMessage.senderId,
        senderType: localMessage.senderType,
        isLocal: localMessage.isLocal,
        isMine: localMessage.isMine
      })
      
      // 使用新数组替换，确保触发响应式更新
      messages.value = [...messages.value, localMessage]
      
      // 立即滚动到底部
      await nextTick()
      scrollToBottom()
      
      try {
        const result = await sendAdminChatMessage({
          content,
          senderId: currentAdmin.value.id,
          senderType: 'admin',
          receiverId: props.session.customerId,
          receiverType: 'customer',
          senderName: currentAdmin.value.username || '客服',
          sessionId: props.session.id,
          type: 'CHAT'
        })
        
        if (result.success) {
          // 服务器返回成功后，用真实消息替换本地消息
          const serverMessage = {
            id: result.data?.id || Date.now().toString(),
            sessionId: props.session.id,
            content,
            senderId: currentAdmin.value.id,
            senderType: 'admin',
            senderName: currentAdmin.value.username || '客服',
            receiverId: props.session.customerId,
            receiverType: 'customer',
            createTime: result.data?.createTime || new Date().toISOString(),
            status: 0,
            isMine: true // 明确标记为我的消息
          }
          
          console.log('服务器消息返回:', {
            id: serverMessage.id,
            content: serverMessage.content,
            senderId: serverMessage.senderId,
            senderType: serverMessage.senderType,
            isMine: serverMessage.isMine
          })
          
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
        console.error('发送消息失败:', error)
        ElMessage.error('发送消息失败: ' + (error.message || '未知错误'))
      } finally {
        sending.value = false
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
        const result = await getAdminChatMessages(props.session.id)
        
        if (result.success) {
          // 处理从服务器获取的消息
          const serverMessages = result.data || []
          console.log('WebSocket通知后获取到消息数量:', serverMessages.length)
          
          // 标记哪些消息是管理员自己发送的
          const processedServerMessages = serverMessages.map(msg => {
            const isAdminMessage = msg.senderType === 'admin' && msg.senderId === currentAdmin.value.id;
            console.log('处理WebSocket消息:', {
              id: msg.id,
              content: msg.content.substring(0, 10) + '...',
              senderType: msg.senderType,
              senderId: msg.senderId,
              currentAdminId: currentAdmin.value.id,
              isAdminMessage
            });
            
            return {
              ...msg,
              // 确保管理员自己发送的消息有正确的标记
              isMine: isAdminMessage
            };
          })
          
          // 找出本地消息
          const localMessages = currentMessages.filter(msg => msg.isLocal)
          
          // 合并服务器消息和本地消息
          const serverMessageIds = processedServerMessages.map(msg => msg.id)
          const missingLocalMessages = localMessages.filter(
            localMsg => !serverMessageIds.includes(localMsg.id)
          )
          
          // 更新消息列表，保留本地消息
          messages.value = [...processedServerMessages, ...missingLocalMessages]
          
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
      console.log('AdminChatWindow组件挂载，会话信息:', props.session)
      console.log('当前管理员信息:', currentAdmin.value)
      
      if (props.session?.id) {
        console.log('组件挂载，初始获取消息:', props.session.id)
        fetchMessages()
      }
    })
    
    // 结束会话
    const handleEndSession = async () => {
      try {
        await ElMessageBox.confirm('确定要结束当前会话吗？结束后客户将无法继续发送消息。', '结束会话', {
          confirmButtonText: '确认',
          cancelButtonText: '取消',
          type: 'warning'
        })
        
        const result = await endAdminChatSession(props.session.id)
        
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
    
    // 格式化消息时间
    const formatMessageTime = (time) => {
      if (!time) return ''
      
      const messageDate = dayjs(time)
      const now = dayjs()
      
      // 今天的消息只显示时间
      if (messageDate.format('YYYY-MM-DD') === now.format('YYYY-MM-DD')) {
        return messageDate.format('HH:mm:ss')
      }
      
      // 昨天的消息显示"昨天 时间"
      const yesterday = now.subtract(1, 'day')
      if (messageDate.format('YYYY-MM-DD') === yesterday.format('YYYY-MM-DD')) {
        return `昨天 ${messageDate.format('HH:mm')}`
      }
      
      // 其他显示完整日期时间
      return messageDate.format('YYYY-MM-DD HH:mm')
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
        
        // 确保管理员ID不为空
        if (!currentAdmin.value.id) {
          ElMessage.warning('请先登录管理员账号')
          return
        }
        
        const result = await deleteAdminChatSession(props.session.id, currentAdmin.value.id)
        
        if (result.success) {
          ElMessage.success('会话已删除')
          emit('messageSent')
          // 通知父组件清除当前会话
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
      processedMessages,
      inputContent,
      messageListRef,
      loading,
      sending,
      currentAdmin,
      adminAvatar,
      customerAvatar,
      sendMessage,
      scrollToBottom,
      receiveNewMessage,
      handleEndSession,
      formatMessageTime,
      getStatusText,
      getStatusType,
      fetchMessages,
      handleDeleteSession
    }
  }
})
</script>

<style scoped>
.admin-chat-window {
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

.customer-name {
  font-weight: normal;
  color: #909399;
  font-size: 14px;
  margin-left: 5px;
  margin-right: 5px;
}

.ml-2 {
  margin-left: 8px;
}

.chat-messages {
  flex: 1;
  overflow-y: auto;
  padding: 15px;
}

.message-item {
  display: flex;
  margin-bottom: 20px;
  clear: both;
  width: 100%;
}

.message-mine {
  flex-direction: row-reverse;
}

.message-avatar {
  margin: 0 10px;
  flex-shrink: 0;
}

.message-content {
  max-width: 70%;
}

.message-mine .message-content {
  text-align: right;
}

.message-sender {
  font-size: 12px;
  color: #909399;
  margin-bottom: 5px;
}

.message-text {
  background-color: #fff;
  padding: 10px 15px;
  border-radius: 4px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.05);
  word-break: break-word;
  white-space: pre-wrap;
  display: inline-block;
  text-align: left;
}

.message-mine .message-text {
  background-color: #ecf5ff;
  color: #409EFF;
}

.message-customer .message-text {
  background-color: #fff;
  color: #303133;
}

.message-time {
  font-size: 12px;
  color: #909399;
  margin-top: 5px;
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