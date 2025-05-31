<template>
  <div class="orders-manage">
    <!-- 操作栏 -->
    <div class="action-bar">
      <div class="left">
        <el-button type="primary" @click="exportOrders">
          <el-icon><Download /></el-icon>导出订单
        </el-button>
      </div>
      
      <div class="right">
        <el-input
          v-model="searchKeyword"
          placeholder="输入订单号或用户ID搜索"
          class="search-input"
          clearable
          @keyup.enter="handleSearch"
        >
          <template #prefix>
            <el-icon><Search /></el-icon>
          </template>
          <template #append>
            <el-button @click="handleSearch">搜索</el-button>
          </template>
        </el-input>
        
        <el-select v-model="statusFilter" placeholder="订单状态" clearable @change="handleSearch">
          <el-option
            v-for="item in statusOptions"
            :key="item.value"
            :label="item.label"
            :value="item.value"
          />
        </el-select>
        
        <el-date-picker
          v-model="dateRange"
          type="daterange"
          range-separator="至"
          start-placeholder="开始日期"
          end-placeholder="结束日期"
          value-format="YYYY-MM-DD"
          @change="handleSearch"
        />
      </div>
    </div>
    
    <!-- 订单表格 -->
    <el-table
      :data="ordersList"
      style="width: 100%"
      v-loading="loading"
      row-key="id"
      @row-click="handleRowClick"
    >
      <el-table-column prop="orderNo" label="订单号" width="180" />
      
      <el-table-column label="用户信息" width="150">
        <template #default="scope">
          <div class="user-info">
            <div>{{ scope.row.address?.name || '用户' + scope.row.userId }}</div>
            <div class="user-id">ID: {{ scope.row.userId }}</div>
          </div>
        </template>
      </el-table-column>
      
      <el-table-column prop="totalAmount" label="订单金额" width="120">
        <template #default="scope">
          <span class="price">¥{{ scope.row.totalAmount.toFixed(2) }}</span>
        </template>
      </el-table-column>
      
      <el-table-column prop="status" label="订单状态" width="100">
        <template #default="scope">
          <el-tag :type="getOrderStatusType(scope.row.status)">
            {{ getOrderStatusText(scope.row.status) }}
          </el-tag>
        </template>
      </el-table-column>
      
      <el-table-column prop="paymentType" label="支付方式" width="120">
        <template #default="scope">
          {{ getPaymentTypeText(scope.row.paymentType) }}
        </template>
      </el-table-column>
      
      <el-table-column prop="createTime" label="创建时间">
        <template #default="scope">
          {{ formatDate(scope.row.createTime) }}
        </template>
      </el-table-column>
      
      <el-table-column label="操作" width="200" fixed="right">
        <template #default="scope">
          <el-button type="primary" link size="small" @click.stop="handleDetail(scope.row)">
            详情
          </el-button>
          <el-button
            v-if="scope.row.status === 1"
            type="success"
            link
            size="small"
            @click.stop="handleShipment(scope.row)"
          >
            发货
          </el-button>
          <el-button
            type="danger"
            link
            size="small"
            @click.stop="handleDelete(scope.row)"
          >
            删除
          </el-button>
        </template>
      </el-table-column>
    </el-table>
    
    <!-- 订单详情弹窗 -->
    <el-dialog
      v-model="orderDetailVisible"
      :title="`订单详情 - ${expandedOrder?.orderNo || ''}`"
      width="70%"
      destroy-on-close
    >
      <div v-if="expandedOrder" class="order-detail-dialog">
        <div class="detail-sections">
          <div class="detail-section">
            <h4>订单信息</h4>
            <div class="info-item">
              <span class="label">订单号:</span>
              <span>{{ expandedOrder.orderNo }}</span>
            </div>
            <div class="info-item">
              <span class="label">创建时间:</span>
              <span>{{ formatDate(expandedOrder.createTime) }}</span>
            </div>
            <div class="info-item">
              <span class="label">支付方式:</span>
              <span>{{ getPaymentTypeText(expandedOrder.paymentType) }}</span>
            </div>
            <div class="info-item">
              <span class="label">支付时间:</span>
              <span>{{ expandedOrder.paymentTime ? formatDate(expandedOrder.paymentTime) : '未支付' }}</span>
            </div>
            <div class="info-item">
              <span class="label">订单状态:</span>
              <span>
                <el-tag :type="getOrderStatusType(expandedOrder.status)">
                  {{ getOrderStatusText(expandedOrder.status) }}
                </el-tag>
              </span>
            </div>
            <div class="info-item" v-if="expandedOrder.remark">
              <span class="label">订单备注:</span>
              <span>{{ expandedOrder.remark }}</span>
            </div>
          </div>
          
          <div class="detail-section">
            <h4>用户信息</h4>
            <div class="info-item">
              <span class="label">用户ID:</span>
              <span>{{ expandedOrder.userId }}</span>
            </div>
            <div class="info-item">
              <span class="label">用户名:</span>
              <span>{{ expandedOrder.address?.name || '用户' + expandedOrder.userId }}</span>
            </div>
          </div>
          
          <div class="detail-section">
            <h4>收货信息</h4>
            <div class="info-item">
              <span class="label">收货人:</span>
              <span>{{ expandedOrder.address?.name }}</span>
            </div>
            <div class="info-item">
              <span class="label">联系电话:</span>
              <span>{{ expandedOrder.address?.phone }}</span>
            </div>
            <div class="info-item">
              <span class="label">收货地址:</span>
              <span>{{ formatAddress(expandedOrder.address) }}</span>
            </div>
          </div>
        </div>
        
        <div class="goods-list">
          <h4>商品信息</h4>
          <el-table :data="expandedOrder.orderItems" style="width: 100%">
            <el-table-column label="商品信息" min-width="300">
              <template #default="scope">
                <div class="goods-info">
                  <el-image
                    :src="scope.row.goodsImage"
                    fit="cover"
                    class="goods-image"
                  />
                  <div class="goods-detail">
                    <div class="goods-name">{{ scope.row.goodsName }}</div>
                  </div>
                </div>
              </template>
            </el-table-column>
            <el-table-column prop="goodsPrice" label="单价" width="100">
              <template #default="scope">
                <span class="price">¥{{ scope.row.goodsPrice.toFixed(2) }}</span>
              </template>
            </el-table-column>
            <el-table-column prop="quantity" label="数量" width="100" />
            <el-table-column label="小计" width="120">
              <template #default="scope">
                <span class="price">¥{{ scope.row.totalPrice.toFixed(2) }}</span>
              </template>
            </el-table-column>
          </el-table>
        </div>
        
        <div class="amount-info">
          <div class="amount-item total">
            <span>实付金额:</span>
            <span class="price">¥{{ expandedOrder.totalAmount.toFixed(2) }}</span>
          </div>
        </div>
        
        <div v-if="expandedOrder.status === 1" class="shipment-section">
          <el-button type="primary" @click="handleShipment(expandedOrder)">发货处理</el-button>
        </div>
        
        <!-- 物流信息 -->
        <div v-if="expandedOrder.status >= 2" class="logistics-section">
          <h4>物流信息</h4>
          <div v-if="shippingInfo" class="logistics-info">
            <div class="detail-section">
              <div class="info-item">
                <span class="label">物流公司:</span>
                <span>{{ shippingInfo.shippingCompany }}</span>
              </div>
              <div class="info-item">
                <span class="label">物流单号:</span>
                <span>{{ shippingInfo.trackingNumber }}</span>
              </div>
              <div class="info-item">
                <span class="label">发货地址:</span>
                <span>{{ shippingInfo.senderAddress }}</span>
              </div>
              <div class="info-item">
                <span class="label">预计送达:</span>
                <span>{{ shippingInfo.estimatedTime }}</span>
              </div>
              <div class="info-item" style="margin-top: 15px;">
                <el-button type="primary" size="small" @click="viewShippingRoute(expandedOrder.id)">
                  查看物流路线
                </el-button>
              </div>
            </div>
          </div>
          <div v-else>
            <el-empty description="暂无物流信息" />
          </div>
        </div>
      </div>
    </el-dialog>
    
    <!-- 发货表单弹窗 -->
    <el-dialog
      v-model="shippingFormVisible"
      title="发货处理"
      width="500px"
      destroy-on-close
    >
      <el-form
        ref="shippingFormRef"
        :model="shippingForm"
        :rules="shippingRules"
        label-width="100px"
        label-position="right"
      >
        <el-form-item label="订单号" prop="orderId">
          <el-input v-model="shippingForm.orderNo" disabled />
        </el-form-item>
        <el-form-item label="物流公司" prop="shippingCompany">
          <el-select v-model="shippingForm.shippingCompany" placeholder="请选择物流公司" style="width: 100%">
            <el-option label="顺丰速运" value="顺丰速运" />
            <el-option label="中通快递" value="中通快递" />
            <el-option label="圆通快递" value="圆通快递" />
            <el-option label="韵达快递" value="韵达快递" />
            <el-option label="申通快递" value="申通快递" />
            <el-option label="京东物流" value="京东物流" />
          </el-select>
        </el-form-item>
        <el-form-item label="物流单号" prop="trackingNumber">
          <el-input v-model="shippingForm.trackingNumber" placeholder="请输入物流单号" />
        </el-form-item>
        <el-form-item label="发货地址" prop="senderAddress">
          <el-input v-model="shippingForm.senderAddress" placeholder="请输入发货地址" />
        </el-form-item>
      </el-form>
      <template #footer>
        <div class="dialog-footer">
          <el-button @click="shippingFormVisible = false">取消</el-button>
          <el-button type="primary" @click="submitShipping" :loading="submitLoading">
            确认发货
          </el-button>
        </div>
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
    
    <!-- 分页 -->
    <div class="pagination-container">
      <el-pagination
        v-model:current-page="currentPage"
        v-model:page-size="pageSize"
        :page-sizes="[10, 20, 50, 100]"
        layout="total, sizes, prev, pager, next, jumper"
        :total="total"
        @size-change="handleSizeChange"
        @current-change="handleCurrentChange"
      />
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Download, Search, Close } from '@element-plus/icons-vue'
import { 
  getOrdersList, 
  getOrderDetail, 
  exportOrdersData,
  deleteOrderAdmin,
  createShipping,
  getShippingRoute
} from '../../api/admin'

