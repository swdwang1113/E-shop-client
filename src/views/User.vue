<template>
  <div class="user-container">
    <!-- 顶部信息卡片 -->
    <div class="user-top-card">
      <el-card>
        <div class="user-top-content">
          <div class="user-avatar">
            <el-avatar :size="100" :src="userInfo?.avatar || 'https://cube.elemecdn.com/3/7c/3ea6beec64369c2642b92c6726f1epng.png'"></el-avatar>
          </div>
          <div class="user-basic-info">
            <h2>{{ userInfo?.username }}</h2>
            <p>邮箱: {{ userInfo?.email }}</p>
            <p>手机: {{ userInfo?.phone || '未设置' }}</p>
            <p>注册时间: {{ formatDate(userInfo?.createTime) }}</p>
          </div>
        </div>
      </el-card>
    </div>
    
    <!-- 主要内容区域 -->
    <div class="user-main-content">
      <!-- 左侧导航 -->
      <div class="user-sidebar">
        <el-card class="sidebar-card">
          <div class="user-actions">
            <el-button 
              :class="{ 'active-tab': activeTab === 'profile' }" 
              type="primary" 
              @click="activeTab = 'profile'"
            >个人资料</el-button>
            <el-button 
              :class="{ 'active-tab': activeTab === 'address' }" 
              type="warning" 
              @click="activeTab = 'address'"
            >收货地址</el-button>
            <el-button 
              :class="{ 'active-tab': activeTab === 'favorite' }" 
              type="success" 
              @click="activeTab = 'favorite'"
            >我的收藏</el-button>
            <el-button 
              :class="{ 'active-tab': activeTab === 'refunds' }" 
              type="info" 
              @click="goToRefunds"
            >退款申请</el-button>
            <el-button type="danger" @click="handleLogout">退出登录</el-button>
          </div>
        </el-card>
      </div>
      
      <!-- 右侧内容 -->
      <div class="user-content">
        <el-card v-if="activeTab === 'profile'" class="content-card">
          <template #header>
            <div class="card-header">
              <h3>个人资料</h3>
              <el-button type="primary" size="small" @click="isEditing = !isEditing">
                {{ isEditing ? '取消编辑' : '编辑资料' }}
              </el-button>
            </div>
          </template>
          
          <!-- 显示模式 -->
          <div v-if="!isEditing" class="profile-info">
            <div class="profile-avatar">
              <el-avatar :size="100" :src="userInfo?.avatar || 'https://cube.elemecdn.com/3/7c/3ea6beec64369c2642b92c6726f1epng.png'"></el-avatar>
            </div>
            
            <div class="profile-details">
              <div class="profile-item">
                <span class="label">用户名：</span>
                <span class="value">{{ userInfo?.username }}</span>
              </div>
              <div class="profile-item">
                <span class="label">手机号：</span>
                <span class="value">{{ userInfo?.phone || '未设置' }}</span>
              </div>
              <div class="profile-item">
                <span class="label">邮箱：</span>
                <span class="value">{{ userInfo?.email || '未设置' }}</span>
              </div>
              <div class="profile-item">
                <span class="label">性别：</span>
                <span class="value">{{ userInfo?.gender || '保密' }}</span>
              </div>
              <div class="profile-item">
                <span class="label">注册时间：</span>
                <span class="value">{{ formatDate(userInfo?.createTime) }}</span>
              </div>
            </div>
          </div>
          
          <!-- 编辑模式 -->
          <el-form v-else :model="profileForm" label-width="120px">
            <el-form-item label="用户名">
              <el-input v-model="profileForm.username"></el-input>
            </el-form-item>
            <el-form-item label="手机号">
              <el-input v-model="profileForm.phone"></el-input>
            </el-form-item>
            <el-form-item label="邮箱">
              <el-input v-model="profileForm.email"></el-input>
            </el-form-item>
            <el-form-item label="性别">
              <el-radio-group v-model="profileForm.gender">
                <el-radio label="男">男</el-radio>
                <el-radio label="女">女</el-radio>
                <el-radio label="保密">保密</el-radio>
              </el-radio-group>
            </el-form-item>
            <el-form-item label="头像">
              <el-upload
                class="avatar-uploader"
                action=""
                :http-request="uploadAvatarRequest"
                :show-file-list="false"
                :before-upload="beforeAvatarUpload"
              >
                <img v-if="profileForm.avatar" :src="profileForm.avatar" class="avatar" />
                <el-icon v-else class="avatar-uploader-icon"><Plus /></el-icon>
                <div class="el-upload__tip">
                  点击上传头像，只能上传jpg/png文件，且不超过2MB
                </div>
              </el-upload>
            </el-form-item>
            <el-form-item>
              <el-button type="primary" @click="updateProfile" :loading="updating">保存更新</el-button>
            </el-form-item>
          </el-form>
        </el-card>
        
        <el-card v-if="activeTab === 'address'" class="content-card">
          <template #header>
            <div class="card-header">
              <h3>收货地址</h3>
              <el-button type="primary" size="small" @click="openAddressDialog()">添加地址</el-button>
            </div>
          </template>
          
          <div class="address-list" v-loading="addressLoading">
            <div v-if="addressList.length === 0" class="empty-address">
              您还没有添加收货地址
            </div>
            
            <el-card 
              v-for="address in addressList" 
              :key="address.id" 
              class="address-item"
              :class="{ 'default-address': address.isDefault === 1 }"
            >
              <div class="address-info">
                <div class="address-header">
                  <span class="name">{{ address.name }}</span>
                  <span class="phone">{{ address.phone }}</span>
                  <el-tag v-if="address.isDefault === 1" type="success" size="small">默认地址</el-tag>
                </div>
                <div class="address-detail">
                  {{ address.province }} {{ address.city }} {{ address.district }} {{ address.address }}
                </div>
              </div>
              <div class="address-actions">
                <el-button type="primary" link @click="openAddressDialog(address)">编辑</el-button>
                <el-button type="danger" link @click="handleDeleteAddress(address.id)">删除</el-button>
                <el-button 
                  v-if="address.isDefault !== 1" 
                  type="success" 
                  link 
                  @click="handleSetDefaultAddress(address.id)"
                >设为默认</el-button>
              </div>
            </el-card>
          </div>
        </el-card>
        
        <!-- 收藏列表 -->
        <el-card v-if="activeTab === 'favorite'" class="content-card">
          <template #header>
            <div class="card-header">
              <h3>我的收藏</h3>
            </div>
          </template>
          
          <div class="favorite-list" v-loading="favoriteLoading">
            <div v-if="favoriteList.length === 0" class="empty-favorite">
              您还没有收藏任何商品
            </div>
            
            <el-row :gutter="20">
              <el-col 
                :xs="24" 
                :sm="12" 
                :md="8" 
                :lg="6" 
                v-for="item in favoriteList" 
                :key="item.id"
                class="favorite-col"
              >
                <el-card class="favorite-item" shadow="hover">
                  <div class="favorite-img" @click="goToGoodsDetail(item.goods?.id)">
                    <img :src="item.goods?.imageUrl || item.goods?.image || ''" :alt="item.goods?.name || '商品图片'">
                  </div>
                  <div class="favorite-info">
                    <div class="favorite-name" @click="goToGoodsDetail(item.goods?.id)">
                      {{ item.goods?.name || '未命名商品' }}
                    </div>
                    <div class="favorite-price">
                      ¥{{ (item.goods?.price) ? item.goods?.price.toFixed(2) : '0.00' }}
                    </div>
                    <div class="favorite-actions">
                      <el-button 
                        type="primary" 
                        size="small" 
                        @click="goToGoodsDetail(item.goods?.id)"
                      >
                        查看详情
                      </el-button>
                      <el-button 
                        type="danger" 
                        size="small" 
                        @click="removeFavoriteItem(item.goodsId || item.goods?.id)"
                      >
                        取消收藏
                      </el-button>
                    </div>
                  </div>
                </el-card>
              </el-col>
            </el-row>
          </div>
        </el-card>
      </div>
    </div>
    
    <!-- 地址对话框 -->
    <el-dialog 
      v-model="addressDialogVisible" 
      :title="currentAddress ? '编辑地址' : '添加地址'"
      width="500px"
      destroy-on-close
    >
      <el-form 
        :model="addressForm" 
        :rules="addressRules"
        ref="addressFormRef"
        label-width="100px"
        status-icon
      >
        <el-form-item label="收货人" prop="name">
          <el-input v-model="addressForm.name" placeholder="请输入收货人姓名"></el-input>
        </el-form-item>
        <el-form-item label="手机号码" prop="phone">
          <el-input v-model="addressForm.phone" placeholder="请输入手机号码"></el-input>
        </el-form-item>
        <el-form-item label="所在地区" prop="selectedRegion">
          <el-cascader
            v-model="addressForm.selectedRegion"
            :options="regionOptions"
            placeholder="请选择省/市/区"
            @change="handleRegionChange"
          ></el-cascader>
        </el-form-item>
        <el-form-item label="详细地址" prop="address">
          <el-input 
            v-model="addressForm.address" 
            type="textarea" 
            :rows="3"
            placeholder="请输入详细地址，如街道、门牌号等"
          ></el-input>
        </el-form-item>
        <el-form-item>
          <el-checkbox v-model="addressForm.isDefault" :true-label="1" :false-label="0">设为默认地址</el-checkbox>
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="addressDialogVisible = false">取消</el-button>
          <el-button type="primary" @click="saveAddress" :loading="addressSaving">保存</el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, computed, nextTick, watch } from 'vue'
