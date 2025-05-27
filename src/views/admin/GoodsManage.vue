<template>
  <div class="goods-manage">
    <!-- 操作栏 -->
    <div class="action-bar">
      <div class="left">
        <el-button type="primary" @click="showAddDialog = true">
          <el-icon><Plus /></el-icon>添加商品
        </el-button>
        <el-button type="danger" :disabled="selectedGoods.length === 0" @click="handleBatchDelete">
          <el-icon><Delete /></el-icon>批量删除
        </el-button>
      </div>
      
      <div class="right">
        <el-input
          v-model="searchKeyword"
          placeholder="请输入商品名称搜索"
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
        
        <el-select v-model="categoryFilter" placeholder="商品分类" clearable @change="handleSearch">
          <el-option
            v-for="item in categoryOptions"
            :key="item.value"
            :label="item.label"
            :value="item.value"
          />
        </el-select>
      </div>
    </div>
    
    <!-- 商品表格 -->
    <el-table
      :data="goodsList"
      style="width: 100%"
      @selection-change="handleSelectionChange"
      v-loading="loading"
    >
      <el-table-column type="selection" width="55" />
      
      <el-table-column label="商品信息" min-width="300">
        <template #default="scope">
          <div class="goods-info">
            <el-image
              :src="scope.row.imageUrl || scope.row.image"
              fit="cover"
              class="goods-image"
            />
            <div class="goods-detail">
              <div class="goods-name">{{ scope.row.name }}</div>
              <div class="goods-id">ID: {{ scope.row.id }}</div>
            </div>
          </div>
        </template>
      </el-table-column>
      
      <el-table-column prop="categoryId" label="分类" width="120">
        <template #default="scope">
          <el-tag>{{ getCategoryName(scope.row.categoryId) }}</el-tag>
        </template>
      </el-table-column>
      
      <el-table-column prop="price" label="价格" width="120">
        <template #default="scope">
          <span class="price">¥{{ scope.row.price.toFixed(2) }}</span>
        </template>
      </el-table-column>
      
      <el-table-column prop="stock" label="库存" width="100">
        <template #default="scope">
          <span :class="{ 'low-stock': scope.row.stock < 10 }">{{ scope.row.stock }}</span>
        </template>
      </el-table-column>
      
      <el-table-column prop="salesVolume" label="销量" width="100" />
      
      <el-table-column prop="status" label="状态" width="100">
        <template #default="scope">
          <el-switch
            v-model="scope.row.status"
            :active-value="1"
            :inactive-value="0"
            @change="handleStatusChange(scope.row)"
          />
        </template>
      </el-table-column>
      
      <el-table-column label="操作" width="200">
        <template #default="scope">
          <el-button type="primary" link size="small" @click="handleEdit(scope.row)">
            编辑
          </el-button>
          <el-button type="danger" link size="small" @click="handleDelete(scope.row)">
            删除
          </el-button>
          <el-button type="success" link size="small" @click="handleView(scope.row)">
            查看
          </el-button>
        </template>
      </el-table-column>
    </el-table>
    
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
    
    <!-- 添加/编辑商品对话框 -->
    <el-dialog
      v-model="showAddDialog"
      :title="isEdit ? '编辑商品' : '添加商品'"
      width="60%"
      destroy-on-close
    >
      <el-form :model="goodsForm" :rules="rules" ref="goodsFormRef" label-width="100px">
        <el-form-item label="商品名称" prop="name">
          <el-input v-model="goodsForm.name" placeholder="请输入商品名称" />
        </el-form-item>
        
        <el-form-item label="商品分类" prop="categoryId">
          <el-select v-model="goodsForm.categoryId" placeholder="请选择商品分类">
            <el-option
              v-for="item in categoryOptions"
              :key="item.value"
              :label="item.label"
              :value="item.value"
            />
          </el-select>
        </el-form-item>
        
        <el-form-item label="商品价格" prop="price">
          <el-input-number
            v-model="goodsForm.price"
            :min="0"
            :precision="2"
            :step="0.1"
            controls-position="right"
          />
        </el-form-item>
        
        <el-form-item label="商品库存" prop="stock">
          <el-input-number
            v-model="goodsForm.stock"
            :min="0"
            :precision="0"
            :step="1"
            controls-position="right"
          />
        </el-form-item>
        
        <el-form-item label="商品封面" prop="cover">
          <el-upload
            class="avatar-uploader"
            action="http://localhost:8080/api/admin/goods/upload/image"
            :headers="getUploadHeaders()"
            :show-file-list="false"
            :on-success="handleCoverSuccess"
            :before-upload="beforeCoverUpload"
            :on-error="handleUploadError"
          >
            <img v-if="goodsForm.cover" :src="goodsForm.cover" class="avatar" />
            <el-icon v-else class="avatar-uploader-icon"><Plus /></el-icon>
          </el-upload>
          <div class="upload-tip">建议尺寸: 800x800像素，大小不超过2MB</div>
        </el-form-item>
        
        <el-form-item label="商品轮播图" prop="banners">
          <el-upload
            class="banner-uploader"
            action="http://localhost:8080/api/admin/goods/upload/image"
            :headers="getUploadHeaders()"
            list-type="picture-card"
            :on-success="handleBannerSuccess"
            :on-remove="handleBannerRemove"
            :on-error="handleUploadError"
            :file-list="bannerFileList"
          >
            <el-icon><Plus /></el-icon>
          </el-upload>
        </el-form-item>
        
        <el-form-item label="商品规格" prop="specs">
          <div v-for="(spec, index) in goodsForm.specs" :key="index" class="spec-item">
            <el-input
              v-model="spec.name"
              placeholder="规格名称"
              class="spec-name"
            />
            <el-input
              v-model="spec.value"
              placeholder="规格值"
              class="spec-value"
            />
            <el-button type="danger" circle @click="removeSpec(index)">
              <el-icon><Delete /></el-icon>
            </el-button>
          </div>
          <el-button type="primary" plain @click="addSpec">
            <el-icon><Plus /></el-icon> 添加规格
          </el-button>
        </el-form-item>
        
        <el-form-item label="商品详情" prop="detail">
          <el-input
            v-model="goodsForm.detail"
            type="textarea"
            :rows="4"
            placeholder="请输入商品详情描述"
          />
        </el-form-item>
        
        <el-form-item label="商品状态" prop="status">
          <el-switch
            v-model="goodsForm.status"
            :active-value="1"
            :inactive-value="0"
            active-text="上架"
            inactive-text="下架"
          />
        </el-form-item>
      </el-form>
      
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="showAddDialog = false">取消</el-button>
          <el-button type="primary" @click="submitForm">确定</el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus, Delete, Search } from '@element-plus/icons-vue'
