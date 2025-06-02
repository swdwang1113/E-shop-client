import service from './index'

/**
 * 获取管理员会话列表
 * @param {Number} adminId 管理员ID
 * @returns {Promise}
 */
export function getAdminChatSessions(adminId) {
  return service({
    url: '/admin/api/chat/sessions',
    method: 'get',
    params: { adminId }
  })
}

/**
 * 获取会话消息历史
 * @param {String} sessionId 会话ID
 * @returns {Promise}
 */
export function getAdminChatMessages(sessionId) {
  return service({
    url: '/admin/api/chat/messages',
    method: 'get',
    params: { sessionId }
  })
}

/**
 * 发送消息
 * @param {Object} data 消息数据
 * @returns {Promise}
 */
export function sendAdminChatMessage(data) {
  return service({
    url: '/admin/api/chat/message',
    method: 'post',
    data
  })
}

/**
 * 标记消息已读
 * @param {Number} messageId 消息ID
 * @returns {Promise}
 */
export function markAdminMessageRead(messageId) {
  return service({
    url: '/admin/api/chat/message/read',
    method: 'put',
    params: { messageId }
  })
}

/**
 * 标记会话所有消息已读
 * @param {String} sessionId 会话ID
 * @param {Number} adminId 管理员ID
 * @returns {Promise}
 */
export function markAdminSessionRead(sessionId, adminId) {
  return service({
    url: '/admin/api/chat/session/read',
    method: 'put',
    params: { sessionId, adminId }
  })
}

/**
 * 结束会话
 * @param {String} sessionId 会话ID
 * @returns {Promise}
 */
export function endAdminChatSession(sessionId) {
  return service({
    url: '/admin/api/chat/session/end',
    method: 'put',
    params: { sessionId }
  })
}

/**
 * 获取未读消息数量
 * @param {Number} adminId 管理员ID
 * @returns {Promise}
 */
export function getAdminUnreadCount(adminId) {
  return service({
    url: '/admin/api/chat/unread/count',
    method: 'get',
    params: { adminId }
  })
}

/**
 * 接入会话
 * @param {String} sessionId 会话ID
 * @param {Number} adminId 管理员ID
 * @returns {Promise}
 */
export function takeSession(sessionId, adminId) {
  return service({
    url: '/admin/api/chat/session/take',
    method: 'put',
    params: { sessionId, adminId }
  })
}

/**
 * 获取待接入会话列表
 * @returns {Promise}
 */
export function getPendingChatSessions() {
  return service({
    url: '/admin/api/chat/sessions/pending',
    method: 'get'
  })
}

/**
 * 删除会话
 * @param {String} sessionId 会话ID
 * @param {Number} adminId 管理员ID
 * @returns {Promise}
 */
export function deleteAdminChatSession(sessionId, adminId) {
  return service({
    url: `/admin/api/chat/session/${sessionId}`,
    method: 'delete',
    params: { adminId }
  })
} 