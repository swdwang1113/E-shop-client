<template>
  <div class="shipping-route">
    <div class="page-header">
      <h2>物流路线管理</h2>
      <div class="search-container">
        <el-input
          v-model="searchOrderId"
          placeholder="请输入订单ID"
          clearable
          class="search-input"
        >
          <template #append>
            <el-button @click="handleSearch" :loading="loading" type="primary">查询</el-button>
          </template>
        </el-input>
      </div>
    </div>

    <div class="route-container" v-loading="loading">
      <el-empty description="请输入订单ID查询物流路线" v-if="!routeInfo"></el-empty>
      
      <div v-else class="route-info">
        <div class="info-header">
          <div class="info-title">
            <h3>订单 #{{ searchOrderId }} 的物流信息</h3>
            <el-tag type="success" v-if="routeInfo.shippingInfo">物流状态: 运输中</el-tag>
          </div>
          <div class="info-actions">
            <el-button type="primary" size="small" @click="refreshRoute">
              <el-icon><Refresh /></el-icon> 刷新
            </el-button>
            <el-button type="default" size="small" @click="goToOrderDetail" v-if="routeInfo.shippingInfo">
              <el-icon><Document /></el-icon> 查看订单
            </el-button>
          </div>
        </div>
        
        <div class="info-card">
          <h3>物流基本信息</h3>
          <div class="info-item">
            <span class="label">订单ID:</span>
            <span>{{ routeInfo.shippingInfo.orderId }}</span>
          </div>
          <div class="info-item">
            <span class="label">物流公司:</span>
            <span>{{ routeInfo.shippingInfo.shippingCompany }}</span>
          </div>
          <div class="info-item">
            <span class="label">物流单号:</span>
            <span>{{ routeInfo.shippingInfo.trackingNumber }}</span>
          </div>
          <div class="info-item">
            <span class="label">发货地址:</span>
            <span>{{ routeInfo.shippingInfo.senderAddress }}</span>
          </div>
          <div class="info-item">
            <span class="label">收货地址:</span>
            <span>{{ routeInfo.shippingInfo.receiverAddress }}</span>
          </div>
          <div class="info-item">
            <span class="label">预计送达:</span>
            <span>{{ formatDateTime(routeInfo.shippingInfo.estimatedTime) }}</span>
          </div>
          <div class="info-item">
            <span class="label">创建时间:</span>
            <span>{{ formatDateTime(routeInfo.shippingInfo.createTime) }}</span>
          </div>
        </div>
        
        <!-- 物流路线地图 -->
        <div class="route-map-container">
          <div class="map-header">
            <h3>物流路线地图</h3>
            <div class="map-actions">
              <el-button v-if="mapLoadError" type="primary" size="small" @click="retryLoadMap">
                <el-icon><RefreshRight /></el-icon> 重试加载地图
              </el-button>
              <el-button v-if="mapLoadError" type="success" size="small" @click="useStaticMap">
                <el-icon><Picture /></el-icon> 使用静态地图
              </el-button>
              <el-button v-if="mapLoadError" type="warning" size="small" @click="useLocalMap">
                <el-icon><PictureFilled /></el-icon> 使用本地地图
              </el-button>
              <el-radio-group v-model="mapViewType" size="small" @change="changeMapView" v-if="!mapLoadError && map && !useStaticMapMode && !useLocalMapMode">
                <el-radio-button label="normal">普通</el-radio-button>
                <el-radio-button label="satellite">卫星</el-radio-button>
              </el-radio-group>
            </div>
          </div>
          <div v-if="mapLoadError && !useStaticMapMode && !useLocalMapMode" class="map-error">
            <el-empty description="地图加载失败，请检查网络或点击重试" />
            <div class="error-message">
              <p>可能原因：</p>
              <ul>
                <li>网络连接问题</li>
                <li>高德地图API密钥配额已用完</li>
                <li>浏览器阻止了地图加载</li>
              </ul>
            </div>
          </div>
          <div v-else-if="useStaticMapMode" class="static-map-container">
            <img :src="staticMapUrl" alt="物流路线静态地图" class="static-map" v-if="staticMapUrl" @error="handleStaticMapError" />
            <div class="static-map-info">
              <p>已切换到静态地图模式</p>
              <div class="route-info-text">
                <p><strong>发货地:</strong> {{ routeInfo.shippingInfo.senderAddress }}</p>
                <p><strong>收货地:</strong> {{ routeInfo.shippingInfo.receiverAddress }}</p>
                <p><strong>距离:</strong> {{ routeInfo.distance ? (routeInfo.distance / 1000).toFixed(2) + ' 公里' : '未知' }}</p>
              </div>
            </div>
          </div>
          <div v-else-if="useLocalMapMode" class="local-map-container">
            <img src="/img/backup-map.jpg" alt="物流路线备用地图" class="local-map" />
            <div class="local-map-info">
              <p>已切换到本地地图模式</p>
              <div class="route-info-text">
                <p><strong>发货地:</strong> {{ routeInfo.shippingInfo.senderAddress }}</p>
                <p><strong>收货地:</strong> {{ routeInfo.shippingInfo.receiverAddress }}</p>
                <p><strong>预计送达时间:</strong> {{ formatDateTime(routeInfo.shippingInfo.estimatedTime) }}</p>
              </div>
            </div>
          </div>
          <div id="route-map" class="map-container" v-else></div>
        </div>
        
        <!-- 物流轨迹 -->
        <div class="route-timeline">
          <h3>物流轨迹</h3>
          <el-timeline>
            <el-timeline-item
              v-for="(point, index) in routeInfo.pathPoints"
              :key="index"
              :timestamp="formatDateTime(point.time)"
              :type="getPointStatusType(point.status)"
              :hollow="index === 0"
              placement="top"
            >
              <div class="timeline-content">
                <div class="timeline-title">{{ getPointStatusText(point.status) }}</div>
                <div class="timeline-location">
                  位置: {{ point.longitude.toFixed(6) }}, {{ point.latitude.toFixed(6) }}
                </div>
              </div>
            </el-timeline-item>
          </el-timeline>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { Refresh, Document, RefreshRight, Picture, PictureFilled } from '@element-plus/icons-vue'
