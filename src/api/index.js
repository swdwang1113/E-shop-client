import axios from 'axios'
import { ElMessage } from 'element-plus'

// 创建axios实例
const service = axios.create({
  baseURL: 'http://localhost:8080',
  timeout: 10000,
  withCredentials: true  // 允许跨域请求携带cookie
})

// 请求拦截器
service.interceptors.request.use(
  config => {
    // 从localStorage获取token
    const token = localStorage.getItem('token')
    
    // 如果是登录、注册、验证码或检查用户名请求，不添加token
    if (config.url === '/user/login' || 
        config.url === '/user/register' || 
        config.url === '/user/check-username' ||
        config.url === '/captcha/get') {
      return config
    }
    
    // 其他请求添加token
    if (token) {
      // 添加Bearer格式的Authorization头
      config.headers['Authorization'] = `Bearer ${token}`
      
      // 同时保留token头，确保兼容性
      config.headers['token'] = token
    }

    // 如果是FormData类型的请求，确保不覆盖Content-Type
    if (config.data instanceof FormData) {
      // 确保Content-Type由浏览器自动设置，包含boundary信息
      // 不要手动设置Content-Type，让浏览器自动处理
      delete config.headers['Content-Type']
    }
    
    return config
  },
  error => {
    return Promise.reject(error)
  }
)

// 响应拦截器
service.interceptors.response.use(
  response => {
    // 如果响应类型是blob，直接返回
    if (response.config.responseType === 'blob') {
      return response.data
    }
    
    const res = response.data
    
    // 成功响应但可能没有返回正确的格式
    if (res.code === undefined && !res.message) {
      // 处理直接返回数据的情况
      return {
        code: 200,
        data: res,
        message: 'success'
      }
    }
    
    if (res.code !== 200) {
      ElMessage({
        message: res.message || '请求失败',
        type: 'error',
        duration: 3000
      })
      
      // 401: 未登录或token过期
      if (res.code === 401) {
        localStorage.removeItem('token')
        localStorage.removeItem('userInfo')
        setTimeout(() => {
          window.location.href = '/login'
        }, 1500)
      }
      
      return Promise.reject(new Error(res.message || '请求失败'))
    } else {
      return res
    }
  },
  error => {
    // 如果是401错误，也可能是token问题
    if (error.response && error.response.status === 401) {
      localStorage.removeItem('token')
      localStorage.removeItem('userInfo')
      setTimeout(() => {
        window.location.href = '/login'
      }, 1500)
    }
    
    ElMessage({
      message: error.message || '请求失败',
      type: 'error',
      duration: 3000
    })
    return Promise.reject(error)
  }
)

export default service 