import { useRouter } from 'vue-router'
import { Plus } from '@element-plus/icons-vue'
import { useUserStore } from '../store/user'
import { ElMessage, ElMessageBox } from 'element-plus'
// 使用element-china-area-data提供的数据
import { regionData, codeToText } from 'element-china-area-data'
import { getFavoriteList, removeFavorite } from '../api/favorite'

const router = useRouter()
const userStore = useUserStore()
const userInfo = computed(() => userStore.userInfo)

// 选项卡
const activeTab = ref('profile')

// 个人资料表单
const profileForm = reactive({
  username: '',
  phone: '',
  email: '',
  avatar: '',
  gender: '保密'
})

// 地址列表
const addressList = ref([])
const addressLoading = ref(false)
const addressDialogVisible = ref(false)
const currentAddress = ref(null)
const addressSaving = ref(false)
const addressFormRef = ref(null)

// 地址表单
const addressForm = reactive({
  id: null,
  name: '',
  phone: '',
  province: '',
  city: '',
  district: '',
  address: '',
  isDefault: 0,
  selectedRegion: []
})

// 表单验证规则
const addressRules = {
  name: [
    { required: true, message: '请输入收货人姓名', trigger: 'blur' },
    { min: 2, max: 20, message: '长度在 2 到 20 个字符', trigger: 'blur' }
  ],
  phone: [
    { required: true, message: '请输入手机号码', trigger: 'blur' },
    { pattern: /^1[3-9]\d{9}$/, message: '请输入正确的手机号码', trigger: 'blur' }
  ],
  selectedRegion: [
    { required: true, message: '请选择所在地区', trigger: 'change', type: 'array' }
  ],
  address: [
    { required: true, message: '请输入详细地址', trigger: 'blur' },
    { min: 5, max: 100, message: '长度在 5 到 100 个字符', trigger: 'blur' }
  ]
}

