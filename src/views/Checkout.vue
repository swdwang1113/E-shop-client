<template>
  <div class="checkout-container">
    <h2 class="page-title">订单结算</h2>
    
    <div class="checkout-content" v-if="checkoutItems.length > 0">
      <!-- 商品信息 -->
      <el-card class="checkout-section">
        <template #header>
          <div class="section-header">
            <h3>确认商品信息</h3>
          </div>
        </template>
        
        <div class="goods-list">
          <el-table :data="checkoutItems" style="width: 100%">
            <el-table-column label="商品" min-width="400">
              <template #default="scope">
                <div class="goods-item">
                  <el-image 
                    :src="scope.row.goodsImage" 
                    fit="cover"
                    class="goods-image"
                  ></el-image>
                  <div class="goods-info">
                    <div class="goods-name">{{ scope.row.goodsName }}</div>
                  </div>
                </div>
              </template>
            </el-table-column>
            <el-table-column prop="price" label="单价" width="120">
              <template #default="scope">
                <div class="price">¥{{ (scope.row.price || 0).toFixed(2) }}</div>
              </template>
            </el-table-column>
            <el-table-column prop="quantity" label="数量" width="120">
              <template #default="scope">
                <div class="count">x{{ scope.row.quantity || 1 }}</div>
              </template>
            </el-table-column>
            <el-table-column label="小计" width="120">
              <template #default="scope">
                <div class="subtotal">
                  ¥{{ ((scope.row.price || 0) * (scope.row.quantity || 1)).toFixed(2) }}
                </div>
              </template>
            </el-table-column>
          </el-table>
        </div>
      </el-card>
      
      <!-- 收货地址 -->
      <el-card class="checkout-section">
        <template #header>
          <div class="section-header">
            <h3>收货地址</h3>
            <div>
              <el-button type="primary" link @click="showAddressSelectionDialog = true">更换地址</el-button>
              <el-button type="primary" link @click="showAddressDialog = true">添加新地址</el-button>
            </div>
          </div>
        </template>
        
        <div class="selected-address" v-if="selectedAddress">
          <div class="address-content">
            <div class="name-phone">
              <span class="name">{{ selectedAddress.name }}</span>
              <span class="default-tag" v-if="selectedAddress.isDefault === true || selectedAddress.isDefault === 1">默认</span>
              <span class="phone">{{ selectedAddress.phone }}</span>
            </div>
            <div class="address-detail">
              {{ formatAddress(selectedAddress) }}
            </div>
          </div>
        </div>
        
        <div v-else class="empty-address">
          您还没有添加收货地址，请添加
        </div>
      </el-card>
    
      <!-- 订单金额 -->
      <el-card class="checkout-section">
        <div class="order-amount">
          <div class="amount-item">
            <span class="label">商品总价</span>
            <span class="value">¥{{ totalPrice.toFixed(2) }}</span>
          </div>
          <div class="amount-item">
            <span class="label">运费</span>
            <span class="value">¥{{ shipping.toFixed(2) }}</span>
          </div>
          <div class="amount-item" v-if="discount > 0">
            <span class="label">优惠</span>
            <span class="value">-¥{{ discount.toFixed(2) }}</span>
          </div>
          <div class="amount-item total">
            <span class="label">应付金额</span>
            <span class="value price">¥{{ payableAmount.toFixed(2) }}</span>
          </div>
        </div>
      </el-card>
      
      <!-- 提交订单 -->
      <div class="checkout-actions">
        <el-button @click="$router.push('/cart')">返回购物车</el-button>
        <el-button type="primary" @click="submitOrder" :disabled="!canSubmit">提交订单</el-button>
      </div>
    </div>
    
    <div class="empty-cart" v-else>
      <el-empty description="您的购物车为空，无法结算">
        <el-button type="primary" @click="$router.push('/')">去购物</el-button>
      </el-empty>
    </div>
    
    <!-- 地址选择对话框 -->
    <el-dialog 
      v-model="showAddressSelectionDialog" 
      title="选择收货地址"
      width="50%"
    >
      <div class="address-list">
        <div class="address-items">
          <div
            v-for="address in addresses"
            :key="address.id"
            class="address-item"
            :class="{ 'address-selected': tempSelectedAddressId === address.id }"
            @click="tempSelectedAddressId = address.id"
          >
            <div class="address-content">
              <div class="name-phone">
                <span class="name">{{ address.name }}</span>
                <span class="default-tag" v-if="address.isDefault === true || address.isDefault === 1">默认</span>
                <span class="phone">{{ address.phone }}</span>
              </div>
              <div class="address-detail">
                {{ formatAddress(address) }}
              </div>
            </div>
            <div class="radio-container">
              <el-radio :label="address.id" v-model="tempSelectedAddressId" class="address-radio"></el-radio>
            </div>
          </div>
        </div>
        
        <div v-if="addresses.length === 0" class="empty-address">
          您还没有添加收货地址，请添加
        </div>
      </div>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="showAddressSelectionDialog = false">取消</el-button>
          <el-button type="primary" @click="confirmAddressSelection">确认</el-button>
        </span>
      </template>
    </el-dialog>
    
    <!-- 地址对话框 -->
    <el-dialog 
      v-model="showAddressDialog" 
      title="添加收货地址"
      width="50%"
    >
      <el-form :model="addressForm" label-width="120px" :rules="addressRules" ref="addressFormRef">
        <el-form-item label="收货人" prop="name">
          <el-input v-model="addressForm.name" placeholder="请输入收货人姓名"></el-input>
        </el-form-item>
        <el-form-item label="手机号" prop="phone">
          <el-input v-model="addressForm.phone" placeholder="请输入手机号"></el-input>
        </el-form-item>
        <el-form-item label="所在地">
          <div class="region-select">
            <el-input v-model="addressForm.province" placeholder="省份" style="width: 30%; margin-right: 5px;"></el-input>
            <el-input v-model="addressForm.city" placeholder="城市" style="width: 30%; margin-right: 5px;"></el-input>
            <el-input v-model="addressForm.district" placeholder="区/县" style="width: 30%;"></el-input>
          </div>
        </el-form-item>
        <el-form-item label="详细地址" prop="address">
          <el-input v-model="addressForm.address" type="textarea" rows="3" placeholder="请输入详细地址，如街道名称、门牌号"></el-input>
        </el-form-item>
        <el-form-item>
          <el-checkbox v-model="addressForm.isDefault">设为默认地址</el-checkbox>
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="showAddressDialog = false">取消</el-button>
          <el-button type="primary" @click="saveAddress">保存</el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { getUserAddresses, addAddress } from '../api/address'
