<template>
  <div class="goods-detail" v-loading="loading">
    <div v-if="goodsInfo.id" class="detail-container">
      <!-- 商品基本信息 -->
      <div class="detail-main">
        <div class="goods-image">
          <el-image :src="goodsInfo.imageUrl" fit="cover" :preview-src-list="[goodsInfo.imageUrl]">
            <template #error>
              <div class="image-error">
                <el-icon><Picture /></el-icon>
                <div>图片加载失败</div>
              </div>
            </template>
          </el-image>
        </div>

        <div class="goods-info">
          <h1 class="goods-name">{{ goodsInfo.name }}</h1>
          
          <div class="goods-price">
            <span class="price-label">价格:</span>
            <span class="price-value">¥{{ goodsInfo.price?.toFixed(2) }}</span>
          </div>
          
          <div class="goods-sales">
            <span>销量: {{ goodsInfo.salesVolume || goodsInfo.sales || 0 }}</span>
            <span class="rating">评分: {{ goodsInfo.rating || 5 }}</span>
          </div>
          
          <div class="goods-stock">
            <span>库存: {{ goodsInfo.stock }}</span>
          </div>
          
          <div class="goods-quantity">
            <span class="quantity-label">数量:</span>
            <el-input-number 
              v-model="quantity" 
              :min="1" 
              :max="goodsInfo.stock || 1"
              size="large"
            />
          </div>
          
          <div class="goods-actions">
            <el-button 
              type="primary" 
              size="large" 
              :disabled="!goodsInfo.stock"
              @click="addToCart"
            >
              加入购物车
            </el-button>
            
            <el-button 
              type="danger" 
              size="large" 
              :disabled="!goodsInfo.stock"
              @click="buyNow"
            >
              立即购买
            </el-button>

            <el-button
              :type="isFavorite ? 'warning' : 'default'"
              size="large"
              :loading="favoriteLoading"
              @click="toggleFavorite"
            >
              <el-icon><Star /></el-icon>
              {{ isFavorite ? '已收藏' : '收藏' }}
            </el-button>
          </div>
        </div>
      </div>
      
      <!-- 商品详情和推荐 -->
      <div class="detail-content">
        <!-- 商品详情 -->
        <div class="goods-description">
          <div class="section-title">
            <h2>商品详情</h2>
          </div>
          <div class="description-content">
            <p>{{ goodsInfo.description || '暂无详情介绍' }}</p>
          </div>
        </div>
        
        <!-- 推荐商品 -->
        <div class="recommend-goods">
          <div class="section-title">
            <h2>推荐商品</h2>
          </div>
          <el-row :gutter="30">
            <el-col 
              :xs="24" 
              :sm="12" 
              :md="6" 
              :lg="6" 
              v-for="item in recommendGoods" 
              :key="item.id"
              class="goods-col"
            >
              <div 
                class="goods-item" 
                @click="goToGoodsDetail(item.id)"
                style="cursor: pointer;"
              >
                <div class="goods-img">
                  <img :src="item.imageUrl" :alt="item.name">
                </div>
                <div class="goods-item-info">
                  <div class="goods-item-name">{{ item.name }}</div>
                  <div class="goods-item-price">¥{{ item.price ? item.price.toFixed(2) : '0.00' }}</div>
                </div>
              </div>
            </el-col>
          </el-row>
        </div>
        
        <!-- 商品评论 -->
        <div class="goods-reviews">
          <div class="section-title">
            <h2>用户评价 ({{ reviewCount }})</h2>
            <el-button type="primary" size="small" @click="openReviewForm" :disabled="hasReviewed">
              <el-icon><ChatDotSquare /></el-icon>
              {{ hasReviewed ? '已评价' : '写评论' }}
            </el-button>
          </div>
          
          <div class="reviews-summary">
            <div class="average-rating">
              <div class="rating-number">{{ averageRating ? averageRating.toFixed(1) : '0.0' }}</div>
              <div class="rating-stars">
                <el-rate v-model="averageRating" disabled show-score text-color="#ff9900" />
              </div>
            </div>
          </div>
          
          <div class="reviews-list" v-loading="reviewsLoading">
            <div v-if="reviews.length === 0" class="empty-reviews">
              暂无评价，快来抢沙发吧！
            </div>
            
            <div v-else>
              <el-card v-for="review in reviews" :key="review.id" class="review-item">
                <div class="review-header">
                  <div class="review-user">
                    <span class="username">{{ review.username }}</span>
                    <el-rate v-model="review.rating" disabled text-color="#ff9900" />
                  </div>
                  <div class="review-date">{{ formatDate(review.createTime) }}</div>
                </div>
                <div class="review-content">{{ review.content }}</div>
                
                <div v-if="review.images" class="review-images">
                  <el-image 
                    v-for="(img, index) in review.images.split(',')" 
                    :key="index"
                    :src="img"
                    :preview-src-list="review.images.split(',')"
                    class="review-image"
                  />
                </div>
                
                <div class="review-actions">
                  <div class="action-buttons">
                    <el-button 
                      :type="likedReviews.get(review.id) ? 'warning' : 'default'" 
                      @click.stop="likeReviewItem(review.id)"
                      class="like-button"
                      size="small"
                    >
                      👍 {{ likedReviews.get(review.id) ? '已点赞' : '点赞' }} ({{ review.likeCount || 0 }})
                    </el-button>
                    <!-- 添加删除按钮，仅当当前用户是评论作者时显示 -->
                    <el-button 
                      v-if="review.userId === userStore.userInfo.id"
                      type="danger" 
                      size="small"
                      @click.stop="handleDeleteReview(review.id)"
                      class="delete-button"
                    >
                      <el-icon><Delete /></el-icon>
                      删除评论
                    </el-button>
                  </div>
                </div>
              </el-card>
            </div>
          </div>
        </div>
        
        <!-- 评论表单对话框 -->
        <el-dialog
          v-model="showReviewForm"
          title="发表评价"
          width="600px"
        >
          <el-form :model="reviewForm" label-width="80px">
            <el-form-item label="选择订单" required>
              <el-select v-model="reviewForm.orderId" placeholder="请选择订单" style="width: 100%">
                <el-option
                  v-for="order in userOrders"
                  :key="order.id"
                  :label="'订单号: ' + order.orderNo + ' (' + formatDate(order.createTime) + ')'"
                  :value="order.id"
                />
              </el-select>
              <div class="el-form-item__tip" v-if="userOrders.length === 0">
                没有找到包含此商品的订单，请先购买此商品
              </div>
            </el-form-item>
            
            <el-form-item label="评分">
              <el-rate v-model="reviewForm.rating" :max="5" />
            </el-form-item>
            
            <el-form-item label="评价内容">
              <el-input
                v-model="reviewForm.content"
                type="textarea"
                :rows="4"
                placeholder="请分享您对商品的使用体验和感受..."
              />
            </el-form-item>
            
            <el-form-item label="上传图片">
              <el-upload
                action=""
                list-type="picture-card"
                :auto-upload="false"
                :on-change="handleFileSelect"
                :before-remove="(file, fileList) => { removeUploadedImage(fileList.indexOf(file)); return true; }"
                :limit="5"
                accept="image/*"
                :file-list="[]"
              >
                <el-icon><Upload /></el-icon>
                <div class="el-upload__text">点击上传</div>
              </el-upload>
              
              <div class="uploaded-images" v-if="reviewImageList.length > 0">
                <div v-for="(img, index) in reviewImageList" :key="index" class="uploaded-image-item">
                  <el-image :src="img" fit="cover" class="preview-image" />
                  <el-button
                    type="danger"
                    circle
                    size="small"
                    class="remove-image-btn"
                    @click="removeUploadedImage(index)"
                  >
                    <el-icon><Delete /></el-icon>
                  </el-button>
                </div>
              </div>
            </el-form-item>
            
            <el-form-item>
              <el-button type="primary" @click="submitReview" :loading="reviewSubmitting">提交评价</el-button>
              <el-button @click="showReviewForm = false">取消</el-button>
            </el-form-item>
          </el-form>
        </el-dialog>
      </div>
    </div>
    
    <div v-else-if="!loading" class="empty-data">
      <el-empty description="商品信息不存在或已下架" />
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, reactive, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Picture, Star, ChatDotSquare, Upload, Delete } from '@element-plus/icons-vue'
import { getGoodsDetail, getRecommendGoods } from '../api/goods'
import { useCartStore } from '../store/cart'
import { useUserStore } from '../store/user'
import { createOrder, getUserOrders } from '../api/order'
import { getUserAddresses } from '../api/address'
import { addFavorite, removeFavorite, checkFavorite } from '../api/favorite'
import { getGoodsReviews, addReview, likeReview, unlikeReview, checkLiked, uploadReviewImage, getGoodsRating, getGoodsReviewCount, deleteReview, checkReviewed } from '../api/review'
import Compressor from 'compressorjs' // 导入图片压缩库

