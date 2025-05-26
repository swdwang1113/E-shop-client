<template>
  <div class="dashboard-container">
    <!-- 统计卡片 -->
    <div class="stat-cards">
      <el-row :gutter="15">
        <el-col :xs="24" :sm="12" :md="6">
          <el-card class="stat-card" shadow="hover">
            <div class="stat-icon user-icon">
              <el-icon><User /></el-icon>
            </div>
            <div class="stat-content">
              <div class="stat-value">{{ stats.userCount }}</div>
              <div class="stat-label">总用户数</div>
            </div>
            <div class="stat-footer">
              <div class="trend">
                <span :class="{ 'up': stats.userIncrease > 0, 'down': stats.userIncrease < 0 }">
                  {{ stats.userIncrease > 0 ? '+' : '' }}{{ stats.userIncrease }}%
                </span>
                较上周
              </div>
            </div>
          </el-card>
        </el-col>
        
        <el-col :xs="24" :sm="12" :md="6">
          <el-card class="stat-card" shadow="hover">
            <div class="stat-icon goods-icon">
              <el-icon><Goods /></el-icon>
            </div>
            <div class="stat-content">
              <div class="stat-value">{{ stats.goodsCount }}</div>
              <div class="stat-label">商品总数</div>
            </div>
            <div class="stat-footer">
              <div class="trend">
                <span :class="{ 'up': stats.goodsIncrease > 0, 'down': stats.goodsIncrease < 0 }">
                  {{ stats.goodsIncrease > 0 ? '+' : '' }}{{ stats.goodsIncrease }}%
                </span>
                较上周
              </div>
            </div>
          </el-card>
        </el-col>
        
        <el-col :xs="24" :sm="12" :md="6">
          <el-card class="stat-card" shadow="hover">
            <div class="stat-icon order-icon">
              <el-icon><List /></el-icon>
            </div>
            <div class="stat-content">
              <div class="stat-value">{{ stats.orderCount }}</div>
              <div class="stat-label">订单总数</div>
            </div>
            <div class="stat-footer">
              <div class="trend">
                <span :class="{ 'up': stats.orderIncrease > 0, 'down': stats.orderIncrease < 0 }">
                  {{ stats.orderIncrease > 0 ? '+' : '' }}{{ stats.orderIncrease }}%
                </span>
                较上周
              </div>
            </div>
          </el-card>
        </el-col>
        
        <el-col :xs="24" :sm="12" :md="6">
          <el-card class="stat-card" shadow="hover">
            <div class="stat-icon sale-icon">
              <el-icon><Money /></el-icon>
            </div>
            <div class="stat-content">
              <div class="stat-value">¥{{ formatNumber(stats.salesAmount) }}</div>
              <div class="stat-label">销售总额</div>
            </div>
            <div class="stat-footer">
              <div class="trend">
                <span :class="{ 'up': stats.salesIncrease > 0, 'down': stats.salesIncrease < 0 }">
                  {{ stats.salesIncrease > 0 ? '+' : '' }}{{ stats.salesIncrease }}%
                </span>
                较上周
              </div>
            </div>
          </el-card>
        </el-col>
      </el-row>
    </div>
    
    <!-- 图表部分 -->
    <div class="chart-section">
      <el-row :gutter="15">
        <el-col :xs="24" :lg="16">
          <el-card class="chart-card" shadow="hover">
            <template #header>
              <div class="chart-header">
                <h3>销售趋势</h3>
                <div class="chart-actions">
                  <el-radio-group v-model="saleChartType" size="small">
                    <el-radio-button label="week">本周</el-radio-button>
                    <el-radio-button label="month">本月</el-radio-button>
                    <el-radio-button label="year">全年</el-radio-button>
                  </el-radio-group>
                </div>
              </div>
            </template>
            <div class="chart-container" ref="saleChartRef"></div>
          </el-card>
        </el-col>
        
        <el-col :xs="24" :lg="8">
          <el-card class="chart-card" shadow="hover">
            <template #header>
              <div class="chart-header">
                <h3>商品分类结构</h3>
              </div>
            </template>
            <div class="chart-container" ref="categoryChartRef"></div>
          </el-card>
        </el-col>
      </el-row>
    </div>
    
    <!-- 最新订单和活跃用户 -->
    <div class="data-section">
      <el-row :gutter="15">
        <el-col :xs="24" :lg="24">
          <el-card class="data-card" shadow="hover">
            <template #header>
              <div class="data-header">
                <h3>最新订单</h3>
                <el-button type="primary" link @click="goToOrders">查看全部</el-button>
              </div>
            </template>
            <div class="data-content">
              <el-table :data="latestOrders" style="width: 100%">
                <el-table-column prop="orderNo" label="订单号" width="180"></el-table-column>
                <el-table-column label="用户名" width="120">
                  <template #default="scope">
                    {{ scope.row.address?.name || '未知用户' }}
                  </template>
                </el-table-column>
                <el-table-column prop="totalAmount" label="金额">
                  <template #default="scope">
                    ¥{{ scope.row.totalAmount.toFixed(2) }}
                  </template>
                </el-table-column>
                <el-table-column prop="status" label="状态" width="100">
                  <template #default="scope">
                    <el-tag :type="getOrderStatusType(scope.row.status)">
                      {{ getOrderStatusText(scope.row.status) }}
                    </el-tag>
                  </template>
                </el-table-column>
                <el-table-column prop="createTime" label="创建时间">
                  <template #default="scope">
                    {{ formatDate(scope.row.createTime) }}
                  </template>
                </el-table-column>
              </el-table>
            </div>
          </el-card>
        </el-col>
      </el-row>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, nextTick, watch } from 'vue'
