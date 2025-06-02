import { ref, inject, onUnmounted, Ref } from 'vue'
import { AxiosResponse, AxiosRequestConfig } from 'axios'
import { createCancelableRequest } from '../plugins/axios'

interface RequestOptions {
  immediate?: boolean;
  cancelKey?: string;
  onSuccess?: (data: any) => void;
  onError?: (error: any) => void;
  onFinally?: () => void;
}

interface RequestControl {
  addRequest: (key: string, controller: AbortController) => void;
  removeRequest: (key: string) => void;
  cancelRequest: (key: string) => void;
  cancelAllRequests: () => void;
}

/**
 * 请求钩子，提供数据加载、错误处理和请求取消功能
 * @param url 请求URL
 * @param config Axios请求配置
 * @param options 请求选项
 * @returns 请求状态和控制方法
 */
export function useRequest<T = any>(
  url: string,
  config: AxiosRequestConfig = {},
  options: RequestOptions = {}
) {
  const data: Ref<T | null> = ref(null)
  const loading = ref(false)
  const error = ref(null)
  const controller = ref<AbortController | null>(null)
  
  // 从App组件注入的请求控制方法
  const requestControl = inject<RequestControl>('requestControl')
  
  // 生成请求的唯一标识
  const cancelKey = options.cancelKey || `${config.method || 'get'}_${url}`
  
  /**
   * 执行请求
   * @returns Promise
   */
  const execute = async (): Promise<T | null> => {
    loading.value = true
    error.value = null
    
    try {
      // 创建可取消的请求
      const { request, controller: requestController } = createCancelableRequest(url, config, cancelKey)
      
      // 保存控制器引用
      controller.value = requestController
      
      // 如果存在请求控制，添加到全局管理
      if (requestControl) {
        requestControl.addRequest(cancelKey, requestController)
      }
      
      // 等待请求完成
      const response: AxiosResponse<T> = await request
      
      // 设置数据
      data.value = response.data
      
      // 调用成功回调
      options.onSuccess?.(response.data)
      
      return response.data
    } catch (err: any) {
      // 如果不是取消请求导致的错误，设置错误状态
      if (err.name !== 'AbortError' && err.name !== 'CanceledError') {
        error.value = err
        options.onError?.(err)
      }
      return null
    } finally {
      // 请求完成，移除控制器引用
      if (requestControl) {
        requestControl.removeRequest(cancelKey)
      }
      
      // 清除控制器引用
      controller.value = null
      
      // 设置加载状态
      loading.value = false
      
      // 调用完成回调
      options.onFinally?.()
    }
  }
  
  /**
   * 取消当前请求
   */
  const cancel = () => {
    if (controller.value) {
      controller.value.abort()
      controller.value = null
    }
  }
  
  // 如果设置了立即执行，自动发起请求
  if (options.immediate !== false) {
    execute()
  }
  
  // 组件卸载时自动取消请求
  onUnmounted(() => {
    cancel()
  })
  
  return {
    data,
    loading,
    error,
    execute,
    cancel
  }
} 