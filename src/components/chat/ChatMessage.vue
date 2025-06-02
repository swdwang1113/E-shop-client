<template>
  <div class="chat-message" :class="{ 'chat-message-self': isSelf }">
    <div class="chat-message-avatar">
      <el-avatar :size="40" :src="avatarUrl"></el-avatar>
    </div>
    <div class="chat-message-content">
      <div class="chat-message-name">{{ displayName }}</div>
      <div class="chat-message-text">{{ message.content }}</div>
      <div class="chat-message-time">{{ formatTime }}</div>
    </div>
  </div>
</template>

<script>
import { computed, defineComponent } from 'vue'
import dayjs from 'dayjs'

export default defineComponent({
  name: 'ChatMessage',
  props: {
    message: {
      type: Object,
      required: true
    },
    currentUser: {
      type: Object,
      required: true
    }
  },
  setup(props) {
    // 是否是自己发送的消息
    const isSelf = computed(() => {
      console.log('检查消息是否为自己发送:', {
        messageId: props.message.id,
        messageSenderId: props.message.senderId,
        messageSenderType: props.message.senderType,
        currentUserId: props.currentUser.id
      });
      return props.message.senderId === props.currentUser.id && props.message.senderType === 'customer'
    })

    // 显示名称
    const displayName = computed(() => {
      if (isSelf.value) {
        return '我'
      } else {
        return props.message.senderType === 'admin' ? '客服' : props.message.senderName || '用户'
      }
    })

    // 头像URL
    const avatarUrl = computed(() => {
      if (isSelf.value) {
        return props.currentUser.avatar || 'https://cube.elemecdn.com/3/7c/3ea6beec64369c2642b92c6726f1epng.png'
      } else {
        return 'https://cube.elemecdn.com/0/88/03b0d39583f48206768a7534e55bcpng.png'
      }
    })

    // 格式化时间
    const formatTime = computed(() => {
      const time = props.message.createTime
      if (!time) return ''
      
      const messageDate = dayjs(time)
      const now = dayjs()
      
      // 今天的消息只显示时间
      if (messageDate.format('YYYY-MM-DD') === now.format('YYYY-MM-DD')) {
        return messageDate.format('HH:mm')
      }
      
      // 昨天的消息显示"昨天 时间"
      const yesterday = now.subtract(1, 'day')
      if (messageDate.format('YYYY-MM-DD') === yesterday.format('YYYY-MM-DD')) {
        return `昨天 ${messageDate.format('HH:mm')}`
      }
      
      // 今年的消息显示"月-日 时间"
      if (messageDate.format('YYYY') === now.format('YYYY')) {
        return messageDate.format('MM-DD HH:mm')
      }
      
      // 其他显示完整日期时间
      return messageDate.format('YYYY-MM-DD HH:mm')
    })

    return {
      isSelf,
      displayName,
      avatarUrl,
      formatTime
    }
  }
})
</script>

<style scoped>
.chat-message {
  display: flex;
  margin-bottom: 15px;
  padding: 0 15px;
}

.chat-message-self {
  flex-direction: row-reverse;
}

.chat-message-avatar {
  margin-right: 10px;
}

.chat-message-self .chat-message-avatar {
  margin-right: 0;
  margin-left: 10px;
}

.chat-message-content {
  max-width: 70%;
}

.chat-message-name {
  font-size: 12px;
  color: #999;
  margin-bottom: 5px;
}

.chat-message-self .chat-message-name {
  text-align: right;
}

.chat-message-text {
  background-color: #f2f2f2;
  padding: 10px 15px;
  border-radius: 4px;
  word-break: break-all;
  line-height: 1.5;
}

.chat-message-self .chat-message-text {
  background-color: #95ec69;
  color: #000;
}

.chat-message-time {
  font-size: 12px;
  color: #999;
  margin-top: 5px;
  text-align: right;
}
</style> 