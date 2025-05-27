import { GoodsFilled, Cellphone, Monitor, HomeFilled, ShoppingBag, Apple, Brush, Basketball, Reading } from '@element-plus/icons-vue'

const getCategoryIcon = (categoryId) => {
  const iconMap = {
    1: Cellphone,     // 手机数码
    2: Monitor,       // 电脑办公
    3: HomeFilled,    // 家用电器
    4: ShoppingBag,   // 服装鞋包
    5: Apple,         // 食品生鲜
    6: Brush,         // 美妆护肤
    7: Basketball,    // 运动户外
    8: Reading,       // 图书音像
  }
  return iconMap[categoryId] || GoodsFilled  // 默认图标
}

<el-icon size="36px">
  <component :is="getCategoryIcon(category.id)"></component>
</el-icon> 