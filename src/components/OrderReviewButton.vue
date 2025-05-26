<template>
  <el-button 
    :type="allReviewed ? 'info' : 'warning'" 
    :disabled="allReviewed"
    size="small"
    @click="handleClick"
  >
    {{ allReviewed ? '已评价' : '去评价' }}
  </el-button>
</template>

<script>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { checkReviewed } from '../api/review'

export default {
  props: {
    order: {
      type: Object,
      required: true
    }
  },
  
  emits: ['show-review-options'],
  
  setup(props, { emit }) {
    const router = useRouter()
    const allReviewed = ref(false)
    const checkedItems = ref(0)
    const totalItems = ref(0)
    
    onMounted(async () => {
      await checkAllItemsReviewStatus()
    })
    
    const checkAllItemsReviewStatus = async () => {
      if (!props.order || !props.order.orderItems || !Array.isArray(props.order.orderItems) || props.order.orderItems.length === 0) {
        allReviewed.value = false
        return
      }
      
      totalItems.value = props.order.orderItems.length
      checkedItems.value = 0
      
      // 检查所有商品的评价状态
      for (const item of props.order.orderItems) {
        try {
          const res = await checkReviewed(Number(item.goodsId), Number(props.order.id))
          if (res.success && res.data === true) {
            checkedItems.value++
          }
        } catch (error) {
          console.error(`检查商品 ${item.goodsId} 评价状态失败:`, error)
        }
      }
      
      // 如果所有商品都已评价，则设置为全部已评价
      allReviewed.value = checkedItems.value === totalItems.value
      console.log(`订单 ${props.order.id} 中的商品评价状态: ${checkedItems.value}/${totalItems.value} 已评价`)
    }
    
    const handleClick = () => {
      if (allReviewed.value) {
        ElMessage.info('该订单所有商品已完成评价')
        return
      }
      
      // 如果订单中只有一件商品，直接跳转到评价页面
      if (props.order.orderItems && props.order.orderItems.length === 1) {
        router.push({
          path: `/goods/${props.order.orderItems[0].goodsId}`,
          query: { 
            review: 'true',
            orderId: props.order.id
          }
        })
        return
      }
      
      // 触发父组件的showReviewOptions方法
      emit('show-review-options')
    }
    
    return {
      allReviewed,
      handleClick
    }
  }
}
</script>

<style scoped>
/* 可以添加自定义样式 */
</style> 