// 地区选项
const regionOptions = ref(regionData)

const updating = ref(false)
const isEditing = ref(false)

// 收藏列表
const favoriteList = ref([])
const favoriteLoading = ref(false)

// 初始化用户数据
onMounted(() => {
  if (userInfo.value) {
    profileForm.username = userInfo.value.username
    profileForm.phone = userInfo.value.phone || ''
    profileForm.email = userInfo.value.email || ''
    profileForm.avatar = userInfo.value.avatar || ''
    profileForm.gender = userInfo.value.gender || '保密'
  }
  
  // 加载地址列表
  if (activeTab.value === 'address') {
    fetchAddressList()
  } else if (activeTab.value === 'favorite') {
    fetchFavoriteList()
  }
})

// 监听标签页变化
watch(activeTab, (newTab) => {
  if (newTab === 'address') {
    fetchAddressList()
  } else if (newTab === 'favorite') {
    fetchFavoriteList()
  }
})

// 获取地址列表
const fetchAddressList = async () => {
  addressLoading.value = true
  try {
    const addresses = await userStore.getAddresses()
    addressList.value = addresses || []
  } catch (error) {
    console.error('获取地址列表失败:', error)
    ElMessage.error('获取地址列表失败')
  } finally {
    addressLoading.value = false
  }
}

