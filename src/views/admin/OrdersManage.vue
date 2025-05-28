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
  shipOrder, 
  exportOrdersData,
  deleteOrderAdmin
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
    console.log('管理员订单列表返回数据:', res)
    
    if (res.code === 200 && res.data) {
      ordersList.value = res.data.list || []
      console.log('订单列表数据结构:', ordersList.value[0])
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
const handleShipment = async (row) => {
  try {
    await ElMessageBox.confirm(`确定要为订单 ${row.orderNo} 发货吗？`, '确认发货', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'info'
    })
    
    loading.value = true
    const res = await shipOrder(row.id)
    
    if (res.code === 200) {
      ElMessage.success('发货成功')
      
      // 刷新订单列表
      loadOrdersList()
      
      // 如果当前有展开的订单，更新其状态
      if (expandedOrder.value && expandedOrder.value.id === row.id) {
        expandedOrder.value.status = 2 // 更新为已发货状态
      }
    } else {
      ElMessage.error(res.message || '发货失败')
    }
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('发货失败')
      console.error(error)
    }
  } finally {
    loading.value = false
  }
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
</style> 