<template>
  <div class="search">
    <div class="search-header">
      <h2 class="search-title">
        搜索结果: <span class="keyword">{{ keyword }}</span>
      </h2>
      
      <div class="filters">
        <el-select v-model="sortBy" placeholder="排序方式" @change="fetchGoods">
          <el-option label="默认排序" value="" />
          <el-option label="价格从低到高" value="price:asc" />
          <el-option label="价格从高到低" value="price:desc" />
          <el-option label="销量优先" value="sales:desc" />
          <el-option label="好评优先" value="rating:desc" />
          <el-option label="最新上架" value="newest" />
        </el-select>
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

.filters {
  display: flex;
  gap: 10px;
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