import request from './index'

/**
 * 添加收藏
 * @param {Number} goodsId 商品ID
 * @returns {Promise} 返回添加结果
 */
export function addFavorite(goodsId) {
  return request({
    url: '/api/favorite/add',
    method: 'post',
    params: { goodsId: Number(goodsId) }
  })
}

/**
 * 取消收藏
 * @param {Number} goodsId 商品ID
 * @returns {Promise} 返回取消结果
 */
export function removeFavorite(goodsId) {
  return request({
    url: '/api/favorite/remove',
    method: 'delete',
    params: { goodsId: Number(goodsId) }
  })
}

/**
 * 检查是否已收藏
 * @param {Number} goodsId 商品ID
 * @returns {Promise} 返回检查结果
 */
export function checkFavorite(goodsId) {
  return request({
    url: '/api/favorite/check',
    method: 'get',
    params: { goodsId: Number(goodsId) }
  })
}

/**
 * 获取收藏列表
 * @returns {Promise} 返回收藏列表
 */
export function getFavoriteList() {
  return request({
    url: '/api/favorite/list',
    method: 'get'
  })
} 