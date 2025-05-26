import request from './index'

// 获取分类列表
export function getCategoryList(parentId) {
  console.log('调用getCategoryList API，parentId:', parentId)
  return request({
    url: '/category/list',
    method: 'get',
    params: { parentId }
  })
}

// 获取分类详情
export function getCategoryDetail(id) {
  console.log('调用getCategoryDetail API，id:', id)
  return request({
    url: `/category/${id}`,
    method: 'get'
  })
}

// 添加分类（管理员）
export function addCategory(data) {
  return request({
    url: '/category/add',
    method: 'post',
    data
  })
}

// 更新分类（管理员）
export function updateCategory(data) {
  return request({
    url: '/category/update',
    method: 'put',
    data
  })
}

// 删除分类（管理员）
export function deleteCategory(id) {
  return request({
    url: `/category/${id}`,
    method: 'delete'
  })
} 