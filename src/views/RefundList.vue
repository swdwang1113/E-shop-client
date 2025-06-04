<template>
  <div class="refund-list-container">
    <div class="page-header">
      <h2>我的退款</h2>
    </div>
    
    <div class="filter-bar">
      <el-form :inline="true" class="filter-form">
        <el-form-item label="退款状态">
          <el-select v-model="filterStatus" placeholder="退款状态" clearable @change="handleFilterChange" style="width: 150px;">
            <el-option label="全部" value="" />
            <el-option label="处理中" :value="0" />
            <el-option label="已通过" :value="1" />
            <el-option label="已拒绝" :value="2" />
          </el-select>
        </el-form-item>
        
        <el-form-item>
          <el-button type="primary" @click="handleFilterChange">查询</el-button>
          <el-button @click="resetFilter">重置</el-button>
        </el-form-item>
      </el-form>
    </div>
    
    <div class="refund-list" v-loading="loading">
      <el-empty v-if="refundList.length === 0" description="暂无退款记录" />
      
      <div class="refund-items" v-else>
        <el-card v-for="refund in refundList" :key="refund.id" class="refund-item">
          <div class="refund-header">
            <div class="refund-info">
              <span class="refund-id">退款编号: {{ refund.id }}</span>
              <span class="order-no">订单ID: {{ refund.orderId }}</span>
            </div>
            <div class="refund-status">
              <el-tag :type="getStatusType(refund.status)">{{ refund.statusText || getStatusText(refund.status) }}</el-tag>
            </div>
          </div>
          
          <div class="refund-content">
            <div class="refund-details">
              <div class="detail-item">
                <span class="label">退款金额:</span>
                <span class="value price">¥{{ refund.refundAmount.toFixed(2) }}</span>
              </div>
              <div class="detail-item">
                <span class="label">退款原因:</span>
                <span class="value">{{ refund.reason }}</span>
              </div>
              <div class="detail-item" v-if="refund.description">
                <span class="label">详细说明:</span>
                <span class="value">{{ refund.description }}</span>
              </div>
              <div class="detail-item" v-if="refund.adminRemark && refund.status !== 0">
                <span class="label">处理备注:</span>
                <span class="value">{{ refund.adminRemark }}</span>
              </div>
              <div class="detail-item">
                <span class="label">申请时间:</span>
                <span class="value">{{ formatTime(refund.createTime) }}</span>
              </div>
              <div class="detail-item" v-if="refund.updateTime && refund.status !== 0">
                <span class="label">处理时间:</span>
                <span class="value">{{ formatTime(refund.updateTime) }}</span>
              </div>
            </div>
          </div>
          
          <div class="refund-actions">
            <el-button 
              type="primary" 
              size="small" 
              @click="viewRefundDetail(refund.id)"
            >
              查看详情
            </el-button>
            <el-button 
              type="primary" 
              size="small" 
              @click="viewOrder(refund.orderId)"
            >
              查看订单
            </el-button>
          </div>
        </el-card>
      </div>
      
      <div class="pagination-container" v-if="total > 0">
        <el-pagination
          background
          layout="total, sizes, prev, pager, next, jumper"
          :total="total"
          :page-sizes="[5, 10, 20, 50]"
          :page-size="pageSize"
          :current-page="currentPage"
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange"
        />
      </div>
    </div>
    
    <!-- 退款详情对话框 -->
    <el-dialog
      v-model="detailDialogVisible"
      title="退款详情"
      width="600px"
      destroy-on-close
    >
      <div v-if="currentRefund" class="refund-detail-dialog">
        <div class="detail-section">
          <h3>基本信息</h3>
          <div class="detail-item">
            <span class="label">退款编号:</span>
            <span class="value">{{ currentRefund.id }}</span>
          </div>
          <div class="detail-item">
            <span class="label">订单ID:</span>
            <span class="value">{{ currentRefund.orderId }}</span>
          </div>
          <div class="detail-item">
            <span class="label">退款金额:</span>
            <span class="value price">¥{{ currentRefund.refundAmount.toFixed(2) }}</span>
          </div>
          <div class="detail-item">
            <span class="label">申请时间:</span>
            <span class="value">{{ formatTime(currentRefund.createTime) }}</span>
          </div>
          <div class="detail-item">
            <span class="label">当前状态:</span>
            <span class="value">
              <el-tag :type="getStatusType(currentRefund.status)">
                {{ currentRefund.statusText || getStatusText(currentRefund.status) }}
              </el-tag>
            </span>
          </div>
        </div>
        
        <div class="detail-section">
          <h3>退款原因</h3>
          <div class="detail-item">
            <span class="label">退款类型:</span>
            <span class="value">{{ currentRefund.reason }}</span>
          </div>
          <div class="detail-item" v-if="currentRefund.description">
            <span class="label">详细说明:</span>
            <span class="value">{{ currentRefund.description }}</span>
          </div>
        </div>
        
        <!-- 添加退款凭证图片显示部分 -->
        <div class="detail-section" v-if="currentRefund.images">
          <h3>退款凭证</h3>
          <div class="refund-images">
            <el-image 
              v-for="(image, index) in getImageList(currentRefund.images)" 
              :key="index"
              :src="image" 
              :preview-src-list="getImageList(currentRefund.images)"
              fit="cover"
              class="refund-image"
            />
          </div>
        </div>
        
        <div class="detail-section" v-if="currentRefund.status !== 0">
          <h3>处理结果</h3>
          <div class="detail-item" v-if="currentRefund.updateTime">
            <span class="label">处理时间:</span>
            <span class="value">{{ formatTime(currentRefund.updateTime) }}</span>
          </div>
          <div class="detail-item" v-if="currentRefund.adminRemark">
            <span class="label">处理备注:</span>
            <span class="value">{{ currentRefund.adminRemark }}</span>
          </div>
        </div>
      </div>
      <div v-else class="loading-container">
        <el-skeleton :rows="6" animated />
      </div>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { getUserRefunds, getRefundDetail } from '../api/refund'