const router = useRouter()

// 订单列表相关
const ordersList = ref([])
const loading = ref(false)
const total = ref(0)
const currentPage = ref(1)
const pageSize = ref(10)
const searchKeyword = ref('')
const statusFilter = ref('')
const dateRange = ref([])
const expandedOrder = ref(null)
const orderDetailVisible = ref(false)
const shippingFormVisible = ref(false)
const shippingForm = ref({
  orderId: null,
  orderNo: '',
  shippingCompany: '',
  trackingNumber: '',
  senderAddress: ''
})
const shippingFormRef = ref(null)
const submitLoading = ref(false)
const routeDialogVisible = ref(false)
const routeInfo = ref(null)
const routeLoaded = ref(false)
const shippingInfo = ref(null)

// 发货表单验证规则
const shippingRules = {
  shippingCompany: [
    { required: true, message: '请选择物流公司', trigger: 'change' }
  ],
  trackingNumber: [
    { required: true, message: '请输入物流单号', trigger: 'blur' }
  ],
  senderAddress: [
    { required: true, message: '请输入发货地址', trigger: 'blur' }
  ]
}

// 订单状态选项
const statusOptions = [
  { value: 0, label: '待付款' },
  { value: 1, label: '待发货' },
  { value: 2, label: '已发货' },
  { value: 3, label: '已完成' },
  { value: 4, label: '已取消' }
]

