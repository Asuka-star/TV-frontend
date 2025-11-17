import { createRouter, createWebHistory } from 'vue-router'
import { useUserStore } from '@/stores/userStore'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/login', 
      name: 'login',
      component: ()=>import('../views/LoginView.vue') 
    },
    {
      path: '/register', 
      name: 'register',
      component: ()=>import('../views/RegisterView.vue') 
    },
    {
      path: '/', 
      name: 'home',
      component: ()=>import('../views/HomeView.vue'),
      redirect: '/posts',
      children: [
        {
          path: '/posts',
          name: 'posts',
          component: ()=>import('../views/PostListView.vue')
        },
        {
          path: '/post/:id',
          name: 'post-detail',
          component: ()=>import('../views/PostDetailView.vue')
        },
        {
          path: '/shops',
          name: 'shops',
          component: ()=>import('../views/ShopListView.vue')
        },
        {
          path: '/shop/:id',
          name: 'shop-detail',
          component: ()=>import('../views/ShopDetailView.vue')
        },
        {
          path: '/profile',
          name: 'profile',
          component: ()=>import('../views/ProfileView.vue'),
          meta: { requiresAuth: true }
        },
        {
          path: '/follow',
          name: 'follow',
          component: ()=>import('../views/FollowView.vue'),
          meta: { requiresAuth: true }
        }
      ]
    }
  ]
})

// 路由守卫
router.beforeEach((to, from, next) => {
  const userStore = useUserStore()
  
  // 检查是否需要登录
  if (to.meta.requiresAuth && !userStore.isLoggedIn) {
    // 需要登录但未登录，跳转到登录页
    next('/login')
  } else {
    next()
  }
})

export default router
