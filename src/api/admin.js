import request from './index'

/**
 * 获取仪表盘统计数据
 * @returns {Promise} 返回统计数据
 */
export function getDashboardStats() {
  return request({
    url: '/admin/dashboard/stats',
    method: 'get'
  })
}

/**
 * 获取用户总数
 * @returns {Promise} 返回用户总数
 */
export function getUserCount() {
  return request({
    url: '/api/admin/users/count',
    method: 'get'
  })
}

/**
 * 获取商品总数
 * @returns {Promise} 返回商品总数
 */
export function getGoodsCount() {
  return request({
    url: '/api/admin/goods/count',
    method: 'get'
  })
}

/**
 * 获取订单统计数据
 * @returns {Promise} 返回订单统计数据
 */
export function getOrdersStatistics() {
  return request({
    url: '/api/admin/orders/statistics',
    method: 'get'
  })
}

/**
 * 获取最新订单
 * @param {Number} limit 限制数量，默认为5
 * @returns {Promise} 返回最新订单列表
 */
export function getLatestOrders(limit = 5) {
  return request({
    url: '/api/admin/orders',
    method: 'get',
    params: {
      pageNum: 1,
      pageSize: limit,
      sortField: 'createTime',
      sortOrder: 'desc'
    }
  })
}

/**
 * 获取活跃用户
 * @returns {Promise} 返回活跃用户列表
 */
export function getActiveUsers() {
  return request({
    url: '/api/admin/users',
    method: 'get',
    params: {
      pageNum: 1,
      pageSize: 5
    }
  })
}

// ------------- 分类管理接口 -------------

/**
 * 获取分类列表
 * @param {Object} params 查询参数
 * @returns {Promise} 返回分类列表
 */
export function getCategoryList(params) {
  return request({
    url: '/api/admin/categories',
    method: 'get',
    params
  })
}

/**
 * 添加分类
 * @param {Object} data 分类数据
 * @returns {Promise} 返回添加结果
 */
export function addCategory(data) {
  return request({
    url: '/api/admin/categories',
    method: 'post',
    data
  })
}

/**
 * 更新分类
 * @param {Object} data 分类数据
 * @returns {Promise} 返回更新结果
 */
export function updateCategory(data) {
  return request({
    url: `/api/admin/categories/${data.id}`,
    method: 'put',
    data
  })
}

/**
 * 删除分类
 * @param {Number} id 分类ID
 * @returns {Promise} 返回删除结果
 */
export function deleteCategory(id) {
  return request({
    url: `/api/admin/categories/${id}`,
    method: 'delete'
  })
}

// ------------- 商品管理接口 -------------

/**
 * 获取商品列表
 * @param {Object} params 查询参数
 * @returns {Promise} 返回商品列表
 */
export function getGoodsList(params) {
  return request({
    url: '/api/admin/goods',
    method: 'get',
    params
  })
}

/**
 * 添加商品
 * @param {Object} data 商品数据
 * @returns {Promise} 返回添加结果
 */
export function addGoods(data) {
  return request({
    url: '/api/admin/goods',
    method: 'post',
    data
  })
}

/**
 * 更新商品
 * @param {Object} data 商品数据
 * @returns {Promise} 返回更新结果
 */
export function updateGoods(data) {
  return request({
    url: `/api/admin/goods/${data.id}`,
    method: 'put',
    data
  })
}

/**
 * 删除商品
 * @param {Number} id 商品ID
 * @returns {Promise} 返回删除结果
 */
export function deleteGoods(id) {
  return request({
    url: `/api/admin/goods/${id}`,
    method: 'delete'
  })
}

/**
 * 更新商品状态
 * @param {Number} id 商品ID
 * @param {Number} status 状态（0下架，1上架）
 * @returns {Promise} 返回更新结果
 */
export function updateGoodsStatus(id, status) {
  return request({
    url: `/api/admin/goods/${id}/status`,
    method: 'put',
    params: { status }
  })
}

// ------------- 订单管理接口 -------------

/**
 * 获取订单列表
 * @param {Object} params 查询参数
 * @returns {Promise} 返回订单列表
 */
export function getOrdersList(params) {
  // 处理请求参数，确保空字符串或null的status不会被发送
  const requestParams = { ...params };
  
  if (requestParams.status === '' || requestParams.status === null) {
    delete requestParams.status;
  }
  
  return request({
    url: '/api/admin/orders',
    method: 'get',
    params: requestParams
  })
}

/**
 * 获取订单详情
 * @param {Number} id 订单ID
 * @returns {Promise} 返回订单详情
 */
export function getOrderDetail(id) {
  return request({
    url: `/api/admin/orders/${id}`,
    method: 'get'
  })
}

/**
 * 订单发货 - 创建物流信息
 * @param {Object} data 物流数据，包含orderId、shippingCompany、trackingNumber、senderAddress
 * @returns {Promise} 返回发货结果
 */
export function createShipping(data) {
  return request({
    url: '/api/admin/shipping/create',
    method: 'post',
    params: data
  })
}

/**
 * 获取物流路线（管理员）
 * @param {Number} orderId 订单ID
 * @returns {Promise} 返回物流路线信息
 */
export function getShippingRoute(orderId) {
  return request({
    url: `/api/admin/shipping/route/${orderId}`,
    method: 'get'
  })
}

/**
 * 删除订单（管理员）
 * @param {Number} id 订单ID
 * @returns {Promise} 返回删除结果
 */
export function deleteOrderAdmin(id) {
  return request({
    url: `/api/admin/orders/${id}`,
    method: 'delete'
  })
}

/**
 * 导出订单数据
 * @param {Object} params 查询参数
 * @returns {Promise} 返回导出结果
 */
export function exportOrdersData(params) {
  return request({
    url: '/admin/orders/export',
    method: 'get',
    params,
    responseType: 'blob'
  })
}

// ------------- 用户管理接口 -------------

/**
 * 获取用户列表
 * @param {Object} params 查询参数
 * @returns {Promise} 返回用户列表
 */
export function getUserList(params) {
  // 处理请求参数，确保空字符串或null的参数不会被发送
  const requestParams = { ...params };
  
  // 清理空值参数
  Object.keys(requestParams).forEach(key => {
    if (requestParams[key] === '' || requestParams[key] === null) {
      delete requestParams[key];
    }
  });
  
  return request({
    url: '/api/admin/users',
    method: 'get',
    params: requestParams
  })
}

/**
 * 删除用户
 * @param {Number} id 用户ID
 * @returns {Promise} 返回删除结果
 */
export function deleteUser(id) {
  return request({
    url: `/api/admin/users/${id}`,
    method: 'delete'
  })
} 