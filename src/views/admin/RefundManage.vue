<template>
  <div class="refund-manage-container">
    <div class="page-header">
      <h2>退款管理</h2>
    </div>
    
    <div class="filter-bar">
      <el-form :inline="true" class="filter-form">
        <el-form-item label="订单号">
          <el-input v-model="filterOrderNo" placeholder="请输入订单号" clearable @clear="handleSearch" />
        </el-form-item>
        
        <el-form-item label="状态">
          <el-select v-model="filterStatus" placeholder="退款状态" clearable>
            <el-option label="全部" value="" />
            <el-option label="处理中" :value="0" />
            <el-option label="已通过" :value="1" />
            <el-option label="已拒绝" :value="2" />
          </el-select>
        </el-form-item>
        
        <el-form-item>
          <el-button type="primary" @click="handleSearch">查询</el-button>
          <el-button @click="resetFilter">重置</el-button>
        </el-form-item>
      </el-form>
    </div>
    
    <div class="refund-table-wrapper" v-loading="loading">
      <el-table :data="refundList" border stripe style="width: 100%">
        <el-table-column prop="id" label="退款ID" width="80" />
        <el-table-column prop="orderNo" label="订单号" width="180" />
        <el-table-column prop="username" label="用户" width="120" />
        
        <el-table-column label="退款金额" width="120">
          <template #default="scope">
            <span class="price">¥{{ scope.row.refundAmount.toFixed(2) }}</span>
          </template>
        </el-table-column>
        
        <el-table-column prop="reason" label="退款原因" />
        
        <el-table-column label="状态" width="100">
          <template #default="scope">
            <el-tag :type="getStatusType(scope.row.status)">
              {{ scope.row.statusText || getStatusText(scope.row.status) }}
            </el-tag>
          </template>
        </el-table-column>
        
        <el-table-column prop="createTime" label="申请时间" width="180">
          <template #default="scope">
            {{ formatTime(scope.row.createTime) }}
          </template>
        </el-table-column>
        
        <el-table-column label="操作" width="220" fixed="right">
          <template #default="scope">
            <el-button 
              size="small" 
              type="primary" 
              plain
              @click="viewRefundDetail(scope.row)"
            >
              查看详情
            </el-button>
            
            <el-button 
              v-if="scope.row.status === 0" 
              size="small" 
              type="success" 
              plain
              @click="showProcessDialog(scope.row, 1)"
            >
              通过
            </el-button>
            
            <el-button 
              v-if="scope.row.status === 0" 
              size="small" 
              type="danger" 
              plain
              @click="showProcessDialog(scope.row, 2)"
            >
              拒绝
            </el-button>
          </template>
        </el-table-column>
      </el-table>
      
      <div class="pagination-container" v-if="total > 0">
        <el-pagination
          background
          layout="total, sizes, prev, pager, next, jumper"
          :total="total"
          :page-sizes="[10, 20, 50, 100]"
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
      width="700px"
    >
      <div v-if="currentRefund" class="refund-detail-dialog">
        <div class="detail-section">
          <h3>基本信息</h3>
          <div class="detail-grid">
            <div class="detail-item">
              <span class="label">退款编号:</span>
              <span class="value">{{ currentRefund.id }}</span>
            </div>
            <div class="detail-item">
              <span class="label">订单编号:</span>
              <span class="value">{{ currentRefund.orderNo }}</span>
            </div>
            <div class="detail-item">
              <span class="label">退款金额:</span>
              <span class="value price">¥{{ currentRefund.refundAmount.toFixed(2) }}</span>
            </div>
            <div class="detail-item">
              <span class="label">用户名:</span>
              <span class="value">{{ currentRefund.username }}</span>
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
        
        <div class="detail-actions" v-if="currentRefund.status === 0">
          <el-button type="success" @click="showProcessDialog(currentRefund, 1)">通过退款</el-button>
          <el-button type="danger" @click="showProcessDialog(currentRefund, 2)">拒绝退款</el-button>
        </div>
      </div>
    </el-dialog>
    
    <!-- 处理退款对话框 -->
    <el-dialog
      v-model="processDialogVisible"
      :title="processType === 1 ? '通过退款申请' : '拒绝退款申请'"
      width="500px"
    >
      <div class="process-dialog-content">
        <p v-if="processType === 1" class="process-tip">确认通过此退款申请吗？通过后将自动退款给用户。</p>
        <p v-else class="process-tip">确认拒绝此退款申请吗？拒绝后用户将收到通知。</p>
        
        <el-form :model="processForm" label-width="100px">
          <el-form-item label="处理备注" required>
            <el-input
              v-model="processForm.remark"
              type="textarea"
              :rows="4"
              :placeholder="processType === 1 ? '请输入通过退款的备注信息' : '请输入拒绝退款的原因'"
            />
          </el-form-item>
        </el-form>
      </div>
      
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="processDialogVisible = false">取消</el-button>
          <el-button 
            :type="processType === 1 ? 'success' : 'danger'" 
            @click="confirmProcess" 
            :loading="processLoading"
          >
            {{ processType === 1 ? '确认通过' : '确认拒绝' }}
          </el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { getRefundList, processRefund } from '../../api/refund'

// 数据相关
const loading = ref(false)
const refundList = ref([])
const total = ref(0)
const currentPage = ref(1)
const pageSize = ref(10)

// 筛选条件
const filterStatus = ref('')
const filterOrderNo = ref('')

// 详情对话框相关
const detailDialogVisible = ref(false)
const currentRefund = ref(null)

// 处理退款对话框相关
const processDialogVisible = ref(false)
const processType = ref(1) // 1-通过 2-拒绝
const processLoading = ref(false)
const processForm = ref({
  status: 1,
  remark: ''
})
const refundToProcess = ref(null)

