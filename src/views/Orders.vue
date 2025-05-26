<template>
  <div class="orders">
    <div class="orders-header">
      <h2>我的订单</h2>
      
      <div class="orders-filter">
        <el-select v-model="statusFilter" placeholder="订单状态" @change="fetchOrders">
          <el-option label="全部订单" value="" />
          <el-option label="待付款" :value="0" />
          <el-option label="待发货" :value="1" />
          <el-option label="已发货" :value="2" />
          <el-option label="已完成" :value="3" />
          <el-option label="已取消" :value="4" />
          <el-option label="申请退款" :value="5" />
          <el-option label="已退款" :value="6" />
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
              @click="goToGoodsDetail(item.goodsId)"
            >
              <div class="goods-image">
                <el-image :src="item.goodsImage" :alt="item.goodsName" />
              </div>
              <div class="goods-info">
                <div class="goods-name">{{ item.goodsName }}</div>
                <div class="goods-price-qty">
                  <span class="goods-price">¥{{ item.goodsPrice.toFixed(2) }}</span>
                  <span class="goods-qty">x{{ item.quantity }}</span>
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
              
              <!-- 单商品订单使用ReviewButton组件 -->
              <review-button
                v-if="order.status === 3 && order.orderItems && order.orderItems.length === 1" 
                :goods-id="order.orderItems[0].goodsId"
                :order-id="order.id"
              />
              
              <!-- 多商品订单使用OrderReviewButton组件 -->
              <order-review-button
                v-if="order.status === 3 && order.orderItems && order.orderItems.length > 1"
                :order="order"
                @show-review-options="showReviewOptions(order)"
              />
              
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
          <el-radio :label="1">支付宝</el-radio>
          <el-radio :label="2">微信支付</el-radio>
          <el-radio :label="3">银行卡</el-radio>
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
  
  <!-- 选择评价商品对话框 -->
  <el-dialog
    v-model="reviewDialogVisible"
    title="选择评价商品"
    width="500px"
  >
    <div class="review-dialog-content">
      <p class="select-tip">该订单包含多件商品，请选择要评价的商品：</p>
      
      <div class="review-goods-list">
        <div 
          v-for="item in currentOrder?.orderItems" 
          :key="item.id"
          class="review-goods-item"
        >
          <div class="review-goods-image">
            <el-image :src="item.goodsImage" :alt="item.goodsName" />
          </div>
          <div class="review-goods-info">
            <div class="review-goods-name">{{ item.goodsName }}</div>
            <div class="review-goods-price">¥{{ item.goodsPrice.toFixed(2) }}</div>
          </div>
          <div class="review-action-btn">
            <el-button 
              :type="isGoodsReviewed(item.goodsId, currentOrder.id) ? 'info' : 'primary'" 
              :disabled="isGoodsReviewed(item.goodsId, currentOrder.id)"
              size="small"
              @click="goToReview(item.goodsId, currentOrder.id)"
            >
              {{ isGoodsReviewed(item.goodsId, currentOrder.id) ? '已评价' : '去评价' }}
            </el-button>
          </div>
        </div>
      </div>
    </div>
    
    <template #footer>
      <span class="dialog-footer">
        <el-button @click="reviewDialogVisible = false">取消</el-button>
      </span>
    </template>
  </el-dialog>
</template>

