import request from './index'

/**
 * 添加商品评价
 * @param {Object} reviewData 评价数据
 * @returns {Promise} 返回添加结果
 */
export function addReview(reviewData) {
  console.log('提交评论数据:', reviewData)
  
  // 确保images是字符串类型
  if (reviewData.images === undefined || reviewData.images === null) {
    reviewData.images = ''
  } else if (Array.isArray(reviewData.images)) {
    reviewData.images = reviewData.images.join(',')
  }
  
  return request({
    url: '/api/reviews',
    method: 'post',
    data: reviewData,
    headers: {
      'Content-Type': 'application/json'
    }
  }).then(response => {
    console.log('评论提交响应:', response)
    return response
  }).catch(error => {
    console.error('评论提交失败:', error)
    throw error
  })
}

/**
 * 获取商品评价列表
 * @param {Number} goodsId 商品ID
 * @returns {Promise} 返回评价列表
 */
export function getGoodsReviews(goodsId) {
  return request({
    url: `/api/reviews/goods/${goodsId}`,
    method: 'get'
  })
}

/**
 * 获取用户评价列表
 * @returns {Promise} 返回评价列表
 */
export function getUserReviews() {
  return request({
    url: '/api/reviews/user',
    method: 'get'
  })
}

/**
 * 获取订单评价列表
 * @param {Number} orderId 订单ID
 * @returns {Promise} 返回评价列表
 */
export function getOrderReviews(orderId) {
  return request({
    url: `/api/reviews/order/${orderId}`,
    method: 'get'
  })
}

/**
 * 检查是否已评价
 * @param {Number} goodsId 商品ID
 * @param {Number} orderId 订单ID
 * @returns {Promise} 返回检查结果
 */
export function checkReviewed(goodsId, orderId) {
  console.log(`调用checkReviewed接口，参数: goodsId=${goodsId}, orderId=${orderId}`)
  return request({
    url: '/api/reviews/check',
    method: 'get',
    params: { goodsId, orderId }
  }).then(response => {
    console.log('检查评价状态响应:', response)
    return response
  }).catch(error => {
    console.error('检查评价状态失败:', error)
    throw error
  })
}

/**
 * 点赞评价
 * @param {Number} reviewId 评价ID
 * @returns {Promise} 返回点赞结果
 */
export function likeReview(reviewId) {
  return request({
    url: `/api/reviews/${reviewId}/like`,
    method: 'post'
  })
}

/**
 * 取消点赞评价
 * @param {Number} reviewId 评价ID
 * @returns {Promise} 返回取消点赞结果
 */
export function unlikeReview(reviewId) {
  return request({
    url: `/api/reviews/${reviewId}/like`,
    method: 'delete'
  })
}

/**
 * 检查是否已点赞评价
 * @param {Number} reviewId 评价ID
 * @returns {Promise} 返回检查结果
 */
export function checkLiked(reviewId) {
  return request({
    url: `/api/reviews/${reviewId}/like/check`,
    method: 'get'
  })
}

/**
 * 删除评价
 * @param {Number} reviewId 评价ID
 * @returns {Promise} 返回删除结果
 */
export function deleteReview(reviewId) {
  return request({
    url: `/api/reviews/${reviewId}`,
    method: 'delete'
  })
}

/**
 * 获取商品平均评分
 * @param {Number} goodsId 商品ID
 * @returns {Promise} 返回平均评分
 */
export function getGoodsRating(goodsId) {
  return request({
    url: `/api/reviews/goods/${goodsId}/rating`,
    method: 'get'
  })
}

/**
 * 获取商品评价数量
 * @param {Number} goodsId 商品ID
 * @returns {Promise} 返回评价数量
 */
export function getGoodsReviewCount(goodsId) {
  return request({
    url: `/api/reviews/goods/${goodsId}/count`,
    method: 'get'
  })
}

/**
 * 上传评价图片
 * @param {FormData} formData 包含图片的表单数据
 * @returns {Promise} 返回上传结果
 */
export function uploadReviewImage(formData) {
  console.log('上传图片请求开始')
  
  // 确保formData包含file字段
  let hasFile = false
  for (let pair of formData.entries()) {
    if (pair[0] === 'file') {
      hasFile = true
      console.log('检测到file字段:', pair[1].name)
      break
    }
  }
  
  if (!hasFile) {
    console.error('FormData中没有file字段')
    return Promise.reject(new Error('FormData中没有file字段'))
  }
  
  return request({
    url: '/api/reviews/upload/image',
    method: 'post',
    data: formData,
    headers: {
      // 不要手动设置Content-Type，让浏览器自动处理
    },
    timeout: 30000
  })
} 