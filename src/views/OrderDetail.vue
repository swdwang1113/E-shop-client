<template>
  <div class="order-detail" v-loading="loading">
    <div v-if="orderInfo.id">
      <div class="page-header">
        <h2>订单详情</h2>
        <div class="header-buttons">
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
      
      <!-- 物流信息 - 当订单状态为已发货或已完成时显示 -->
      <el-card v-if="orderInfo.status >= 2" class="info-card">
        <template #header>
          <div class="card-header">
            <h3>物流信息</h3>
          </div>
        </template>
        
        <div v-if="shippingInfo" class="logistics-info">
          <el-descriptions :column="2" border>
            <el-descriptions-item label="物流公司" label-width="80px" width="200px">
              {{ shippingInfo.shippingCompany }}
            </el-descriptions-item>
            <el-descriptions-item label="物流单号" label-width="80px">
              {{ shippingInfo.trackingNumber }}
            </el-descriptions-item>
            <el-descriptions-item label="发货地址" label-width="80px" :span="2">
              {{ shippingInfo.senderAddress }}
            </el-descriptions-item>
            <el-descriptions-item label="预计送达" label-width="80px" :span="2">
              {{ shippingInfo.estimatedTime }}
            </el-descriptions-item>
          </el-descriptions>
          
          <div class="logistics-actions">
            <el-button type="primary" @click="viewShippingRoute">查看物流路线</el-button>
          </div>
        </div>
        <div v-else class="no-logistics">
          <el-empty description="暂无物流信息" />
        </div>
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
      <div class="empty-actions">
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
    
    <!-- 物流路线弹窗 -->
    <el-dialog
      v-model="routeDialogVisible"
      title="物流路线"
      width="80%"
      destroy-on-close
    >
      <div v-if="routeInfo" class="route-info">
        <div class="route-header">
          <div class="detail-sections">
            <div class="detail-section">
              <div class="info-item">
                <span class="label">物流公司:</span>
                <span>{{ routeInfo.shippingInfo.shippingCompany }}</span>
              </div>
              <div class="info-item">
                <span class="label">物流单号:</span>
                <span>{{ routeInfo.shippingInfo.trackingNumber }}</span>
              </div>
            </div>
            <div class="detail-section">
              <div class="info-item">
                <span class="label">发货地址:</span>
                <span>{{ routeInfo.shippingInfo.senderAddress }}</span>
              </div>
              <div class="info-item">
                <span class="label">收货地址:</span>
                <span>{{ routeInfo.shippingInfo.receiverAddress }}</span>
              </div>
            </div>
          </div>
        </div>
        
        <!-- 物流路线图 -->
        <div class="route-map">
          <div class="map-placeholder">
            <el-empty description="物流路线地图加载中..." v-if="!routeLoaded" />
            <div id="route-map-container" style="height: 400px; width: 100%;" v-else></div>
          </div>
        </div>
        
        <!-- 物流路径点 -->
        <div class="route-path-points">
          <h4>物流轨迹</h4>
          <el-timeline>
            <el-timeline-item
              v-for="(point, index) in routeInfo.pathPoints"
              :key="index"
              :timestamp="point.time"
              :type="getPointStatusType(point.status)"
            >
              {{ getPointStatusText(point.status) }}
            </el-timeline-item>
          </el-timeline>
        </div>
      </div>
      <div v-else>
        <el-empty description="暂无物流路线信息" />
      </div>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted, watch, defineProps } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { 
  getOrderDetail, 
  cancelOrder as apiCancelOrder, 
  payOrder as apiPayOrder, 
  deleteOrder as apiDeleteOrder, 
  confirmReceipt as apiConfirmReceipt, 
  getShippingRoute 
} from '../api/order'

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

// 物流相关数据
const shippingInfo = ref(null)
const routeDialogVisible = ref(false)
const routeInfo = ref(null)
const routeLoaded = ref(false)