const route = useRoute()
const router = useRouter()
const cartStore = useCartStore()
const userStore = useUserStore()

let goodsId = route.params.id
const goodsInfo = ref({})
const recommendGoods = ref([])
const loading = ref(true)
const quantity = ref(1)
const isFavorite = ref(false)
const favoriteLoading = ref(false)

// 评论相关
const reviews = ref([])
const reviewsLoading = ref(false)
const reviewCount = ref(0)
const averageRating = ref(0)
const hasReviewed = ref(false) // 用户是否已评价过该商品
const reviewForm = reactive({
  rating: 5,
  content: '',
  images: '',
  orderId: null
})
const showReviewForm = ref(false)
const reviewSubmitting = ref(false)
const uploadImageLoading = ref(false)
const reviewImageList = ref([])
const imageFiles = ref([])
const uploadedImageUrls = ref([])
// 记录用户对评论的点赞状态
const likedReviews = ref(new Map())
// 用户订单列表
const userOrders = ref([])
const ordersLoading = ref(false)

onMounted(async () => {
  await fetchGoodsDetail()
  await fetchRecommendGoods()
  if (userStore.isLoggedIn) {
    await checkIsFavorite()
    await checkUserReviewed() // 检查用户是否已评价
  }
  await fetchReviews()
  await fetchReviewStats()
})