import { getShippingRoute } from '../../api/admin'

const route = useRoute()
const router = useRouter()
const loading = ref(false)
const searchOrderId = ref('')
const routeInfo = ref(null)
const mapViewType = ref('normal')
const mapLoadError = ref(false)
const useStaticMapMode = ref(false)
const useLocalMapMode = ref(false)
const staticMapUrl = ref('')
let map = null
let mapLoadRetries = 0
const MAX_RETRIES = 3

// 获取URL中的订单ID
onMounted(() => {
  // 预加载高德地图API
  loadAMapScript().then(() => {
    console.log('高德地图API预加载成功');
  }).catch(err => {
    console.error('高德地图API预加载失败:', err);
  });
  
  const orderId = route.query.orderId
  if (orderId) {
    searchOrderId.value = orderId
    handleSearch()
  }
})

onUnmounted(() => {
  // 清理地图实例
  if (map) {
    map = null
  }
})

// 重试加载地图
const retryLoadMap = async () => {
  if (mapLoadRetries >= MAX_RETRIES) {
    ElMessage.error('多次尝试加载地图失败，请稍后再试');
    return;
  }
  
  mapLoadRetries++;
  mapLoadError.value = false;
  
  try {
    // 如果地图实例存在，先销毁
    if (map) {
      map.destroy();
      map = null;
    }
    
    // 重新加载地图
    await loadAMapScript();
    setTimeout(() => {
      initMap();
    }, 300);
    
    ElMessage.success('正在重新加载地图...');
  } catch (error) {
    console.error('重试加载地图失败:', error);
    mapLoadError.value = true;
    ElMessage.error('重试加载地图失败');
  }
}

// 加载高德地图脚本
const loadAMapScript = () => {
  return new Promise((resolve, reject) => {
    if (window.AMap) {
      console.log('高德地图已加载，直接使用');
      resolve(window.AMap);
      return;
    }
    
    console.log('开始加载高德地图API...');
    
    // 检查是否已存在高德地图脚本
    const existingScript = document.querySelector('script[src*="webapi.amap.com/maps"]');
    if (existingScript) {
      console.log('发现已有高德地图脚本标签，移除后重新加载');
      existingScript.parentNode.removeChild(existingScript);
    }
    
    const script = document.createElement('script');
    script.type = 'text/javascript';
    script.async = true;
    script.src = `https://webapi.amap.com/maps?v=2.0&key=017045315860ec69975d7a0a49f15511&plugin=AMap.Driving`;
    
    script.onload = () => {
      console.log('高德地图脚本加载完成');
      if (window.AMap) {
        resolve(window.AMap);
      } else {
        reject(new Error('高德地图API加载失败：AMap对象不存在'));
      }
    };
    
    script.onerror = (e) => {
      console.error('高德地图脚本加载失败:', e);
      reject(new Error('高德地图API加载失败：脚本加载错误'));
    };
    
    document.head.appendChild(script);
  });
}