import { createOrder } from '../api/order'

const router = useRouter()
const checkoutItems = ref([])

// 地址相关
const addresses = ref([])
const selectedAddressId = ref('')
const showAddressDialog = ref(false)
const showAddressSelectionDialog = ref(false)
const tempSelectedAddressId = ref('')
const selectedAddress = computed(() => {
  return addresses.value.find(addr => addr.id === selectedAddressId.value) || null
})
const addressForm = reactive({
  name: '',
  phone: '',
  province: '',
  city: '',
  district: '',
  address: '',
  isDefault: false
})
const addressFormRef = ref(null)


// 商品总价
const totalPrice = computed(() => {
  return checkoutItems.value.reduce((total, item) => {
    return total + (item.price || 0) * (item.quantity || 1)
  }, 0)
})

// 运费
const shipping = ref(0)

// 优惠金额
const discount = ref(0)

// 应付金额
const payableAmount = computed(() => {
  return totalPrice.value + shipping.value - discount.value
})

// 是否可以提交订单
const canSubmit = computed(() => {
  return checkoutItems.value.length > 0 && selectedAddressId.value
})

// 初始化数据
onMounted(async () => {
  // 从localStorage获取结算商品
  try {
    const checkoutItemsStr = localStorage.getItem('checkoutItems')
    if (checkoutItemsStr) {
      checkoutItems.value = JSON.parse(checkoutItemsStr)
    } else {
      checkoutItems.value = []
    }
  } catch (error) {
    console.error('解析结算商品失败:', error)
    checkoutItems.value = []
  }
  
  if (checkoutItems.value.length === 0) {
    // 如果购物车为空，跳转回购物车页面
    ElMessage.warning('请先选择要结算的商品')
    router.push('/cart')
    return
  }
  
  // 加载收货地址
  await loadAddresses()
  
  // 如果有默认地址，自动选中
  const defaultAddress = addresses.value.find(address => address.isDefault)
  if (defaultAddress) {
    selectedAddressId.value = defaultAddress.id
    tempSelectedAddressId.value = defaultAddress.id
  } else if (addresses.value.length > 0) {
    selectedAddressId.value = addresses.value[0].id
    tempSelectedAddressId.value = addresses.value[0].id
  }
  
  // 计算运费 (这里可以根据实际情况来计算，如根据地址、商品重量等)
  calculateShipping()
})

// 计算运费
const calculateShipping = () => {
  // 这里可以根据选择的地址和商品信息计算运费
  // 简单示例：总价99元免运费，否则10元运费
  shipping.value = totalPrice.value >= 99 ? 0 : 10
}

