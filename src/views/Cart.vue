<template>
  <div class="cart">
    <div class="cart-header">
      <h2>我的购物车</h2>
    </div>
    
    <div class="cart-content" v-loading="cartStore.loading">
      <template v-if="cartStore.cartItems.length > 0">
        <div class="cart-table">
          <el-table
            :data="cartStore.cartItems"
            style="width: 100%"
            @selection-change="handleSelectionChange"
            v-if="cartStore.cartItems && cartStore.cartItems.length > 0"
          >
            <el-table-column type="selection" width="55" />
            
            <el-table-column label="商品信息" min-width="400">
              <template #default="scope">
                <div class="goods-cell">
                  <div class="goods-image">
                    <el-image :src="scope.row.goodsImage" :alt="scope.row.goodsName" />
                  </div>
                  <div class="goods-info">
                    <div class="goods-name" @click="goToGoodsDetail(scope.row.goodsId)">
                      {{ scope.row.goodsName }}
                    </div>
                  </div>
                </div>
              </template>
            </el-table-column>
            
            <el-table-column label="单价" prop="price" width="120">
              <template #default="scope">
                <div class="price">¥{{ (scope.row.price || 0).toFixed(2) }}</div>
              </template>
            </el-table-column>
            
            <el-table-column label="数量" width="200">
              <template #default="scope">
                <el-input-number
                  v-model="scope.row.quantity"
                  :min="1"
                  :max="99"
                  @change="(val) => handleQuantityChange(scope.row, val)"
                />
              </template>
            </el-table-column>
            
            <el-table-column label="小计" width="120">
              <template #default="scope">
                <div class="subtotal">
                  <!-- 优先使用后端返回的totalPrice，如果没有则自行计算 -->
                  ¥{{ (scope.row.totalPrice || ((scope.row.price || 0) * (scope.row.quantity || 0))).toFixed(2) }}
                </div>
              </template>
            </el-table-column>
            
            <el-table-column label="操作" width="100">
              <template #default="scope">
                <el-button
                  type="danger"
                  size="small"
                  @click="handleDelete(scope.row)"
                >
                  删除
                </el-button>
              </template>
            </el-table-column>
          </el-table>
        </div>
        
        <div class="cart-footer">
          <div class="footer-left">
            <el-button
              type="primary"
              link
              @click="handleClearCart"
            >
              清空购物车
            </el-button>
          </div>
          
          <div class="footer-right">
            <div class="selected-count">
              已选择 <span class="count">{{ selectedItems.length }}</span> 件商品
            </div>
            <div class="total-price">
              合计: <span class="price">¥{{ totalAmount.toFixed(2) }}</span>
            </div>
            <el-button
              type="primary"
              size="large"
              :disabled="selectedItems.length === 0"
              @click="handleCheckout"
            >
              去结算
            </el-button>
          </div>
        </div>
      </template>
      
      <el-empty
        v-else
        description="购物车还是空的，快去选购商品吧"
        :image-size="200"
      >
        <el-button type="primary" @click="goToHome">去购物</el-button>
      </el-empty>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed, onBeforeUnmount } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessageBox, ElMessage } from 'element-plus'
import { useCartStore } from '../store/cart'
import { useUserStore } from '../store/user'

const router = useRouter()
const cartStore = useCartStore()
const userStore = useUserStore()
const selectedItems = ref([])
const isComponentMounted = ref(true)

onMounted(async () => {
  console.log('Cart组件已挂载')
  isComponentMounted.value = true
  
  // 检查用户是否已登录
  if (!userStore.isLoggedIn) {
    ElMessage.warning('请先登录')
    router.push('/login').catch(err => {
      console.error('路由导航失败:', err)
      window.location.href = '/login'
    })
    return
  }
  
  // 加载购物车数据
  loadCartData()
  
  // 添加强制刷新事件监听器
  window.addEventListener('reload-page', handleReload)
})

onBeforeUnmount(() => {
  isComponentMounted.value = false
  // 移除事件监听器
  window.removeEventListener('reload-page', handleReload)
})

// 处理强制刷新
const handleReload = () => {
  console.log('Cart组件接收到强制刷新事件')
  if (isComponentMounted.value) {
    loadCartData()
  }
}

// 加载购物车数据
const loadCartData = async () => {
  try {
    console.log('开始获取购物车数据')
    
    // 设置超时，确保请求不会无限等待
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('请求超时')), 5000)
    })
    
    // 与超时竞争
    await Promise.race([
      cartStore.getCartList(),
      timeoutPromise
    ])
    
    console.log('购物车数据获取完成')
  } catch (error) {
    console.error('加载购物车失败:', error)
    
    // 如果加载失败，尝试使用本地数据或显示空购物车
    if (!cartStore.cartItems || cartStore.cartItems.length === 0) {
      // 尝试从localStorage获取购物车数据
      try {
        const localCart = localStorage.getItem('cartItems')
        if (localCart) {
          const parsedCart = JSON.parse(localCart)
          if (Array.isArray(parsedCart) && parsedCart.length > 0) {
            cartStore.$patch({ cartItems: parsedCart })
            console.log('已从本地存储加载购物车数据')
          }
        }
      } catch (e) {
        console.error('解析本地购物车数据失败:', e)
      }
    }
  }
}

