<template>
  <div class="orders">
    <div class="orders-header">
      <h2>我的订单</h2>
      
      <div class="orders-filter">
        <el-select v-model="statusFilter" placeholder="订单状态" @change="fetchOrders">
          <el-option label="全部订单" value="" />
          <el-option label="待付款" :value="0" />
          <el-option label="已付款" :value="1" />
          <el-option label="已发货" :value="2" />
          <el-option label="已完成" :value="3" />
          <el-option label="已取消" :value="4" />
        </el-select>
      </div>
    </div>
    
    <div class="orders-list" v-loading="loading">
      <el-empty 
        v-if="orderList.length === 0 && !loading" 
        description="暂无订单" 
      >
        <el-button type="primary" @click="goToHome">去购物</el-button>
      </el-empty>
      
      <div v-else>
        <div class="order-item" v-for="order in orderList" :key="order.id">
          <div class="order-header">
            <div class="order-info">
              <span class="order-no">订单号：{{ order.orderNo }}</span>
              <span class="order-time">下单时间：{{ formatDateTime(order.createTime) }}</span>
            </div>
            <div class="order-status">
              <el-tag :type="getStatusType(order.status)">{{ getStatusText(order.status) }}</el-tag>
            </div>
          </div>
          
          <div class="order-goods">
            <div 
              class="goods-item" 
              v-for="item in order.orderItems" 
              :key="item.id" 
            >
              <div class="goods-image" @click="goToGoodsDetail(item.goodsId)">
                <el-image :src="item.goodsImage" :alt="item.goodsName" />
              </div>
              <div class="goods-info">
                <div class="goods-name" @click="goToGoodsDetail(item.goodsId)">{{ item.goodsName }}</div>
                <div class="goods-price-qty">
                  <span class="goods-price">¥{{ item.goodsPrice.toFixed(2) }}</span>
                  <span class="goods-qty">x{{ item.quantity }}</span>
                </div>
                
                <!-- 每个商品单独的评价按钮 -->
                <div class="goods-actions" v-if="order.status === 3">
                  <el-button 
                    :type="item.hasReviewed ? 'success' : 'primary'" 
                    size="small"
                    :disabled="item.hasReviewed"
                    @click.stop="goToReview(order.id, item)"
                  >
                    <el-icon v-if="item.hasReviewed"><Check /></el-icon>
                    {{ item.hasReviewed ? '已评价' : '去评价' }}
                  </el-button>
                </div>
              </div>
            </div>
          </div>
          
          <div class="order-footer">
            <div class="order-amount">
              共 {{ getTotalQuantity(order) }} 件商品，
              总计：<span class="price">¥{{ (order.totalAmount || 0).toFixed(2) }}</span>
            </div>
            
            <div class="order-actions">
              <el-button 
                v-if="order.status === 0" 
                type="primary" 
                size="small"
                @click="payOrder(order)"
              >
                去支付
              </el-button>
              
              <el-button 
                v-if="order.status === 0" 
                type="danger" 
                size="small"
                @click="cancelOrder(order.id)"
              >
                取消订单
              </el-button>
              
              <el-button 
                v-if="order.status === 2" 
                type="success" 
                size="small"
                @click="confirmReceipt(order.id)"
              >
                确认收货
              </el-button>
              
              <el-button 
                v-if="order.status === 3 || order.status === 4" 
                type="danger" 
                plain
                size="small"
                @click="deleteOrder(order.id)"
              >
                删除订单
              </el-button>
              
              <el-button 
                type="primary" 
                plain
                size="small"
                @click="viewOrderDetail(order.id)"
              >
                订单详情
              </el-button>
            </div>
          </div>
        </div>
        
        <div class="pagination" v-if="total > 0">
          <el-pagination
            v-model:current-page="currentPage"
            v-model:page-size="pageSize"
            :page-sizes="[5, 10, 20, 50]"
            layout="total, sizes, prev, pager, next, jumper"
            :total="total"
            @size-change="handleSizeChange"
            @current-change="handleCurrentChange"
          />
        </div>
      </div>
    </div>
  </div>
  
  <!-- 支付对话框 -->
  <el-dialog
    v-model="payDialogVisible"
    title="订单支付"
    width="400px"
  >
    <div class="pay-dialog-content">
      <p class="pay-amount">支付金额：<span class="price">¥{{ currentOrder?.totalAmount?.toFixed(2) }}</span></p>
      
      <div class="pay-type">
        <p class="pay-type-title">选择支付方式：</p>
        <el-radio-group v-model="payType">
          <el-radio :label="1" :value="1">支付宝</el-radio>
          <el-radio :label="2" :value="2">微信支付</el-radio>
          <el-radio :label="3" :value="3">银行卡</el-radio>
        </el-radio-group>
      </div>
    </div>
    
    <template #footer>
      <span class="dialog-footer">
        <el-button @click="payDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="confirmPay" :loading="payLoading">
          确认支付
        </el-button>
      </span>
    </template>
  </el-dialog>
