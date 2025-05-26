<template>
  <el-button 
    :type="isReviewed ? 'info' : 'warning'" 
    :disabled="isReviewed"
    size="small"
    @click="handleClick"
  >
    {{ isReviewed ? '已评价' : '去评价' }}
  </el-button>
</template>

<script>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { checkReviewed } from '../api/review'

export default {
  props: {
    goodsId: {
      type: [Number, String],
      required: true
    },
    orderId: {
      type: [Number, String],
      required: true
    }
  },
  
  setup(props) {
    const router = useRouter()
    const isReviewed = ref(false)
    
    onMounted(async () => {
      await checkReviewStatus()
    })
    
    const checkReviewStatus = async () => {
      try {
        console.log(`检查商品 ${props.goodsId} 在订单 ${props.orderId} 中的评价状态`)
        const res = await checkReviewed(Number(props.goodsId), Number(props.orderId))
        console.log(`检查结果:`, res)
        
        if (res.success && res.data === true) {
          isReviewed.value = true
          console.log(`商品 ${props.goodsId} 已评价`)
        } else {
          isReviewed.value = false
          console.log(`商品 ${props.goodsId} 未评价`)
        }
      } catch (error) {
        console.error(`检查商品 ${props.goodsId} 评价状态失败:`, error)
        isReviewed.value = false
      }
    }
    
    const handleClick = () => {
      if (isReviewed.value) {
        ElMessage.info('该商品已完成评价')
        return
      }
      
      // 跳转到商品详情页并打开评价表单
      router.push({
        path: `/goods/${props.goodsId}`,
        query: { 
          review: 'true',
          orderId: props.orderId
        }
      })
    }
    
    return {
      isReviewed,
      handleClick
    }
  }
}
</script>

<style scoped>
/* 可以添加自定义样式 */
</style> 