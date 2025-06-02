import { onBeforeUnmount, onDeactivated } from 'vue'
import axios, { AxiosRequestConfig } from 'axios'

/**
 * 请求取消管理钩子
 * 用于管理组件内的请求取消操作
 */
export function useRequestCancellation() {
  // 存储当前组件的所有请求控制器
  const controllers: Map<string, AbortController> = new Map()
  
  /**
   * 创建请求配置，添加取消功能
   * @param requestKey 请求的唯一标识
   * @returns 包含signal的请求配置
   */
  const createRequestConfig = (requestKey: string): AxiosRequestConfig => {
    // 如果已存在相同key的请求，先取消它
    if (controllers.has(requestKey)) {
      controllers.get(requestKey)?.abort()
      controllers.delete(requestKey)
    }
    
    // 创建新的控制器
    const controller = new AbortController()
    controllers.set(requestKey, controller)
    
    // 返回带有signal的请求配置
    return {
      signal: controller.signal
    }
  }
  
  /**
   * 取消指定请求
   * @param requestKey 请求的唯一标识
   */
  const cancelRequest = (requestKey: string): void => {
    if (controllers.has(requestKey)) {
      controllers.get(requestKey)?.abort()
      controllers.delete(requestKey)
    }
  }
  
  /**
   * 取消所有请求
   */
  const cancelAllRequests = (): void => {
    controllers.forEach(controller => {
      controller.abort()
    })
    controllers.clear()
  }
  
  /**
   * 检查请求是否被取消
   * @param error 错误对象
   * @returns 是否是取消请求导致的错误
   */
  const isRequestCancelled = (error: any): boolean => {
    return axios.isCancel(error) || 
           error.name === 'AbortError' || 
           error.name === 'CanceledError'
  }
  
  // 组件失活时取消所有请求
  onDeactivated(() => {
    cancelAllRequests()
  })
  
  // 组件卸载前取消所有请求
  onBeforeUnmount(() => {
    cancelAllRequests()
  })
  
  return {
    createRequestConfig,
    cancelRequest,
    cancelAllRequests,
    isRequestCancelled
  }
} 