import { useRouter } from 'vue-router'
import { User, Goods, List, Money } from '@element-plus/icons-vue'
import * as echarts from 'echarts/core'
import { LineChart, PieChart } from 'echarts/charts'
import {
  TitleComponent,
  TooltipComponent,
  LegendComponent,
  GridComponent
} from 'echarts/components'
import { CanvasRenderer } from 'echarts/renderers'
import { getDashboardStats, getLatestOrders, getUserCount, getGoodsCount, getOrdersStatistics } from '../../api/admin'
import request from '../../api/index'

// 注册必须的组件
echarts.use([
  TitleComponent,
  TooltipComponent,
  LegendComponent,
  GridComponent,
  LineChart,
  PieChart,
  CanvasRenderer
])

const router = useRouter()

// 图表相关
const saleChartRef = ref(null)
const categoryChartRef = ref(null)
const saleChartType = ref('week')
let saleChart = null
let categoryChart = null

// 统计数据
const stats = reactive({
  userCount: 0,
  userIncrease: 0,
  goodsCount: 0,
  goodsIncrease: 0,
  orderCount: 0,
  orderIncrease: 0,
  salesAmount: 0,
  salesIncrease: 0
})

// 最新订单
const latestOrders = ref([])

// 初始化
onMounted(async () => {
  // 获取统计数据
  await fetchDashboardStats()
  
  // 获取最新订单
  await fetchLatestOrders()
  
  // 等待下一个DOM更新周期再初始化图表
  await nextTick()
  
  // 初始化图表
  setTimeout(() => {
    initSaleChart()
    initCategoryChart()
  }, 300)
})

// 获取仪表盘统计数据
const fetchDashboardStats = async () => {
  try {
    // 获取用户总数
    const userCountRes = await getUserCount();
    if (userCountRes.success && userCountRes.code === 200) {
      stats.userCount = userCountRes.data;
    }
    
    // 获取商品总数
    const goodsCountRes = await getGoodsCount();
    if (goodsCountRes.success && goodsCountRes.code === 200) {
      stats.goodsCount = goodsCountRes.data;
    }
    
    // 获取订单统计数据
    const orderStatsRes = await getOrdersStatistics();
    if (orderStatsRes.success && orderStatsRes.code === 200) {
      stats.orderCount = orderStatsRes.data.totalOrders;
      stats.salesAmount = orderStatsRes.data.totalSales;
    }
    
    // 这里暂时设置增长率为0，后续可以添加相关接口获取增长率数据
    stats.userIncrease = 0;
    stats.goodsIncrease = 0;
    stats.orderIncrease = 0;
    stats.salesIncrease = 0;
    
    console.log('统计数据加载完成:', stats);
  } catch (error) {
    console.error('获取仪表盘统计数据失败:', error);
  }
}

