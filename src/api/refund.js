import request from './index'

// 申请退款
export function applyRefund(orderId, refundData) {
  console.log('申请退款参数:', orderId, refundData)
  return request({
    url: `/api/orders/${orderId}/refund`,
    method: 'post',
    data: refundData
  }).then(res => {
    console.log('申请退款响应:', res)
    return res
  }).catch(err => {
    console.error('申请退款错误:', err)
    throw err
  })
}

// 上传退款凭证图片
export function uploadRefundImage(file) {
  const formData = new FormData()
  formData.append('file', file)
  
  return request({
    url: '/api/refunds/upload/image',
    method: 'post',
    data: formData,
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  })
}

// 获取退款详情
export function getRefundDetail(refundId) {
  console.log('获取退款详情, ID:', refundId)
  return request({
    url: `/api/refunds/${refundId}`,
    method: 'get'
  }).then(res => {
    console.log('退款详情响应:', res)
    return res
  }).catch(err => {
    console.error('获取退款详情错误:', err)
    throw err
  })
}

// 获取用户退款列表
export function getUserRefunds(params) {
  console.log('获取用户退款列表参数:', params)
  const requestParams = {
    pageNum: params?.pageNum || 1,
    pageSize: params?.pageSize || 10
  }
  
  if (params?.status !== undefined && params.status !== '') {
    requestParams.status = params.status
  }
  
  return request({
    url: '/api/refunds',
    method: 'get',
    params: requestParams
  }).then(res => {
    console.log('用户退款列表响应:', res)
    return res
  }).catch(err => {
    console.error('获取用户退款列表错误:', err)
    throw err
  })
}

/**
 * 管理员获取退款申请列表
 * @param {Object} params 查询参数 {pageNum, pageSize, status, orderNo}
 * @returns {Promise}
 */
export function getRefundList(params = {}) {
  console.log('API - getRefundList 请求参数:', params)
  
  // 确保分页参数
  const requestParams = {
    pageNum: params.pageNum || 1,
    pageSize: params.pageSize || 10,
    ...params
  }
  
  // 只有当状态不为空时才添加status参数
  if (params.status !== undefined && params.status !== '') {
    requestParams.status = params.status
  }
  
  // 只有当订单号不为空时才添加orderNo参数
  if (params.orderNo !== undefined && params.orderNo !== '') {
    requestParams.orderNo = params.orderNo
  }
  
  console.log('API - getRefundList 最终请求参数:', requestParams)
  
  return request({
    url: '/api/admin/refunds',
    method: 'get',
    params: requestParams
  }).then(res => {
    console.log('API - getRefundList 响应结果:', res)
    return res
  }).catch(err => {
    console.error('API - getRefundList 请求错误:', err)
    throw err
  })
}

// 管理员审核退款
export function processRefund(refundId, processData) {
  console.log('处理退款参数:', refundId, processData)
  
  // 规范化处理数据
  const data = {
    status: processData.status, // 1-通过 2-拒绝
    remark: processData.remark || ''
  }
  
  return request({
    url: `/api/admin/refunds/${refundId}/process`,
    method: 'post',
    data
  }).then(res => {
    console.log('处理退款响应:', res)
    return res
  }).catch(err => {
    console.error('处理退款错误:', err)
    throw err
  })
} 