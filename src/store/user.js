import { defineStore } from 'pinia'
import { login, getUserInfo, updateUserInfo, uploadAvatar } from '../api/user'
import { getUserAddresses, addAddress, updateAddress, deleteAddress, setDefaultAddress } from '../api/address'
import { ElMessage } from 'element-plus'

export const useUserStore = defineStore('user', {
  state: () => {
    // 安全地获取localStorage的值
    let token = '';
    let userInfo = {};
    
    try {
      token = localStorage.getItem('token') || '';
      userInfo = JSON.parse(localStorage.getItem('userInfo') || '{}');
    } catch (e) {
      console.error('从localStorage读取数据失败:', e);
    }
    
    return {
      token,
      userInfo
    };
  },
  
  getters: {
    isLoggedIn: (state) => !!state.token,
    isAdmin: (state) => state.userInfo.role === 1
  },
  
  actions: {
    async login(userInfo) {
      try {
        // 确保验证码参数被正确传递
        const loginData = {
          username: userInfo.username,
          password: userInfo.password,
          captcha: userInfo.captcha
        }
        
        const res = await login(loginData)
        
        // 直接从data中获取token
        const token = res.data?.token
        
        if (!token) {
          ElMessage.error(res.message || '登录失败，未获取到token')
          throw new Error(res.message || '未获取到token')
        }
        
        this.token = token
        localStorage.setItem('token', token)
        
        return res
      } catch (error) {
        console.error('登录失败:', error)
        ElMessage.error(error.message || '登录失败，请检查用户名、密码和验证码')
        throw error
      }
    },
    
    async getUserInfo() {
      try {
        const res = await getUserInfo()
        
        this.userInfo = res.data
        localStorage.setItem('userInfo', JSON.stringify(res.data))
        
        return res
      } catch (error) {
        console.error('获取用户信息失败:', error)
        throw error
      }
    },
    
    async updateUserInfo(data) {
      try {
        const res = await updateUserInfo(data)
        
        // 更新本地存储的用户信息
        this.userInfo = { ...this.userInfo, ...res.data }
        localStorage.setItem('userInfo', JSON.stringify(this.userInfo))
        
        return res
      } catch (error) {
        console.error('更新用户信息失败:', error)
        throw error
      }
    },
    
    async uploadAvatar(formData) {
      try {
        const res = await uploadAvatar(formData)
        
        // 更新头像URL
        this.userInfo.avatar = res.data
        localStorage.setItem('userInfo', JSON.stringify(this.userInfo))
        
        return res
      } catch (error) {
        console.error('上传头像失败:', error)
        throw error
      }
    },
    
    // 获取地址列表
    async getAddresses() {
      try {
        const res = await getUserAddresses()
        return res.data
      } catch (error) {
        console.error('获取地址列表失败:', error)
        throw error
      }
    },
    
    // 添加/更新地址
    async updateAddress(addressData) {
      try {
        let res
        if (addressData.id) {
          // 更新现有地址
          res = await updateAddress(addressData.id, addressData)
        } else {
          // 添加新地址
          res = await addAddress(addressData)
        }
        return res.data
      } catch (error) {
        console.error('保存地址失败:', error)
        throw error
      }
    },
    
    // 删除地址
    async deleteAddress(addressId) {
      try {
        const res = await deleteAddress(addressId)
        return res.data
      } catch (error) {
        console.error('删除地址失败:', error)
        throw error
      }
    },
    
    // 设置默认地址
    async setDefaultAddress(addressId) {
      try {
        const res = await setDefaultAddress(addressId)
        return res.data
      } catch (error) {
        console.error('设置默认地址失败:', error)
        throw error
      }
    },
    
    logout() {
      this.token = ''
      this.userInfo = {}
      localStorage.removeItem('token')
      localStorage.removeItem('userInfo')
    }
  }
}) 