// 先定义fetchOrderDetail函数
const fetchOrderDetail = async () => {
  // 确保在请求开始前设置loading状态
  loading.value = true
  orderInfo.value = {} // 清空之前的数据
  
  const orderId = getOrderId()
  console.log('开始获取订单详情，ID:', orderId)
  
  try {
    console.log('调用API前，请求参数:', orderId)
    const res = await getOrderDetail(orderId)
    console.log('获取订单详情响应原始数据:', JSON.stringify(res))
    
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
      
      // 获取物流信息
      fetchShippingInfo();
      
      // 添加更详细的调试信息
      console.log('订单状态值:', orderInfo.value.status);
      console.log('订单状态值类型:', typeof orderInfo.value.status);
      console.log('订单状态文本:', getStatusText(orderInfo.value.status));
      console.log('是否显示去评价按钮条件1 (status === 3):', orderInfo.value.status === 3);
      console.log('是否显示去评价按钮条件2 (getStatusText === 已完成):', getStatusText(orderInfo.value.status) === '已完成');
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

onMounted(() => {
  console.log('OrderDetail组件已挂载，路由参数:', route.params)
  
  // 发送API请求获取最新数据
  if (getOrderId()) {
    console.log('组件挂载时立即请求数据')
    fetchOrderDetail()
    
    // 检查URL参数，如果有retry=payment，则自动打开支付对话框
    if (route.query.retry === 'payment' && orderInfo.value && orderInfo.value.status === 0) {
      setTimeout(() => {
        payOrder()
      }, 500) // 延迟500ms，确保订单信息已加载
    }
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
  // 确保状态值是数字
  const statusNum = Number(status);
  
  const statusMap = {
    0: '待付款',
    1: '待发货',
    2: '已发货',
    3: '已完成',
    4: '已取消',
    5: '申请退款',
    6: '已退款'
  }
  return statusMap[statusNum] || '未知状态'
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
    // 使用统一的支付接口，不再区分支付宝和其他支付方式
    const res = await apiPayOrder(getOrderId(), payType.value)
    
    if (res.code === 200) {
      ElMessage.success('支付成功')
      payDialogVisible.value = false
      // 刷新订单详情
      fetchOrderDetail()
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

// 获取物流信息
const fetchShippingInfo = async () => {
  if (orderInfo.value && orderInfo.value.status >= 2) {
    try {
      const res = await getShippingRoute(getOrderId())
      if (res.code === 200 && res.data) {
        shippingInfo.value = res.data.shippingInfo
      }
    } catch (error) {
      console.error('获取物流信息失败:', error)
    }
  }
}

// 查看物流路线
const viewShippingRoute = async () => {
  try {
    const res = await getShippingRoute(getOrderId())
    
    if (res.code === 200 && res.data) {
      routeInfo.value = res.data
      routeDialogVisible.value = true
      
      // 延迟加载地图
      setTimeout(() => {
        loadRouteMap()
      }, 500)
    } else {
      ElMessage.error(res.message || '获取物流路线失败')
    }
  } catch (error) {
    console.error('获取物流路线失败:', error)
    ElMessage.error('获取物流路线失败')
  }
}

// 加载物流路线地图
const loadRouteMap = () => {
  if (!routeInfo.value) return;
  
  routeLoaded.value = true;
  
  try {
    // 获取坐标
    const senderLng = parseFloat(routeInfo.value.senderLocation.longitude);
    const senderLat = parseFloat(routeInfo.value.senderLocation.latitude);
    const receiverLng = parseFloat(routeInfo.value.receiverLocation.longitude);
    const receiverLat = parseFloat(routeInfo.value.receiverLocation.latitude);
    
    // 确保坐标有效
    if (isNaN(senderLng) || isNaN(senderLat) || isNaN(receiverLng) || isNaN(receiverLat)) {
      ElMessage.warning('物流坐标数据格式错误，无法显示地图');
      return;
    }
    
    // 延迟执行，确保DOM已经完全渲染
    setTimeout(() => {
      // 准备地图容器
      const mapContainer = document.getElementById('route-map-container');
      if (!mapContainer) {
        console.error('找不到地图容器');
        return;
      }
      
      // 确保容器有尺寸
      if (mapContainer.offsetWidth === 0 || mapContainer.offsetHeight === 0) {
        mapContainer.style.width = '100%';
        mapContainer.style.height = '400px';
        mapContainer.style.display = 'block';
      }
      
      // 清空容器
      mapContainer.innerHTML = '';
      
      // 加载高德地图API
      if (!window.AMap) {
        const script = document.createElement('script');
        script.type = 'text/javascript';
        script.src = 'https://webapi.amap.com/maps?v=2.0&key=017045315860ec69975d7a0a49f15511';
        script.onload = () => initMap(senderLng, senderLat, receiverLng, receiverLat);
        script.onerror = () => ElMessage.error('地图加载失败');
        document.head.appendChild(script);
      } else {
        initMap(senderLng, senderLat, receiverLng, receiverLat);
      }
    }, 1000);
  } catch (error) {
    console.error('加载地图失败:', error);
    ElMessage.warning('地图加载失败，但您仍可以查看物流信息');
  }
}

// 初始化地图
const initMap = (senderLng, senderLat, receiverLng, receiverLat) => {
  try {
    // 创建地图实例
    const map = new window.AMap.Map('route-map-container', {
      zoom: 8,
      center: [(senderLng + receiverLng) / 2, (senderLat + receiverLat) / 2],
      resizeEnable: true
    });
    
    // 添加起点和终点标记
    const startMarker = new window.AMap.Marker({
      position: [senderLng, senderLat],
      title: '发货地',
      label: { content: '发货地', direction: 'right' }
    });
    
    const endMarker = new window.AMap.Marker({
      position: [receiverLng, receiverLat],
      title: '收货地',
      label: { content: '收货地', direction: 'right' }
    });
    
    map.add([startMarker, endMarker]);
    
    // 添加信息窗体
    startMarker.on('click', () => {
      new window.AMap.InfoWindow({
        content: `<div style="padding:10px;"><h4>发货地</h4><p>${routeInfo.value.shippingInfo.senderAddress}</p></div>`,
        offset: new window.AMap.Pixel(0, -30)
      }).open(map, startMarker.getPosition());
    });
    
    endMarker.on('click', () => {
      new window.AMap.InfoWindow({
        content: `<div style="padding:10px;"><h4>收货地</h4><p>${routeInfo.value.shippingInfo.receiverAddress}</p></div>`,
        offset: new window.AMap.Pixel(0, -30)
      }).open(map, endMarker.getPosition());
    });
    
    // 绘制直线连接起点和终点
    const polyline = new window.AMap.Polyline({
      path: [[senderLng, senderLat], [receiverLng, receiverLat]],
      strokeColor: '#3498db',
      strokeWeight: 6,
      strokeOpacity: 0.8,
      showDir: true,
      lineJoin: 'round'
    });
    
    map.add(polyline);
    
    // 计算两点之间的距离并显示
    const distance = window.AMap.GeometryUtil.distance([senderLng, senderLat], [receiverLng, receiverLat]);
    const distanceText = distance > 1000 ? `约 ${(distance / 1000).toFixed(1)} 公里` : `约 ${Math.round(distance)} 米`;
    
    // 在路线中间添加距离标签
    const midPoint = [(senderLng + receiverLng) / 2, (senderLat + receiverLat) / 2];
    const distanceMarker = new window.AMap.Marker({
      position: midPoint,
      content: `<div style="background-color: white; padding: 5px 10px; border-radius: 15px; border: 1px solid #3498db; font-size: 12px;">
        <span>${distanceText}</span>
      </div>`,
      offset: new window.AMap.Pixel(0, -10),
      anchor: 'bottom-center'
    });
    
    map.add(distanceMarker);
    map.setFitView();
    
  } catch (error) {
    console.error('初始化地图失败:', error);
    ElMessage.error('地图初始化失败');
  }
}

// 获取物流节点状态类型
const getPointStatusType = (status) => {
  const types = {
    1: 'primary',   // 已发货
    2: 'warning',   // 运输中
    3: 'success'    // 已送达
  }
  return types[status] || 'info'
}

// 获取物流节点状态文本
const getPointStatusText = (status) => {
  const texts = {
    1: '已从仓库发出',
    2: '运输中',
    3: '已送达'
  }
  return texts[status] || '未知状态'
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

.logistics-info {
  margin-bottom: 20px;
}

.logistics-actions {
  margin-top: 20px;
  display: flex;
  justify-content: flex-end;
}

.no-logistics {
  padding: 20px 0;
}

.route-info {
  padding: 0;
}

.route-header {
  margin-bottom: 20px;
  background-color: #fff;
  border-radius: 4px;
  padding: 15px;
  border: 1px solid #ebeef5;
}

.detail-sections {
  display: flex;
  flex-wrap: wrap;
  gap: 30px;
}

.detail-section {
  flex: 1;
  min-width: 250px;
}

.info-item {
  margin-bottom: 8px;
  display: flex;
}

.info-item .label {
  width: 80px;
  color: #666;
}

.route-map {
  height: 400px;
  margin-bottom: 20px;
  border: 1px solid #ebeef5;
  border-radius: 4px;
  overflow: hidden;
}

.map-placeholder {
  height: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
  background-color: #f5f7fa;
}

.route-path-points {
  margin-top: 20px;
  background-color: #fff;
  border-radius: 4px;
  padding: 15px;
  border: 1px solid #ebeef5;
}

.route-path-points h4 {
  margin-top: 0;
  margin-bottom: 15px;
  font-size: 16px;
  color: #333;
  font-weight: 600;
  border-bottom: 1px solid #ebeef5;
  padding-bottom: 10px;
}
</style>