// 获取收藏列表
const fetchFavoriteList = async () => {
  favoriteLoading.value = true
  try {
    const res = await getFavoriteList()
    console.log('收藏列表原始数据:', res)
    
    // 处理可能的不同数据格式
    let favorites = []
    if (res.data && Array.isArray(res.data)) {
      favorites = res.data
    } else if (res.data && res.data.list && Array.isArray(res.data.list)) {
      favorites = res.data.list
    } else if (Array.isArray(res)) {
      favorites = res
    }
    
    // 处理每个收藏项，确保数据格式一致
    favoriteList.value = favorites.map(item => {
      // 确保goods对象存在
      if (!item.goods && item.goodsInfo) {
        item.goods = item.goodsInfo
      } else if (!item.goods) {
        item.goods = {}
      }
      
      // 确保必要的字段存在
      if (!item.goodsId && item.goods && item.goods.id) {
        item.goodsId = item.goods.id
      }
      
      return item
    })
    
    console.log('处理后的收藏列表:', favoriteList.value)
  } catch (error) {
    console.error('获取收藏列表失败:', error)
    ElMessage.error('获取收藏列表失败')
    favoriteList.value = []
  } finally {
    favoriteLoading.value = false
  }
}

// 打开地址对话框
const openAddressDialog = (address = null) => {
  currentAddress.value = address
  
  if (address) {
    // 编辑现有地址
    addressForm.id = address.id
    addressForm.name = address.name
    addressForm.phone = address.phone
    addressForm.province = address.province
    addressForm.city = address.city
    addressForm.district = address.district
    addressForm.address = address.address
    addressForm.isDefault = address.isDefault
    
    // 设置地区选择器的值
    try {
      // 在regionData中查找匹配的选项
      const matchProvince = regionData.find(item => item.label === address.province);
      if (matchProvince) {
        const matchCity = matchProvince.children.find(item => item.label === address.city);
        if (matchCity) {
          const matchDistrict = matchCity.children.find(item => item.label === address.district);
          if (matchDistrict) {
            addressForm.selectedRegion = [matchProvince.value, matchCity.value, matchDistrict.value];
          }
        }
      }
      
      if (!addressForm.selectedRegion || addressForm.selectedRegion.length !== 3) {
        addressForm.selectedRegion = [];
        console.warn('无法匹配地址代码，将使用空值');
      }
    } catch (e) {
      // 如果转换失败，使用空值
      addressForm.selectedRegion = []
      console.warn('地址匹配失败，将使用空值', e)
    }
  } else {
    // 添加新地址
    addressForm.id = null
    addressForm.name = ''
    addressForm.phone = ''
    addressForm.province = ''
    addressForm.city = ''
    addressForm.district = ''
    addressForm.address = ''
    addressForm.isDefault = 0
    
    addressForm.selectedRegion = []
  }
  
  addressDialogVisible.value = true
  
  // 等待对话框DOM更新后重置表单验证状态
  nextTick(() => {
    if (addressFormRef.value) {
      addressFormRef.value.clearValidate()
    }
  })
}

// 地区选择变化处理
const handleRegionChange = (value) => {
  if (value && value.length === 3) {
    // 使用codeToText将代码转换为文本
    addressForm.province = codeToText[value[0]]
    addressForm.city = codeToText[value[1]]
    addressForm.district = codeToText[value[2]]
  } else {
    console.warn('地区选择不完整:', value)
    addressForm.province = ''
    addressForm.city = ''
    addressForm.district = ''
  }
}

// 保存地址
const saveAddress = async () => {
  if (!addressFormRef.value) return
  
  try {
    // 表单验证
    await addressFormRef.value.validate()
    
    // 确保地区信息已设置
    if (!addressForm.selectedRegion || addressForm.selectedRegion.length !== 3) {
      ElMessage.error('请选择完整的省市区信息')
      return
    }
    
    // 确保地区信息已正确设置到表单
    handleRegionChange(addressForm.selectedRegion)
    
    addressSaving.value = true
    
    // 准备提交的数据
    const addressData = {
      id: addressForm.id,
      name: addressForm.name,
      phone: addressForm.phone,
      province: addressForm.province,
      city: addressForm.city,
      district: addressForm.district,
      address: addressForm.address,
      isDefault: addressForm.isDefault
    }
    
    // 调用store方法保存地址
    await userStore.updateAddress(addressData)
    
    ElMessage.success(currentAddress.value ? '地址更新成功' : '地址添加成功')
    addressDialogVisible.value = false
    
    // 刷新地址列表
    fetchAddressList()
  } catch (error) {
    if (error !== 'validation failed') {
      console.error('保存地址失败:', error)
      ElMessage.error('保存地址失败: ' + (error.message || '未知错误'))
    }
  } finally {
    addressSaving.value = false
  }
}