</template>

<script setup>
import { ref, onMounted, onBeforeMount } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Check } from '@element-plus/icons-vue'
import { getOrderList, cancelOrder as apiCancelOrder, payOrder as apiPayOrder, deleteOrder as apiDeleteOrder, confirmReceipt as apiConfirmReceipt } from '../api/order'
import { checkReviewed } from '../api/review' // 导入检查评价状态的API

const router = useRouter()
const orderList = ref([])
const loading = ref(false)
const currentPage = ref(1)
const pageSize = ref(10)
const total = ref(0)
const statusFilter = ref('')
const reviewedItems = ref({}) // 存储已评价的商品ID

// 支付相关
const payDialogVisible = ref(false)
const payType = ref(1)
const currentOrder = ref(null)
const payLoading = ref(false)

onBeforeMount(() => {
  // 从localStorage加载已评价的商品记录
  const savedReviewedItems = localStorage.getItem('reviewedItems')
  if (savedReviewedItems) {
    try {
      reviewedItems.value = JSON.parse(savedReviewedItems)
    } catch (e) {
      console.error('解析已评价商品记录失败:', e)
      reviewedItems.value = {}
    }
  }
})

onMounted(() => {
  console.log('Orders组件已挂载，检查URL参数')
  
  // 检查URL参数，看是否有评价完成的标记
  const query = router.currentRoute.value.query
  if (query.reviewed === 'true' && query.orderId && query.goodsId) {
    console.log('检测到评价完成标记，更新状态:', query)
    markItemAsReviewed(Number(query.orderId), Number(query.goodsId))
    ElMessage.success('评价成功！')
    
    // 清除URL参数，避免刷新页面时重复处理
    router.replace({ path: '/orders' })
  }
  
  // 获取订单列表
  fetchOrders()
})

const fetchOrders = async () => {
  loading.value = true
  try {
    const params = {
      pageNum: currentPage.value,
      pageSize: pageSize.value
    }
    
    // 只有当状态筛选不为空时，才添加status参数
    if (statusFilter.value !== '') {
      params.status = statusFilter.value
    }
    
    console.log('请求订单列表参数:', params)
    
    const res = await getOrderList(params)
    console.log('订单列表返回数据:', res)
    
    if (res.data && res.data.list) {
      orderList.value = res.data.list || []
      total.value = res.data.total || 0
      
      // 标记已评价的商品
      orderList.value.forEach(order => {
        if (order.orderItems && Array.isArray(order.orderItems)) {
          order.orderItems.forEach(item => {
            const reviewKey = `${order.id}_${item.goodsId}`
            item.hasReviewed = !!reviewedItems.value[reviewKey]
          })
        }
      })
      
      // 检查商品评价状态
      await checkOrderItemsReviewStatus()
      
      console.log('处理后的订单列表:', orderList.value)
    } else {
      console.warn('订单数据结构不符合预期，尝试直接使用数据')
      if (Array.isArray(res.data)) {
        orderList.value = res.data
        total.value = res.data.length
        console.log('直接使用数据数组:', orderList.value)
      } else {
        orderList.value = []
        total.value = 0
        console.error('无法解析订单数据:', res.data)
      }
    }
  } catch (error) {
    console.error('获取订单列表失败:', error)
    orderList.value = []
    total.value = 0
  } finally {
    loading.value = false
  }
}