import { 
  getGoodsList, 
  addGoods, 
  updateGoods, 
  deleteGoods, 
  updateGoodsStatus, 
  getCategoryList 
} from '../../api/admin'

const router = useRouter()

// 商品列表相关
const goodsList = ref([])
const loading = ref(false)
const total = ref(0)
const currentPage = ref(1)
const pageSize = ref(10)
const searchKeyword = ref('')
const categoryFilter = ref('')
const selectedGoods = ref([])

// 分类选项
const categoryOptions = ref([])

// 加载商品分类
const loadCategories = async () => {
  try {
    const res = await getCategoryList()
    if (res.success && res.code === 200) {
      categoryOptions.value = res.data.map(item => ({
        value: item.id,
        label: item.name
      }))
    } else {
      console.error('获取分类失败:', res.message)
    }
  } catch (error) {
    console.error('获取商品分类失败:', error)
  }
}

// 加载商品列表数据
const loadGoodsList = async () => {
  loading.value = true
  try {
    const params = {
      pageNum: currentPage.value,
      pageSize: pageSize.value
    }
    
    if (searchKeyword.value) {
      params.keyword = searchKeyword.value
    }
    
    if (categoryFilter.value) {
      params.categoryId = categoryFilter.value
    }
    
    const res = await getGoodsList(params)
    if (res.success && res.code === 200) {
      goodsList.value = res.data.list || []
      total.value = res.data.total || 0
    } else {
      ElMessage.error(res.message || '获取商品列表失败')
      goodsList.value = []
      total.value = 0
    }
  } catch (error) {
    ElMessage.error('获取商品列表失败')
    console.error('获取商品列表错误:', error)
    goodsList.value = []
    total.value = 0
  } finally {
    loading.value = false
  }
}

// 表格多选变化
const handleSelectionChange = (val) => {
  selectedGoods.value = val
}

// 搜索商品
const handleSearch = () => {
  currentPage.value = 1
  loadGoodsList()
}

