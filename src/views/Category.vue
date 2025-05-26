<template>
  <div class="category">
    <div class="category-header">
      <h2 class="category-title">{{ categoryName }}</h2>
    </div>

    <!-- 子分类导航 -->
    <div v-if="categoryId > 0 && subCategories.length > 0" class="sub-categories">
      <div class="sub-categories-title">子分类:</div>
      <div class="sub-categories-list">
        <el-button 
          size="large"
          :type="subCategoryId === 0 ? 'primary' : 'default'"
          @click="goToCategory(0)"
        >
          全部
        </el-button>
        <el-button 
          v-for="subCategory in subCategories" 
          :key="subCategory.id"
          size="large"
          :type="subCategoryId === subCategory.id ? 'primary' : 'default'"
          @click="goToCategory(subCategory.id)"
        >
          {{ subCategory.name }}
        </el-button>
      </div>
    </div>

    <!-- 排序方式导航 -->
    <div class="sort-nav">
      <div class="sort-nav-title">排序方式:</div>
      <div class="sort-nav-list">
        <el-button 
          size="large"
          :type="sortBy === '' ? 'primary' : 'default'"
          @click="changeSortBy('')"
        >
          默认排序
        </el-button>
        <el-button 
          size="large"
          :type="sortBy === 'price:asc' ? 'primary' : 'default'"
          @click="changeSortBy('price:asc')"
        >
          价格从低到高
        </el-button>
        <el-button 
          size="large"
          :type="sortBy === 'price:desc' ? 'primary' : 'default'"
          @click="changeSortBy('price:desc')"
        >
          价格从高到低
        </el-button>
        <el-button 
          size="large"
          :type="sortBy === 'sales:desc' ? 'primary' : 'default'"
          @click="changeSortBy('sales:desc')"
        >
          销量优先
        </el-button>
        <el-button 
          size="large"
          :type="sortBy === 'rating:desc' ? 'primary' : 'default'"
          @click="changeSortBy('rating:desc')"
        >
          好评优先
        </el-button>
        <el-button 
          size="large"
          :type="sortBy === 'newest' ? 'primary' : 'default'"
          @click="changeSortBy('newest')"
        >
          最新上架
        </el-button>
      </div>
    </div>

    <div class="goods-list">
      <el-row v-loading="loading" :gutter="20">
        <el-col 
          :xs="12" 
          :sm="12" 
          :md="6" 
          :lg="6" 
          v-for="goods in goodsList" 
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

      <div v-if="goodsList.length === 0 && !loading" class="empty-data">
        <el-empty description="暂无商品数据" />
      </div>

      <div class="pagination" v-if="goodsList.length > 0">
        <el-pagination
          v-model:current-page="currentPage"
          v-model:page-size="pageSize"
          :page-sizes="[12, 24, 36, 48]"
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
import { ref, onMounted, computed, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { getGoodsList } from '../api/goods'
import { getCategoryDetail, getCategoryList } from '../api/category'

const route = useRoute()
const router = useRouter()
const categoryId = computed(() => Number(route.params.categoryId))
const keyword = computed(() => route.query.keyword)
const subCategoryId = computed(() => Number(route.query.subCategoryId || 0))

const goodsList = ref([])
const loading = ref(false)
const categoryName = ref('全部商品')
const subCategories = ref([])
const sortBy = ref('')
const currentPage = ref(1)
const pageSize = ref(12)
const total = ref(0)

watch(() => categoryId.value, () => {
  sortBy.value = route.query.sortBy || ''
  currentPage.value = 1
  fetchCategories()
  fetchGoods()
})

watch(() => subCategoryId.value, () => {
  fetchGoods()
})

onMounted(() => {
  fetchCategories()
  fetchGoods()
})

const fetchCategories = async () => {
  try {
    if (categoryId.value > 0) {
      // 获取当前分类详情
      const detailRes = await getCategoryDetail(categoryId.value)
      if (detailRes.data) {
        categoryName.value = detailRes.data.name
      }
      
      // 获取子分类列表
      const subRes = await getCategoryList(categoryId.value)
      if (subRes.data && Array.isArray(subRes.data)) {
        subCategories.value = subRes.data
        console.log(`获取到${subCategories.value.length}个子分类:`, subCategories.value)
      } else {
        subCategories.value = []
      }
    } else {
      categoryName.value = '全部商品'
      subCategories.value = []
    }
  } catch (error) {
    console.error('获取分类详情或子分类失败:', error)
    subCategories.value = []
  }
}

const fetchGoods = async () => {
  loading.value = true
  try {
    const params = {
      pageNum: currentPage.value,
      pageSize: pageSize.value
    }

    if (subCategoryId.value > 0) {
      // 如果选择了子分类，则只查询该子分类
      params.categoryId = subCategoryId.value
      console.log(`正在获取子分类ID为${subCategoryId.value}的商品列表`)
    } else if (categoryId.value > 0) {
      // 否则查询主分类及其所有子分类
      params.categoryId = categoryId.value
      console.log(`正在获取分类ID为${categoryId.value}的商品列表（包含所有子分类）`)
    } else {
      console.log('正在获取全部商品列表')
    }

    if (keyword.value) {
      params.keyword = keyword.value
      console.log(`包含关键词: ${keyword.value}`)
    }

    if (sortBy.value) {
      const [field, direction] = sortBy.value.split(':')
      params.sortBy = field
      if (direction) {
        params.sortDirection = direction
      }
      console.log(`排序方式: ${sortBy.value}`)
    }

    console.log('API请求参数:', params)
    const res = await getGoodsList(params)
    console.log('获取商品列表响应:', res)
    
    // 处理可能的不同响应格式
    let goodsData = []
    let totalCount = 0
    
    if (!res.data && Array.isArray(res)) {
      // 直接返回数组的情况
      goodsData = res
      totalCount = res.length
      console.log('API直接返回数组数据')
    } else if (!res.data && typeof res === 'object') {
      // 直接返回对象的情况
      if (res.list && Array.isArray(res.list)) {
        goodsData = res.list
        totalCount = res.total || res.list.length
        console.log('API返回带list字段的对象')
      } else {
        goodsData = []
        totalCount = 0
        console.log('API返回未知格式的对象:', res)
      }
    } else if (Array.isArray(res.data)) {
      // 标准格式，data是数组
      goodsData = res.data
      totalCount = res.data.length
      console.log('API返回标准格式，data是数组')
    } else if (res.data && res.data.list) {
      // 标准格式，data包含list
      goodsData = res.data.list
      totalCount = res.data.total || res.data.list.length
      console.log('API返回标准格式，data包含list')
    } else {
      console.error('API返回未知格式:', res)
      goodsData = []
      totalCount = 0
    }
    
    goodsList.value = goodsData
    
    // 确保商品数据有正确的销量字段
    goodsList.value = goodsList.value.map(goods => ({
      ...goods,
      sales: goods.salesVolume || goods.sales || goods.salesCount || 0
    }))
    
    console.log(`成功获取${goodsList.value.length}个商品:`, goodsList.value)
    
    total.value = totalCount
  } catch (error) {
    console.error('获取商品列表失败:', error)
    goodsList.value = []
    total.value = 0
  } finally {
    loading.value = false
  }
}

const handleSizeChange = (val) => {
  pageSize.value = val
  fetchGoods()
}

const handleCurrentChange = (val) => {
  currentPage.value = val
  fetchGoods()
}

const goToGoodsDetail = (goodsId) => {
  router.push(`/goods/${goodsId}`)
}

const goToCategory = (subCatId) => {
  if (subCatId === 0) {
    // 如果点击"全部"，则移除subCategoryId参数
    const query = { ...route.query }
    delete query.subCategoryId
    router.push({
      path: `/category/${categoryId.value}`,
      query
    })
  } else {
    // 如果点击具体子分类，则添加subCategoryId参数
    router.push({
      path: `/category/${categoryId.value}`,
      query: {
        ...route.query,
        subCategoryId: subCatId
      }
    })
  }
}

const changeSortBy = (newSortBy) => {
  sortBy.value = newSortBy
  fetchGoods()
}
</script>

<style scoped>
.category {
  padding: 20px 0;
}

.category-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding-bottom: 10px;
  border-bottom: 1px solid #eee;
}