// 查询物流路线
const handleSearch = async () => {
  if (!searchOrderId.value) {
    ElMessage.warning('请输入订单ID')
    return
  }
  
  try {
    loading.value = true
    mapLoadError.value = false
    useStaticMapMode.value = false
    useLocalMapMode.value = false
    mapLoadRetries = 0
    
    const res = await getShippingRoute(searchOrderId.value)
    
    if (res.code === 200 && res.data) {
      routeInfo.value = res.data
      
      // 检查返回的数据结构
      console.log('物流路线数据:', res.data);
      
      // 检查是否有必要的坐标数据
      if (!res.data.senderLocation || !res.data.receiverLocation) {
        console.error('物流数据缺少必要的坐标信息');
        ElMessage.warning('物流数据不完整，无法显示地图，但您仍可以查看物流信息');
        loading.value = false;
        // 更新URL，不刷新页面
        updateUrlParams();
        // 使用本地地图作为备用
        useLocalMap();
        return;
      }
      
      // 更新URL，不刷新页面
      updateUrlParams();
      
      // 尝试加载地图
      try {
        await loadAMapScript();
        // 确保DOM已经渲染完成
        setTimeout(() => {
          initMap();
        }, 500);
      } catch (err) {
        console.error('加载地图失败:', err);
        mapLoadError.value = true;
        ElMessage.warning('地图加载失败，但您仍可以查看物流信息');
        useStaticMap();
      }
    } else {
      ElMessage.error(res.message || '获取物流路线失败');
      routeInfo.value = null; // 确保清空之前的数据
    }
  } catch (error) {
    ElMessage.error('获取物流路线失败');
    console.error('获取物流路线错误:', error);
    routeInfo.value = null; // 确保清空之前的数据
  } finally {
    loading.value = false;
  }
}

// 更新URL参数，不刷新页面
const updateUrlParams = () => {
  const query = { ...route.query, orderId: searchOrderId.value }
  router.replace({ query })
}