// 获取最新订单
const fetchLatestOrders = async () => {
  try {
    const res = await getLatestOrders(5) // 获取最新的5条订单
    if (res.success && res.code === 200 && res.data) {
      // 从分页数据中提取订单列表
      latestOrders.value = res.data.list || []
      console.log('最新订单数据:', latestOrders.value)
    } else {
      latestOrders.value = []
    }
  } catch (error) {
    console.error('获取最新订单失败:', error)
    latestOrders.value = []
  }
}

// 初始化销售趋势图表
const initSaleChart = async () => {
  const chartDom = saleChartRef.value
  if (!chartDom) return
  
  saleChart = echarts.init(chartDom)
  
  try {
    // 从API获取订单数据
    const res = await request({
      url: '/api/admin/orders',
      method: 'get',
      params: {
        pageSize: 100, // 获取足够多的订单数据用于图表
        sortField: 'createTime',
        sortOrder: 'asc'
      }
    })
    
    if (res.success && res.code === 200 && res.data && res.data.list && res.data.list.length > 0) {
      // 处理数据，按日期分组
      const orders = res.data.list
      
      // 根据当前选择的图表类型处理数据
      const { xAxis, salesData, orderData } = processOrdersData(orders, saleChartType.value)
      
      const option = {
        title: {
          text: '销售趋势',
          left: 'center'
        },
        tooltip: {
          trigger: 'axis'
        },
        legend: {
          data: ['销售额', '订单量'],
          bottom: 0
        },
        grid: {
          left: '3%',
          right: '4%',
          bottom: '10%',
          containLabel: true
        },
        xAxis: {
          type: 'category',
          boundaryGap: false,
          data: xAxis
        },
        yAxis: [
          {
            type: 'value',
            name: '销售额',
            axisLabel: {
              formatter: '{value} 元'
            }
          },
          {
            type: 'value',
            name: '订单量',
            axisLabel: {
              formatter: '{value} 单'
            }
          }
        ],
        series: [
          {
            name: '销售额',
            type: 'line',
            smooth: true,
            data: salesData
          },
          {
            name: '订单量',
            type: 'line',
            smooth: true,
            yAxisIndex: 1,
            data: orderData
          }
        ]
      }
      
      saleChart.setOption(option)
    } else {
      // 使用默认数据
      useDefaultChartData()
    }
  } catch (error) {
    console.error('获取销售趋势数据失败:', error)
    // 使用默认数据
    useDefaultChartData()
  }
  
  // 监听窗口大小变化，调整图表大小
  window.addEventListener('resize', () => {
    saleChart.resize()
  })
  
  // 使用默认数据的函数
  function useDefaultChartData() {
    const option = {
      title: {
        text: '销售趋势',
        left: 'center'
      },
      tooltip: {
        trigger: 'axis'
      },
      legend: {
        data: ['销售额', '订单量'],
        bottom: 0
      },
      grid: {
        left: '3%',
        right: '4%',
        bottom: '10%',
        containLabel: true
      },
      xAxis: {
        type: 'category',
        boundaryGap: false,
        data: ['周一', '周二', '周三', '周四', '周五', '周六', '周日']
      },
      yAxis: [
        {
          type: 'value',
          name: '销售额',
          axisLabel: {
            formatter: '{value} 元'
          }
        },
        {
          type: 'value',
          name: '订单量',
          axisLabel: {
            formatter: '{value} 单'
          }
        }
      ],
      series: [
        {
          name: '销售额',
          type: 'line',
          smooth: true,
          data: [5000, 6000, 7000, 8000, 9000, 10000, 11000]
        },
        {
          name: '订单量',
          type: 'line',
          smooth: true,
          yAxisIndex: 1,
          data: [50, 60, 70, 80, 90, 100, 110]
        }
      ]
    }
    
    saleChart.setOption(option)
  }
}

