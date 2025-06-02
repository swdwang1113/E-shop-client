import axios from 'axios'
import { ElMessage } from 'element-plus'

// API调试工具
const ApiDebug = {
  enabled: true, // 是否启用调试
  
  // 记录请求
  logRequest(config) {
    if (!this.enabled) return
    
    console.group(`🚀 API请求: ${config.method.toUpperCase()} ${config.url}`)
    console.log('请求参数:', config.params || config.data || '无参数')
    console.log('请求头:', config.headers)
    console.groupEnd()
  },
  
  // 记录响应
  logResponse(response) {
    if (!this.enabled) return
    
    const url = response.config.url
    const method = response.config.method.toUpperCase()
    const status = response.status
    const data = response.data
    
    console.group(`✅ API响应: ${method} ${url} [${status}]`)
    console.log('响应数据:', data)
    console.groupEnd()
    
    return response
  },
  
  // 记录错误
  logError(error) {
    if (!this.enabled) return
    
    let url = '未知'
    let method = '未知'
    let errorMsg = error.message || '未知错误'
    let responseData = null
    
    if (error.config) {
      url = error.config.url
      method = error.config.method.toUpperCase()
    }
    
    if (error.response) {
      responseData = error.response.data
    }
    
    console.group(`❌ API错误: ${method} ${url}`)
    console.error('错误消息:', errorMsg)
    if (responseData) {
      console.error('错误响应数据:', responseData)
    }
    console.error('完整错误对象:', error)
    console.groupEnd()
    
    return error
  }
}

// 创建axios实例
const service = axios.create({
  baseURL: 'http://localhost:8080',
  timeout: 10000,
  withCredentials: true  // 允许跨域请求携带cookie
})

// 请求拦截器
service.interceptors.request.use(
  config => {
    // 记录请求
    ApiDebug.logRequest(config)
    
    // 打印完整请求URL
    console.log('完整请求URL:', `${config.baseURL || ''}${config.url}`)
    console.log('请求头:', config.headers)
    
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
    ApiDebug.logError(error)
    return Promise.reject(error)
  }
)

// 响应拦截器
service.interceptors.response.use(
  response => {
    // 记录响应
    ApiDebug.logResponse(response)
    
    // 如果响应类型是blob，直接返回
    if (response.config.responseType === 'blob') {
      return response.data
    }
    
    const res = response.data
    
    // 成功响应但没有标准格式的处理
    if (res.code === undefined && res.success === undefined) {
      // 处理直接返回数据的情况
      if (Array.isArray(res)) {
        // 返回数组的情况
        return {
          success: true,
          code: 200,
          data: res,
          message: 'success'
        }
      } else {
        // 返回其他数据的情况
        return {
          success: true,
          code: 200,
          data: res,
          message: 'success'
        }
      }
    }
    
    // 处理code格式的响应
    if (res.code !== undefined) {
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
        // 标准成功响应
        return {
          ...res,
          success: true
        }
      }
    }
    
    // 处理success格式的响应
    if (res.success !== undefined) {
      if (!res.success) {
        ElMessage({
          message: res.message || '请求失败',
          type: 'error',
          duration: 3000
        })
        return Promise.reject(new Error(res.message || '请求失败'))
      } else {
        // 已经是标准success格式
        return res
      }
    }
    
    // 默认返回原始响应
    return res
  },
  error => {
    // 记录错误
    ApiDebug.logError(error)
    
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

// 暴露API调试工具
export { ApiDebug }
export default service 