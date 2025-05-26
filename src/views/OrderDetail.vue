<template>
  <div class="order-detail" v-loading="loading">
    <div v-if="orderInfo.id">
      <div class="page-header">
        <h2>订单详情</h2>
        <div class="header-buttons">
          <el-button @click="refreshOrderDetail" icon="RefreshRight" type="primary" plain>刷新</el-button>
          <el-button @click="forceRequest" icon="Connection" type="warning" plain>强制请求</el-button>
          <el-button @click="goBack" icon="Back">返回</el-button>
        </div>
      </div>
      
      <!-- 订单信息 -->
      <el-card class="info-card">
        <template #header>
          <div class="card-header">
            <h3>订单信息</h3>
          </div>
        </template>
        
        <el-descriptions :column="2" border>
          <el-descriptions-item label="订单编号">{{ orderInfo.orderNo }}</el-descriptions-item>
          <el-descriptions-item label="下单时间">{{ formatDateTime(orderInfo.createTime) }}</el-descriptions-item>
          <el-descriptions-item label="支付方式">{{ getPayType(orderInfo.paymentType) }}</el-descriptions-item>
          <el-descriptions-item label="支付时间">{{ orderInfo.paymentTime ? formatDateTime(orderInfo.paymentTime) : '未支付' }}</el-descriptions-item>
        </el-descriptions>
      </el-card>
      
      <!-- 收货信息 -->
      <el-card class="info-card">
        <template #header>
          <div class="card-header">
            <h3>收货信息</h3>
          </div>
        </template>
        
        <el-descriptions :column="2" border>
          <el-descriptions-item label="收货人" label-width="80px" width="200px">{{ orderInfo.address?.name || '未指定收货人' }}</el-descriptions-item>
          <el-descriptions-item label="联系电话" label-width="80px">{{ orderInfo.address?.phone || '无联系电话' }}</el-descriptions-item>
          <el-descriptions-item label="收货地址" label-width="80px" :span="2">{{ formatAddress(orderInfo.address) }}</el-descriptions-item>
        </el-descriptions>
      </el-card>
      
      <!-- 商品信息 -->
      <el-card class="goods-card">
        <template #header>
          <div class="card-header">
            <h3>商品信息</h3>
          </div>
        </template>
        
        <el-table :data="orderInfo.orderItems" style="width: 100%">
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
          
          <el-table-column label="单价" prop="goodsPrice" width="120">
            <template #default="scope">
              <div class="price">¥{{ (scope.row.goodsPrice || 0).toFixed(2) }}</div>
            </template>
          </el-table-column>
          
          <el-table-column label="数量" prop="quantity" width="100" />
          
          <el-table-column label="小计" width="120">
            <template #default="scope">
              <div class="subtotal">
                ¥{{ (scope.row.totalPrice || 0).toFixed(2) }}
              </div>
            </template>
          </el-table-column>
        </el-table>
        
        <div class="order-total">
          <div class="total-item">
            <span>商品总额：</span>
            <span class="price">¥{{ (orderInfo.totalAmount || 0).toFixed(2) }}</span>
          </div>
          <div class="total-item">
            <span>订单总额：</span>
            <span class="price">¥{{ (orderInfo.totalAmount || 0).toFixed(2) }}</span>
          </div>
          <div class="total-item">
            <span>实付金额：</span>
            <span class="price highlight">¥{{ (orderInfo.totalAmount || 0).toFixed(2) }}</span>
          </div>
        </div>
      </el-card>
      
      <!-- 订单状态和操作（位于商品信息下方） -->
      <el-card class="status-card">
        <div class="status-info">
          <div class="status-text">
            <el-tag :type="getStatusType(orderInfo.status)" size="large">
              {{ getStatusText(orderInfo.status) }}
            </el-tag>
            <span class="status-desc">{{ getStatusDesc(orderInfo.status) }}</span>
          </div>
          
          <div class="status-actions">
            <el-button 
              v-if="orderInfo.status === 0" 
              type="primary"
              @click="payOrder"
            >
              去支付
            </el-button>
            
            <el-button 
              v-if="orderInfo.status === 0" 
              type="danger"
              @click="cancelOrder"
            >
              取消订单
            </el-button>
            
            <el-button 
              v-if="orderInfo.status === 2" 
              type="success"
              @click="confirmReceipt"
            >
              确认收货
            </el-button>
            
            <el-button 
              v-if="orderInfo.status === 3 || orderInfo.status === 4" 
              type="danger"
              @click="deleteOrder"
            >
              删除订单
            </el-button>
          </div>
        </div>
      </el-card>
    </div>
    
    <el-empty 
      v-else-if="!loading"
      description="订单数据加载失败" 
    >
      <p class="error-tip">可能是数据格式问题，请点击刷新按钮重试</p>
      <div class="empty-actions">
        <el-button type="primary" @click="refreshOrderDetail" icon="RefreshRight">刷新数据</el-button>
        <el-button type="warning" @click="forceRequest">强制请求</el-button>
        <el-button @click="goToOrderList">返回订单列表</el-button>
      </div>
    </el-empty>
    
    <!-- 支付对话框 -->
    <el-dialog
      v-model="payDialogVisible"
      title="订单支付"
      width="400px"
    >
      <div class="pay-dialog-content">
        <p class="pay-amount">支付金额：<span class="price">¥{{ (orderInfo?.totalAmount || 0).toFixed(2) }}</span></p>
        
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
  </div>
