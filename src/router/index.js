import { createRouter, createWebHistory } from 'vue-router'

const routes = [
  {
    path: '/',
    component: () => import('../views/Layout.vue'),
    children: [
      {
        path: '',
        name: 'Home',
        component: () => import('../views/Home.vue')
      },
      {
        path: '/category/:categoryId',
        name: 'Category',
        component: () => import('../views/Category.vue')
      },
      {
        path: '/goods/:id',
        name: 'GoodsDetail',
        component: () => import('../views/GoodsDetail.vue')
      },
      {
        path: '/cart',
        name: 'Cart',
        component: () => import('../views/Cart.vue')
      },
      {
        path: '/orders',
        name: 'Orders',
        component: () => import('../views/Orders.vue')
      },
      {
        path: '/orders/:id',
        name: 'OrderDetail',
        component: () => import('../views/OrderDetail.vue'),
        props: true,
        meta: { 
          keepAlive: false,
          reload: true
        }
      },
      {
        path: '/user',
        name: 'User',
        component: () => import('../views/User.vue')
      },
      {
        path: '/checkout',
        name: 'Checkout',
        component: () => import('../views/Checkout.vue')
      },
      {
        path: '/search',
        name: 'Search',
        component: () => import('../views/Search.vue')
      }
    ]
  },
  {
    path: '/login',
    name: 'Login',
    component: () => import('../views/Login.vue')
  },
  {
    path: '/register',
    name: 'Register',
    component: () => import('../views/Register.vue')
  },
  {
    path: '/admin',
    component: () => import('../views/admin/AdminLayout.vue'),
    meta: { requiresAdmin: true },
    children: [
      {
        path: '',
        name: 'Dashboard',
        component: () => import('../views/admin/Dashboard.vue')
      },
      {
        path: 'goods',
        name: 'GoodsManage',
        component: () => import('../views/admin/GoodsManage.vue')
      },
      {
        path: 'orders',
        name: 'OrdersManage',
        component: () => import('../views/admin/OrdersManage.vue')
      },
      {
        path: 'users',
        name: 'UsersManage',
        component: () => import('../views/admin/UsersManage.vue')
      },
      {
        path: 'categories',
        name: 'CategoriesManage',
        component: () => import('../views/admin/CategoriesManage.vue')
      }
    ]
  },
  {
    path: '/:pathMatch(.*)*',
    name: 'NotFound',
    component: () => import('../views/NotFound.vue')
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes,
  scrollBehavior(to, from, savedPosition) {
    // 如果有保存的位置，则使用保存的位置
    if (savedPosition) {
      return savedPosition
    }
    // 否则滚动到顶部
    return { top: 0 }
  }
})

// 导航守卫
router.beforeEach((to, from, next) => {
  const token = localStorage.getItem('token')
  
  // 需要管理员权限的路由
  if (to.meta.requiresAdmin) {
    const userInfo = JSON.parse(localStorage.getItem('userInfo') || '{}')
    if (token && userInfo.role === 1) {
      next()
    } else {
      next('/')
    }
  } 
  // 需要登录的路由
  else if (to.path.startsWith('/orders') || to.path === '/cart' || to.path === '/checkout' || to.path === '/user') {
    if (token) {
      next()
    } else {
      next('/login')
    }
  } else {
    next()
  }
})

export default router 