const handleSizeChange = (val) => {
  pageSize.value = val
  fetchOrders()
}

const handleCurrentChange = (val) => {
  currentPage.value = val
  fetchOrders()
}

const goToHome = () => {
  router.push('/')
}

const goToGoodsDetail = (goodsId) => {
  router.push(`/goods/${goodsId}`)
}

const viewOrderDetail = (orderId) => {
  console.log('查看订单详情，订单ID:', orderId)
  // 使用Vue Router进行导航
  router.push({
    name: 'OrderDetail',
    params: { id: orderId },
    query: { _t: new Date().getTime() } // 添加时间戳确保刷新
  })
}

const getTotalQuantity = (order) => {
  if (!order || !order.orderItems || !Array.isArray(order.orderItems)) {
    return 0;
  }
  return order.orderItems.reduce((total, item) => total + (item.quantity || 0), 0)
}

const getStatusText = (status) => {
  const statusMap = {
    0: '待付款',
    1: '已付款',
    2: '已发货',
    3: '已完成',
    4: '已取消'
  }
  return statusMap[status] || '未知状态'
}

const getStatusType = (status) => {
  const typeMap = {
    0: 'warning',
    1: 'primary',
    2: 'success',
    3: 'success',
    4: 'info'
  }
  return typeMap[status] || ''
}