const router = useRouter()

// 数据相关
const loading = ref(false)
const refundList = ref([])
const total = ref(0)
const currentPage = ref(1)
const pageSize = ref(10)
const filterStatus = ref('')

// 详情对话框相关
const detailDialogVisible = ref(false)
const currentRefund = ref(null)

onMounted(() => {
  fetchRefundList()
})

// 获取退款列表
const fetchRefundList = async () => {
  loading.value = true
  try {
    const params = {
      pageNum: currentPage.value,
      pageSize: pageSize.value
    }
    
    // 只有当状态不为空时才添加status参数
    if (filterStatus.value !== '') {
      params.status = filterStatus.value
    }
    
    console.log('获取用户退款列表参数:', params)
    const res = await getUserRefunds(params)
    console.log('用户退款列表响应:', res)
    
    if (res.success) {
      // 处理不同格式的响应数据
      if (res.data && res.data.list && res.data.total !== undefined) {
        // 标准格式: {success: true, data: {list: [], total: 0}}
        refundList.value = res.data.list
        total.value = res.data.total
      } else if (Array.isArray(res.data)) {
        // 另一种格式: {success: true, data: []}
        refundList.value = res.data
        total.value = res.data.length
      } else {
        // 未知格式
        refundList.value = []
        total.value = 0
        ElMessage.warning('返回数据格式不正确')
      }
    } else {
      ElMessage.error(res.message || '获取退款列表失败')
      refundList.value = []
      total.value = 0
    }
  } catch (error) {
    console.error('获取退款列表失败:', error)
    ElMessage.error('获取退款列表失败：' + (error.message || '未知错误'))
    refundList.value = []
    total.value = 0
  } finally {
    loading.value = false
  }
}