<script setup>
import { ref, onMounted, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { getOrderList, cancelOrder as apiCancelOrder, payOrder as apiPayOrder, deleteOrder as apiDeleteOrder, confirmReceipt as apiConfirmReceipt } from '../api/order'
import { checkReviewed } from '../api/review'
import ReviewButton from '../components/ReviewButton.vue'
import OrderReviewButton from '../components/OrderReviewButton.vue'

const router = useRouter()
const orderList = ref([])
const loading = ref(false)
const currentPage = ref(1)
const pageSize = ref(10)
const total = ref(0)
const statusFilter = ref('')

// 支付相关
const payDialogVisible = ref(false)
const payType = ref(1)
const currentOrder = ref(null)
const payLoading = ref(false)

// 评价相关
const reviewDialogVisible = ref(false)
// 存储商品评价状态的Map，key为"goodsId-orderId"，value为是否已评价
const reviewedStatusMap = reactive(new Map())

onMounted(() => {
  fetchOrders()
})

const fetchOrders = async () => {
  loading.value = true
  try {
    const params = {
      pageNum: currentPage.value,
      pageSize: pageSize.value
    }
    
    if (statusFilter.value !== '') {
      params.status = statusFilter.value
    }
    
    console.log('请求订单列表参数:', params)
    
    const res = await getOrderList(params)
    console.log('订单列表返回数据:', res)
    
    if (res.data && res.data.list) {
      orderList.value = res.data.list || []
      total.value = res.data.total || 0
      console.log('解析后的订单列表:', orderList.value)
    } else {
      console.warn('订单数据结构不符合预期，尝试直接使用数据')
      if (Array.isArray(res.data)) {
        orderList.value = res.data
        total.value = res.data.length
      } else {
        orderList.value = []
        total.value = 0
        console.error('无法解析订单数据:', res.data)
      }
    }
    
    // 检查已完成订单中商品的评价状态
    await checkOrdersReviewStatus()
    
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
  router.push({
    name: 'OrderDetail',
    params: { id: orderId }
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
    1: '待发货',
    2: '已发货',
    3: '已完成',
    4: '已取消',
    5: '申请退款',
    6: '已退款'
  }
  return statusMap[status] || '未知状态'
}

const getStatusType = (status) => {
  const typeMap = {
    0: 'warning',   // 待付款
    1: 'primary',   // 待发货
    2: 'info',      // 已发货
    3: 'success',   // 已完成
    4: 'danger',    // 已取消
    5: 'warning',   // 申请退款
    6: 'info'       // 已退款
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
    await apiPayOrder(currentOrder.value.id, payType.value)
    ElMessage.success('支付成功')
    payDialogVisible.value = false
    fetchOrders()
  } catch (error) {
    console.error('支付失败:', error)
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

// 显示评价选项
const showReviewOptions = async (order) => {
  // 如果整个订单已评价，则不做任何操作
  if (isOrderReviewed(order)) {
    ElMessage.info('该订单已完成评价')
    return
  }
  
  // 如果订单中只有一件商品，直接跳转到评价页面
  if (order.orderItems && order.orderItems.length === 1) {
    goToReview(order.orderItems[0].goodsId, order.id)
    return
  }
  
  // 如果有多件商品，显示选择对话框
  currentOrder.value = order
  
  // 检查每个商品的评价状态
  if (order.orderItems && Array.isArray(order.orderItems)) {
    for (const item of order.orderItems) {
      await checkGoodsReviewStatus(item.goodsId, order.id)
    }
  }
  
  reviewDialogVisible.value = true
}

// 检查商品评价状态
const checkGoodsReviewStatus = async (goodsId, orderId) => {
  const key = `${goodsId}-${orderId}`
  
  try {
    console.log(`检查商品 ${goodsId} 在订单 ${orderId} 中的评价状态`)
    const res = await checkReviewed(goodsId, orderId)
    console.log(`检查结果:`, res)
    
    if (res.success && res.data === true) {
      reviewedStatusMap.set(key, true)
      console.log(`商品 ${goodsId} 已评价`)
    } else {
      reviewedStatusMap.set(key, false)
      console.log(`商品 ${goodsId} 未评价`)
    }
  } catch (error) {
    console.error(`检查商品 ${goodsId} 评价状态失败:`, error)
    reviewedStatusMap.set(key, false)
  }
}

// 判断商品是否已评价
const isGoodsReviewed = (goodsId, orderId) => {
  const key = `${goodsId}-${orderId}`
  return reviewedStatusMap.get(key) === true
}

// 判断整个订单是否已评价（所有商品都已评价）
const isOrderReviewed = (order) => {
  if (!order || !order.orderItems || !Array.isArray(order.orderItems) || order.orderItems.length === 0) {
    return false
  }
  
  // 检查所有商品是否都已评价
  return order.orderItems.every(item => {
    const key = `${item.goodsId}-${order.id}`
    return reviewedStatusMap.get(key) === true
  })
}

// 跳转到评价页面
const goToReview = (goodsId, orderId) => {
  // 如果商品已评价，不做任何操作
  if (isGoodsReviewed(goodsId, orderId)) {
    ElMessage.info('该商品已完成评价')
    return
  }
  
  reviewDialogVisible.value = false
  
  // 跳转到商品详情页并打开评价表单
  router.push({
    path: `/goods/${goodsId}`,
    query: { 
      review: 'true',
      orderId: orderId
    }
  })
}

// 检查所有已完成订单中商品的评价状态
const checkOrdersReviewStatus = async () => {
  // 只检查已完成的订单
  const completedOrders = orderList.value.filter(order => order.status === 3)
  
  for (const order of completedOrders) {
    if (order.orderItems && Array.isArray(order.orderItems)) {
      for (const item of order.orderItems) {
        await checkGoodsReviewStatus(item.goodsId, order.id)
      }
    }
  }
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
}

.goods-price-qty {
  display: flex;
  align-items: center;
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

.review-dialog-content {
  padding: 10px 0;
}

.select-tip {
  margin-bottom: 15px;
  color: #666;
}

.review-goods-list {
  max-height: 400px;
  overflow-y: auto;
}

.review-goods-item {
  display: flex;
  align-items: center;
  padding: 10px;
  border-bottom: 1px solid #eee;
  cursor: pointer;
  transition: background-color 0.3s;
}

.review-goods-item:hover {
  background-color: #f9f9f9;
}

.review-goods-image {
  width: 60px;
  height: 60px;
  margin-right: 15px;
  border-radius: 4px;
  overflow: hidden;
}

.review-goods-image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.review-goods-info {
  flex: 1;
}

.review-goods-name {
  font-size: 14px;
  margin-bottom: 5px;
}

.review-goods-price {
  color: #f56c6c;
  font-weight: bold;
}

.review-action-btn {
  margin-left: 10px;
}
</style> 