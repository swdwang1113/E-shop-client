import request from './index'

// 获取验证码
export function getCaptcha() {
  return request({
    url: '/captcha/get',
    method: 'get',
    responseType: 'blob',  // 指定响应类型为blob（二进制数据）
    // 添加时间戳参数，避免浏览器缓存
    params: {
      t: new Date().getTime()
    },
    // 确保携带cookie，使session能够正常工作
    withCredentials: true
  })
}

// 发送邮箱验证码
export function sendEmailCode(email) {
  return request({
    url: '/api/email/code/send',
    method: 'post',
    data: { email }
  })
}

// 邮箱验证码登录
export function emailLogin(data) {
  return request({
    url: '/api/email/login',
    method: 'post',
    data
  })
}

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