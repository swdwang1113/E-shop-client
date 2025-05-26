import request from './index'

// 获取商品列表
export function getGoodsList(params) {
  return request({
    url: '/goods/list',
    method: 'get',
    params
  })
}

// 获取商品详情
export function getGoodsDetail(id) {
  return request({
    url: `/goods/${id}`,
    method: 'get'
  })
}

// 获取推荐商品
export function getRecommendGoods(limit) {
  return request({
    url: '/goods/recommend',
    method: 'get',
    params: { limit }
  })
}

// 添加商品（管理员）
export function addGoods(data) {
  return request({
    url: '/goods/add',
    method: 'post',
    data
  })
}

// 更新商品（管理员）
export function updateGoods(data) {
  return request({
    url: '/goods/update',
    method: 'put',
    data
  })
}

// 删除商品（管理员）
export function deleteGoods(id) {
  return request({
    url: `/goods/${id}`,
    method: 'delete'
  })
}

// 上架/下架商品（管理员）
export function updateGoodsStatus(id, status) {
  return request({
    url: `/goods/status/${id}`,
    method: 'put',
    params: { status }
  })
}

// 上传商品图片（管理员）
export function uploadGoodsImage(file) {
  const formData = new FormData()
  formData.append('file', file)
  return request({
    url: '/goods/upload/image',
    method: 'post',
    data: formData,
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  })
} 