// 初始化地图
const initMap = () => {
  if (!routeInfo.value) {
    console.error('初始化地图失败: routeInfo为空');
    mapLoadError.value = true;
    useLocalMap(); // 使用本地地图作为备用
    return;
  }
  
  if (!window.AMap) {
    console.error('初始化地图失败: AMap未加载，尝试重新加载');
    mapLoadError.value = true;
    // 尝试重新加载地图API
    loadAMapScript().then(() => {
      setTimeout(() => {
        initMap();
      }, 500);
    }).catch(err => {
      console.error('重新加载地图API失败:', err);
      // 尝试使用静态地图作为备用
      useStaticMap();
    });
    return;
  }
  
  try {
    console.log('初始化地图，数据:', routeInfo.value);
    
    // 确保地图容器存在且有尺寸
    const mapContainer = document.getElementById('route-map');
    if (!mapContainer) {
      console.error('找不到地图容器');
      mapLoadError.value = true;
      useLocalMap(); // 使用本地地图作为备用
      return;
    }
    
    console.log('地图容器尺寸:', mapContainer.offsetWidth, mapContainer.offsetHeight);
    
    // 强制设置容器尺寸，确保可见
    mapContainer.style.width = '100%';
    mapContainer.style.height = '500px';
    mapContainer.style.display = 'block';
    mapContainer.style.visibility = 'visible';
    mapContainer.style.position = 'relative';
    mapContainer.style.zIndex = '1';
    
    // 检查坐标格式，确保是数值类型
    const senderLng = parseFloat(routeInfo.value.senderLocation.longitude);
    const senderLat = parseFloat(routeInfo.value.senderLocation.latitude);
    const receiverLng = parseFloat(routeInfo.value.receiverLocation.longitude);
    const receiverLat = parseFloat(routeInfo.value.receiverLocation.latitude);
    
    console.log('发货地坐标:', senderLng, senderLat);
    console.log('收货地坐标:', receiverLng, receiverLat);
    
    if (isNaN(senderLng) || isNaN(senderLat) || isNaN(receiverLng) || isNaN(receiverLat)) {
      console.error('坐标格式错误');
      ElMessage.warning('物流坐标数据格式错误，无法显示地图');
      useLocalMap(); // 使用本地地图作为备用
      return;
    }
    
    // 销毁已有的地图实例
    if (map) {
      try {
        map.destroy();
      } catch (e) {
        console.error('销毁地图实例失败:', e);
      }
      map = null;
    }
    
    // 清空容器内容
    mapContainer.innerHTML = '';
    
    // 创建一个新的div作为地图容器
    const newMapContainer = document.createElement('div');
    newMapContainer.id = 'amap-container';
    newMapContainer.style.width = '100%';
    newMapContainer.style.height = '100%';
    mapContainer.appendChild(newMapContainer);
    
    console.log('开始创建地图实例...');
    
    // 使用最简单的方式创建地图
    try {
      map = new window.AMap.Map('amap-container', {
        zoom: 8,
        center: [(senderLng + receiverLng) / 2, (senderLat + receiverLat) / 2],
        mapStyle: 'amap://styles/normal'
      });
      
      console.log('地图实例创建完成');
      
      // 添加标记
      const startMarker = new window.AMap.Marker({
        position: [senderLng, senderLat],
        title: '发货地'
      });
      
      const endMarker = new window.AMap.Marker({
        position: [receiverLng, receiverLat],
        title: '收货地'
      });
      
      map.add([startMarker, endMarker]);
      
      // 调整视图以包含所有点
      map.setFitView([startMarker, endMarker]);
      
      // 添加简单的信息窗体
      startMarker.on('click', () => {
        new window.AMap.InfoWindow({
          content: `<div><b>发货地</b><br>${routeInfo.value.shippingInfo.senderAddress}</div>`,
          offset: new window.AMap.Pixel(0, -30)
        }).open(map, startMarker.getPosition());
      });
      
      endMarker.on('click', () => {
        new window.AMap.InfoWindow({
          content: `<div><b>收货地</b><br>${routeInfo.value.shippingInfo.receiverAddress}</div>`,
          offset: new window.AMap.Pixel(0, -30)
        }).open(map, endMarker.getPosition());
      });
      
      // 绘制路线
      if (window.AMap.Driving) {
        const driving = new window.AMap.Driving({
          policy: window.AMap.DrivingPolicy.LEAST_TIME,
          map: map
        });
        
        driving.search(
          [senderLng, senderLat],
          [receiverLng, receiverLat],
          (status, result) => {
            if (status === 'complete') {
              console.log('路线规划成功');
            } else {
              console.error('路线规划失败:', status, result);
              
              // 如果规划失败，至少绘制一条直线
              const polyline = new window.AMap.Polyline({
                path: [[senderLng, senderLat], [receiverLng, receiverLat]],
                strokeColor: '#3498db',
                strokeWeight: 6,
                strokeOpacity: 0.8
              });
              
              map.add(polyline);
            }
          }
        );
      }
    } catch (mapError) {
      console.error('创建地图实例失败:', mapError);
      mapLoadError.value = true;
      useStaticMap();
    }
    
  } catch (error) {
    console.error('初始化地图失败:', error);
    mapLoadError.value = true;
    ElMessage.warning('地图初始化失败，但您仍可以查看物流信息');
    useStaticMap();
  }
}

// 获取物流节点状态类型
const getPointStatusType = (status) => {
  const types = {
    1: 'primary',   // 已发货
    2: 'warning',   // 运输中
    3: 'success'    // 已送达
  }
  return types[status] || 'info'
}

// 获取物流节点状态文本
const getPointStatusText = (status) => {
  const texts = {
    1: '已从仓库发出',
    2: '运输中',
    3: '已送达'
  }
  return texts[status] || '未知状态'
}

// 处理静态地图加载错误
const handleStaticMapError = () => {
  console.error('静态地图加载失败');
  ElMessage.error('静态地图加载失败，将切换到本地地图');
  useStaticMapMode.value = false;
  useLocalMap();
}

