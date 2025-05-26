import request from './index'

// 用户注册
export function register(data) {
  return request({
    url: '/user/register',
    method: 'post',
    data
  })
}

// 用户登录
export function login(data) {
  return request({
    url: '/user/login',
    method: 'post',
    data
  })
}

// 检查用户名是否可用
export function checkUsername(username) {
  return request({
    url: '/user/check-username',
    method: 'get',
    params: { username }
  })
}

// 获取用户信息
export function getUserInfo() {
  return request({
    url: '/user/info',
    method: 'get'
  })
}

// 更新用户信息
export function updateUserInfo(data) {
  return request({
    url: '/user/update-info',
    method: 'put',
    data
  })
}

// 上传用户头像
export function uploadAvatar(data) {
  return request({
    url: '/user/upload-avatar',
    method: 'post',
    data,
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  })
} 