// 分页大小变化
const handleSizeChange = (val) => {
  pageSize.value = val
  loadGoodsList()
}

// 页码变化
const handleCurrentChange = (val) => {
  currentPage.value = val
  loadGoodsList()
}

// 获取分类名称
const getCategoryName = (categoryId) => {
  const category = categoryOptions.value.find(item => item.value === categoryId)
  return category ? category.label : '未分类'
}

// 商品状态变化
const handleStatusChange = async (row) => {
  try {
    const res = await updateGoodsStatus(row.id, row.status)
    if (res.success && res.code === 200) {
      ElMessage.success(`商品${row.status === 1 ? '上架' : '下架'}成功`)
    } else {
      ElMessage.error(res.message || '操作失败')
      // 恢复原状态
      row.status = row.status === 1 ? 0 : 1
    }
  } catch (error) {
    ElMessage.error('操作失败')
    // 恢复原状态
    row.status = row.status === 1 ? 0 : 1
  }
}

// 批量删除商品
const handleBatchDelete = async () => {
  if (selectedGoods.value.length === 0) {
    ElMessage.warning('请选择要删除的商品')
    return
  }
  
  try {
    await ElMessageBox.confirm(`确定要删除选中的 ${selectedGoods.value.length} 个商品吗？此操作不可恢复！`, '警告', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })
    
    const ids = selectedGoods.value.map(item => item.id)
    // 这里应该调用批量删除接口，但示例中我们使用单个删除接口循环删除
    for (const id of ids) {
      const res = await deleteGoods(id)
      if (!res.success || res.code !== 200) {
        throw new Error(res.message || `删除商品ID:${id}失败`)
      }
    }
    
    ElMessage.success('批量删除成功')
    loadGoodsList()
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('批量删除失败: ' + error.message)
    }
  }
}

// 编辑商品相关
const showAddDialog = ref(false)
const isEdit = ref(false)
const goodsFormRef = ref(null)
const bannerFileList = ref([])

// 商品表单数据
const goodsForm = reactive({
  id: '',
  name: '',
  categoryId: '',
  price: 0,
  stock: 0,
  status: 1,
  cover: '',
  banners: [],
  specs: [],
  detail: ''
})

// 表单验证规则
const rules = {
  name: [
    { required: true, message: '请输入商品名称', trigger: 'blur' },
    { min: 2, max: 50, message: '商品名称长度应在2-50个字符之间', trigger: 'blur' }
  ],
  categoryId: [
    { required: true, message: '请选择商品分类', trigger: 'change' }
  ],
  price: [
    { required: true, message: '请输入商品价格', trigger: 'blur' }
  ],
  stock: [
    { required: true, message: '请输入商品库存', trigger: 'blur' }
  ],
  cover: [
    { required: true, message: '请上传商品封面图', trigger: 'change' }
  ],
  detail: [
    { required: true, message: '请输入商品详情', trigger: 'blur' }
  ]
}

// 添加规格
const addSpec = () => {
  goodsForm.specs.push({ name: '', value: '' })
}

// 移除规格
const removeSpec = (index) => {
  goodsForm.specs.splice(index, 1)
}

// 上传封面成功回调
const handleCoverSuccess = (res) => {
  if (res.success && res.code === 200) {
    goodsForm.cover = res.data
    ElMessage.success('封面上传成功')
  } else {
    ElMessage.error(res.message || '封面上传失败')
  }
}

// 上传封面前验证
const beforeCoverUpload = (file) => {
  const isImage = file.type.startsWith('image/')
  const isLt2M = file.size / 1024 / 1024 < 2
  
  if (!isImage) {
    ElMessage.error('上传封面只能是图片格式!')
  }
  
  if (!isLt2M) {
    ElMessage.error('上传封面大小不能超过 2MB!')
  }
  
  return isImage && isLt2M
}

// 上传轮播图成功回调
const handleBannerSuccess = (res) => {
  if (res.success && res.code === 200) {
    goodsForm.banners.push(res.data)
    ElMessage.success('轮播图上传成功')
  } else {
    ElMessage.error(res.message || '轮播图上传失败')
  }
}

// 移除轮播图
const handleBannerRemove = (file) => {
  const index = goodsForm.banners.indexOf(file.url)
  if (index > -1) {
    goodsForm.banners.splice(index, 1)
  }
}