// 监听路由参数变化，当商品ID变化时重新加载数据
watch(() => route.params.id, async (newId, oldId) => {
  if (newId !== oldId) {
    goodsId = newId
    loading.value = true
    await fetchGoodsDetail()
    await fetchRecommendGoods()
    if (userStore.isLoggedIn) {
      await checkIsFavorite()
      await checkUserReviewed() // 检查用户是否已评价
    }
    await fetchReviews()
    await fetchReviewStats()
  }
})

// 监听query参数，处理从订单页跳转过来的评价请求
watch(() => route.query, async (query) => {
  if (query.review === 'true' && query.orderId && userStore.isLoggedIn) {
    // 等待商品数据加载完成
    if (loading.value) {
      await new Promise(resolve => {
        const checkLoading = setInterval(() => {
          if (!loading.value) {
            clearInterval(checkLoading)
            resolve()
          }
        }, 100)
      })
    }
    
    // 设置订单ID并打开评价表单
    await fetchUserOrders()
    
    // 找到匹配的订单并设置
    const orderId = Number(query.orderId)
    if (userOrders.value.some(order => order.id === orderId)) {
      reviewForm.orderId = orderId
      showReviewForm.value = true
    }
  }
}, { immediate: true })

const fetchGoodsDetail = async () => {
  loading.value = true
  try {
    const res = await getGoodsDetail(goodsId)
    if (res.data) {
      goodsInfo.value = {
        ...res.data,
        // 确保价格和销量字段存在且类型正确
        price: Number(res.data.price || res.data.goodsPrice || 0),
        sales: res.data.salesVolume || res.data.sales || res.data.salesCount || 0,
        rating: res.data.rating || 5
      }
    }
  } catch (error) {
    ElMessage.error('获取商品详情失败')
  } finally {
    loading.value = false
  }
}

