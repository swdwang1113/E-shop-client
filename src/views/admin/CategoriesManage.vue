<template>
  <div class="categories-manage">
    <!-- 操作栏 -->
    <div class="action-bar">
      <el-button type="primary" @click="handleAddCategory">
        <el-icon><Plus /></el-icon>添加分类
      </el-button>
    </div>
    
    <!-- 分类表格 -->
    <el-table
      :data="categoriesTree"
      style="width: 100%"
      v-loading="loading"
      row-key="id"
      border
      default-expand-all
      :tree-props="{ children: 'children', hasChildren: 'hasChildren' }"
      :cell-style="{ verticalAlign: 'middle' }"
      :header-cell-style="{ textAlign: 'center' }"
    >
      <el-table-column prop="id" label="ID" width="80" align="center" />
      
      <el-table-column label="分类名称" min-width="300" prop="name">
        <template #default="scope">
          <span :class="scope.row.level === 1 ? 'parent-category-name' : 'child-category-name'">
            {{ scope.row.name }}
          </span>
        </template>
      </el-table-column>
      
      <el-table-column prop="sort" label="排序" width="100" align="center" />
      
      <el-table-column prop="level" label="层级" width="100" align="center">
        <template #default="scope">
          <el-tag size="small" :type="scope.row.level === 1 ? 'primary' : 'success'">
            {{ scope.row.level === 1 ? '一级分类' : '二级分类' }}
          </el-tag>
        </template>
      </el-table-column>
      
      <el-table-column prop="createTime" label="创建时间" width="180" align="center">
        <template #default="scope">
          {{ formatDate(scope.row.createTime) }}
        </template>
      </el-table-column>
      
      <el-table-column label="操作" width="180" fixed="right" align="center">
        <template #default="scope">
          <el-button type="primary" link size="small" @click="handleEdit(scope.row)">
            编辑
          </el-button>
          <el-button type="warning" link size="small" @click="handleAddSubCategory(scope.row)" v-if="scope.row.level === 1">
            添加子分类
          </el-button>
          <el-button type="danger" link size="small" @click="handleDelete(scope.row)">
            删除
          </el-button>
        </template>
      </el-table-column>
    </el-table>
    
    <!-- 添加/编辑分类对话框 -->
    <el-dialog
      v-model="dialogVisible"
      :title="isEdit ? '编辑分类' : isSubCategory ? '添加子分类' : '添加分类'"
      width="500px"
    >
      <el-form :model="categoryForm" :rules="rules" ref="categoryFormRef" label-width="100px">
        <el-form-item label="分类名称" prop="name">
          <el-input v-model="categoryForm.name" placeholder="请输入分类名称" />
        </el-form-item>
        
        <el-form-item label="父级分类" prop="parentId" v-if="!isSubCategory">
          <el-select v-model="categoryForm.parentId" placeholder="选择父级分类（可选）" clearable>
            <el-option
              v-for="item in parentCategories"
              :key="item.id"
              :label="item.name"
              :value="item.id"
            />
          </el-select>
        </el-form-item>
        
        <el-form-item label="排序" prop="sort">
          <el-input-number v-model="categoryForm.sort" :min="0" :max="999" />
          <div class="help-text">数值越小排序越靠前</div>
        </el-form-item>
      </el-form>
      
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="dialogVisible = false">取消</el-button>
          <el-button type="primary" @click="submitForm">确定</el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, computed } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus } from '@element-plus/icons-vue'
import { 
  getCategoryList, 
  addCategory, 
  updateCategory, 
  deleteCategory
} from '../../api/admin'

// 分类列表相关
const categories = ref([])
const loading = ref(false)

// 树形分类数据
const categoriesTree = computed(() => {
  // 找出所有顶级分类
  const topCategories = categories.value.filter(item => !item.parentId)
  
  // 为每个顶级分类添加子分类
  return topCategories.map(category => {
    // 深拷贝顶级分类，避免修改原始数据
    const parent = { ...category, level: 1 }
    
    // 查找该分类的所有子分类
    const children = categories.value
      .filter(item => item.parentId === parent.id)
      .map(child => ({ ...child, level: 2 }))
    
    // 如果有子分类，添加到children属性
    if (children.length > 0) {
      parent.children = children
    }
    
    return parent
  })
})

// 对话框相关
const dialogVisible = ref(false)
const isEdit = ref(false)
const isSubCategory = ref(false)
const categoryFormRef = ref(null)

// 父级分类选择项
const parentCategories = computed(() => {
  return categories.value.filter(item => !item.parentId)
})

// 分类表单
const categoryForm = reactive({
  id: '',
  name: '',
  parentId: '',
  sort: 0
})