.category-title {
  font-size: 1.5rem;
  color: #333;
  margin: 0;
}

.sub-categories {
  display: flex;
  align-items: center;
  margin-bottom: 25px;
  padding: 20px;
  background-color: #f8f9fa;
  border-radius: 8px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.05);
}

.sub-categories-title {
  font-weight: bold;
  margin-right: 20px;
  color: #606266;
  font-size: 16px;
}

.sub-categories-list {
  display: flex;
  flex-wrap: wrap;
  gap: 15px;
}

.sub-categories-list .el-button {
  padding: 10px 20px;
  font-size: 14px;
}

.sort-nav {
  display: flex;
  align-items: center;
  margin-bottom: 25px;
  padding: 20px;
  background-color: #f8f9fa;
  border-radius: 8px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.05);
}

.sort-nav-title {
  font-weight: bold;
  margin-right: 20px;
  color: #606266;
  font-size: 16px;
}

.sort-nav-list {
  display: flex;
  flex-wrap: wrap;
  gap: 15px;
}

.sort-nav-list .el-button {
  padding: 10px 20px;
  font-size: 14px;
}

.goods-list {
  margin-top: 20px;
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

.empty-data {
  margin: 40px 0;
}

.pagination {
  margin-top: 30px;
  text-align: center;
}
</style> 