</template>

<script setup>
import { ref, onMounted, watch, defineProps } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { getOrderDetail, cancelOrder as apiCancelOrder, payOrder as apiPayOrder, deleteOrder as apiDeleteOrder, confirmReceipt as apiConfirmReceipt } from '../api/order'

// 接收props
const props = defineProps({
  id: {
    type: [String, Number],
    required: false
  }
})

const route = useRoute()
const router = useRouter()

// 优先使用props中的id，如果没有则使用路由参数
const getOrderId = () => props.id || route.params.id

const orderInfo = ref({})
const loading = ref(true)

// 支付相关
const payDialogVisible = ref(false)
const payType = ref(1)
const payLoading = ref(false)

// 先定义fetchOrderDetail函数
const fetchOrderDetail = async () => {
  // 确保在请求开始前设置loading状态
  loading.value = true
  orderInfo.value = {} // 清空之前的数据
  
  const orderId = getOrderId()
  console.log('开始获取订单详情，ID:', orderId)
  
  try {
    const res = await getOrderDetail(orderId)
    console.log('获取订单详情响应:', res)
    
    if (res && res.data) {
      // 深拷贝防止影响原始数据
      const orderData = JSON.parse(JSON.stringify(res.data));
      console.log('处理前的订单数据:', orderData);
      
      // 检查并规范化订单项数据
      if (orderData.orderItems) {
        // 确保orderItems是数组
        orderData.orderItems = Array.isArray(orderData.orderItems) ? orderData.orderItems : [];
      } else if (orderData.items) {
        // 有些接口可能返回items而不是orderItems
        orderData.orderItems = Array.isArray(orderData.items) ? orderData.items : [];
        delete orderData.items;
      } else {
        orderData.orderItems = [];
      }
      
      // 确保地址数据结构正确
      if (typeof orderData.address === 'string') {
        // 如果地址是字符串，解析为对象
        const addressParts = orderData.address.split(' ');
        orderData.address = {
          province: addressParts[0] || '',
          city: addressParts[1] || '',
          district: addressParts[2] || '',
          address: addressParts.slice(3).join(' ') || '',
          name: orderData.consignee || '未知',
          phone: orderData.mobile || ''
        };
      } else if (!orderData.address) {
        // 如果地址不存在，创建一个包含基础信息的地址对象
        orderData.address = {
          name: orderData.consignee || '未知',
          phone: orderData.mobile || '',
          province: '',
          city: '',
          district: '',
          address: orderData.addressDetail || ''
        };
      }
      
      orderInfo.value = orderData;
      console.log('处理后的订单详情数据:', orderInfo.value);
    } else {
      console.error('获取订单详情失败: 没有数据');
      ElMessage.error('获取订单数据失败');
      orderInfo.value = {};
    }
  } catch (error) {
    console.error('获取订单详情失败:', error);
    ElMessage.error('获取订单数据出错');
    orderInfo.value = {};
  } finally {
    loading.value = false;
  }
}

// 添加强制刷新功能
const refreshOrderDetail = () => {
  console.log('手动刷新订单详情')
  loading.value = true
  orderInfo.value = {}
  setTimeout(() => {
    fetchOrderDetail()
  }, 100)
}

onMounted(() => {
  console.log('OrderDetail组件已挂载，路由参数:', route.params)
  
  // 发送API请求获取最新数据
  if (getOrderId()) {
    console.log('组件挂载时立即请求数据')
    fetchOrderDetail()
  }
})

// 监听路由参数变化，使用immediate: true确保首次加载时也会触发
watch([() => getOrderId()], ([newId], [oldId]) => {
  console.log('路由参数变化:', { newId, oldId })
  if (newId && newId !== oldId) {
    console.log('路由ID变化，重新请求数据')
    fetchOrderDetail()
  }
}, { immediate: true })

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

