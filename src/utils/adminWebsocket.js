/**
 * 管理员WebSocket服务
 */
class AdminWebSocketService {
  constructor() {
    this.socket = null
    this.messageHandlers = []
    this.connected = false
    this.reconnectTimer = null
    this.reconnectInterval = 5000 // 重连间隔时间5秒
    this.maxReconnectAttempts = 5 // 最大重连次数
    this.reconnectAttempts = 0
    this.adminId = null
  }

  /**
   * 连接WebSocket
   * @param {Number} adminId 管理员ID
   */
  connect(adminId) {
    if (!adminId) {
      console.error('管理员ID不能为空')
      return
    }

    // 保存管理员ID用于重连
    this.adminId = adminId

    // 如果已经连接，先断开
    if (this.socket) {
      this.socket.close()
    }

    // 重置重连计数
    this.reconnectAttempts = 0

    // 创建WebSocket连接
    const wsUrl = `${location.protocol === 'https:' ? 'wss:' : 'ws:'}//${location.host}/admin/ws/chat/${adminId}/admin`
    
    try {
      this.socket = new WebSocket(wsUrl)
      
      // 设置事件处理器
      this.socket.onopen = this.onOpen.bind(this)
      this.socket.onmessage = this.onMessage.bind(this)
      this.socket.onclose = this.onClose.bind(this)
      this.socket.onerror = this.onError.bind(this)
    } catch (error) {
      console.error('创建WebSocket连接失败:', error)
    }
  }

  /**
   * WebSocket连接成功事件处理
   * @param {Event} event
   */
  onOpen(event) {
    this.connected = true
    this.reconnectAttempts = 0
  }

  /**
   * WebSocket收到消息事件处理
   * @param {MessageEvent} event
   */
  onMessage(event) {
    try {
      const data = JSON.parse(event.data)

      // 调用所有注册的消息处理函数
      this.messageHandlers.forEach(handler => {
        try {
          handler(data)
        } catch (err) {
          console.error('消息处理器执行错误:', err)
        }
      })
    } catch (error) {
      console.error('解析WebSocket消息失败:', error)
    }
  }

  /**
   * WebSocket关闭事件处理
   * @param {CloseEvent} event
   */
  onClose(event) {
    this.connected = false
    this.socket = null

    // 自动重连
    this.scheduleReconnect()
  }

  /**
   * WebSocket错误事件处理
   */
  onError(event) {
    this.connected = false
  }

  /**
   * 安排重连
   */
  scheduleReconnect() {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer)
    }

    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectTimer = setTimeout(() => {
        this.reconnectAttempts++
        this.connect(this.adminId)
      }, this.reconnectInterval)
    }
  }

  /**
   * 注册消息处理函数
   * @param {Function} handler 消息处理函数
   */
  onMessage(handler) {
    if (typeof handler === 'function' && !this.messageHandlers.includes(handler)) {
      this.messageHandlers.push(handler)
    }
  }

  /**
   * 取消注册消息处理函数
   * @param {Function} handler 要取消的消息处理函数
   */
  offMessage(handler) {
    const index = this.messageHandlers.indexOf(handler)
    if (index !== -1) {
      this.messageHandlers.splice(index, 1)
    }
  }

  /**
   * 关闭WebSocket连接
   */
  disconnect() {
    if (this.socket) {
      this.socket.close()
      this.socket = null
    }

    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer)
      this.reconnectTimer = null
    }

    this.connected = false
    this.reconnectAttempts = 0
    this.messageHandlers = []
    this.adminId = null
  }

  /**
   * 发送消息
   * @param {Object} data 要发送的数据
   */
  sendMessage(data) {
    if (this.socket && this.connected) {
      this.socket.send(JSON.stringify(data))
    } else {
      console.error('WebSocket未连接，无法发送消息')
    }
  }
}

// 创建单例实例
export const adminWebSocketService = new AdminWebSocketService() 