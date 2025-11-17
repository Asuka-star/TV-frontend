import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { useRouter } from 'vue-router';
import { loginAPI } from '@/api/user';

/**
 * 定义用户 Store (仓库)
 * * 第一个参数 'user' 是这个 store 的唯一 ID，Pinia 会用它来连接 devtools
 */
export const useUserStore = defineStore('user', () => {

  // === 1. State (状态) ===
  // 你的 "全局数据"
  
  // 清理可能损坏的 localStorage 数据
  const cleanInvalidStorage = () => {
    const stored = localStorage.getItem('userInfo');
    if (stored === 'undefined' || stored === 'null') {
      localStorage.removeItem('userInfo');
      localStorage.removeItem('token');
    }
  };
  cleanInvalidStorage();
  
  // 尝试从 localStorage 读取 token，实现"持久化登录"
  // 用户刷新页面后，只要 token 还在，就保持登录状态
  const token = ref(localStorage.getItem('token') || '');
  
  // 存储用户信息（例如：ID, 用户名, 头像等）
  const getUserInfoFromStorage = () => {
    try {
      const stored = localStorage.getItem('userInfo');
      if (!stored || stored === 'undefined' || stored === 'null') {
        return {};
      }
      return JSON.parse(stored);
    } catch (e) {
      console.error('解析 userInfo 失败:', e);
      return {};
    }
  };
  const userInfo = ref(getUserInfoFromStorage());


  // === 2. Getters (计算属性) ===
  // 类似于 Vue 组件中的 computed，它们会根据 state 自动计算
  
  // 计算用户是否已登录 (!! 是一个技巧，把字符串转成布尔值)
  const isLoggedIn = computed(() => !!token.value);
  
  // 获取用户名，用于导航栏显示
  const username = computed(() => userInfo.value?.username || '游客');
  

  // === 3. Actions (动作) ===
  // 你的 "全局方法"，用于修改 state
  
  const router = useRouter(); // 获取路由实例，用于登出后跳转

  /**
   * 登录动作 (这就是你的 LoginView.vue 调用的方法)
   * @param {string} username - 用户名
   * @param {string} password - 密码
   */
  const login = async (username: string, password: string) => {
    try {
      // 1. 调用你的真实 API
      const response = await loginAPI({ username, password }); // <-- 真实的调用

      console.log('登录响应:', response.data);

      // 2. 登录成功，更新 State
      const userData = response.data.data;
      token.value = userData.token || '';
      
      // 构建用户信息对象
      const userInfoData = {
        id: userData.id,
        username: userData.username,
        fansNumber: userData.fansNumber || 0
      };
      userInfo.value = userInfoData;

      // 3. (关键!) 将 token 和用户信息存入 localStorage
      //    这样用户关闭浏览器或刷新页面后，状态依然存在
      localStorage.setItem('token', userData.token || '');
      localStorage.setItem('userInfo', JSON.stringify(userInfoData));

      // 4. (注意!) 这里不需要返回任何东西，也不需要 ElMessage 或 router.push
      //    因为 LoginView.vue 的 try 块会自动继续执行那里的 ElMessage 和 push

    } catch (error) {
      // 5. (关键!) 登录失败，API 抛出了错误
      //    我们在这里再次把错误 throw (抛出) 出去
      //    这样 LoginView.vue 的 catch (error) 块就能捕获到这个错误！
      throw error;
    }
  };

  /**
   * 登出动作
   */
  const logout = () => {
    // 1. 清空 State
    token.value = '';
    userInfo.value = {};

    // 2. (关键!) 清空 localStorage
    localStorage.removeItem('token');
    localStorage.removeItem('userInfo');
    
    // 3. (可选) 跳转到登录页
    router.push('/login');
  };


  // === 4. Return ===
  // 把你需要“暴露”给所有组件的 state, getters 和 actions 返回
  return {
    // State
    token,
    userInfo,
    
    // Getters
    isLoggedIn,
    username,
    
    // Actions
    login,
    logout
  };
});