// 表单验证规则
const rules = {
  name: [
    { required: true, message: '请输入分类名称', trigger: 'blur' },
    { min: 2, max: 20, message: '长度在 2 到 20 个字符', trigger: 'blur' }
  ],
  sort: [
    { required: true, message: '请输入排序值', trigger: 'blur' }
  ]
}

// 加载分类列表
const loadCategories = async () => {
  loading.value = true
  try {
    const res = await getCategoryList()
    console.log('分类列表响应:', res)
    if (res.success && res.code === 200) {
      categories.value = res.data || []
      console.log('加载的分类列表:', categories.value)
    } else {
      ElMessage.error(res.message || '获取分类列表失败')
      categories.value = []
    }
  } catch (error) {
    ElMessage.error('获取分类列表失败')
    console.error('获取分类列表错误:', error)
    categories.value = []
  } finally {
    loading.value = false
  }
}

// 获取分类名称
const getCategoryNameById = (id) => {
  const category = categories.value.find(item => item.id === id)
  return category ? category.name : '未知分类'
}

// 格式化日期
const formatDate = (dateStr) => {
  if (!dateStr) return ''
  const date = new Date(dateStr)
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`
}

// 添加分类
const handleAddCategory = () => {
  resetForm()
  isEdit.value = false
  isSubCategory.value = false
  dialogVisible.value = true
}

// 添加子分类
const handleAddSubCategory = (row) => {
  resetForm()
  isEdit.value = false
  isSubCategory.value = true
  categoryForm.parentId = row.id
  dialogVisible.value = true
}

// 编辑分类
const handleEdit = (row) => {
  resetForm()
  isEdit.value = true
  isSubCategory.value = false
  
  Object.assign(categoryForm, {
    id: row.id,
    name: row.name,
    parentId: row.parentId || '',
    sort: row.sort
  })
  
  dialogVisible.value = true
}

// 删除分类
const handleDelete = async (row) => {
  // 检查是否有子分类
  const hasChildren = row.children && row.children.length > 0
  if (hasChildren) {
    ElMessage.warning('该分类下有子分类，请先删除子分类')
    return
  }
  
  try {
    await ElMessageBox.confirm(`确定要删除分类"${row.name}"吗？`, '警告', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })
    
    const res = await deleteCategory(row.id)
    if (res.success && res.code === 200) {
      ElMessage.success('删除成功')
      loadCategories()
    } else {
      ElMessage.error(res.message || '删除失败')
    }
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('删除失败: ' + error.message)
    }
  }
}

// 重置表单
const resetForm = () => {
  if (categoryFormRef.value) {
    categoryFormRef.value.resetFields()
  }
  
  Object.assign(categoryForm, {
    id: '',
    name: '',
    parentId: '',
    sort: 0
  })
}

// 提交表单
const submitForm = async () => {
  if (!categoryFormRef.value) return
  
  await categoryFormRef.value.validate(async (valid) => {
    if (valid) {
      try {
        let res
        if (isEdit.value) {
          // 更新分类
          res = await updateCategory(categoryForm)
        } else {
          // 添加分类
          res = await addCategory(categoryForm)
        }
        
        if (res.success && res.code === 200) {
          ElMessage.success(isEdit.value ? '分类更新成功' : '分类添加成功')
          dialogVisible.value = false
          loadCategories()
        } else {
          ElMessage.error(res.message || (isEdit.value ? '更新失败' : '添加失败'))
        }
      } catch (error) {
        ElMessage.error(isEdit.value ? '更新失败' : '添加失败')
      }
    } else {
      ElMessage.warning('请完成必填项')
    }
  })
}

// 初始化
onMounted(() => {
  loadCategories()
})
</script>

<style scoped>
.categories-manage {
  padding: 20px 0;
}

.action-bar {
  margin-bottom: 20px;
}

.parent-category-name {
  font-weight: bold;
  font-size: 15px;
}

.child-category-name {
  font-weight: normal;
  color: #606266;
}

/* 树形结构样式 */
:deep(.el-table__row) {
  height: 60px;
}

:deep(.el-table__row--level-0) {
  background-color: #ffffff;
}

:deep(.el-table__row--level-0):hover > td {
  background-color: #f5f7fa !important;
}

:deep(.el-table__row--level-1) {
  background-color: #ffffff;
}

:deep(.el-table__row--level-1) td:first-child {
  border-left: 3px solid #67c23a;
}

:deep(.el-table__row--level-1):hover > td {
  background-color: #f5f7fa !important;
}

:deep(.el-table__indent) {
  padding-left: 25px !important;
}

.help-text {
  font-size: 12px;
  color: #999;
  margin-top: 5px;
}
</style> 