<template>
  <div class="users-manage">
    <!-- 操作栏 -->
    <div class="action-bar">
      <div class="left">
        <el-button type="danger" :disabled="selectedUsers.length === 0" @click="handleBatchDelete">
          <el-icon><Delete /></el-icon>批量删除
        </el-button>
      </div>
      
      <div class="right">
        <el-input
          v-model="searchKeyword"
          placeholder="请输入用户名/手机号搜索"
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
        
        <el-select v-model="roleFilter" placeholder="用户角色" clearable @change="handleSearch">
          <el-option label="普通用户" :value="0" />
          <el-option label="管理员" :value="1" />
        </el-select>
      </div>
    </div>
    
    <!-- 用户表格 -->
    <el-table
      :data="usersList"
      style="width: 100%"
      @selection-change="handleSelectionChange"
      v-loading="loading"
    >
      <el-table-column type="selection" width="55" />
      
      <el-table-column label="用户信息" min-width="250">
        <template #default="scope">
          <div class="user-info">
            <el-avatar :size="40" :src="scope.row.avatar || ''" />
            <div class="user-detail">
              <div class="username">{{ scope.row.username }}</div>
              <div class="user-id">ID: {{ scope.row.id }}</div>
            </div>
          </div>
        </template>
      </el-table-column>
      
      <el-table-column prop="email" label="邮箱" width="200" />
      
      <el-table-column prop="phone" label="手机号" width="150" />
      
      <el-table-column prop="gender" label="性别" width="80">
        <template #default="scope">
          {{ scope.row.gender === 'male' ? '男' : scope.row.gender === 'female' ? '女' : '未知' }}
        </template>
      </el-table-column>
      
      <el-table-column prop="role" label="角色" width="100">
        <template #default="scope">
          <el-tag :type="scope.row.role === 1 ? 'danger' : 'info'">
            {{ scope.row.role === 1 ? '管理员' : '普通用户' }}
          </el-tag>
        </template>
      </el-table-column>
      
      <el-table-column prop="createTime" label="注册时间" width="180">
        <template #default="scope">
          {{ formatDate(scope.row.createTime) }}
        </template>
      </el-table-column>
      
      <el-table-column label="操作" width="120" fixed="right">
        <template #default="scope">
          <el-button type="danger" link size="small" @click="handleDelete(scope.row)">
            删除
          </el-button>
        </template>
      </el-table-column>
    </el-table>
    
    <!-- 分页 -->
    <div class="pagination-container">
      <div class="pagination-content">
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
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Delete, Search } from '@element-plus/icons-vue'
import { 
  getUserList, 
  deleteUser
} from '../../api/admin'

// 用户列表相关
const usersList = ref([])
const loading = ref(false)
const total = ref(0)
const currentPage = ref(1)
const pageSize = ref(10)
const searchKeyword = ref('')
const roleFilter = ref('')
const selectedUsers = ref([])

// 格式化日期
const formatDate = (dateStr) => {
  if (!dateStr) return ''
  const date = new Date(dateStr)
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`
}

// 删除用户
const handleDelete = async (row) => {
  try {
    await ElMessageBox.confirm(`确定要删除用户"${row.username}"吗？此操作不可恢复！`, '警告', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })
    
    const res = await deleteUser(row.id)
    if (res.code === 200) {
      ElMessage.success('删除成功')
      loadUsersList()
    } else {
      ElMessage.error(res.message || '删除失败')
    }
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('删除失败')
    }
  }
}

// 加载用户列表
const loadUsersList = async () => {
  loading.value = true
  try {
    const params = {
      pageNum: currentPage.value,
      pageSize: pageSize.value,
      role: roleFilter.value
    }
    
    // 处理搜索关键词
    if (searchKeyword.value) {
      // 判断是否为手机号格式（简单判断：11位数字）
      if (/^1\d{10}$/.test(searchKeyword.value)) {
        params.phone = searchKeyword.value
      } else {
        // 否则作为用户名搜索
        params.username = searchKeyword.value
      }
    }
    
    console.log('请求参数:', params)
    const res = await getUserList(params)
    if (res.code === 200 && res.data) {
      usersList.value = res.data.list
      total.value = res.data.total
    } else {
      ElMessage.error(res.message || '获取用户列表失败')
    }
  } catch (error) {
    ElMessage.error('获取用户列表失败')
    console.error(error)
  } finally {
    loading.value = false
  }
}

// 表格多选变化
const handleSelectionChange = (val) => {
  selectedUsers.value = val
}

// 搜索用户
const handleSearch = () => {
  currentPage.value = 1
  loadUsersList()
}

// 分页大小变化
const handleSizeChange = (val) => {
  pageSize.value = val
  loadUsersList()
}

// 页码变化
const handleCurrentChange = (val) => {
  currentPage.value = val
  loadUsersList()
}

// 批量删除用户
const handleBatchDelete = async () => {
  if (selectedUsers.value.length === 0) {
    ElMessage.warning('请选择要删除的用户')
    return
  }
  
  try {
    await ElMessageBox.confirm(`确定要删除选中的 ${selectedUsers.value.length} 个用户吗？此操作不可恢复！`, '警告', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })
    
    const ids = selectedUsers.value.map(item => item.id)
    let successCount = 0
    
    // 逐个删除选中的用户
    for (const id of ids) {
      try {
        const res = await deleteUser(id)
        if (res.code === 200) {
          successCount++
        }
      } catch (error) {
        console.error(`删除用户ID ${id} 失败:`, error)
      }
    }
    
    if (successCount === ids.length) {
      ElMessage.success('所有用户删除成功')
    } else if (successCount > 0) {
      ElMessage.warning(`成功删除 ${successCount}/${ids.length} 个用户`)
    } else {
      ElMessage.error('批量删除失败')
    }
    
    loadUsersList()
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('批量删除失败')
    }
  }
}

// 初始化
onMounted(() => {
  loadUsersList()
})
</script>

<style scoped>
.users-manage {
  padding: 0;
  width: 100%;
}

.action-bar {
  display: flex;
  justify-content: space-between;
  margin-bottom: 20px;
  width: 100%;
}

.left, .right {
  display: flex;
  gap: 10px;
}

.search-input {
  width: 600px;
}

.user-info {
  display: flex;
  align-items: center;
}

.user-detail {
  margin-left: 15px;
}

.username {
  font-size: 14px;
  font-weight: bold;
  margin-bottom: 5px;
}

.user-id {
  font-size: 12px;
  color: #999;
}

.pagination-container {
  margin-top: 20px;
  width: 100%;
  box-sizing: border-box;
}

.pagination-content {
  display: flex;
  justify-content: flex-end;
}
</style> 