// 加载收货地址
const loadAddresses = async () => {
  try {
    const res = await getUserAddresses()
    console.log('地址数据响应:', res)
    
    // 尝试从不同的数据结构中获取地址列表
    if (Array.isArray(res)) {
      addresses.value = res
    } else if (res.data && Array.isArray(res.data)) {
      addresses.value = res.data
    } else if (res.success && Array.isArray(res.data)) {
      addresses.value = res.data
    } else {
      addresses.value = []
      console.warn('地址数据格式异常:', res)
    }
    
    console.log('处理后的地址列表:', addresses.value)
    
    // 转换地址数据格式，确保字段名一致
    addresses.value = addresses.value.map(addr => {
      // 确保isDefault是布尔值或数字
      if (typeof addr.isDefault === 'string') {
        addr.isDefault = addr.isDefault === 'true' || addr.isDefault === '1' ? 1 : 0
      }
      return addr
    })
    
    // 如果地址数据为空，使用测试数据
    if (addresses.value.length === 0) {
      addresses.value = [
        {
          id: 1,
          name: '张三',
          phone: '13800138000',
          province: '广东',
          city: '深圳',
          district: '南山',
          address: '科技园',
          isDefault: 1
        },
        {
          id: 2,
          name: '李四',
          phone: '13900139000',
          province: '北京',
          city: '朝阳',
          district: '',
          address: '三里屯SOHO',
          isDefault: 0
        }
      ]
      console.log('使用测试地址数据:', addresses.value)
    }
  } catch (error) {
    console.error('获取地址列表失败:', error)
    ElMessage.error('获取地址列表失败: ' + (error.message || '未知错误'))
    
    // 使用测试数据
    addresses.value = [
      {
        id: 1,
        name: '张三',
        phone: '13800138000',
        province: '广东',
        city: '深圳',
        district: '南山',
        address: '科技园',
        isDefault: 1
      },
      {
        id: 2,
        name: '李四',
        phone: '13900139000',
        province: '北京',
        city: '朝阳',
        district: '',
        address: '三里屯SOHO',
        isDefault: 0
      }
    ]
    console.log('出错后使用测试地址数据:', addresses.value)
  }
}

// 地址规则
const addressRules = {
  name: [
    { required: true, message: '请输入收货人姓名', trigger: 'blur' },
    { min: 2, max: 20, message: '长度2-20个字', trigger: 'blur' }
  ],
  phone: [
    { required: true, message: '请输入手机号', trigger: 'blur' },
    { pattern: /^1[3-9]\d{9}$/, message: '请输入正确的手机号', trigger: 'blur' }
  ],
  address: [
    { required: true, message: '请输入详细地址', trigger: 'blur' },
    { min: 5, max: 100, message: '长度5-100个字', trigger: 'blur' }
  ]
}

// 保存地址
const saveAddress = async () => {
  if (!addressFormRef.value) return
  
  try {
    await addressFormRef.value.validate()
    
    // 使用后端实际接受的字段名
    const addressData = {
      name: addressForm.name.trim(),
      phone: addressForm.phone.trim(),
      province: addressForm.province.trim(),
      city: addressForm.city.trim(),
      district: addressForm.district.trim(),
      address: addressForm.address.trim(),
      isDefault: addressForm.isDefault ? 1 : 0
    }
    
    console.log('提交的地址数据:', addressData)
    
    // 检查是否有必填字段为空
    if (!addressData.name) {
      ElMessage.warning('收货人不能为空')
      return
    }
    
    if (!addressData.phone) {
      ElMessage.warning('手机号不能为空')
      return
    }
    
    if (!addressData.address) {
      ElMessage.warning('详细地址不能为空')
      return
    }
    
    try {
      const res = await addAddress(addressData)
      console.log('添加地址响应:', res)
      
      if (res.success === false) {
        ElMessage.error('添加地址失败: ' + res.message)
        return
      }
      
      ElMessage.success('地址添加成功')
      showAddressDialog.value = false
      
      // 重置表单
      addressForm.name = ''
      addressForm.phone = ''
      addressForm.province = ''
      addressForm.city = ''
      addressForm.district = ''
      addressForm.address = ''
      addressForm.isDefault = false
      
      // 重新加载地址
      await loadAddresses()
      
      // 选中新添加的地址
      if (res.data && res.data.id) {
        selectedAddressId.value = res.data.id
      } else if (addresses.value.length > 0) {
        // 如果无法获取新地址ID，选择第一个地址
        selectedAddressId.value = addresses.value[0].id
      }
      
      // 重新计算运费
      calculateShipping()
    } catch (error) {
      console.error('添加地址请求失败:', error)
      ElMessage.error('添加地址失败: ' + (error.message || '未知错误'))
    }
  } catch (validationError) {
    console.error('表单验证失败:', validationError)
    ElMessage.error('请正确填写表单')
  }
}