// 加载订单列表数据
const loadOrdersList = async () => {
  loading.value = true
  try {
    const params = {
      pageNum: currentPage.value,  // 修正参数名称为pageNum
      pageSize: pageSize.value,
      startDate: dateRange.value ? dateRange.value[0] : undefined,
      endDate: dateRange.value ? dateRange.value[1] : undefined
    }
    
    // 只有当状态筛选有值时才添加status参数
    if (statusFilter.value !== '' && statusFilter.value !== null) {
      params.status = statusFilter.value
    }
    
    // 处理搜索关键词，判断是否为订单号或用户ID
    if (searchKeyword.value) {
      // 如果输入的是纯数字，可能是用户ID
      if (/^\d+$/.test(searchKeyword.value)) {
        params.userId = parseInt(searchKeyword.value)
      } else {
        // 否则当作订单号关键词搜索
        params.orderNo = searchKeyword.value
      }
    }
    
    const res = await getOrdersList(params)
    
    if (res.code === 200 && res.data) {
      ordersList.value = res.data.list || []
      total.value = res.data.total || 0
    } else {
      ElMessage.error(res.message || '获取订单列表失败')
    }
  } catch (error) {
    ElMessage.error('获取订单列表失败')
    console.error(error)
  } finally {
    loading.value = false
  }
}

// 搜索订单
const handleSearch = () => {
  currentPage.value = 1
  loadOrdersList()
}

// 分页大小变化
const handleSizeChange = (val) => {
  pageSize.value = val
  loadOrdersList()
}

