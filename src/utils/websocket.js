/**
 * WebSocket客户端服务
 */
class WebSocketService {
  constructor() {
    this.socket = null
    this.isConnected = false
    this.listeners = []
    this.reconnectAttempts = 0
    this.maxReconnectAttempts = 5
    this.reconnectTimeout = null
    this.processedMessages = new Set() // 已处理的消息ID集合
    this.messageQueue = [] // 消息队列
    this.messageQueueTimer = null // 消息队列处理定时器
    this.userId = null // 保存用户ID
    this.visibilityChangeHandler = this.handleVisibilityChange.bind(this) // 页面可见性变化处理函数
  }

  /**
   * 连接WebSocket服务器
   * @param {Number} userId 用户ID
   */
  connect(userId) {
    if (this.isConnected || this.socket) {
      // 如果已连接或socket实例存在，先关闭
      this.close()
    }
    
    // 保存用户ID
    this.userId = userId
    
    try {
      // 使用硬编码的WebSocket URL，避免使用process.env
      const wsUrl = `ws://localhost:8080/ws/chat/${userId}/customer`
      this.socket = new WebSocket(wsUrl)

      this.socket.onopen = () => {
        this.isConnected = true
        this.reconnectAttempts = 0
        
        // 添加页面可见性变化监听器
        document.addEventListener('visibilitychange', this.visibilityChangeHandler)
      }

      this.socket.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data)
          
          // 检查消息是否已处理过（防止重复处理）
          if (data.id && this.processedMessages.has(data.id)) {
            return
          }
          
          // 记录已处理的消息ID
          if (data.id) {
            this.processedMessages.add(data.id)
            
            // 限制已处理消息ID集合的大小，防止内存泄漏
            if (this.processedMessages.size > 100) {
              // 移除最早添加的ID
              const idsArray = Array.from(this.processedMessages)
              this.processedMessages.clear()
              // 保留最新的50条
              idsArray.slice(-50).forEach(id => this.processedMessages.add(id))
            }
          }
          
          // 将消息添加到队列
          this.messageQueue.push(data)
          
          // 安排消息处理（使用防抖，减少频繁回调）
          this.scheduleMessageProcessing()
        } catch (error) {
          console.error('处理WebSocket消息失败:', error)
        }
      }

      this.socket.onclose = (event) => {
        if (this.isConnected) {
          this.isConnected = false
          
          // 移除页面可见性变化监听器
          document.removeEventListener('visibilitychange', this.visibilityChangeHandler)
          
          // 如果不是主动关闭，尝试重连
          if (!event.wasClean && this.reconnectAttempts < this.maxReconnectAttempts) {
            this.scheduleReconnect()
          }
        }
      }

      this.socket.onerror = (error) => {
        this.isConnected = false
      }
    } catch (error) {
      console.error('创建WebSocket连接失败:', error)
    }
  }
  
  /**
   * 处理页面可见性变化
   */
  handleVisibilityChange() {
    if (document.visibilityState === 'visible') {
      // 页面变为可见时，如果连接已断开，尝试重新连接
      if (!this.isConnected && this.userId) {
        this.connect(this.userId)
      }
    } else {
      // 页面变为不可见时，如果连接时间超过一定阈值，关闭连接以节省资源
      if (this.isConnected) {
        this.close()
      }
    }
  }
  
  /**
   * 安排消息处理
   * 使用防抖处理，避免短时间内多次触发回调
   */
  scheduleMessageProcessing() {
    // 清除现有定时器
    clearTimeout(this.messageQueueTimer)
    
    // 设置新定时器，100ms后处理消息队列
    this.messageQueueTimer = setTimeout(() => {
      // 处理队列中的所有消息
      const messages = [...this.messageQueue]
      this.messageQueue = []
      
      // 通知所有监听器
      messages.forEach(data => {
        this.listeners.forEach(callback => {
          try {
            callback(data)
          } catch (error) {
            console.error('执行WebSocket消息回调失败:', error)
          }
        })
      })
    }, 100)
  }

  /**
   * 安排重连
   */
  scheduleReconnect() {
    clearTimeout(this.reconnectTimeout)
    
    const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts), 30000)
    
    this.reconnectTimeout = setTimeout(() => {
      if (!this.isConnected && this.userId) {
        this.reconnectAttempts++
        this.connect(this.userId)
      }
    }, delay)
  }

  /**
   * 发送消息
   * @param {Object} data 消息数据
   */
  send(data) {
    if (this.isConnected && this.socket) {
      this.socket.send(JSON.stringify(data))
    } else {
      console.error('WebSocket未连接，无法发送消息')
    }
  }

  /**
   * 添加消息监听器
   * @param {Function} callback 回调函数
   */
  onMessage(callback) {
    if (typeof callback === 'function' && !this.listeners.includes(callback)) {
      this.listeners.push(callback)
    }
  }

  /**
   * 移除消息监听器
   * @param {Function} callback 回调函数
   */
  offMessage(callback) {
    this.listeners = this.listeners.filter(cb => cb !== callback)
  }

  /**
   * 关闭WebSocket连接
   */
  close() {
    // 清除所有定时器
    clearTimeout(this.reconnectTimeout)
    clearTimeout(this.messageQueueTimer)
    
    // 重置消息队列
    this.messageQueue = []
    
    // 移除页面可见性变化监听器
    document.removeEventListener('visibilitychange', this.visibilityChangeHandler)
    
    // 如果socket存在且连接已建立
    if (this.socket) {
      // 移除所有事件监听器
      this.socket.onopen = null
      this.socket.onmessage = null
      this.socket.onclose = null
      this.socket.onerror = null
      
      // 如果连接已建立，则关闭
      if (this.isConnected) {
        try {
          this.socket.close()
        } catch (error) {
          console.error('关闭WebSocket连接失败:', error)
        }
      }
      
      // 重置状态
      this.socket = null
      this.isConnected = false
    }
  }
}

// 创建单例
const webSocketService = new WebSocketService()
export default webSocketService 