// 删除地址
const handleDeleteAddress = async (addressId) => {
  try {
    await ElMessageBox.confirm('确定要删除该地址吗？', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })
    
    await userStore.deleteAddress(addressId)
    ElMessage.success('地址已删除')
    
    // 刷新地址列表
    fetchAddressList()
  } catch (error) {
    if (error !== 'cancel') {
      console.error('删除地址失败:', error)
      ElMessage.error('删除地址失败: ' + (error.message || '未知错误'))
    }
  }
}

// 设置默认地址
const handleSetDefaultAddress = async (addressId) => {
  try {
    await userStore.setDefaultAddress(addressId)
    ElMessage.success('默认地址设置成功')
    
    // 刷新地址列表
    fetchAddressList()
  } catch (error) {
    console.error('设置默认地址失败:', error)
    ElMessage.error('设置默认地址失败: ' + (error.message || '未知错误'))
  }
}

// 格式化日期
const formatDate = (dateStr) => {
  if (!dateStr) return ''
  const date = new Date(dateStr)
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`
}

// 更新个人资料
const updateProfile = async () => {
  try {
    updating.value = true
    await userStore.updateUserInfo({
      username: profileForm.username,
      phone: profileForm.phone,
      email: profileForm.email,
      gender: profileForm.gender
    })
    ElMessage.success('个人资料更新成功')
    isEditing.value = false // 保存成功后退出编辑模式
  } catch (error) {
    ElMessage.error('更新失败: ' + (error.message || '未知错误'))
  } finally {
    updating.value = false
  }
}

// 头像上传前的验证
const beforeAvatarUpload = (file) => {
  const isJPG = file.type === 'image/jpeg'
  const isPNG = file.type === 'image/png'
  const isLt2M = file.size / 1024 / 1024 < 2

  if (!isJPG && !isPNG) {
    ElMessage.error('头像只能是 JPG 或 PNG 格式!')
    return false
  }
  if (!isLt2M) {
    ElMessage.error('头像大小不能超过 2MB!')
    return false
  }
  return true
}

// 自定义头像上传请求
const uploadAvatarRequest = async (options) => {
  try {
    const { file } = options
    const formData = new FormData()
    formData.append('file', file)
    
    const res = await userStore.uploadAvatar(formData)
    profileForm.avatar = res.data
    ElMessage.success('头像上传成功')
  } catch (error) {
    ElMessage.error('头像上传失败: ' + (error.message || '未知错误'))
  }
}

// 通用导航函数
const navigateTo = (path, query = {}) => {
  router.push({ path, query }).catch(err => {
    if (err.name !== 'NavigationDuplicated') {
      console.error('导航错误:', err)
      // 使用window.location作为备用
      const queryString = Object.keys(query).length > 0 
        ? '?' + new URLSearchParams(query).toString() 
        : ''
      window.location.href = path + queryString
    }
  })
}

// 退出登录
const handleLogout = async () => {
  try {
    await ElMessageBox.confirm('确定要退出登录吗？', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })
    
    await userStore.logout()
    router.push('/login')
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('退出失败: ' + error.message)
    }
  }
}

// 跳转到商品详情
const goToGoodsDetail = (goodsId) => {
  if (!goodsId) return
  router.push(`/goods/${goodsId}`)
}

// 取消收藏
const removeFavoriteItem = async (goodsId) => {
  if (!goodsId) {
    ElMessage.warning('商品ID不存在，无法取消收藏')
    return
  }
  
  try {
    await ElMessageBox.confirm('确定要取消收藏该商品吗？', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })
    
    await removeFavorite(goodsId)
    ElMessage.success('已取消收藏')
    
    // 刷新收藏列表
    fetchFavoriteList()
  } catch (error) {
    if (error !== 'cancel') {
      console.error('取消收藏失败:', error)
      ElMessage.error('取消收藏失败: ' + (error.message || '未知错误'))
    }
  }
}

// 跳转到退款申请页面
const goToRefunds = () => {
  router.push('/refunds')
}
</script>

<style scoped>
.user-container {
  max-width: 1200px;
  margin: 20px auto;
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.user-top-card {
  width: 100%;
}

.user-top-content {
  display: flex;
  align-items: center;
  padding: 10px;
}

.user-avatar {
  margin-right: 30px;
}

.user-basic-info {
  flex: 1;
}

.user-basic-info h2 {
  margin-top: 0;
  margin-bottom: 10px;
}

.user-basic-info p {
  margin: 5px 0;
  color: #606266;
}

.user-main-content {
  display: flex;
  gap: 20px;
}

.user-sidebar {
  width: 200px;
  flex-shrink: 0;
}

.sidebar-card {
  height: 350px; /* 设置一个固定高度，与右侧个人资料区域相近 */
}

.user-actions {
  display: flex;
  flex-direction: column;
  gap: 15px;
  padding: 20px 0;
  height: 100%; /* 使按钮组占满卡片高度 */
  justify-content: space-between; /* 均匀分布按钮 */
}

.user-actions .el-button {
  width: 100%;
  text-align: left;
  margin-left: 0;
  margin-right: 0;
}

.active-tab {
  font-weight: bold;
  position: relative;
}

.active-tab::after {
  content: '';
  position: absolute;
  right: 10px;
  top: 50%;
  transform: translateY(-50%);
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background-color: #fff;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.empty-orders, .empty-address {
  text-align: center;
  padding: 30px 0;
  color: #999;
}

.avatar-uploader {
  width: 100px;
  height: 100px;
  border: 1px dashed #d9d9d9;
  border-radius: 6px;
  display: flex;
  justify-content: center;
  align-items: center;
  cursor: pointer;
  overflow: hidden;
  transition: border-color 0.3s;
}

.avatar-uploader:hover {
  border-color: #409EFF;
}

.avatar-uploader-icon {
  font-size: 28px;
  color: #8c939d;
  width: 100%;
  height: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
}

.avatar {
  width: 100px;
  height: 100px;
  display: block;
  object-fit: cover;
}

.el-upload__tip {
  font-size: 12px;
  color: #606266;
  margin-top: 10px;
  line-height: 1.4;
}

.address-list {
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.address-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 15px;
  border-radius: 4px;
}

.default-address {
  border: 1px solid #67c23a;
  background-color: #f0f9eb;
}

.address-info {
  flex: 1;
}

.address-header {
  margin-bottom: 10px;
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 10px;
}

.address-header .name {
  font-weight: bold;
  font-size: 16px;
}

.address-header .phone {
  color: #666;
}

.address-detail {
  color: #333;
  line-height: 1.5;
}

.address-actions {
  display: flex;
  gap: 10px;
}

.empty-address {
  text-align: center;
  padding: 40px 0;
  color: #909399;
  font-size: 14px;
}

.profile-info {
  display: flex;
  padding: 20px 0;
}

.profile-avatar {
  margin-right: 40px;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.profile-details {
  flex: 1;
}

.profile-item {
  margin-bottom: 15px;
  line-height: 24px;
}

.profile-item .label {
  font-weight: bold;
  color: #606266;
  margin-right: 10px;
  display: inline-block;
}

.profile-item .value {
  color: #333;
}

/* 收藏列表样式 */
.favorite-list {
  min-height: 200px;
}

.favorite-col {
  margin-bottom: 20px;
}

.favorite-item {
  height: 100%;
  transition: all 0.3s;
}

.favorite-item:hover {
  transform: translateY(-5px);
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.1);
}

.favorite-img {
  position: relative;
  width: 100%;
  padding-top: 100%; /* 创建1:1的宽高比 */
  overflow: hidden;
  cursor: pointer;
}

.favorite-img img {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.3s;
}

.favorite-img:hover img {
  transform: scale(1.05);
}

.favorite-info {
  padding: 10px;
}

.favorite-name {
  font-size: 14px;
  margin-bottom: 8px;
  height: 40px;
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  cursor: pointer;
}

.favorite-name:hover {
  color: #409EFF;
}

.favorite-price {
  color: #f56c6c;
  font-size: 16px;
  font-weight: bold;
  margin-bottom: 10px;
}

.favorite-actions {
  display: flex;
  justify-content: space-between;
}

.empty-favorite {
  text-align: center;
  padding: 40px 0;
  color: #909399;
  font-size: 14px;
}

@media (max-width: 768px) {
  .user-main-content {
    flex-direction: column;
  }
  
  .user-sidebar {
    width: 100%;
  }
  
  .sidebar-card {
    height: auto; /* 在移动设备上恢复自适应高度 */
  }
  
  .user-actions {
    flex-direction: row;
    flex-wrap: wrap;
    justify-content: space-between;
    height: auto; /* 在移动设备上恢复自适应高度 */
    padding: 10px 0;
  }
  
  .user-actions .el-button {
    width: auto;
    margin-bottom: 10px;
  }
}

.user-content {
  flex: 1;
}

.content-card {
  height: 100%;
}
</style> 