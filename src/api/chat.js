import service from './index'

/**
 * 创建聊天会话
 * @param {Object} data 会话数据
 * @returns {Promise}
 */
export function createChatSession(data) {
  console.log('API调用: createChatSession', data)
  return service({
    url: '/api/chat/session',
    method: 'post',
    data
  })
}

/**
 * 获取用户会话列表
 * @param {Number} userId 用户ID
 * @returns {Promise}
 */
export function getChatSessions(userId) {
  console.log('API调用: getChatSessions', userId)
  return service({
    url: '/api/chat/sessions',
    method: 'get',
    params: { userId }
  })
}

/**
 * 获取会话消息历史
 * @param {String} sessionId 会话ID
 * @returns {Promise}
 */
export function getChatMessages(sessionId) {
  console.log('API调用: getChatMessages', sessionId)
  return service({
    url: '/api/chat/messages',
    method: 'get',
    params: { sessionId }
  })
}

/**
 * 发送消息
 * @param {Object} data 消息数据
 * @returns {Promise}
 */
export function sendChatMessage(data) {
  console.log('API调用: sendChatMessage', data)
  return service({
    url: '/api/chat/message',
    method: 'post',
    data
  })
}

/**
 * 标记消息已读
 * @param {Number} messageId 消息ID
 * @returns {Promise}
 */
export function markMessageRead(messageId) {
  console.log('API调用: markMessageRead', messageId)
  return service({
    url: '/api/chat/message/read',
    method: 'put',
    params: { messageId }
  })
}

/**
 * 标记会话所有消息已读
 * @param {String} sessionId 会话ID
 * @param {Number} userId 用户ID
 * @returns {Promise}
 */
export function markSessionRead(sessionId, userId) {
  console.log('API调用: markSessionRead', sessionId, userId)
  return service({
    url: '/api/chat/session/read',
    method: 'put',
    params: { sessionId, userId }
  })
}

/**
 * 结束会话
 * @param {String} sessionId 会话ID
 * @returns {Promise}
 */
export function endChatSession(sessionId) {
  console.log('API调用: endChatSession', sessionId)
  return service({
    url: '/api/chat/session/end',
    method: 'put',
    params: { sessionId }
  })
}

/**
 * 获取未读消息数量
 * @param {Number} userId 用户ID
 * @returns {Promise}
 */
export function getUnreadCount(userId) {
  console.log('API调用: getUnreadCount', userId)
  return service({
    url: '/api/chat/unread/count',
    method: 'get',
    params: { userId }
  })
}

/**
 * 删除会话
 * @param {String} sessionId 会话ID
 * @param {Number} userId 用户ID
 * @returns {Promise}
 */
export function deleteChatSession(sessionId, userId) {
  console.log('API调用: deleteChatSession', sessionId, userId)
  return service({
    url: `/api/chat/session/${sessionId}`,
    method: 'delete',
    params: { userId }
  })
} 