// 处理订单数据为图表所需格式
const processOrdersData = (orders, type) => {
  // 根据创建时间分组
  const groupedData = {}
  let xAxis = []
  let salesData = []
  let orderData = []
  
  // 获取当前日期
  const now = new Date()
  
  if (type === 'week') {
    // 按周分组（最近7天）
    const dayNames = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']
    xAxis = Array(7).fill().map((_, i) => {
      const d = new Date(now)
      d.setDate(d.getDate() - 6 + i)
      return dayNames[d.getDay()]
    })
    
    // 初始化数据
    const salesByDay = {}
    const ordersByDay = {}
    xAxis.forEach(day => {
      salesByDay[day] = 0
      ordersByDay[day] = 0
    })
    
    // 过滤最近7天的订单
    const sevenDaysAgo = new Date(now)
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6)
    sevenDaysAgo.setHours(0, 0, 0, 0)
    
    orders.forEach(order => {
      const orderDate = new Date(order.createTime)
      if (orderDate >= sevenDaysAgo) {
        const dayName = dayNames[orderDate.getDay()]
        salesByDay[dayName] += order.totalAmount
        ordersByDay[dayName] += 1
      }
    })
    
    // 转换为数组
    salesData = xAxis.map(day => salesByDay[day])
    orderData = xAxis.map(day => ordersByDay[day])
    
  } else if (type === 'month') {
    // 按月分组（最近30天）
    xAxis = Array(30).fill().map((_, i) => {
      const d = new Date(now)
      d.setDate(d.getDate() - 29 + i)
      return `${d.getMonth() + 1}/${d.getDate()}`
    })
    
    // 初始化数据
    const salesByDate = {}
    const ordersByDate = {}
    xAxis.forEach(date => {
      salesByDate[date] = 0
      ordersByDate[date] = 0
    })
    
    // 过滤最近30天的订单
    const thirtyDaysAgo = new Date(now)
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 29)
    thirtyDaysAgo.setHours(0, 0, 0, 0)
    
    orders.forEach(order => {
      const orderDate = new Date(order.createTime)
      if (orderDate >= thirtyDaysAgo) {
        const dateKey = `${orderDate.getMonth() + 1}/${orderDate.getDate()}`
        if (salesByDate[dateKey] !== undefined) {
          salesByDate[dateKey] += order.totalAmount
          ordersByDate[dateKey] += 1
        }
      }
    })
    
    // 转换为数组
    salesData = xAxis.map(date => salesByDate[date])
    orderData = xAxis.map(date => ordersByDate[date])
    
  } else if (type === 'year') {
    // 按年分组（12个月）
    xAxis = ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月']
    
    // 初始化数据
    const salesByMonth = {}
    const ordersByMonth = {}
    xAxis.forEach((month, index) => {
      salesByMonth[index] = 0
      ordersByMonth[index] = 0
    })
    
    // 过滤今年的订单
    const startOfYear = new Date(now.getFullYear(), 0, 1)
    
    orders.forEach(order => {
      const orderDate = new Date(order.createTime)
      if (orderDate >= startOfYear) {
        const monthIndex = orderDate.getMonth()
        salesByMonth[monthIndex] += order.totalAmount
        ordersByMonth[monthIndex] += 1
      }
    })
    
    // 转换为数组
    salesData = Object.values(salesByMonth)
    orderData = Object.values(ordersByMonth)
  }
  
  return { xAxis, salesData, orderData }
}