const fetchRecommendGoods = async () => {
  try {
    const res = await getRecommendGoods(5)
    // 过滤掉当前商品，确保至少有4个推荐商品
    recommendGoods.value = (res.data || [])
      .filter(item => item.id !== Number(goodsId))
      .slice(0, 4)
  } catch (error) {
    ElMessage.error('获取推荐商品失败')
  }
}

const addToCart = async () => {
  if (!userStore.isLoggedIn) {
    ElMessage.warning('请先登录')
    router.push('/login')
    return
  }
  
  try {
    await cartStore.addToCart(goodsId, quantity.value)
  } catch (error) {
    ElMessage.error('添加购物车失败')
  }
}

const buyNow = async () => {
  if (!userStore.isLoggedIn) {
    ElMessage.warning('请先登录')
    router.push('/login')
    return
  }
  
  try {
    // 获取用户地址列表
    const addressRes = await getUserAddresses()
    let addresses = []
    
    // 处理地址数据
    if (Array.isArray(addressRes)) {
      addresses = addressRes
    } else if (addressRes.data && Array.isArray(addressRes.data)) {
      addresses = addressRes.data
    } else if (addressRes.success && Array.isArray(addressRes.data)) {
      addresses = addressRes.data
    }
    
    // 检查是否有地址
    if (!addresses || addresses.length === 0) {
      ElMessage.warning('请先添加收货地址')
      router.push('/address')
      return
    }
    
    // 获取默认地址或第一个地址
    const defaultAddress = addresses.find(addr => addr.isDefault === true || addr.isDefault === 1)
    const addressId = defaultAddress ? defaultAddress.id : addresses[0].id
    
    // 构建订单数据 - 使用直接购买模式
    const orderData = {
      addressId: addressId,
      goodsId: Number(goodsId),
      quantity: quantity.value
    }
    
    // 创建订单
    const res = await createOrder(orderData)
    
    if (res.success) {
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
    ElMessage.error('立即购买失败: ' + (error.message || '未知错误'))
  }
}

const goToGoodsDetail = (id) => {
  if (id === Number(goodsId)) return
  router.push({
    path: `/goods/${id}`,
    replace: false
  })
  // 确保页面滚动到顶部
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

const checkIsFavorite = async () => {
  if (!userStore.isLoggedIn) return
  
  try {
    favoriteLoading.value = true
    const res = await checkFavorite(goodsId)
    isFavorite.value = res.data === true
  } catch (error) {
    ElMessage.error('检查收藏状态失败')
  } finally {
    favoriteLoading.value = false
  }
}

const toggleFavorite = async () => {
  if (!userStore.isLoggedIn) {
    ElMessage.warning('请先登录')
    router.push('/login')
    return
  }
  
  try {
    favoriteLoading.value = true
    if (isFavorite.value) {
      // 取消收藏
      await removeFavorite(goodsId)
      isFavorite.value = false
      ElMessage.success('已取消收藏')
    } else {
      // 添加收藏
      await addFavorite(goodsId)
      isFavorite.value = true
      ElMessage.success('收藏成功')
    }
  } catch (error) {
    ElMessage.error('操作失败: ' + (error.message || '未知错误'))
  } finally {
    favoriteLoading.value = false
  }
}

// 获取商品评论列表
const fetchReviews = async () => {
  reviewsLoading.value = true
  try {
    const res = await getGoodsReviews(goodsId)
    reviews.value = res.data || []
    
    // 如果用户已登录，检查每条评论的点赞状态
    if (userStore.isLoggedIn && reviews.value.length > 0) {
      await checkReviewsLikeStatus()
    }
  } catch (error) {
    ElMessage.error('获取商品评论失败')
  } finally {
    reviewsLoading.value = false
  }
}

// 检查用户对评论的点赞状态
const checkReviewsLikeStatus = async () => {
  try {
    // 清空之前的点赞状态
    likedReviews.value.clear()
    
    // 并行检查所有评论的点赞状态
    await Promise.all(reviews.value.map(async (review) => {
      try {
        const res = await checkLiked(review.id)
        if (res.data === true) {
          likedReviews.value.set(review.id, true)
        }
      } catch (error) {
        // 忽略单个评论点赞状态检查错误
      }
    }))
  } catch (error) {
    // 忽略整体检查错误
  }
}

// 获取评论统计数据
const fetchReviewStats = async () => {
  try {
    // 获取评论数量
    const countRes = await getGoodsReviewCount(goodsId)
    reviewCount.value = countRes.data || 0
    
    // 获取平均评分
    const ratingRes = await getGoodsRating(goodsId)
    averageRating.value = ratingRes.data || 5
  } catch (error) {
    ElMessage.error('获取评论统计数据失败')
  }
}

// 检查用户是否已评价过该商品
const checkUserReviewed = async () => {
  if (!userStore.isLoggedIn) return

  try {
    // 获取用户订单列表
    const res = await getUserOrders()
    
    let orderList = []
    if (res.data && Array.isArray(res.data.list)) {
      orderList = res.data.list
    } else if (Array.isArray(res.data)) {
      orderList = res.data
    } else {
      console.warn('订单数据格式异常:', res.data)
    }
    
    // 过滤出包含当前商品的订单
    const relevantOrders = orderList.filter(order => {
      if (!order.orderItems || !Array.isArray(order.orderItems)) {
        console.warn('订单缺少orderItems数组:', order.id)
        return false
      }
      
      // 检查订单中是否包含当前商品
      const hasItem = order.orderItems.some(item => {
        const itemGoodsId = Number(item.goodsId)
        const currentGoodsId = Number(goodsId)
        return itemGoodsId === currentGoodsId
      })
      
      return hasItem
    })
    
    if (relevantOrders.length === 0) {
      // 没有相关订单，不需要继续检查
      hasReviewed.value = false
      return
    }
    
    // 检查每个订单是否已评价
    let allReviewed = true
    
    for (const order of relevantOrders) {
      try {
        const checkResult = await checkReviewed(Number(goodsId), order.id)
        
        // 检查响应格式
        if (typeof checkResult === 'object') {
          if (checkResult.success === true && checkResult.data === true) {
            // 已评价
          } else {
            // 未评价
            allReviewed = false
            break
          }
        } else {
          console.warn('检查评价接口返回格式异常:', checkResult)
          allReviewed = false
          break
        }
      } catch (error) {
        console.error('检查评价状态失败:', error)
        allReviewed = false
        break
      }
    }
    
    hasReviewed.value = allReviewed
  } catch (error) {
    console.error('检查用户评价状态失败:', error)
    hasReviewed.value = false
  }
}

// 打开评论表单
const openReviewForm = async () => {
  if (!userStore.isLoggedIn) {
    ElMessage.warning('请先登录')
    router.push('/login')
    return
  }
  
  // 如果用户已评价，提示用户
  if (hasReviewed.value) {
    ElMessage.info('您已经评价过该商品')
    return
  }
  
  // 获取用户订单列表
  await fetchUserOrders()
  
  // 如果没有相关订单，提示用户
  if (userOrders.value.length === 0) {
    ElMessage.warning('您需要先购买此商品才能评价')
    return
  }
  
  showReviewForm.value = true
}

// 获取用户订单列表
const fetchUserOrders = async () => {
  ordersLoading.value = true
  try {
    const res = await getUserOrders()
    
    // 处理分页数据结构，订单数组在res.data.list中
    const orderList = res.data && res.data.list ? res.data.list : []
    
    // 过滤出包含当前商品的订单
    userOrders.value = orderList.filter(order => {
      // 检查订单中是否包含当前商品
      return order.orderItems && order.orderItems.some(item => item.goodsId === Number(goodsId))
    })
    
    // 如果有相关订单，默认选择第一个
    if (userOrders.value.length > 0) {
      reviewForm.orderId = userOrders.value[0].id
    }
  } catch (error) {
    ElMessage.error('获取订单信息失败')
  } finally {
    ordersLoading.value = false
  }
}

// 处理文件选择
const handleFileSelect = (file) => {
  // 获取实际的文件对象
  const rawFile = file.raw || file
  
  // 验证文件类型和大小
  if (!rawFile.type || !rawFile.type.startsWith('image/')) {
    ElMessage.error('只能上传图片文件!')
    return false
  }
  
  const isLt2M = rawFile.size / 1024 / 1024 < 2
  
  if (!isLt2M) {
    ElMessage.error('图片大小不能超过 2MB!')
    return false
  }
  
  // 保存文件对象到数组
  imageFiles.value.push(rawFile)
  
  // 创建预览
  const reader = new FileReader()
  reader.onload = (e) => {
    const previewUrl = e.target.result
    reviewImageList.value.push(previewUrl) // 仅用于UI预览
  }
  reader.readAsDataURL(rawFile)
  
  return false // 阻止自动上传
}

// 删除已选择的图片
const removeUploadedImage = (index) => {
  if (index < 0 || index >= reviewImageList.value.length) {
    return
  }
  
  // 从预览列表中删除
  reviewImageList.value.splice(index, 1)
  
  // 从文件列表中删除
  if (index < imageFiles.value.length) {
    imageFiles.value.splice(index, 1)
  }
  
  // 如果已经上传了，也从已上传URL列表中删除
  if (index < uploadedImageUrls.value.length) {
    uploadedImageUrls.value.splice(index, 1)
  }
}

// 上传选择的图片
const uploadImages = async () => {
  if (imageFiles.value.length === 0) {
    return []
  }
  
  uploadImageLoading.value = true
  const urls = []
  
  try {
    // 逐个上传图片
    for (const file of imageFiles.value) {
      try {
        // 使用Compressor压缩图片
        const compressedFile = await new Promise((resolve, reject) => {
          new Compressor(file, {
            quality: 0.8, // 压缩质量，范围0-1
            maxWidth: 1200, // 最大宽度
            maxHeight: 1200, // 最大高度
            success(result) {
              resolve(result)
            },
            error(err) {
              reject(err)
            }
          })
        })
        
        const formData = new FormData()
        formData.append('file', compressedFile, file.name)
        
        const res = await uploadReviewImage(formData)
        
        if (res && res.data) {
          const imageUrl = res.data
          
          if (typeof imageUrl === 'string') {
            urls.push(imageUrl)
            ElMessage.success(`图片 ${file.name} 上传成功`)
          } else {
            ElMessage.error(`图片 ${file.name} 上传失败: 返回的URL格式不正确`)
          }
        } else {
          ElMessage.error(`图片 ${file.name} 上传失败: 服务器返回异常`)
        }
      } catch (error) {
        ElMessage.error(`图片 ${file.name} 上传失败: ${error.message || '未知错误'}`)
      }
    }
    
    // 更新已上传图片URL列表
    uploadedImageUrls.value = urls
    
    // 将图片URL转为逗号分隔的字符串
    const imagesStr = urls.join(',')
    reviewForm.images = imagesStr
    
    return urls
  } catch (error) {
    ElMessage.error('上传图片失败: ' + (error.message || '未知错误'))
    return []
  } finally {
    uploadImageLoading.value = false
  }
}

// 提交评论
const submitReview = async () => {
  if (!reviewForm.orderId) {
    ElMessage.warning('请选择订单')
    return
  }
  
  if (!reviewForm.content.trim()) {
    ElMessage.warning('请输入评论内容')
    return
  }
  
  reviewSubmitting.value = true
  try {
    // 先上传图片
    await uploadImages()
    
    // 构建评论数据对象
    const reviewData = {
      goodsId: Number(goodsId),
      orderId: reviewForm.orderId,
      rating: reviewForm.rating,
      content: reviewForm.content,
      images: reviewForm.images
    }
    
    // 发送评论请求
    const response = await addReview(reviewData)
    
    if (response.success || response.code === 200) {
      ElMessage.success('评论提交成功')
      
      // 重置表单
      reviewForm.rating = 5
      reviewForm.content = ''
      reviewForm.orderId = null
      reviewForm.images = ''
      reviewImageList.value = []
      imageFiles.value = []
      uploadedImageUrls.value = []
      
      // 关闭表单
      showReviewForm.value = false
      
      // 刷新评论列表和统计数据
      await fetchReviews()
      await fetchReviewStats()
      
      // 重新检查评价状态
      await checkUserReviewed()
      
      // 如果是从订单列表页跳转过来的，返回订单列表页并传递评价完成的信息
      if (route.query.fromOrders === 'true') {
        const orderId = route.query.orderId
        const itemId = route.query.itemId
        
        // 返回订单列表页
        router.push({
          path: '/orders',
          query: {
            reviewed: 'true',
            orderId: orderId,
            goodsId: goodsId,
            itemId: itemId,
            timestamp: Date.now() // 添加时间戳确保URL唯一，避免缓存
          }
        })
      }
    } else {
      ElMessage.error('评论提交失败: ' + (response.message || '未知错误'))
    }
  } catch (error) {
    ElMessage.error('提交评论失败: ' + (error.message || '未知错误'))
  } finally {
    reviewSubmitting.value = false
  }
}

// 点赞评论
const likeReviewItem = async (reviewId) => {
  if (!userStore.isLoggedIn) {
    ElMessage.warning('请先登录')
    router.push('/login')
    return
  }
  
  try {
    const isLiked = likedReviews.value.get(reviewId)
    
    if (isLiked) {
      // 已点赞，执行取消点赞
      await unlikeReview(reviewId)
      likedReviews.value.delete(reviewId)
      ElMessage.success('已取消点赞')
      
      // 更新点赞数
      const index = reviews.value.findIndex(item => item.id === reviewId)
      if (index !== -1 && reviews.value[index].likeCount > 0) {
        reviews.value[index].likeCount -= 1
      }
    } else {
      // 未点赞，执行点赞
      await likeReview(reviewId)
      likedReviews.value.set(reviewId, true)
      ElMessage.success('点赞成功')
      
      // 更新点赞数
      const index = reviews.value.findIndex(item => item.id === reviewId)
      if (index !== -1) {
        reviews.value[index].likeCount = (reviews.value[index].likeCount || 0) + 1
      }
    }
  } catch (error) {
    ElMessage.error('操作失败: ' + (error.message || '未知错误'))
  }
}

// 删除评论
const handleDeleteReview = async (reviewId) => {
  ElMessageBox.confirm('确定要删除这条评论吗？', '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(async () => {
    try {
      const res = await deleteReview(reviewId)
      
      if (res.success || res.code === 200) {
        ElMessage.success('评论已删除')
        // 刷新评论列表
        await fetchReviews()
        await fetchReviewStats()
      } else {
        ElMessage.error('删除评论失败: ' + (res.message || '未知错误'))
      }
    } catch (error) {
      ElMessage.error('删除评论失败: ' + (error.message || '未知错误'))
    }
  }).catch(() => {
    // 用户取消操作
  })
}

// 格式化日期
const formatDate = (dateStr) => {
  if (!dateStr) return ''
  const date = new Date(dateStr)
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`
}
</script>

<style scoped>
.goods-detail {
  min-height: 400px;
}

.detail-container {
  background-color: #fff;
  border-radius: 8px;
  overflow: hidden;
}

.detail-main {
  display: flex;
  padding: 20px;
}

.goods-image {
  width: 400px;
  height: 400px;
  margin-right: 40px;
  border: 1px solid #eee;
  border-radius: 4px;
  overflow: hidden;
}

.image-error {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  height: 100%;
  color: #999;
}

.goods-info {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.goods-name {
  font-size: 24px;
  color: #333;
  margin-bottom: 20px;
}

.goods-price {
  margin-bottom: 15px;
}

.price-label {
  font-size: 16px;
  color: #666;
}

.price-value {
  font-size: 28px;
  color: #f56c6c;
  font-weight: bold;
  margin-left: 10px;
}

.goods-sales {
  margin-bottom: 15px;
  font-size: 14px;
  color: #666;
}

.rating {
  margin-left: 20px;
}

.goods-stock {
  margin-bottom: 20px;
  font-size: 14px;
  color: #666;
}

.goods-quantity {
  display: flex;
  align-items: center;
  margin-bottom: 30px;
}

.quantity-label {
  margin-right: 10px;
  font-size: 16px;
  color: #666;
}

.goods-actions {
  display: flex;
  gap: 20px;
}

.detail-content {
  padding: 0 20px 20px;
}

.goods-description {
  margin-bottom: 30px;
}

.section-title {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 25px;
  padding-bottom: 15px;
  border-bottom: 1px solid #ddd;
}

.section-title h2 {
  font-size: 1.5rem;
  color: #333;
  margin: 0;
  font-weight: bold;
}

.description-content {
  padding: 20px 0;
}

.goods-reviews {
  margin-top: 30px;
  margin-bottom: 30px;
  padding-top: 20px;
  border-top: 1px solid #eee;
}

.reviews-summary {
  margin-bottom: 20px;
}

.average-rating {
  display: flex;
  align-items: center;
}

.rating-number {
  font-size: 24px;
  color: #f56c6c;
  font-weight: bold;
  margin-right: 10px;
}

.rating-stars {
  margin-right: 10px;
}

.reviews-list {
  margin-bottom: 20px;
}

.empty-reviews {
  text-align: center;
  color: #999;
}

.review-item {
  margin-bottom: 20px;
  position: relative;
  padding-bottom: 40px;
}

.review-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
}

.review-user {
  display: flex;
  align-items: center;
}

.username {
  font-size: 14px;
  color: #333;
  margin-right: 10px;
}

.review-date {
  font-size: 12px;
  color: #999;
}

.review-content {
  margin-bottom: 10px;
}

.review-images {
  margin-bottom: 10px;
}

.review-image {
  width: 100px;
  height: 100px;
  object-fit: cover;
  margin-right: 5px;
}

.review-actions {
  position: absolute;
  bottom: 10px;
  right: 10px;
  display: flex;
  justify-content: flex-end;
  align-items: center;
}

.action-buttons {
  display: flex;
  gap: 10px;
}

.like-button, .delete-button {
  display: flex;
  align-items: center;
  gap: 5px;
}

.uploaded-images {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-top: 10px;
}

.uploaded-image-item {
  position: relative;
  width: 100px;
  height: 100px;
}

.preview-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.remove-image-btn {
  position: absolute;
  top: -10px;
  right: -10px;
  padding: 4px;
}

.recommend-goods {
  padding: 20px 0;
  margin-top: 30px;
  margin-bottom: 40px;
}

.recommend-goods .el-row {
  margin-bottom: 20px;
}

.goods-col {
  margin-bottom: 30px;
}

.goods-item {
  background-color: #fff;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  transition: all 0.3s;
  cursor: pointer;
  height: 100%;
  display: flex;
  flex-direction: column;
  position: relative;
  z-index: 1;
}

.goods-item:hover {
  transform: translateY(-5px);
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.1);
}

.goods-img {
  height: 200px;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
}

.goods-img img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.goods-item-info {
  padding: 15px;
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
}

.goods-item-name {
  font-size: 14px;
  color: #333;
  margin-bottom: 10px;
  height: 42px;
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  line-height: 1.5;
}

.goods-item-price {
  font-size: 18px;
  color: #f56c6c;
  font-weight: bold;
  margin-top: auto;
}

.empty-data {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 400px;
}
</style> 