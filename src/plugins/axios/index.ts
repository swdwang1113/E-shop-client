// Axios
import axios, { AxiosRequestConfig, InternalAxiosRequestConfig, AxiosResponse, AxiosInstance, AxiosError } from 'axios'

// 创建axios实例
const instance: AxiosInstance = axios.create({
  baseURL: '/api', // 使用代理前缀
  timeout: 15000
})

// 请求拦截器
instance.interceptors.request.use(
  (config: InternalAxiosRequestConfig): InternalAxiosRequestConfig => {
    // 从localStorage获取token
    const token = localStorage.getItem('token')
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error: any): Promise<never> => {
    return Promise.reject(error)
  }
)

// 响应拦截器
instance.interceptors.response.use(
  (response: AxiosResponse): AxiosResponse => {
    return response
  },
  (error: any): Promise<never> => {
    // 检查是否是取消请求导致的错误
    if (axios.isCancel(error)) {
      console.log('请求已取消:', error.message)
      return Promise.reject(error)
    }

    // 处理其他错误
    if (error.response) {
      switch (error.response.status) {
        case 401:
          // 未授权，清除token并跳转到登录页
          localStorage.removeItem('token')
          window.location.href = '/login'
          break
        case 403:
          console.error('没有权限访问此资源')
          break
        case 404:
          console.error('请求的资源不存在')
          break
        case 500:
          console.error('服务器内部错误')
          break
        default:
          console.error(`请求错误: ${error.response.status}`)
      }
    } else if (error.request) {
      // 请求已发出，但没有收到响应
      console.error('网络错误，请检查您的网络连接')
    } else {
      // 请求配置出错
      console.error('请求配置错误:', error.message)
    }

    return Promise.reject(error)
  }
)

/**
 * 创建带有取消功能的请求
 * @param {string} url - 请求URL
 * @param {AxiosRequestConfig} config - Axios配置
 * @param {string} cancelKey - 取消请求的唯一标识
 * @returns {Object} 包含请求Promise、控制器和取消键的对象
 */
export const createCancelableRequest = (
  url: string, 
  config: AxiosRequestConfig = {}, 
  cancelKey?: string
): { 
  request: Promise<AxiosResponse>;
  controller: AbortController;
  cancelKey: string;
} => {
  // 创建AbortController
  const controller = new AbortController()
  
  // 将signal添加到请求配置中
  const requestConfig: AxiosRequestConfig = {
    ...config,
    signal: controller.signal
  }
  
  // 获取请求方法
  const method = (config.method || 'get').toLowerCase()
  
  // 根据方法类型发送请求
  let request: Promise<AxiosResponse>
  
  if (method === 'get' || method === 'delete') {
    request = instance[method](url, requestConfig)
  } else if (method === 'post' || method === 'put' || method === 'patch') {
    request = instance[method](url, config.data, requestConfig)
  } else {
    request = instance.get(url, requestConfig)
  }
  
  // 返回请求Promise和取消控制器
  return {
    request,
    controller,
    cancelKey: cancelKey || url
  }
}

export { instance as axios }
export default instance 