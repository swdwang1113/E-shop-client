<template>
  <div class="search">
    <div class="search-header">
      <h2 class="search-title">
        搜索结果: <span class="keyword">{{ keyword }}</span>
      </h2>
    </div>
    
    <!-- 排序方式：横向按钮组 -->
    <div class="sort-nav">
      <div class="sort-nav-title">排序方式:</div>
      <div class="sort-nav-list">
        <el-button 
          size="large"
          :type="sortBy === '' ? 'primary' : 'default'"
          @click="setSortBy('')"
        >
          默认排序
        </el-button>
        <el-button 
          size="large"
          :type="sortBy === 'price:asc' ? 'primary' : 'default'"
          @click="setSortBy('price:asc')"
        >
          价格从低到高
        </el-button>
        <el-button 
          size="large"
          :type="sortBy === 'price:desc' ? 'primary' : 'default'"
          @click="setSortBy('price:desc')"
        >
          价格从高到低
        </el-button>
        <el-button 
          size="large"
          :type="sortBy === 'sales:desc' ? 'primary' : 'default'"
          @click="setSortBy('sales:desc')"
        >
          销量优先
        </el-button>
        <el-button 
          size="large"
          :type="sortBy === 'rating:desc' ? 'primary' : 'default'"
          @click="setSortBy('rating:desc')"
        >
          好评优先
        </el-button>
        <el-button 
          size="large"
          :type="sortBy === 'newest' ? 'primary' : 'default'"
          @click="setSortBy('newest')"
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
              <div class="goods-price">¥{{ goods.price ? goods.price.toFixed(2) : '0.00' }}</div>
              <div class="goods-sales">已售 {{ goods.salesVolume || goods.sales || 0 }}</div>
            </div>
          </div>
        </el-col>
      </el-row>

      <div v-if="goodsList.length === 0 && !loading" class="empty-data">
        <el-empty 
          description="未找到相关商品，换个关键词试试吧" 
          :image-size="200"
        />
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

const route = useRoute()
const router = useRouter()
const keyword = computed(() => route.query.keyword || '')

const goodsList = ref([])
const loading = ref(false)
const sortBy = ref('')
const currentPage = ref(1)
const pageSize = ref(12)
const total = ref(0)

watch(() => keyword.value, () => {
  if (keyword.value) {
    currentPage.value = 1
    fetchGoods()
  }
})

onMounted(() => {
  if (keyword.value) {
    fetchGoods()
  }
})

const fetchGoods = async () => {
  if (!keyword.value) return
  
  loading.value = true
  try {
    const params = {
      keyword: keyword.value,
      pageNum: currentPage.value,
      pageSize: pageSize.value
    }

    if (sortBy.value) {
      const [field, direction] = sortBy.value.split(':')
      params.sortBy = field
      if (direction) {
        params.sortDirection = direction
      }
    }

    const res = await getGoodsList(params)
    goodsList.value = res.data.list || res.data || []
    
    // 确保商品数据有正确的销量字段
    goodsList.value = goodsList.value.map(goods => ({
      ...goods,
      sales: goods.salesVolume || goods.sales || goods.salesCount || 0
    }))
    
    if (res.data.total) {
      total.value = res.data.total
    } else {
      total.value = goodsList.value.length
    }
  } catch (error) {
    console.error('搜索商品失败:', error)
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

const setSortBy = (newSortBy) => {
  sortBy.value = newSortBy
  fetchGoods()
}
</script>

<style scoped>
.search {
  padding: 20px 0;
}

.search-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding-bottom: 10px;
  border-bottom: 1px solid #eee;
}

.search-title {
  font-size: 1.5rem;
  color: #333;
  margin: 0;
}

.keyword {
  color: #409EFF;
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