// 打开编辑对话框
const handleEdit = (row) => {
  isEdit.value = true
  showAddDialog.value = true
  
  nextTick(() => {
    // 复制商品数据到表单
    Object.assign(goodsForm, {
      id: row.id,
      name: row.name,
      categoryId: row.categoryId,
      price: row.price,
      stock: row.stock,
      status: row.status,
      cover: row.imageUrl || row.image,
      banners: row.banners || [],
      specs: row.specs || [],
      detail: row.description || ''
    })
    
    // 设置轮播图文件列表
    bannerFileList.value = (row.banners || []).map((url, index) => ({
      name: `banner-${index + 1}`,
      url
    }))
  })
}

// 删除商品
const handleDelete = async (row) => {
  try {
    await ElMessageBox.confirm(`确定要删除商品"${row.name}"吗？此操作不可恢复！`, '警告', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })
    
    const res = await deleteGoods(row.id)
    if (res.success && res.code === 200) {
      ElMessage.success('删除成功')
      loadGoodsList()
    } else {
      ElMessage.error(res.message || '删除失败')
    }
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('删除失败: ' + (error.message || '未知错误'))
    }
  }
}

// 查看商品详情
const handleView = (row) => {
  router.push(`/goods/${row.id}`)
}

// 重置表单
const resetForm = () => {
  if (goodsFormRef.value) {
    goodsFormRef.value.resetFields()
  }
  
  Object.assign(goodsForm, {
    id: '',
    name: '',
    categoryId: '',
    price: 0,
    stock: 0,
    status: 1,
    cover: '',
    banners: [],
    specs: [],
    detail: ''
  })
  
  bannerFileList.value = []
}

// 提交表单
const submitForm = async () => {
  if (!goodsFormRef.value) return
  
  await goodsFormRef.value.validate(async (valid) => {
    if (valid) {
      try {
        // 移除空规格
        goodsForm.specs = goodsForm.specs.filter(spec => spec.name.trim() && spec.value.trim())
        
        // 创建提交数据，将cover映射为imageUrl
        const submitData = { ...goodsForm }
        submitData.imageUrl = submitData.cover
        
        let res
        if (isEdit.value) {
          // 更新商品
          res = await updateGoods(submitData)
        } else {
          // 添加商品
          res = await addGoods(submitData)
        }
        
        if (res.success && res.code === 200) {
          ElMessage.success(isEdit.value ? '商品更新成功' : '商品添加成功')
          showAddDialog.value = false
          loadGoodsList()
          resetForm()
        } else {
          ElMessage.error(res.message || (isEdit.value ? '更新失败' : '添加失败'))
        }
      } catch (error) {
        ElMessage.error(isEdit.value ? '更新失败: ' + error.message : '添加失败: ' + error.message)
      }
    } else {
      ElMessage.warning('请完成必填项')
    }
  })
}

// 获取上传请求头
const getUploadHeaders = () => {
  const token = localStorage.getItem('token')
  return {
    Authorization: token ? `Bearer ${token}` : '',
    token: token || ''
  }
}

// 处理上传错误
const handleUploadError = (err) => {
  ElMessage.error(`图片上传失败: ${err.message || '未知错误'}`)
}

// 初始化
onMounted(async () => {
  await loadCategories()
  loadGoodsList()
})
</script>

<style scoped>
.goods-manage {
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

.goods-id {
  font-size: 12px;
  color: #999;
}

.low-stock {
  color: #f56c6c;
  font-weight: bold;
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

.avatar-uploader {
  width: 150px;
  height: 150px;
  border: 1px dashed #d9d9d9;
  border-radius: 6px;
  cursor: pointer;
  position: relative;
  overflow: hidden;
}

.avatar-uploader:hover {
  border-color: #409eff;
}

.avatar-uploader-icon {
  font-size: 28px;
  color: #8c939d;
  width: 150px;
  height: 150px;
  line-height: 150px;
  text-align: center;
}

.avatar {
  width: 150px;
  height: 150px;
  display: block;
  object-fit: cover;
}

.upload-tip {
  font-size: 12px;
  color: #999;
  margin-top: 5px;
}

.spec-item {
  display: flex;
  align-items: center;
  margin-bottom: 10px;
  gap: 10px;
}

.spec-name, .spec-value {
  flex: 1;
}
</style> 