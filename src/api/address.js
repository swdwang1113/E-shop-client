import request from './index'

// 获取用户地址列表
export function getUserAddresses() {
  return request({
    url: '/api/addresses',
    method: 'get'
  })
}

// 添加新地址
export function addAddress(data) {
  return request({
    url: '/api/addresses',
    method: 'post',
    data
  })
}

// 更新地址
export function updateAddress(id, data) {
  return request({
    url: `/api/addresses/${id}`,
    method: 'put',
    data
  })
}

// 删除地址
export function deleteAddress(id) {
  return request({
    url: `/api/addresses/${id}`,
    method: 'delete'
  })
}

// 设置默认地址
export function setDefaultAddress(id) {
  return request({
    url: `/api/addresses/${id}/default`,
    method: 'post'
  })
} 