// 格式化地址
const formatAddress = (address) => {
  console.log('格式化地址:', address)
  
  if (!address) {
    return '地址信息不完整'
  }
  
  // 组合省市区详细地址
  let formattedAddress = ''
  
  // 添加省市
  if (address.province) formattedAddress += address.province
  if (address.city) formattedAddress += ' ' + address.city
  if (address.district) formattedAddress += ' ' + address.district
  
  // 添加详细地址
  if (formattedAddress && address.address) {
    formattedAddress += ' ' + address.address
  } else if (address.address) {
    formattedAddress = address.address
  }
  
  return formattedAddress || '地址信息不完整'
}

// 确认地址选择
const confirmAddressSelection = () => {
  if (tempSelectedAddressId.value) {
    selectedAddressId.value = tempSelectedAddressId.value
    showAddressSelectionDialog.value = false
    
    // 重新计算运费
    calculateShipping()
  } else {
    ElMessage.warning('请选择一个地址')
  }
}

// 提交订单
const submitOrder = async () => {
  if (!selectedAddressId.value) {
    ElMessage.warning('请选择收货地址')
    return
  }
  
  try {
    // 构建订单数据
    const orderData = {
      addressId: selectedAddressId.value,
      cartItemIds: checkoutItems.value.map(item => item.id)
    }
    
    console.log('提交订单数据:', orderData)
    
    // 创建订单
    const res = await createOrder(orderData)
    console.log('创建订单响应:', res)
    
    if (res.success) {
      // 清空localStorage中的结算商品
      localStorage.removeItem('checkoutItems')
      
      // 显示订单创建成功消息
      ElMessage.success('订单创建成功')
      
      // 跳转到订单详情页
      router.push({
        name: 'OrderDetail',
        params: { id: res.data.id },
        query: { _t: new Date().getTime() }
      })
    } else {
      ElMessage.error(res.message || '订单创建失败')
    }
  } catch (error) {
    console.error('提交订单失败:', error)
    ElMessage.error('提交订单失败: ' + (error.message || '未知错误'))
  }
}
</script>

<style scoped>
.checkout-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
}

.page-title {
  margin-bottom: 20px;
  font-size: 24px;
  color: #333;
}

.checkout-section {
  margin-bottom: 20px;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.goods-item {
  display: flex;
  align-items: center;
}

.goods-image {
  width: 80px;
  height: 80px;
  margin-right: 15px;
  border-radius: 4px;
}

.goods-info {
  display: flex;
  flex-direction: column;
}

.goods-name {
  font-size: 16px;
  margin-bottom: 5px;
}

.price {
  color: #f56c6c;
  font-weight: bold;
}

.address-list {
  width: 100%;
}

.address-items {
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-top: 10px;
  width: 100%;
}

.address-item {
  width: 100%;
  border: 1px solid #dcdfe6;
  border-radius: 8px;
  padding: 15px 20px;
  cursor: pointer;
  position: relative;
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  transition: all 0.3s;
  background-color: #f8faff;
  box-sizing: border-box;
}

.address-selected {
  border-color: #409EFF;
  background-color: #ecf5ff;
}

.address-content {
  flex: 1;
  overflow: hidden;
  padding-right: 20px;
  text-align: left;
}

.name-phone {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 5px;
  flex-wrap: wrap;
}

.name {
  font-size: 16px;
  font-weight: 500;
}

.phone {
  color: #666;
  font-size: 14px;
}

.default-tag {
  background-color: #67c23a;
  color: white;
  padding: 2px 6px;
  border-radius: 4px;
  font-size: 12px;
}

.address-detail {
  color: #666;
  font-size: 14px;
  line-height: 1.4;
  word-break: break-all;
  white-space: normal;
  text-align: left;
}

.radio-container {
  display: flex;
  align-items: center;
  justify-content: center;
  padding-left: 10px;
}

.address-radio {
  margin: 0;
}

.empty-address {
  text-align: center;
  padding: 20px;
  color: #999;
}


.order-amount {
  padding: 10px 20px;
}

.amount-item {
  display: flex;
  justify-content: space-between;
  margin-bottom: 10px;
}

.total {
  margin-top: 20px;
  font-size: 18px;
  font-weight: bold;
  border-top: 1px solid #eee;
  padding-top: 10px;
}

.checkout-actions {
  display: flex;
  justify-content: flex-end;
  gap: 20px;
  margin-top: 20px;
}

.empty-cart {
  text-align: center;
  padding: 50px 0;
}

.selected-address {
  border: 1px solid #409EFF;
  border-radius: 8px;
  padding: 15px 20px;
  background-color: #ecf5ff;
  margin-top: 10px;
}
</style> 
