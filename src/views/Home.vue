<template>
  <div class="home">
    <!-- 轮播图 -->
    <div class="banner">
      <el-carousel :interval="5000" height="500px" arrow="always">
        <el-carousel-item v-for="(banner, index) in banners" :key="index">
          <img :src="banner.img" :alt="banner.title" class="banner-img">
        </el-carousel-item>
      </el-carousel>
    </div>
    
    <!-- 分类导航 -->
    <div class="category-nav">
      <div class="section-title">
        <h2>商品分类</h2>
      </div>
      <el-row :gutter="30">
        <el-col :span="4" v-for="category in categories" :key="category.id" class="category-col">
          <div class="category-item" @click="goToCategory(category.id)">
            <el-icon size="36px">
              <component :is="getCategoryIcon(category.id)"></component>
            </el-icon>
            <div class="category-name">{{ category.name }}</div>
          </div>
        </el-col>
      </el-row>
    </div>
    
    <!-- 推荐商品 -->
    <div class="recommend-goods">
      <div class="section-title">
        <h2>推荐商品</h2>
        <a href="javascript:void(0)" @click="navigateTo('/category/0')" class="more-link">查看更多</a>
      </div>
      <el-row :gutter="20">
        <el-col 
          :xs="12" 
          :sm="12" 
          :md="6" 
          :lg="6" 
          v-for="goods in recommendGoods" 
          :key="goods.id"
          class="goods-col"
        >
          <div class="goods-item" @click="goToGoodsDetail(goods.id)">
            <div class="goods-img">
              <img :src="goods.imageUrl" :alt="goods.name">
            </div>
            <div class="goods-info">
              <div class="goods-name">{{ goods.name }}</div>
              <div class="goods-price">¥{{ goods.price ? goods.price.toFixed(2) : '0.00' }}</div>
              <div class="goods-sales">已售 {{ goods.salesVolume || goods.sales || 0 }}</div>
            </div>
          </div>
        </el-col>
      </el-row>
    </div>
    
    <!-- 猜你喜欢 -->
    <div class="new-goods">
      <div class="section-title">
        <h2>猜你喜欢</h2>
        <a href="javascript:void(0)" @click="navigateTo('/category/0', { sortBy: 'sales' })" class="more-link">查看更多</a>
      </div>
      <el-row :gutter="20">
        <el-col 
          :xs="12" 
          :sm="12" 
          :md="6" 
          :lg="6" 
          v-for="goods in popularGoods" 
          :key="goods.id"
          class="goods-col"
        >
          <div class="goods-item" @click="goToGoodsDetail(goods.id)">
            <div class="goods-img">
              <img :src="goods.imageUrl" :alt="goods.name">
            </div>
            <div class="goods-info">
              <div class="goods-name">{{ goods.name }}</div>
              <div class="goods-price">¥{{ goods.price ? goods.price.toFixed(2) : '0.00' }}</div>
              <div class="goods-sales">已售 {{ goods.salesVolume || goods.sales || 0 }}</div>
            </div>
          </div>
        </el-col>
      </el-row>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue'
import { useRouter } from 'vue-router'
import { GoodsFilled, Cellphone, Monitor, HomeFilled, ShoppingBag, Apple, Star, Basketball, Reading, Present, Van, House, Watch } from '@element-plus/icons-vue'
import { getGoodsList, getRecommendGoods } from '../api/goods'
import { getCategoryList } from '../api/category'

const router = useRouter()
const categories = ref([])
const recommendGoods = ref([])
const popularGoods = ref([])

// 轮播图数据
const banners = ref([
  {
    img: '/img/003.jpg',
    title: '轮播图1',
  },
  {
    img: '/img/004.jpg',
    title: '轮播图2',
  },
  {
    img: '/img/006.jpg',
    title: '轮播图3',
  }
])

onMounted(async () => {
  console.log('Home组件已挂载')
  fetchData()
  
  // 添加强制刷新事件监听器
  window.addEventListener('reload-page', handleReload)
})

onBeforeUnmount(() => {
  // 移除事件监听器
  window.removeEventListener('reload-page', handleReload)
})

// 处理强制刷新
const handleReload = () => {
  console.log('Home组件接收到强制刷新事件')
  fetchData()
}