// 使用静态地图
const useStaticMap = () => {
  if (!routeInfo.value || !routeInfo.value.senderLocation || !routeInfo.value.receiverLocation) {
    ElMessage.warning('无法获取路线坐标信息，无法显示静态地图');
    useLocalMap(); // 如果无法获取坐标，直接使用本地地图
    return;
  }
  
  try {
    useStaticMapMode.value = true;
    useLocalMapMode.value = false;
    
    const senderLng = parseFloat(routeInfo.value.senderLocation.longitude);
    const senderLat = parseFloat(routeInfo.value.senderLocation.latitude);
    const receiverLng = parseFloat(routeInfo.value.receiverLocation.longitude);
    const receiverLat = parseFloat(routeInfo.value.receiverLocation.latitude);
    
    if (isNaN(senderLng) || isNaN(senderLat) || isNaN(receiverLng) || isNaN(receiverLat)) {
      throw new Error('坐标格式无效');
    }
    
    // 使用高德静态地图API
    staticMapUrl.value = `https://restapi.amap.com/v3/staticmap?location=${senderLng},${senderLat}&zoom=12&size=750*500&markers=mid,0xFF0000,A:${senderLng},${senderLat}|mid,0x00FF00,B:${receiverLng},${receiverLat}&key=017045315860ec69975d7a0a49f15511`;
    
    // 如果有路径点，添加路径线
    if (routeInfo.value.pathPoints && routeInfo.value.pathPoints.length > 1) {
      const pathStr = routeInfo.value.pathPoints.map(point => {
        const lng = parseFloat(point.longitude);
        const lat = parseFloat(point.latitude);
        if (isNaN(lng) || isNaN(lat)) return null;
        return `${lng},${lat}`;
      }).filter(coord => coord !== null).join(';');
      
      if (pathStr) {
        staticMapUrl.value += `&paths=5,0x0000ff,1,,:${pathStr}`;
      }
    }
    
    ElMessage.success('已切换到静态地图模式');
  } catch (error) {
    console.error('生成静态地图失败:', error);
    ElMessage.error('生成静态地图失败，将使用本地地图');
    useLocalMap();
  }
}

// 使用本地地图
const useLocalMap = () => {
  useStaticMapMode.value = false;
  useLocalMapMode.value = true;
  staticMapUrl.value = '';
  
  // 确保本地地图图片存在
  const img = new Image();
  img.onload = () => {
    console.log('本地地图图片加载成功');
    ElMessage.success('已切换到本地地图模式');
  };
  img.onerror = () => {
    console.error('本地地图图片加载失败');
    ElMessage.warning('本地地图图片加载失败，将显示基本信息');
    // 创建一个简单的文本作为备用
    const mapContainer = document.querySelector('.local-map-container');
    if (mapContainer) {
      const textDiv = document.createElement('div');
      textDiv.className = 'backup-text';
      textDiv.innerHTML = `
        <h3>物流路线基本信息</h3>
        <p>发货地: ${routeInfo.value?.shippingInfo?.senderAddress || '未知'}</p>
        <p>收货地: ${routeInfo.value?.shippingInfo?.receiverAddress || '未知'}</p>
        <p>物流公司: ${routeInfo.value?.shippingInfo?.shippingCompany || '未知'}</p>
        <p>物流单号: ${routeInfo.value?.shippingInfo?.trackingNumber || '未知'}</p>
      `;
      const existingImg = mapContainer.querySelector('img');
      if (existingImg) {
        mapContainer.replaceChild(textDiv, existingImg);
      } else {
        mapContainer.insertBefore(textDiv, mapContainer.firstChild);
      }
    }
  };
  img.src = '/img/backup-map.jpg';
}

// 刷新物流路线
const refreshRoute = () => {
  if (map) {
    map.destroy()
    map = null
  }
  useStaticMapMode.value = false;
  useLocalMapMode.value = false;
  staticMapUrl.value = '';
  handleSearch()
}

// 查看订单详情
const goToOrderDetail = () => {
  router.push(`/admin/orders`)
}

// 更改地图视图类型
const changeMapView = () => {
  if (map) {
    if (mapViewType.value === 'normal') {
      map.setMapStyle('amap://styles/normal')
    } else {
      map.setMapStyle('amap://styles/satellite')
    }
  }
}

// 格式化日期时间
const formatDateTime = (timestamp) => {
  if (!timestamp) return '未知'
  const date = new Date(timestamp)
  return date.toLocaleString()
}
</script>

<style scoped>
.shipping-route {
  padding: 20px;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  background-color: #fff;
  padding: 15px;
  border-radius: 4px;
  box-shadow: 0 1px 4px rgba(0, 21, 41, 0.08);
}

.page-header h2 {
  margin: 0;
  font-size: 20px;
  color: #303133;
}

.search-container {
  display: flex;
  align-items: center;
}

.search-input {
  width: 300px;
}

