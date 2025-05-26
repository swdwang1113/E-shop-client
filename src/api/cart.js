import request from './index'

// 获取购物车列表
export function getCartList() {
  return request({
    url: '/cart/list',
    method: 'get'
  })
}

// 添加商品到购物车
export function addToCart(goodsId, quantity) {
  return request({
    url: '/cart/add',
    method: 'post',
    params: { goodsId, quantity }
  })
}

// 更新购物车商品数量
export function updateCartQuantity(cartId, quantity) {
  return request({
    url: '/cart/update',
    method: 'put',
    params: { cartId, quantity }
  })
}

// 删除购物车商品
export function deleteCartItem(cartId) {
  return request({
    url: `/cart/delete/${cartId}`,
    method: 'delete'
  })
}

// 删除购物车商品（按商品ID）
export function deleteCartItemByGoodsId(goodsId) {
  return request({
    url: `/cart/delete/goods/${goodsId}`,
    method: 'delete'
  })
}

// 清空购物车
export function clearCart() {
  return request({
    url: '/cart/clear',
    method: 'delete'
  })
} 