const formatDateTime = (dateTimeStr) => {
  if (!dateTimeStr) return ''
  const date = new Date(dateTimeStr)
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`
}

// 支付订单
const payOrder = (order) => {
  currentOrder.value = order
  payDialogVisible.value = true
}

const confirmPay = async () => {
  if (!currentOrder.value || !payType.value) return
  
  payLoading.value = true
  try {
    // 使用统一的支付接口
    const res = await apiPayOrder(currentOrder.value.id, payType.value)
    
    if (res.code === 200) {
      ElMessage.success('支付成功')
      payDialogVisible.value = false
      fetchOrders()
    } else {
      ElMessage.error(res.message || '支付失败，请稍后重试')
    }
  } catch (error) {
    console.error('支付失败:', error)
    ElMessage.error('支付失败，请稍后重试')
  } finally {
    payLoading.value = false
  }
}

// 取消订单
const cancelOrder = (orderId) => {
  ElMessageBox.confirm(
    '确定要取消该订单吗?',
    '提示',
    {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    }
  ).then(async () => {
    try {
      await apiCancelOrder(orderId)
      ElMessage.success('订单已取消')
      fetchOrders()
    } catch (error) {
      console.error('取消订单失败:', error)
    }
  }).catch(() => {})
}

// 确认收货
const confirmReceipt = (orderId) => {
  ElMessageBox.confirm(
    '确认已收到商品?',
    '提示',
    {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'info'
    }
  ).then(async () => {
    try {
      await apiConfirmReceipt(orderId)
      ElMessage.success('已确认收货')
      fetchOrders()
    } catch (error) {
      console.error('确认收货失败:', error)
    }
  }).catch(() => {})
}

// 删除订单
const deleteOrder = (orderId) => {
  ElMessageBox.confirm(
    '确定要删除该订单吗?',
    '提示',
    {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    }
  ).then(async () => {
    try {
      await apiDeleteOrder(orderId)
      ElMessage.success('订单已删除')
      fetchOrders()
    } catch (error) {
      console.error('删除订单失败:', error)
    }
  }).catch(() => {})
}

// 去评价
const goToReview = (orderId, item) => {
  console.log('去评价，订单ID:', orderId, '商品:', item)
  
  // 确保订单有商品
  if (!item) {
    ElMessage.warning('订单中没有商品可评价')
    return
  }
  
  // 跳转到商品详情页并带上评价参数
  router.push({
    path: `/goods/${item.goodsId}`,
    query: { 
      review: 'true',
      orderId: orderId,
      itemId: item.id,
      fromOrders: 'true' // 标记来源，用于评价完成后返回
    }
  })
}

// 标记商品为已评价
const markItemAsReviewed = (orderId, goodsId) => {
  const reviewKey = `${orderId}_${goodsId}`
  reviewedItems.value[reviewKey] = true
  
  // 保存到localStorage
  localStorage.setItem('reviewedItems', JSON.stringify(reviewedItems.value))
  
  // 更新UI
  orderList.value.forEach(order => {
    if (order.id === Number(orderId) && order.orderItems) {
      const item = order.orderItems.find(i => i.goodsId === Number(goodsId))
      if (item) {
        item.hasReviewed = true
      }
    }
  })
}

// 检查订单中商品的评价状态
const checkOrderItemsReviewStatus = async () => {
  for (const order of orderList.value) {
    if (order.status === 3 && order.orderItems && Array.isArray(order.orderItems)) {
      for (const item of order.orderItems) {
        try {
          // 调用后端API检查评价状态
          const result = await checkReviewed(item.goodsId, order.id)
          if (result.success && result.data === true) {
            // 商品已评价，更新状态
            const reviewKey = `${order.id}_${item.goodsId}`
            reviewedItems.value[reviewKey] = true
            item.hasReviewed = true
          }
        } catch (error) {
          console.error('检查评价状态失败:', error)
        }
      }
    }
  }
  
  // 保存更新后的评价状态
  localStorage.setItem('reviewedItems', JSON.stringify(reviewedItems.value))
}
</script>

<style scoped>
.orders {
  background-color: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
  padding: 20px;
}

.orders-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding-bottom: 10px;
  border-bottom: 1px solid #eee;
}

.orders-header h2 {
  margin: 0;
  font-size: 20px;
  color: #333;
}

.orders-list {
  min-height: 300px;
}

.order-item {
  margin-bottom: 20px;
  border: 1px solid #eee;
  border-radius: 8px;
  overflow: hidden;
}

.order-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 15px;
  background-color: #f7f7f7;
}

.order-info {
  display: flex;
  gap: 20px;
  font-size: 14px;
  color: #666;
}

.order-goods {
  padding: 15px;
  border-top: 1px solid #eee;
  border-bottom: 1px solid #eee;
}

.goods-item {
  display: flex;
  padding: 10px 0;
  cursor: pointer;
}

.goods-item:not(:last-child) {
  border-bottom: 1px dashed #eee;
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

.goods-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
}

.goods-name {
  font-size: 14px;
  color: #333;
  max-width: 400px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  cursor: pointer;
}

.goods-name:hover {
  color: #409EFF;
}

.goods-price-qty {
  display: flex;
  align-items: center;
  margin-top: 8px;
}

.goods-price {
  font-size: 14px;
  color: #f56c6c;
  font-weight: bold;
  margin-right: 10px;
}

.goods-qty {
  font-size: 12px;
  color: #999;
  margin-right: 15px;
}

.goods-actions {
  margin-left: auto;
}

.order-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 15px;
}

.order-amount {
  font-size: 14px;
  color: #666;
}

.order-amount .price {
  font-size: 16px;
  color: #f56c6c;
  font-weight: bold;
}

.order-actions {
  display: flex;
  gap: 10px;
}

.pagination {
  margin-top: 20px;
  display: flex;
  justify-content: flex-end;
}

.pay-dialog-content {
  padding: 10px 0;
}

.pay-amount {
  font-size: 16px;
  margin-bottom: 20px;
}

.pay-amount .price {
  font-size: 20px;
  color: #f56c6c;
  font-weight: bold;
}

.pay-type-title {
  margin-bottom: 10px;
}
</style>