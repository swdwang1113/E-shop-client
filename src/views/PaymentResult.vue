<template>
  <div class="payment-result">
    <div class="result-container" v-loading="loading">
      <div v-if="!loading">
        <div v-if="paymentSuccess" class="success-result">
          <el-icon class="result-icon success"><CircleCheckFilled /></el-icon>
          <h2>支付成功</h2>
          <p>订单号: {{ orderNo }}</p>
          <p>支付金额: ¥{{ amount.toFixed(2) }}</p>
          <p>支付时间: {{ payTime }}</p>
          <div class="action-buttons">
            <el-button type="primary" @click="viewOrderDetail">查看订单详情</el-button>
            <el-button @click="goToOrderList">返回订单列表</el-button>
          </div>
        </div>
        <div v-else class="failed-result">
          <el-icon class="result-icon failed"><CircleCloseFilled /></el-icon>
          <h2>{{ checkingPayment ? '支付确认中' : '支付失败' }}</h2>
          <p>{{ errorMessage || '支付过程中发生错误，请稍后重试' }}</p>
          <div class="action-buttons">
            <el-button type="primary" @click="retryPayment">重新支付</el-button>
            <el-button @click="goToOrderList">返回订单列表</el-button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { CircleCheckFilled, CircleCloseFilled } from '@element-plus/icons-vue'
import { getOrderByNo, getOrderDetail } from '../api/order'
import { queryAlipayStatus } from '../api/order'

const route = useRoute()
const router = useRouter()

const loading = ref(true)
const paymentSuccess = ref(false)
const checkingPayment = ref(false)
const orderNo = ref('')
const orderId = ref('')
const amount = ref(0)
const payTime = ref('')
const errorMessage = ref('')
let statusCheckTimer = null
let maxCheckAttempts = 10
let currentAttempt = 0

onMounted(async () => {
  // 从URL参数中获取订单信息
  const orderNoParam = route.query.out_trade_no || ''
  const tradeNo = route.query.trade_no || ''
  
  if (!orderNoParam) {
    errorMessage.value = '未找到订单信息'
    loading.value = false
    return
  }
  
  orderNo.value = orderNoParam
  
  try {
    // 根据订单号获取订单详情
    const orderRes = await getOrderByNo(orderNoParam)
    
    if (orderRes.success && orderRes.data) {
      const orderData = orderRes.data
      orderId.value = orderData.id
      amount.value = orderData.totalAmount || 0
      
      // 检查订单状态，如果已支付则显示成功
      if (orderData.status >= 1) { // 状态大于等于1表示已支付
        paymentSuccess.value = true
        payTime.value = formatDateTime(orderData.payTime || new Date())
        loading.value = false
      } else {
        // 如果订单状态仍为未支付，可能是支付宝回调尚未完成
        // 开始定时查询支付状态
        checkingPayment.value = true
        errorMessage.value = '正在确认支付结果，请稍候...'
        loading.value = false
        startPaymentStatusCheck()
      }
    } else {
      errorMessage.value = '获取订单信息失败'
      loading.value = false
    }
  } catch (error) {
    console.error('获取订单详情失败:', error)
    errorMessage.value = '获取订单信息失败'
    loading.value = false
  }
})

onBeforeUnmount(() => {
  // 组件卸载前清除定时器
  if (statusCheckTimer) {
    clearInterval(statusCheckTimer)
  }
})

// 定时查询支付状态
const startPaymentStatusCheck = () => {
  // 先立即查询一次
  checkPaymentStatus()
  
  // 设置定时器，每3秒查询一次
  statusCheckTimer = setInterval(() => {
    checkPaymentStatus()
  }, 3000)
  
  // 60秒后停止查询
  setTimeout(() => {
    if (statusCheckTimer) {
      clearInterval(statusCheckTimer)
      statusCheckTimer = null
      
      // 如果仍未确认支付成功，显示提示信息
      if (!paymentSuccess.value) {
        checkingPayment.value = false
        errorMessage.value = '支付结果确认超时，请查看订单列表确认支付状态'
      }
    }
  }, 60000)
}

// 查询支付状态
const checkPaymentStatus = async () => {
  currentAttempt++
  
  try {
    // 先通过支付宝查询接口查询
    const alipayRes = await queryAlipayStatus(orderNo.value)
    if (alipayRes.success && alipayRes.data === true) {
      // 支付宝查询显示已支付
      handlePaymentSuccess()
      return
    }
    
    // 再查询订单详情
    const orderRes = await getOrderDetail(orderId.value)
    if (orderRes.success && orderRes.data && orderRes.data.status >= 1) {
      // 订单状态显示已支付
      handlePaymentSuccess(orderRes.data)
      return
    }
    
    // 如果达到最大尝试次数，停止查询
    if (currentAttempt >= maxCheckAttempts) {
      if (statusCheckTimer) {
        clearInterval(statusCheckTimer)
        statusCheckTimer = null
      }
      checkingPayment.value = false
      errorMessage.value = '支付结果确认超时，请查看订单列表确认支付状态'
    }
  } catch (error) {
    console.error('查询支付状态失败:', error)
    // 查询失败不停止定时器，继续尝试
  }
}

// 处理支付成功
const handlePaymentSuccess = (orderData) => {
  // 清除定时器
  if (statusCheckTimer) {
    clearInterval(statusCheckTimer)
    statusCheckTimer = null
  }
  
  // 更新状态
  paymentSuccess.value = true
  checkingPayment.value = false
  payTime.value = formatDateTime(orderData?.payTime || new Date())
}

const formatDateTime = (dateTimeStr) => {
  if (!dateTimeStr) return ''
  const date = new Date(dateTimeStr)
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}:${String(date.getSeconds()).padStart(2, '0')}`
}

const viewOrderDetail = () => {
  if (orderId.value) {
    router.push({
      name: 'OrderDetail',
      params: { id: orderId.value },
      query: { _t: new Date().getTime() } // 添加时间戳确保刷新
    })
  } else {
    ElMessage.warning('订单ID不存在，无法查看详情')
    goToOrderList()
  }
}

const goToOrderList = () => {
  router.push('/orders')
}

const retryPayment = () => {
  if (orderId.value) {
    router.push({
      name: 'OrderDetail',
      params: { id: orderId.value },
      query: { _t: new Date().getTime(), retry: 'payment' } // 添加重试支付标记
    })
  } else {
    ElMessage.warning('订单ID不存在，无法重新支付')
    goToOrderList()
  }
}
</script>

<style scoped>
.payment-result {
  padding: 30px;
  min-height: 60vh;
  display: flex;
  justify-content: center;
  align-items: center;
}

.result-container {
  background-color: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
  padding: 40px;
  width: 100%;
  max-width: 600px;
  text-align: center;
}

.result-icon {
  font-size: 64px;
  margin-bottom: 20px;
}

.result-icon.success {
  color: #67c23a;
}

.result-icon.failed {
  color: #f56c6c;
}

.success-result h2,
.failed-result h2 {
  margin-bottom: 20px;
  font-weight: 500;
}

.success-result p,
.failed-result p {
  margin-bottom: 10px;
  color: #606266;
}

.action-buttons {
  margin-top: 30px;
}

.action-buttons .el-button {
  margin: 0 10px;
}
</style>