.route-container {
  background-color: #fff;
  border-radius: 4px;
  padding: 20px;
  min-height: 500px;
  box-shadow: 0 1px 4px rgba(0, 21, 41, 0.08);
}

.info-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding-bottom: 15px;
  border-bottom: 1px solid #ebeef5;
}

.info-title {
  display: flex;
  align-items: center;
}

.info-title h3 {
  margin: 0 10px 0 0;
  font-size: 18px;
  color: #303133;
}

.info-actions {
  display: flex;
  align-items: center;
  gap: 10px;
}

.info-card {
  background-color: #f5f7fa;
  border-radius: 4px;
  padding: 20px;
  margin-bottom: 20px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.info-card h3 {
  margin-top: 0;
  margin-bottom: 15px;
  font-size: 16px;
  color: #333;
  border-bottom: 1px solid #e0e0e0;
  padding-bottom: 10px;
}

.info-item {
  margin-bottom: 12px;
  display: flex;
}

.info-item .label {
  width: 100px;
  color: #666;
  font-weight: bold;
}

.route-map-container {
  margin-bottom: 30px;
  border: 1px solid #ebeef5;
  border-radius: 4px;
  overflow: hidden;
}

.map-container {
  height: 500px;
  width: 100%;
  position: relative;
  z-index: 1; /* 确保地图在正确的层级 */
  border: 1px solid #dcdfe6;
  overflow: hidden;
}

.map-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 15px;
  background-color: #f5f7fa;
  border-bottom: 1px solid #ebeef5;
}

.map-header h3 {
  margin: 0;
  font-size: 16px;
  color: #333;
}

.map-actions {
  display: flex;
  align-items: center;
}

.route-timeline {
  margin-top: 30px;
  background-color: #fff;
  border-radius: 4px;
  padding: 20px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.route-timeline h3 {
  margin-top: 0;
  margin-bottom: 20px;
  font-size: 16px;
  color: #333;
  border-bottom: 1px solid #e0e0e0;
  padding-bottom: 10px;
}

.timeline-content {
  padding: 10px;
  background-color: #f5f7fa;
  border-radius: 4px;
}

.timeline-title {
  font-weight: bold;
  margin-bottom: 5px;
  color: #303133;
}

.timeline-location {
  font-size: 12px;
  color: #666;
}

.map-error {
  height: 500px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  background-color: #f5f7fa;
  border: 1px solid #dcdfe6;
  border-radius: 4px;
}

.error-message {
  margin-top: 20px;
  text-align: center;
  color: #606266;
}

.error-message ul {
  text-align: left;
  margin-top: 10px;
}

.static-map-container {
  height: 500px;
  position: relative;
  border: 1px solid #dcdfe6;
  border-radius: 4px;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  align-items: center;
  background-color: #f5f7fa;
}

.static-map {
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
}

.static-map-info {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  background-color: rgba(255, 255, 255, 0.8);
  padding: 10px;
  text-align: center;
}

.route-info-text {
  display: flex;
  justify-content: space-around;
  flex-wrap: wrap;
  margin-top: 10px;
}

.route-info-text p {
  margin: 5px 10px;
}

.local-map-container {
  height: 500px;
  position: relative;
  border: 1px solid #dcdfe6;
  border-radius: 4px;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  align-items: center;
  background-color: #f5f7fa;
}

.local-map {
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
}

.local-map-info {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  background-color: rgba(255, 255, 255, 0.8);
  padding: 10px;
  text-align: center;
}

.backup-text {
  padding: 20px;
  text-align: center;
  background-color: #f5f7fa;
  border-radius: 4px;
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
}

.backup-text h3 {
  margin-bottom: 20px;
  color: #409EFF;
}

.backup-text p {
  margin: 5px 0;
  font-size: 14px;
  color: #606266;
}

/* 响应式调整 */
@media screen and (max-width: 768px) {
  .page-header {
    flex-direction: column;
    align-items: flex-start;
  }
  
  .page-header h2 {
    margin-bottom: 15px;
  }
  
  .search-input {
    width: 100%;
  }
  
  .info-header {
    flex-direction: column;
    align-items: flex-start;
  }
  
  .info-title {
    margin-bottom: 15px;
  }
  
  .map-container {
    height: 350px; /* 移动设备上地图高度 */
  }
  
  .map-error {
    height: 350px;
  }
  
  .static-map-container {
    height: 350px;
  }
  
  .local-map-container {
    height: 350px;
  }
}
</style> 