// 查看退款详情
const viewRefundDetail = async (refundId) => {
  try {
    const res = await getRefundDetail(refundId)
    
    if (res.success) {
      currentRefund.value = res.data
      detailDialogVisible.value = true
    } else {
      ElMessage.error(res.message || '获取退款详情失败')
    }
  } catch (error) {
    ElMessage.error('获取退款详情失败：' + (error.message || '未知错误'))
  }
}

// 查看关联订单
const viewOrder = (orderId) => {
  router.push(`/orders/${orderId}`)
}

// 状态筛选变化
const handleFilterChange = () => {
  currentPage.value = 1
  fetchRefundList()
}

// 页码变化
const handleCurrentChange = (page) => {
  currentPage.value = page
  fetchRefundList()
}

// 页码大小变化
const handleSizeChange = (size) => {
  pageSize.value = size
  currentPage.value = 1
  fetchRefundList()
}

// 重置筛选条件
const resetFilter = () => {
  filterStatus.value = ''
  currentPage.value = 1
  fetchRefundList()
}

// 获取状态类型（用于设置Tag颜色）
const getStatusType = (status) => {
  const types = {
    0: 'warning',   // 处理中
    1: 'success',   // 已通过
    2: 'danger'     // 已拒绝
  }
  return types[status] || 'info'
}

// 获取状态文本
const getStatusText = (status) => {
  const texts = {
    0: '处理中',
    1: '已通过',
    2: '已拒绝'
  }
  return texts[status] || '未知状态'
}

// 格式化时间
const formatTime = (timeStr) => {
  if (!timeStr) return '-'
  
  const date = new Date(timeStr)
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  const hours = String(date.getHours()).padStart(2, '0')
  const minutes = String(date.getMinutes()).padStart(2, '0')
  const seconds = String(date.getSeconds()).padStart(2, '0')
  
  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`
}

// 将逗号分隔的图片URL转换为数组
const getImageList = (imagesStr) => {
  if (!imagesStr) return []
  return imagesStr.split(',').filter(url => url.trim() !== '')
}
</script>

<style scoped>
.refund-list-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
}

.page-header {
  margin-bottom: 20px;
}

.page-header h2 {
  font-size: 24px;
  color: #333;
  margin: 0;
}

.filter-bar {
  margin-bottom: 20px;
  background-color: #f5f7fa;
  padding: 15px;
  border-radius: 4px;
}

.filter-form {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
}

.refund-items {
  margin-bottom: 20px;
}

.refund-item {
  margin-bottom: 15px;
}

.refund-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
  padding-bottom: 10px;
  border-bottom: 1px solid #ebeef5;
}

.refund-info {
  display: flex;
  gap: 20px;
}

.refund-id, .order-no {
  color: #606266;
  font-size: 14px;
}

.refund-content {
  margin-bottom: 15px;
}

.refund-details {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 15px;
}

.detail-item {
  display: flex;
  align-items: flex-start;
}

.detail-item .label {
  color: #909399;
  min-width: 80px;
  flex-shrink: 0;
}

.detail-item .value {
  color: #606266;
  word-break: break-all;
}

.detail-item .price {
  color: #F56C6C;
  font-weight: bold;
}

.refund-actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}

.pagination-container {
  margin-top: 20px;
  display: flex;
  justify-content: flex-end;
}

.refund-detail-dialog .detail-section {
  margin-bottom: 20px;
}

.refund-detail-dialog h3 {
  font-size: 16px;
  margin-bottom: 10px;
  color: #303133;
  border-bottom: 1px solid #EBEEF5;
  padding-bottom: 8px;
}

.loading-container {
  padding: 20px;
}

.refund-images {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-top: 10px;
}

.refund-image {
  width: 120px;
  height: 120px;
  border-radius: 4px;
  border: 1px solid #EBEEF5;
  cursor: pointer;
}
</style> 