const totalAmount = computed(() => {
  return selectedItems.value.reduce((total, item) => {
    // 优先使用后端返回的totalPrice，如果没有则自行计算
    const itemTotal = item.totalPrice || ((item.price || 0) * (item.quantity || 0));
    return total + itemTotal;
  }, 0)
})

const handleQuantityChange = async (item, value) => {
  if (!item || !item.id) return;
  
  try {
    await cartStore.updateCartQuantity(item.id, value)
  } catch (error) {
    console.error('更新购物车数量失败:', error)
    // 恢复原来的数量
    await cartStore.getCartList()
  }
}

const handleDelete = (item) => {
  if (!item || !item.id) return;
  
  ElMessageBox.confirm(
    '确定要删除该商品吗?',
    '提示',
    {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    }
  ).then(async () => {
    try {
      await cartStore.removeFromCart(item.id)
      ElMessage.success('删除成功')
    } catch (error) {
      console.error('删除购物车商品失败:', error)
      // 刷新购物车列表
      await cartStore.getCartList()
    }
  }).catch(() => {
    // 用户取消删除，不做任何操作
  })
}

const handleClearCart = () => {
  if (cartStore.cartItems.length === 0) return
  
  ElMessageBox.confirm(
    '确定要清空购物车吗?',
    '提示',
    {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    }
  ).then(async () => {
    try {
      await cartStore.clearCart()
      ElMessage.success('购物车已清空')
    } catch (error) {
      console.error('清空购物车失败:', error)
      // 刷新购物车列表
      await cartStore.getCartList()
    }
  }).catch(() => {
    // 用户取消清空，不做任何操作
  })
}

const handleSelectionChange = (val) => {
  if (isComponentMounted.value) {
    selectedItems.value = val || []
  }
}

const handleCheckout = () => {
  if (selectedItems.value.length === 0) return
  
  try {
    // 将选中的商品信息存储到localStorage
    localStorage.setItem('checkoutItems', JSON.stringify(selectedItems.value))
    
    // 先触发刷新事件，然后再导航
    window.dispatchEvent(new Event('reload-page'))
    
    // 使用setTimeout确保事件处理完成后再导航
    setTimeout(() => {
      // 跳转到结算页面
      router.push('/checkout').catch(err => {
        console.error('路由导航失败:', err)
        window.location.href = '/checkout'
      })
    }, 50)
  } catch (error) {
    console.error('结算操作失败:', error)
    // 如果发生错误，使用window.location作为备用
    window.location.href = '/checkout'
  }
}

const goToHome = () => {
  // 先触发刷新事件，然后再导航
  window.dispatchEvent(new Event('reload-page'))
  
  // 使用setTimeout确保事件处理完成后再导航
  setTimeout(() => {
    router.push('/').catch(err => {
      console.error('路由导航失败:', err)
      window.location.href = '/'
    })
  }, 50)
}

const goToGoodsDetail = (goodsId) => {
  if (!goodsId) return;
  
  // 先触发刷新事件，然后再导航
  window.dispatchEvent(new Event('reload-page'))
  
  // 使用setTimeout确保事件处理完成后再导航
  setTimeout(() => {
    router.push(`/goods/${goodsId}`).catch(err => {
      console.error('路由导航失败:', err)
      window.location.href = `/goods/${goodsId}`
    })
  }, 50)
}
</script>

<style scoped>
.cart {
  background-color: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
  padding: 20px;
}

.cart-header {
  margin-bottom: 20px;
  padding-bottom: 10px;
  border-bottom: 1px solid #eee;
}

.cart-header h2 {
  margin: 0;
  font-size: 20px;
  color: #333;
}

.cart-content {
  min-height: 300px;
}

.goods-cell {
  display: flex;
  align-items: center;
}

.goods-image {
  width: 80px;
  height: 80px;
  margin-right: 15px;
  border-radius: 4px;
  overflow: hidden;
}

.goods-image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.goods-name {
  font-size: 14px;
  color: #333;
  cursor: pointer;
  transition: color 0.3s;
}

.goods-name:hover {
  color: #409EFF;
}

.price, .subtotal {
  font-size: 16px;
  color: #f56c6c;
  font-weight: bold;
}

.cart-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 20px;
  padding-top: 20px;
  border-top: 1px solid #eee;
}

.footer-right {
  display: flex;
  align-items: center;
}

.selected-count {
  margin-right: 20px;
  font-size: 14px;
  color: #666;
}

.selected-count .count {
  color: #f56c6c;
  font-weight: bold;
  margin: 0 5px;
}

.total-price {
  margin-right: 20px;
  font-size: 14px;
  color: #666;
}

.total-price .price {
  font-size: 20px;
  margin-left: 5px;
}

@media (max-width: 768px) {
  .cart-footer {
    flex-direction: column;
    gap: 15px;
  }
  
  .footer-right {
    width: 100%;
    justify-content: space-between;
  }
}
</style> 