// 初始化分类占比图表
const initCategoryChart = async () => {
  const chartDom = categoryChartRef.value
  if (!chartDom) return
  
  categoryChart = echarts.init(chartDom)
  
  try {
    // 从API获取分类数据
    const res = await request({
      url: '/api/admin/categories',
      method: 'get'
    })
    
    if (res.success && res.code === 200 && res.data) {
      // 处理分类数据
      const categories = res.data
      
      // 过滤出一级分类
      const parentCategories = categories.filter(item => item.level === 1)
      
      // 构建饼图数据
      const pieData = parentCategories.map(category => ({
        name: category.name,
        value: 1 // 每个分类默认值为1，显示相等大小
      }))
      
      const option = {
        title: {
          text: '商品分类结构',
          left: 'center'
        },
        tooltip: {
          trigger: 'item',
          formatter: '{b}'
        },
        legend: {
          orient: 'vertical',
          left: 10,
          top: 'center',
          data: parentCategories.map(item => item.name)
        },
        series: [
          {
            name: '商品分类',
            type: 'pie',
            radius: ['40%', '70%'],
            center: ['60%', '50%'],
            avoidLabelOverlap: false,
            itemStyle: {
              borderRadius: 10,
              borderColor: '#fff',
              borderWidth: 2
            },
            label: {
              show: false
            },
            emphasis: {
              label: {
                show: true,
                fontSize: '16',
                fontWeight: 'bold'
              }
            },
            labelLine: {
              show: false
            },
            data: pieData
          }
        ]
      }
      
      categoryChart.setOption(option)
      console.log('分类图表已初始化:', option)
    } else {
      // 使用默认数据
      useDefaultCategoryData()
    }
  } catch (error) {
    console.error('获取分类数据失败:', error)
    // 使用默认数据
    useDefaultCategoryData()
  }
  
  // 监听窗口大小变化，调整图表大小
  window.addEventListener('resize', () => {
    categoryChart.resize()
  })
  
  // 使用默认数据的函数
  function useDefaultCategoryData() {
    const defaultData = [
      { value: 1048, name: '手机数码' },
      { value: 735, name: '电脑办公' },
      { value: 580, name: '家用电器' },
      { value: 484, name: '服装鞋包' },
      { value: 300, name: '食品生鲜' },
      { value: 200, name: '美妆护肤' },
      { value: 180, name: '运动户外' },
      { value: 150, name: '图书音像' }
    ]
    
    const option = {
      title: {
        text: '商品分类结构',
        left: 'center'
      },
      tooltip: {
        trigger: 'item',
        formatter: '{b}: {c}'
      },
      legend: {
        orient: 'vertical',
        left: 10,
        top: 'center',
        data: defaultData.map(item => item.name)
      },
      series: [
        {
          name: '商品分类',
          type: 'pie',
          radius: ['40%', '70%'],
          center: ['60%', '50%'],
          avoidLabelOverlap: false,
          itemStyle: {
            borderRadius: 10,
            borderColor: '#fff',
            borderWidth: 2
          },
          label: {
            show: false
          },
          emphasis: {
            label: {
              show: true,
              fontSize: '16',
              fontWeight: 'bold'
            }
          },
          labelLine: {
            show: false
          },
          data: defaultData
        }
      ]
    }
    
    categoryChart.setOption(option)
    console.log('分类图表使用默认数据初始化:', option)
  }
}

// 获取订单状态类型
const getOrderStatusType = (status) => {
  const types = {
    0: 'warning',   // 待付款
    1: 'primary',   // 待发货
    2: 'info',      // 已发货
    3: 'success',   // 已完成
    4: 'danger',    // 已取消
    5: 'warning',   // 申请退款
    6: 'info'       // 已退款
  }
  return types[status] || 'info'
}

// 获取订单状态文本
const getOrderStatusText = (status) => {
  const texts = {
    0: '待付款',
    1: '待发货',
    2: '已发货',
    3: '已完成',
    4: '已取消',
    5: '申请退款',
    6: '已退款'
  }
  return texts[status] || '未知状态'
}

// 格式化数字（添加千位分隔符）
const formatNumber = (num) => {
  return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',')
}