const fetchData = async () => {
  try {
    console.log('开始获取Home页面数据')
    
    // 并行请求所有数据，提高加载速度
    const [categoryRes, recommendRes, popularGoodsRes] = await Promise.all([
      getCategoryList(0).catch(err => {
        console.error('获取分类列表失败:', err)
        return { data: [] }
      }),
      getRecommendGoods(8).catch(err => {
        console.error('获取推荐商品失败:', err)
        return { data: [] }
      }),
      getGoodsList({ sortBy: 'sales', sortDirection: 'desc', pageSize: 20 }).catch(err => {
        console.error('获取热销商品失败:', err)
        return { data: [] }
      })
    ])
    
    // 更新数据
    categories.value = categoryRes.data || []
    
    // 确保推荐商品数据格式正确
    recommendGoods.value = (recommendRes.data || []).map(item => ({
      ...item,
      price: Number(item.price || 0),
      sales: item.salesVolume || item.sales || 0
    }))
    
    // 确保热销商品数据格式正确
    // 处理可能的不同响应格式
    let popularGoodsData = []
    if (popularGoodsRes.data && popularGoodsRes.data.list && Array.isArray(popularGoodsRes.data.list)) {
      // 如果返回的是带分页的格式，取list字段
      popularGoodsData = popularGoodsRes.data.list
    } else if (Array.isArray(popularGoodsRes.data)) {
      // 如果直接返回数组
      popularGoodsData = popularGoodsRes.data
    }
    
    // 处理每个商品对象，确保price是数值类型
    popularGoods.value = popularGoodsData.map(item => ({
      ...item,
      price: Number(item.price || 0),
      sales: item.salesVolume || item.sales || 0
    }))
    
    console.log('分类数据:', categories.value)
    console.log('推荐商品:', recommendGoods.value)
    console.log('热销商品:', popularGoods.value)
    
    console.log('Home页面数据获取完成')
  } catch (error) {
    console.error('获取首页数据失败:', error)
    
    // 确保组件不会因为错误而显示空白
    if (categories.value.length === 0) categories.value = []
    if (recommendGoods.value.length === 0) recommendGoods.value = []
    if (popularGoods.value.length === 0) popularGoods.value = []
  }
}

// 通用导航函数
const navigateTo = (path, query = {}) => {
  console.log(`导航到: ${path}`, query)
  
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

const goToCategory = (categoryId) => {
  console.log(`导航到分类: ${categoryId}`)
  router.push(`/category/${categoryId}`)
}

const goToGoodsDetail = (goodsId) => {
  router.push(`/goods/${goodsId}`)
}

// 根据分类ID获取对应图标
const getCategoryIcon = (categoryId) => {
  const iconMap = {
    1: Cellphone,     // 手机数码
    2: Monitor,       // 电脑办公
    3: HomeFilled,    // 家用电器
    4: ShoppingBag,   // 服装鞋包
    5: Apple,         // 食品生鲜
    6: Star,         // 美妆护肤
    7: Basketball,    // 运动户外
    8: Reading,       // 图书音像
    67: Present,       // 母婴玩具
    68: Van,          // 汽车用品
    69: House,        // 家居生活
    70: Watch,    // 珠宝首饰
  }
  return iconMap[categoryId] || GoodsFilled  // 默认图标
}
</script>

<style scoped>
.home {
  margin-top: 20px;
}

.banner {
  margin-bottom: 40px;
  border-radius: 8px;
  overflow: hidden;
}

.banner-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.banner-info {
  position: absolute;
  top: 50%;
  left: 50px;
  transform: translateY(-50%);
  color: #fff;
  text-shadow: 0 1px 3px rgba(0, 0, 0, 0.3);
  max-width: 500px;
}

.banner-info h2 {
  font-size: 2.5rem;
  margin-bottom: 10px;
}

.banner-info p {
  font-size: 1.2rem;
  margin-bottom: 20px;
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

.more-link {
  color: #409EFF;
  text-decoration: none;
}

.category-nav {
  margin-bottom: 40px;
}

.category-col {
  margin-bottom: 30px;
}

.category-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 20px;
  background-color: #ffffff;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  height: 100%;
}

.category-item:hover {
  background-color: #e6f2ff;
  transform: translateY(-5px);
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.1);
}

.category-name {
  margin-top: 10px;
  font-size: 14px;
}

.recommend-goods,
.new-goods {
  margin-bottom: 40px;
}

.goods-col {
  margin-bottom: 20px;
}

.goods-item {
  background-color: #fff;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  transition: all 0.3s;
  cursor: pointer;
}

.goods-item:hover {
  transform: translateY(-5px);
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.1);
}

.goods-img {
  position: relative;
  width: 100%;
  padding-top: 100%; /* 创建1:1的宽高比 */
  overflow: hidden;
}

.goods-img img {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.3s;
}

.goods-item:hover .goods-img img {
  transform: scale(1.05);
}

.goods-info {
  padding: 15px;
  position: relative;
}

.goods-name {
  font-size: 14px;
  color: #333;
  margin-bottom: 10px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.goods-price {
  font-size: 18px;
  color: #f56c6c;
  font-weight: bold;
}

.goods-sales {
  font-size: 12px;
  color: #999;
  margin-top: 5px;
}

.goods-tag {
  position: absolute;
  top: 15px;
  right: 15px;
  background-color: #f56c6c;
  color: #fff;
  font-size: 12px;
  padding: 2px 6px;
  border-radius: 4px;
}
</style> 