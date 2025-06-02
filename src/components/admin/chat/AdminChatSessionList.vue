<template>
  <div class="admin-chat-session-list">
    <div class="chat-session-header">
      <h3>客户会话</h3>
      <div class="filter-controls">
        <el-radio-group v-model="statusFilter" size="small" @change="onFilterChange">
          <el-radio-button label="all">全部</el-radio-button>
          <el-radio-button label="waiting">待接入</el-radio-button>
          <el-radio-button label="active">进行中</el-radio-button>
          <el-radio-button label="ended">已结束</el-radio-button>
        </el-radio-group>
      </div>
    </div>
    
    <el-empty v-if="filteredSessions.length === 0" description="暂无会话"></el-empty>
    
    <div v-else class="session-items">
      <div
        v-for="session in filteredSessions"
        :key="session.id"
        class="session-item"
        :class="{ 
          'session-item-active': currentSessionId === session.id,
          'session-item-ended': session.status === 1,
          'session-item-waiting': session.adminId === null
        }"
        @click="selectSession(session)"
      >
        <div class="session-avatar">
          <el-avatar :size="40" src="https://cube.elemecdn.com/0/88/03b0d39583f48206768a7534e55bcpng.png"></el-avatar>
          <div v-if="getSessionUnreadCount(session.id) > 0" class="unread-badge">{{ getSessionUnreadCount(session.id) }}</div>
          <div v-if="session.adminId === null" class="waiting-badge">待接入</div>
        </div>
        <div class="session-info">
          <div class="session-title">
            {{ session.title || '客户咨询' }}
            <span class="customer-name" v-if="session.customerName">({{ session.customerName }})</span>
          </div>
          <div class="session-time">{{ formatTime(session.lastUpdateTime) }}</div>
          <div class="session-status">
            <el-tag size="small" :type="getStatusType(session.status)">{{ getStatusText(session.status) }}</el-tag>
          </div>
        </div>
        <div class="session-actions" v-if="session.adminId === null && session.status === 0">
          <el-button type="primary" size="small" @click.stop="handleTakeSession(session)">接入</el-button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { defineComponent, ref, computed } from 'vue'
import { ElMessage } from 'element-plus'
import dayjs from 'dayjs'
import { takeSession } from '../../../api/adminChat'
import { useUserStore } from '../../../store/user'

export default defineComponent({
  name: 'AdminChatSessionList',
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
    // 获取用户Store
    const userStore = useUserStore()
    
    // 状态过滤器
    const statusFilter = ref('all')
    
    // 过滤后的会话列表
    const filteredSessions = computed(() => {
      if (statusFilter.value === 'all') {
        return props.sessions
      } else if (statusFilter.value === 'waiting') {
        return props.sessions.filter(session => session.adminId === null)
      } else if (statusFilter.value === 'active') {
        return props.sessions.filter(session => session.adminId !== null && session.status === 0)
      } else if (statusFilter.value === 'ended') {
        return props.sessions.filter(session => session.status === 1)
      }
      return props.sessions
    })

    // 选择会话
    const selectSession = (session) => {
      console.log('选择会话:', session)
      
      // 如果是未接入的会话，先接入
      if (session.adminId === null && session.status === 0) {
        handleTakeSession(session)
        return
      }
      
      emit('select-session', session)
    }

    // 接入会话
    const handleTakeSession = async (session) => {
      try {
        const adminInfo = userStore.userInfo
        
        if (!adminInfo.id) {
          ElMessage.warning('请先登录管理员账号')
          return
        }
        
        const result = await takeSession(session.id, adminInfo.id)
        
        if (result.success) {
          ElMessage.success('会话接入成功')
          emit('refresh-sessions')
          
          // 等待列表刷新后选择会话
          setTimeout(() => {
            const updatedSession = { ...session, adminId: adminInfo.id }
            emit('select-session', updatedSession)
          }, 300)
        } else {
          ElMessage.error(result.message || '接入失败')
        }
      } catch (error) {
        console.error('接入会话失败:', error)
        ElMessage.error('接入会话失败，请重试')
      }
    }

    // 处理过滤器变化
    const onFilterChange = () => {
      console.log('过滤条件变化:', statusFilter.value)
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
      statusFilter,
      filteredSessions,
      selectSession,
      handleTakeSession,
      getSessionUnreadCount,
      formatTime,
      getStatusText,
      getStatusType,
      onFilterChange
    }
  }
})
</script>

<style scoped>
.admin-chat-session-list {
  height: 100%;
  border-right: 1px solid #eee;
  display: flex;
  flex-direction: column;
}

.chat-session-header {
  padding: 15px;
  display: flex;
  flex-direction: column;
  border-bottom: 1px solid #eee;
}

.chat-session-header h3 {
  margin: 0 0 10px 0;
  font-size: 16px;
}

.filter-controls {
  margin-top: 5px;
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
  position: relative;
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

.session-item-waiting {
  background-color: #fdf6ec;
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

.waiting-badge {
  position: absolute;
  bottom: -5px;
  right: -5px;
  background-color: #e6a23c;
  color: #fff;
  border-radius: 10px;
  font-size: 12px;
  padding: 0 6px;
  line-height: 16px;
  white-space: nowrap;
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

.customer-name {
  font-weight: normal;
  color: #909399;
  font-size: 12px;
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
  display: flex;
  align-items: center;
  margin-left: 10px;
}

.session-item:hover .session-actions {
  opacity: 1;
}
</style> 