const getStatusDesc = (status) => {
  const descMap = {
    0: '请尽快完成支付',
    1: '商家正在处理您的订单',
    2: '商品已发货，请注意查收',
    3: '交易已完成',
    4: '订单已取消',
    5: '退款申请正在处理中',
    6: '退款已完成'
  }
  return descMap[status] || ''
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

const getPayType = (type) => {
  const typeMap = {
    1: '支付宝',
    2: '微信支付',
    3: '银行卡'
  }
  return type ? typeMap[type] : '未支付'
}

const formatDateTime = (dateTimeStr) => {
  if (!dateTimeStr) return ''
  const date = new Date(dateTimeStr)
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`
}

// 简化后的地址格式化函数
const formatAddress = (addressObj) => {
  if (!addressObj) return '无地址信息'
  
  let formattedAddress = ''
  if (addressObj.province) formattedAddress += addressObj.province
  if (addressObj.city) formattedAddress += ' ' + addressObj.city
  if (addressObj.district) formattedAddress += ' ' + addressObj.district
  if (addressObj.address) formattedAddress += ' ' + addressObj.address
  
  return formattedAddress.trim() || '地址信息不完整'
}

const goBack = () => {
  router.back()
}

const goToOrderList = () => {
  router.push('/orders')
}

const goToGoodsDetail = (goodsId) => {
  router.push(`/goods/${goodsId}`)
}

// 支付订单
const payOrder = () => {
  payDialogVisible.value = true
}

const confirmPay = async () => {
  if (!payType.value) return
  
  payLoading.value = true
  try {
    await apiPayOrder(getOrderId(), payType.value)
    ElMessage.success('支付成功')
    payDialogVisible.value = false
    fetchOrderDetail()
  } catch (error) {
    console.error('支付失败:', error)
  } finally {
    payLoading.value = false
  }
}

// 取消订单
const cancelOrder = () => {
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
      await apiCancelOrder(getOrderId())
      ElMessage.success('订单已取消')
      fetchOrderDetail()
    } catch (error) {
      console.error('取消订单失败:', error)
    }
  }).catch(() => {})
}

// 确认收货
const confirmReceipt = () => {
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
      await apiConfirmReceipt(getOrderId())
      ElMessage.success('已确认收货')
      fetchOrderDetail()
    } catch (error) {
      console.error('确认收货失败:', error)
    }
  }).catch(() => {})
}

// 删除订单
const deleteOrder = () => {
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
      await apiDeleteOrder(getOrderId())
      ElMessage.success('订单已删除')
      router.push('/orders')
    } catch (error) {
      console.error('删除订单失败:', error)
    }
  }).catch(() => {})
}

// 强制发送请求
const forceRequest = async () => {
  console.log('强制发送请求')
  loading.value = true
  orderInfo.value = {}
  
  try {
    const orderId = getOrderId()
    const timestamp = new Date().getTime()
    console.log(`强制请求订单详情，ID: ${orderId}, 时间戳: ${timestamp}`)
    
    const res = await getOrderDetail(orderId)
    console.log('强制请求响应数据:', res)
    
    if (res && res.data) {
      orderInfo.value = res.data
      ElMessage.success('数据刷新成功')
    } else {
      ElMessage.warning('响应数据格式不正确')
    }
  } catch (error) {
    console.error('强制请求失败:', error)
    ElMessage.error('请求失败: ' + error.message)
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.order-detail {
  min-height: 500px;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.page-header h2 {
  margin: 0;
  font-size: 20px;
  color: #333;
}

.header-buttons {
  display: flex;
  gap: 10px;
}

.status-card,
.info-card,
.goods-card {
  margin-bottom: 20px;
}

.status-info {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.status-text {
  display: flex;
  align-items: center;
}

.status-desc {
  margin-left: 15px;
  font-size: 14px;
  color: #666;
}

.status-actions {
  display: flex;
  gap: 10px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.card-header h3 {
  margin: 0;
  font-size: 16px;
  color: #333;
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

.order-total {
  margin-top: 20px;
  padding-top: 20px;
  border-top: 1px solid #eee;
  display: flex;
  flex-direction: column;
  align-items: flex-end;
}

.total-item {
  margin-bottom: 10px;
  font-size: 14px;
}

.total-item .price {
  margin-left: 10px;
  font-size: 16px;
}

.total-item .highlight {
  font-size: 20px;
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

.error-tip {
  color: #f56c6c;
  margin: 10px 0;
}

.empty-actions {
  display: flex;
  gap: 10px;
  justify-content: center;
}
</style> 