// 格式化日期
const formatDate = (dateStr) => {
  if (!dateStr) return ''
  const date = new Date(dateStr)
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`
}

// 跳转到订单管理页面
const goToOrders = () => {
  router.push('/admin/orders')
}

// 监听图表类型变化
watch(saleChartType, async (newType) => {
  if (!saleChart) return
  
  try {
    // 从API获取订单数据
    const res = await request({
      url: '/api/admin/orders',
      method: 'get',
      params: {
        pageSize: 100,
        sortField: 'createTime',
        sortOrder: 'asc'
      }
    })
    
    if (res.success && res.code === 200 && res.data && res.data.list && res.data.list.length > 0) {
      // 处理数据，按日期分组
      const orders = res.data.list
      
      // 根据当前选择的图表类型处理数据
      const { xAxis, salesData, orderData } = processOrdersData(orders, newType)
      
      saleChart.setOption({
        xAxis: {
          data: xAxis
        },
        series: [
          {
            name: '销售额',
            data: salesData
          },
          {
            name: '订单量',
            data: orderData
          }
        ]
      })
    }
  } catch (error) {
    console.error('获取销售趋势数据失败:', error)
    
    // 使用默认数据
    let xAxisData = []
    let salesData = []
    let orderData = []
    
    if (newType === 'week') {
      xAxisData = ['周一', '周二', '周三', '周四', '周五', '周六', '周日']
      salesData = [5000, 6000, 7000, 8000, 9000, 10000, 11000]
      orderData = [50, 60, 70, 80, 90, 100, 110]
    } else if (newType === 'month') {
      xAxisData = Array.from({ length: 30 }, (_, i) => `${i + 1}日`)
      salesData = Array.from({ length: 30 }, () => Math.floor(Math.random() * 10000) + 5000)
      orderData = Array.from({ length: 30 }, () => Math.floor(Math.random() * 100) + 50)
    } else if (newType === 'year') {
      xAxisData = ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月']
      salesData = [50000, 60000, 70000, 80000, 90000, 100000, 110000, 120000, 130000, 140000, 150000, 160000]
      orderData = [500, 600, 700, 800, 900, 1000, 1100, 1200, 1300, 1400, 1500, 1600]
    }
    
    saleChart.setOption({
      xAxis: {
        data: xAxisData
      },
      series: [
        {
          name: '销售额',
          data: salesData
        },
        {
          name: '订单量',
          data: orderData
        }
      ]
    })
  }
})
</script>

<style scoped>
.dashboard-container {
  padding: 0;
  width: 100%;
  box-sizing: border-box;
}

.stat-cards {
  margin-bottom: 20px;
  width: 100%;
}

.stat-card {
  position: relative;
  height: 100%;
  display: flex;
  flex-direction: column;
}

.stat-icon {
  position: absolute;
  top: 20px;
  right: 20px;
  width: 48px;
  height: 48px;
  border-radius: 50%;
  display: flex;
  justify-content: center;
  align-items: center;
}

.stat-icon .el-icon {
  font-size: 24px;
  color: white;
}

.user-icon {
  background-color: #409eff;
}

.goods-icon {
  background-color: #67c23a;
}

.order-icon {
  background-color: #e6a23c;
}

.sale-icon {
  background-color: #f56c6c;
}

.stat-content {
  padding: 20px;
  flex: 1;
}

.stat-value {
  font-size: 24px;
  font-weight: bold;
  margin-bottom: 10px;
}

.stat-label {
  font-size: 14px;
  color: #909399;
}

.stat-footer {
  padding: 10px 20px;
  border-top: 1px solid #f0f0f0;
}

.trend {
  font-size: 12px;
  color: #909399;
}

.trend .up {
  color: #67c23a;
}

.trend .down {
  color: #f56c6c;
}

.chart-section,
.data-section {
  margin-bottom: 20px;
  width: 100%;
}

.chart-card,
.data-card {
  margin-bottom: 20px;
  height: 100%;
  width: 100%;
}

.chart-header,
.data-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.chart-header h3,
.data-header h3 {
  margin: 0;
  font-size: 16px;
}

.chart-container {
  height: 400px;
  width: 100%;
  margin: 0 auto;
}

.user-cell {
  display: flex;
  align-items: center;
  gap: 10px;
}

.user-name {
  font-weight: bold;
}

/* 确保el-row和el-col占满宽度 */
:deep(.el-row) {
  width: 100% !important;
  margin-left: 0 !important;
  margin-right: 0 !important;
}

:deep(.el-col) {
  padding-left: 7.5px !important;
  padding-right: 7.5px !important;
}

:deep(.el-card) {
  width: 100%;
}

:deep(.el-card__body) {
  width: 100%;
  padding: 15px;
}

:deep(.el-table) {
  width: 100%;
}

/* 响应式调整 */
@media screen and (max-width: 1200px) {
  .chart-container {
    height: 300px;
  }
}

@media screen and (max-width: 768px) {
  .stat-cards .el-col {
    margin-bottom: 20px;
  }
  
  .chart-container {
    height: 250px;
  }
}
</style> 