onMounted(() => {
  fetchRefundList()
})

// 获取退款列表
const fetchRefundList = async () => {
  loading.value = true
  const params = {
    pageNum: currentPage.value,
    pageSize: pageSize.value,
    status: filterStatus.value !== '' ? filterStatus.value : undefined,
    orderNo: filterOrderNo.value.trim() || undefined
  }
  console.log('请求参数:', params)
  
  try {
    const res = await getRefundList(params)
    console.log('退款列表响应:', res)
    loading.value = false
    
    // 处理不同格式的响应数据
    if (res.success && res.data) {
      // 标准格式: {success: true, data: {list: [], total: 0}}
      if (res.data.list && res.data.total !== undefined) {
        refundList.value = res.data.list
        total.value = res.data.total
        console.log('解析后的退款列表:', refundList.value)
        return
      }
      
      // 另一种格式: {success: true, data: []}
      if (Array.isArray(res.data)) {
        refundList.value = res.data
        total.value = res.data.length
        console.log('解析后的退款列表(数组格式):', refundList.value)
        return
      }
    }
    
    // 直接返回数组的格式
    if (Array.isArray(res)) {
      refundList.value = res
      total.value = res.length
      console.log('解析后的退款列表(直接数组):', refundList.value)
      return
    }
    
    // 无法识别的格式，使用模拟数据
    console.error('无法识别的响应格式:', res)
    useMockData()
  } catch (error) {
    console.error('获取退款列表失败:', error)
    loading.value = false
    // 使用模拟数据
    useMockData()
  }
}

// 使用模拟数据（当API出错或没有返回数据时）
const useMockData = () => {
  console.warn('使用模拟数据...')
  refundList.value = [
    {
      id: 1,
      orderNo: 'O202310190001',
      username: '张三',
      refundAmount: 199.99,
      reason: '商品质量问题',
      status: 0,
      statusText: '处理中',
      createTime: new Date().toISOString(),
      description: '商品收到时已经损坏，不能正常使用。'
    },
    {
      id: 2,
      orderNo: 'O202310190002',
      username: '李四',
      refundAmount: 99.99,
      reason: '订单错误',
      status: 1,
      statusText: '已通过',
      createTime: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
      updateTime: new Date().toISOString(),
      adminRemark: '确认订单错误，已处理退款。'
    },
    {
      id: 3,
      orderNo: 'O202310190003',
      username: '王五',
      refundAmount: 299.99,
      reason: '物流太慢',
      status: 2,
      statusText: '已拒绝',
      createTime: new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString(),
      updateTime: new Date().toISOString(),
      adminRemark: '经查询，物流在正常配送范围内，不符合退款条件。'
    }
  ]
  total.value = refundList.value.length
  ElMessage.warning('使用测试数据显示，实际数据可能未正确获取')
}

// 查看退款详情
const viewRefundDetail = (refund) => {
  currentRefund.value = refund
  detailDialogVisible.value = true
}

// 显示处理对话框
const showProcessDialog = (refund, type) => {
  if (refund.status !== 0) {
    ElMessage.warning('只能处理状态为"处理中"的退款申请')
    return
  }
  
  refundToProcess.value = refund
  processType.value = type
  processForm.value = {
    status: type,
    remark: ''
  }
  processDialogVisible.value = true
}

// 确认处理退款
const confirmProcess = async () => {
  if (!processForm.value.remark) {
    ElMessage.warning('请输入处理备注')
    return
  }
  
  processLoading.value = true
  try {
    const res = await processRefund(refundToProcess.value.id, processForm.value)
    
    if (res.success) {
      ElMessage.success('处理成功')
      processDialogVisible.value = false
      detailDialogVisible.value = false
      
      // 刷新列表
      await fetchRefundList()
    } else {
      ElMessage.error(res.message || '处理失败')
    }
  } catch (error) {
    ElMessage.error('处理失败：' + (error.message || '未知错误'))
  } finally {
    processLoading.value = false
  }
}

// 搜索
const handleSearch = () => {
  currentPage.value = 1
  fetchRefundList()
}

// 重置筛选条件
const resetFilter = () => {
  filterStatus.value = ''
  filterOrderNo.value = ''
  currentPage.value = 1
  fetchRefundList()
}

// 页码大小变化
const handleSizeChange = (size) => {
  pageSize.value = size
  currentPage.value = 1
  fetchRefundList()
}

// 页码变化
const handleCurrentChange = (page) => {
  currentPage.value = page
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
</script>

<style scoped>
.refund-manage-container {
  padding: 20px;
}

.page-header {
  margin-bottom: 20px;
}

.page-header h2 {
  font-size: 22px;
  font-weight: 600;
  color: #333;
  margin: 0;
}

.filter-bar {
  margin-bottom: 20px;
  background-color: #f5f7fa;
  padding: 15px;
  border-radius: 4px;
}

.refund-table-wrapper {
  margin-bottom: 20px;
}

.price {
  color: #F56C6C;
  font-weight: bold;
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
  margin-bottom: 15px;
  color: #303133;
  border-bottom: 1px solid #EBEEF5;
  padding-bottom: 8px;
}

.detail-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 15px;
}

.detail-item {
  display: flex;
  align-items: flex-start;
  margin-bottom: 10px;
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

.detail-actions {
  margin-top: 20px;
  display: flex;
  justify-content: center;
  gap: 20px;
}

.process-tip {
  margin-bottom: 20px;
  padding: 10px;
  background-color: #f8f8f8;
  border-left: 3px solid #E6A23C;
  color: #606266;
}
</style> 