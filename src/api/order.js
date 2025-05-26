import request from './index'

// 创建订单
export function createOrder(orderData) {
  return request({
    url: '/api/orders',
    method: 'post',
    data: orderData
  })
}

// 获取用户订单列表
export function getUserOrders() {
  return request({
    url: '/api/orders',
    method: 'get'
  })
}

// 获取订单列表
export function getOrderList(params) {
  console.log('API请求参数:', params)
  // 确保页码和每页大小参数存在
  const requestParams = {
    ...params,
    pageNum: params.pageNum || 1,
    pageSize: params.pageSize || 10
  }
  
  return request({
    url: '/api/orders',
    method: 'get',
    params: requestParams
  })
}

// 兼容旧代码的别名
export function getOrders(params) {
  return getOrderList(params)
}

// 获取订单详情
export function getOrderDetail(orderId) {
  return request({
    url: `/api/orders/${orderId}`,
    method: 'get'
  })
}

// 根据订单编号获取订单详情
export function getOrderByNo(orderNo) {
  return request({
    url: '/api/orders/no',
    method: 'get',
    params: { orderNo }
  })
}

// 取消订单
export function cancelOrder(id) {
  return request({
    url: `/api/orders/${id}/cancel`,
    method: 'post'
  })
}

// 支付订单
export function payOrder(id, paymentType) {
  return request({
    url: `/api/orders/${id}/pay`,
    method: 'post',
    params: { paymentType }
  })
}

// 确认收货
export function confirmReceipt(id) {
  return request({
    url: `/api/orders/${id}/receipt`,
    method: 'post'
  })
}

// 删除订单
export function deleteOrder(id) {
  return request({
    url: `/api/orders/${id}`,
    method: 'delete'
  })
}

// 获取所有订单列表（管理员）
export function getAllOrders(params) {
  return request({
    url: '/api/admin/orders',
    method: 'get',
    params
  })
}

// 订单发货（管理员）
export function shipOrder(id) {
  return request({
    url: `/api/admin/orders/${id}/ship`,
    method: 'post'
  })
}

// 删除订单（管理员）
export function deleteOrderAdmin(id) {
  return request({
    url: `/api/admin/orders/${id}`,
    method: 'delete'
  })
} 