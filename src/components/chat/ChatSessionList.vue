<template>
  <div class="chat-session-list">
    <div class="chat-session-header">
      <h3>我的会话</h3>
      <el-button type="primary" size="small" @click="createNewSession">新建会话</el-button>
    </div>
    
    <el-empty v-if="sessions.length === 0" description="暂无会话"></el-empty>
    
    <div v-else class="session-items">
      <div
        v-for="session in sessions"
        :key="session.id"
        class="session-item"
        :class="{ 
          'session-item-active': currentSessionId === session.id,
          'session-item-ended': session.status === 1 
        }"
        @click="selectSession(session)"
      >
        <div class="session-avatar">
          <el-avatar :size="40" src="https://cube.elemecdn.com/0/88/03b0d39583f48206768a7534e55bcpng.png"></el-avatar>
          <div v-if="getSessionUnreadCount(session.id) > 0" class="unread-badge">{{ getSessionUnreadCount(session.id) }}</div>
        </div>
        <div class="session-info">
          <div class="session-title">{{ session.title || '在线客服' }}</div>
          <div class="session-time">{{ formatTime(session.lastUpdateTime) }}</div>
          <div class="session-status">
            <el-tag size="small" :type="getStatusType(session.status)">{{ getStatusText(session.status) }}</el-tag>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { defineComponent, ref } from 'vue'
import { ElMessageBox, ElMessage } from 'element-plus'
import { Delete } from '@element-plus/icons-vue'
import dayjs from 'dayjs'
import { axios } from '../../plugins/axios'
// 导入聊天相关API
import { createChatSession, deleteChatSession } from '../../api/chat'

export default defineComponent({
  name: 'ChatSessionList',
  props: {
    sessions: {
      type: Array,
      default: () => []
    },
    currentSessionId: {
      type: String,
      default: ''
    },
    unreadCounts: {
      type: Object,
      default: () => ({})
    }
  },
  emits: ['select-session', 'refresh-sessions'],
  setup(props, { emit }) {
    // 创建新会话
    const createNewSession = async () => {
      try {
        const { value: title } = await ElMessageBox.prompt('请输入会话标题', '新建会话', {
          confirmButtonText: '确认',
          cancelButtonText: '取消',
          inputPlaceholder: '例如：商品咨询'
        })
        
        if (title) {
          const userInfo = JSON.parse(localStorage.getItem('userInfo') || '{}')
          console.log('当前token:', localStorage.getItem('token')) // 打印token用于调试
          
          // 使用API函数替代直接axios调用
          const result = await createChatSession({
            customerId: userInfo.id,
            title: title.trim() || '在线咨询'
          })
          
          if (result.success) {
            emit('refresh-sessions')
            emit('select-session', result.data)
          }
        }
      } catch (error) {
        console.log('创建会话失败或用户取消:', error)
      }
    }

    // 选择会话
    const selectSession = (session) => {
      console.log('选择会话:', session)
      console.log('会话状态:', session.status, '(0=进行中, 1=已结束)')
      emit('select-session', session)
    }

    // 删除会话
    const handleDeleteSession = async (session) => {
      try {
        await ElMessageBox.confirm(
          '确定要删除此会话吗？删除后将无法恢复所有聊天记录。', 
          '删除会话', 
          {
            confirmButtonText: '确认',
            cancelButtonText: '取消',
            type: 'warning'
          }
        )
        
        const result = await deleteChatSession(session.id)
        
        if (result.success) {
          ElMessage.success('会话已删除')
          emit('refresh-sessions')
          
          // 如果删除的是当前选中的会话，清除选中状态
          if (props.currentSessionId === session.id) {
            emit('select-session', null)
          }
        } else {
          ElMessage.error(result.message || '删除失败')
        }
      } catch (error) {
        if (error !== 'cancel') {
          console.error('删除会话失败:', error)
          ElMessage.error('删除会话失败，请重试')
        }
      }
    }

    // 获取会话未读消息数量
    const getSessionUnreadCount = (sessionId) => {
      return props.unreadCounts[sessionId] || 0
    }

    // 格式化时间
    const formatTime = (time) => {
      if (!time) return ''
      
      const messageDate = dayjs(time)
      const now = dayjs()
      
      // 今天的消息只显示时间
      if (messageDate.format('YYYY-MM-DD') === now.format('YYYY-MM-DD')) {
        return messageDate.format('HH:mm')
      }
      
      // 昨天的消息显示"昨天"
      const yesterday = now.subtract(1, 'day')
      if (messageDate.format('YYYY-MM-DD') === yesterday.format('YYYY-MM-DD')) {
        return '昨天'
      }
      
      // 今年的消息显示"月-日"
      if (messageDate.format('YYYY') === now.format('YYYY')) {
        return messageDate.format('MM-DD')
      }
      
      // 其他显示年-月-日
      return messageDate.format('YYYY-MM-DD')
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

    return {
      createNewSession,
      selectSession,
      handleDeleteSession,
      getSessionUnreadCount,
      formatTime,
      getStatusText,
      getStatusType
    }
  }
})
</script>

<style scoped>
.chat-session-list {
  height: 100%;
  border-right: 1px solid #eee;
  display: flex;
  flex-direction: column;
}

.chat-session-header {
  padding: 15px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 1px solid #eee;
}

.chat-session-header h3 {
  margin: 0;
  font-size: 16px;
}

.session-items {
  flex: 1;
  overflow-y: auto;
}

.session-item {
  display: flex;
  padding: 15px;
  cursor: pointer;
  border-bottom: 1px solid #f5f5f5;
  transition: background-color 0.3s;
  align-items: center;
}

.session-item:hover {
  background-color: #f5f5f5;
}

.session-item-active {
  background-color: #ecf5ff;
}

.session-item-ended {
  opacity: 0.8;
}

.session-item-ended:hover {
  background-color: #f0f0f0;
}

.session-item-active.session-item-ended {
  background-color: #e8f4ff;
}

.session-avatar {
  position: relative;
  margin-right: 10px;
}

.unread-badge {
  position: absolute;
  top: -5px;
  right: -5px;
  background-color: #f56c6c;
  color: #fff;
  border-radius: 10px;
  min-width: 20px;
  height: 20px;
  text-align: center;
  line-height: 20px;
  font-size: 12px;
  padding: 0 6px;
}

.session-info {
  flex: 1;
  overflow: hidden;
}

.session-title {
  font-weight: bold;
  margin-bottom: 5px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.session-time {
  font-size: 12px;
  color: #999;
  margin-bottom: 5px;
}

.session-status {
  font-size: 12px;
}

.session-actions {
  opacity: 0;
  transition: opacity 0.3s;
}

.session-item:hover .session-actions {
  opacity: 1;
}
</style> 