// 页码变化
const handleCurrentChange = (val) => {
  currentPage.value = val
  loadOrdersList()
}

// 获取订单状态类型
const getOrderStatusType = (status) => {
  const types = {
    0: 'warning',   // 待付款
    1: 'primary',   // 待发货
    2: 'info',      // 已发货
    3: 'success',   // 已完成
    4: 'danger',    // 已取消
    5: 'warning',   // 申请退款
    6: 'info'       // 已退款
  }
  return types[status] || 'info'
}

// 获取订单状态文本
const getOrderStatusText = (status) => {
  const texts = {
    0: '待付款',
    1: '待发货',
    2: '已发货',
    3: '已完成',
    4: '已取消',
    5: '申请退款',
    6: '已退款'
  }
  return texts[status] || '未知状态'
}

// 获取支付方式文本
const getPaymentTypeText = (type) => {
  if (type === null || type === undefined) return '未支付';
  
  const types = {
    1: '支付宝',
    2: '微信支付',
    3: '银行卡'
  }
  return types[type] || '其他方式'
}

// 格式化日期
const formatDate = (dateStr) => {
  if (!dateStr) return ''
  const date = new Date(dateStr)
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`
}

// 格式化地址
const formatAddress = (address) => {
  if (!address) return ''
  return `${address.province} ${address.city} ${address.district} ${address.address}`
}

// 行点击处理 - 展开订单详情
const handleRowClick = async (row) => {
  await handleDetail(row)
}

// 查看订单详情
const handleDetail = async (row) => {
  try {
    loading.value = true
    const res = await getOrderDetail(row.id)
    if (res.code === 200 && res.data) {
      expandedOrder.value = res.data
      orderDetailVisible.value = true
      
      // 如果订单已发货，尝试获取物流信息
      if (expandedOrder.value.status >= 2) {
        try {
          const routeRes = await getShippingRoute(expandedOrder.value.id)
          if (routeRes.code === 200 && routeRes.data) {
            shippingInfo.value = routeRes.data.shippingInfo
          }
        } catch (error) {
          console.error('获取物流信息失败:', error)
        }
      }
    } else {
      ElMessage.error(res.message || '获取订单详情失败')
    }
  } catch (error) {
    ElMessage.error('获取订单详情失败')
    console.error(error)
  } finally {
    loading.value = false
  }
}

// 处理发货
const handleShipment = (row) => {
  shippingForm.value = {
    orderId: row.id,
    orderNo: row.orderNo,  // 保留orderNo用于显示，但不会发送到后端
    shippingCompany: '',
    trackingNumber: '',
    senderAddress: '广东省深圳市南山区科技园'  // 默认发货地址
  }
  shippingFormVisible.value = true
}

// 提交发货信息
const submitShipping = async () => {
  if (!shippingFormRef.value) return
  
  await shippingFormRef.value.validate(async (valid) => {
    if (!valid) return
    
    try {
      submitLoading.value = true
      
      // 创建一个新对象，只包含API需要的字段
      const shippingData = {
        orderId: shippingForm.value.orderId,
        shippingCompany: shippingForm.value.shippingCompany,
        trackingNumber: shippingForm.value.trackingNumber,
        senderAddress: shippingForm.value.senderAddress
      }
      
      const res = await createShipping(shippingData)
      
      if (res.code === 200) {
        ElMessage.success('发货成功')
        shippingFormVisible.value = false
        
        // 刷新订单列表
        loadOrdersList()
        
        // 如果当前有展开的订单，更新其状态
        if (expandedOrder.value && expandedOrder.value.id === shippingForm.value.orderId) {
          expandedOrder.value.status = 2 // 更新为已发货状态
          
          // 更新物流信息
          shippingInfo.value = res.data
        }
      } else {
        ElMessage.error(res.message || '发货失败')
      }
    } catch (error) {
      ElMessage.error('发货失败')
      console.error(error)
    } finally {
      submitLoading.value = false
    }
  })
}

// 查看物流路线
const viewShippingRoute = async (orderId) => {
  try {
    loading.value = true
    const res = await getShippingRoute(orderId)
    
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
    ElMessage.error('获取物流路线失败')
    console.error(error)
  } finally {
    loading.value = false
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

// 删除订单
const handleDelete = async (row) => {
  try {
    await ElMessageBox.confirm(`确定要删除订单 ${row.orderNo} 吗？删除后不可恢复！`, '警告', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })
    
    loading.value = true
    const res = await deleteOrderAdmin(row.id)
    
    if (res.code === 200) {
      ElMessage.success('订单已删除')
      
      // 刷新订单列表
      loadOrdersList()
      
      // 如果当前有展开的订单且是被删除的订单，关闭弹窗
      if (expandedOrder.value && expandedOrder.value.id === row.id) {
        orderDetailVisible.value = false
        expandedOrder.value = null
      }
    } else {
      ElMessage.error(res.message || '删除订单失败')
    }
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('删除订单失败')
      console.error(error)
    }
  } finally {
    loading.value = false
  }
}

// 导出订单数据
const exportOrders = async () => {
  try {
    const params = {
      pageNum: 1,
      pageSize: 1000, // 导出更多数据
      startDate: dateRange.value ? dateRange.value[0] : undefined,
      endDate: dateRange.value ? dateRange.value[1] : undefined
    }
    
    // 只有当状态筛选有值时才添加status参数
    if (statusFilter.value !== '' && statusFilter.value !== null) {
      params.status = statusFilter.value
    }
    
    // 处理搜索关键词，判断是否为订单号或用户ID
    if (searchKeyword.value) {
      // 如果输入的是纯数字，可能是用户ID
      if (/^\d+$/.test(searchKeyword.value)) {
        params.userId = parseInt(searchKeyword.value)
      } else {
        // 否则当作订单号关键词搜索
        params.orderNo = searchKeyword.value
      }
    }
    
    await exportOrdersData(params)
    ElMessage.success('订单数据导出成功')
  } catch (error) {
    ElMessage.error('订单数据导出失败')
    console.error(error)
  }
}

// 初始化
onMounted(() => {
  loadOrdersList()
})
</script>

<style scoped>
.orders-manage {
  padding: 20px 0;
}

.action-bar {
  display: flex;
  justify-content: space-between;
  margin-bottom: 20px;
}

.left, .right {
  display: flex;
  gap: 10px;
}

.search-input {
  width: 600px;
}

.user-info {
  font-size: 14px;
}

.user-id {
  font-size: 12px;
  color: #999;
}

.price {
  color: #f56c6c;
  font-weight: bold;
}

.pagination-container {
  margin-top: 20px;
  display: flex;
  justify-content: flex-end;
}

/* 订单详情弹窗样式 */
.order-detail-dialog {
  padding: 0 20px;
}

.detail-sections {
  display: flex;
  flex-wrap: wrap;
  gap: 30px;
  margin-bottom: 20px;
}

.detail-section {
  flex: 1;
  min-width: 250px;
}

.detail-section h4 {
  margin-top: 0;
  margin-bottom: 15px;
  font-size: 16px;
  color: #333;
}

.info-item {
  margin-bottom: 8px;
  display: flex;
}

.info-item .label {
  width: 80px;
  color: #666;
}

.goods-info {
  display: flex;
  align-items: center;
}

.goods-image {
  width: 60px;
  height: 60px;
  margin-right: 15px;
  border-radius: 4px;
  object-fit: cover;
}

.goods-detail {
  display: flex;
  flex-direction: column;
}

.goods-name {
  font-size: 14px;
  margin-bottom: 5px;
}

.goods-list {
  margin-bottom: 20px;
}

.goods-list h4 {
  margin-top: 0;
  margin-bottom: 15px;
  font-size: 16px;
  color: #333;
}

.amount-info {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 8px;
  margin-bottom: 20px;
}

.amount-item {
  display: flex;
  gap: 15px;
}

.amount-item.total {
  font-size: 16px;
  font-weight: bold;
  margin-top: 10px;
}

.shipment-section {
  margin-top: 20px;
  display: flex;
  justify-content: flex-end;
}

.logistics-section {
  margin-top: 20px;
  padding: 20px;
  background-color: #fff;
  border-radius: 4px;
  border: 1px solid #ebeef5;
}

.logistics-section h4 {
  margin-top: 0;
  margin-bottom: 15px;
  font-size: 16px;
  color: #333;
  font-weight: 600;
  border-bottom: 1px solid #ebeef5;
  padding-bottom: 10px;
}

.logistics-info {
  display: flex;
  flex-wrap: wrap;
}

.route-header {
  margin-bottom: 20px;
  background-color: #fff;
  border-radius: 4px;
  padding: 15px;
  border: 1px solid #ebeef5;
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

.route-info {
  padding: 0;
}
</style> 