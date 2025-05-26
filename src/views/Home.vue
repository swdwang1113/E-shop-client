<template>
  <div class="home">
    <!-- 轮播图 -->
    <div class="banner">
      <el-carousel :interval="5000" height="400px" arrow="always">
        <el-carousel-item v-for="(banner, index) in banners" :key="index">
          <img :src="banner.img" :alt="banner.title" class="banner-img">
          <div class="banner-info">
            <h2>{{ banner.title }}</h2>
            <p>{{ banner.desc }}</p>
            <el-button type="primary" size="large" @click="navigateTo(banner.link)">
              查看详情
            </el-button>
          </div>
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
            <el-icon size="36px"><GoodsFilled /></el-icon>
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
              <div class="goods-price">¥{{ goods.price.toFixed(2) }}</div>
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
              <div class="goods-price">¥{{ goods.price.toFixed(2) }}</div>
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
import { GoodsFilled } from '@element-plus/icons-vue'
import { getGoodsList, getRecommendGoods } from '../api/goods'
import { getCategoryList } from '../api/category'

const router = useRouter()
const categories = ref([])
const recommendGoods = ref([])
const popularGoods = ref([])

// 模拟轮播图数据
const banners = ref([
  {
    img: 'https://via.placeholder.com/1200x400',
    title: '夏季新品',
    desc: '清凉一夏，折扣多多',
    link: '/category/1'
  },
  {
    img: 'https://via.placeholder.com/1200x400',
    title: '电子产品',
    desc: '最新科技，尽在掌握',
    link: '/category/2'
  },
  {
    img: 'https://via.placeholder.com/1200x400',
    title: '家居好物',
    desc: '温馨家居，品质生活',
    link: '/category/3'
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
      getGoodsList({ sortBy: 'sales', limit: 6 }).catch(err => {
        console.error('获取热销商品失败:', err)
        return { data: [] }
      })
    ])
    
    // 更新数据
    categories.value = categoryRes.data || []
    recommendGoods.value = recommendRes.data || []
    popularGoods.value = popularGoodsRes.data || []
    
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
  height: 200px;
  overflow: hidden;
}

.goods-img img {
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