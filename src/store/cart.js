import { defineStore } from 'pinia'
import { getCartList, addToCart, updateCartQuantity, deleteCartItem, clearCart } from '../api/cart'
import { ElMessage } from 'element-plus'

export const useCartStore = defineStore('cart', {
  state: () => ({
    cartItems: [],
    loading: false
  }),
  
  getters: {
    totalCount: (state) => {
      return state.cartItems.length
    },
    totalQuantity: (state) => {
      return state.cartItems.reduce((total, item) => total + (item.quantity || 0), 0)
    },
    totalAmount: (state) => {
      return state.cartItems.reduce((total, item) => total + (item.price || 0) * (item.quantity || 0), 0)
    }
  },
  
  actions: {
    async getCartList() {
      this.loading = true
      try {
        const res = await getCartList()
        if (Array.isArray(res.data)) {
          this.cartItems = res.data.map(item => ({
            ...item,
            price: item.goodsPrice || item.price || 0,
            quantity: item.quantity || 1,
            goodsImage: item.goodsImage || '',
            goodsName: item.goodsName || '未命名商品'
          }))
        } else {
          this.cartItems = []
        }
        return res
      } catch (error) {
        console.error('获取购物车列表失败:', error)
        this.cartItems = []
        return { data: [] }
      } finally {
        this.loading = false
      }
    },
    
    async addToCart(goodsId, quantity = 1) {
      try {
        const res = await addToCart(goodsId, quantity)
        ElMessage({
          type: 'success',
          message: '添加成功'
        })
        try {
          await this.getCartList()
        } catch (e) {
          console.error('添加后刷新购物车失败:', e)
        }
        return res
      } catch (error) {
        console.error('添加购物车失败:', error)
        ElMessage.error('添加购物车失败')
        return { success: false }
      }
    },
    
    async updateCartQuantity(cartId, quantity) {
      try {
        const res = await updateCartQuantity(cartId, quantity)
        try {
          await this.getCartList()
        } catch (e) {
          console.error('更新后刷新购物车失败:', e)
        }
        return res
      } catch (error) {
        console.error('更新购物车数量失败:', error)
        ElMessage.error('更新购物车数量失败')
        return { success: false }
      }
    },
    
    async removeFromCart(cartId) {
      try {
        const res = await deleteCartItem(cartId)
        try {
          await this.getCartList()
        } catch (e) {
          console.error('删除后刷新购物车失败:', e)
        }
        return res
      } catch (error) {
        console.error('删除购物车商品失败:', error)
        ElMessage.error('删除购物车商品失败')
        return { success: false }
      }
    },
    
    async clearCart() {
      try {
        const res = await clearCart()
        this.cartItems = []
        return res
      } catch (error) {
        console.error('清空购物车失败:', error)
        ElMessage.error('清空购物车失败')
        return { success: false }
      }
    }
  }
}) 