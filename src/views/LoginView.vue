<template>
  <div class="login-container">
    <el-card class="login-card" header="用户登录">
      <el-form
        :model="loginForm"
        :rules="loginRules"
        ref="loginFormRef"
        @submit.prevent="handleLogin"
      >
        <el-form-item prop="username">
          <el-input
            v-model="loginForm.username"
            placeholder="请输入用户名"
            prefix-icon="User"
            size="large"
          />
        </el-form-item>

        <el-form-item prop="password">
          <el-input
            v-model="loginForm.password"
            type="password"
            placeholder="请输入密码"
            prefix-icon="Lock"
            show-password
            size="large"
          />
        </el-form-item>

        <el-form-item>
          <el-button
            type="primary"
            class="login-button"
            native-type="submit"
            :loading="loading"
            size="large"
          >
            登 录
          </el-button>
        </el-form-item>

        <div class="links">
          <router-link to="/register">
            <el-link type="info">用户注册</el-link>
          </router-link>
          <router-link to="/">
            <el-link type="info">返回首页</el-link>
          </router-link>
        </div>
      </el-form>
    </el-card>
  </div>
</template>

<script setup lang="ts">
// 1. 引入 Vue 和 Element Plus 的功能
import { ref, reactive } from 'vue';
import { ElMessage } from 'element-plus';
import type { FormInstance } from 'element-plus'; // 👈 修复 1：导入类型

// 2. 引入路由和状态管理
import { useRouter } from 'vue-router';
import { useUserStore } from '@/stores/userStore';

// --- 状态定义 ---

// 3. 获取路由实例，用于跳转
const router = useRouter();
// 4. 获取用户 store 实例
const userStore = useUserStore();

// 5. 绑定表单 DOM，用于校验
const loginFormRef = ref<FormInstance | null>(null); // 👈 修复 1：指定类型
// 6. 按钮加载状态
const loading = ref(false);

// 7. 表单数据
const loginForm = reactive({
  username: '',
  password: '',
});

// 8. 表单校验规则
const loginRules = reactive({
  username: [
    { required: true, message: '用户名不能为空', trigger: 'blur' },
  ],
  password: [
    { required: true, message: '密码不能为空', trigger: 'blur' },
  ],
});

// --- 方法定义 ---

// 9. 登录逻辑
const handleLogin = async () => {
  if (!loginFormRef.value) return;

  // 现在 loginFormRef.value.validate 和 valid 都不会报错
  await loginFormRef.value.validate(async (valid) => {
    if (valid) {
      loading.value = true;
      try {
        await userStore.login(loginForm.username, loginForm.password);
        ElMessage.success('登录成功');
        router.push('/home');
      } catch (error) { // 'error' 是 unknown 类型
        // 9.5. 统一的错误处理
        
        let errorMessage = '登录失败';
        // 👈 修复 2：在使用前检查 error 的类型
        if (error instanceof Error) {
          errorMessage = error.message;
        }
        ElMessage.error(errorMessage);

      } finally {
        loading.value = false;
      }
    } else {
      ElMessage.warning('请检查表单输入');
    }
  });
};
</script>

<style scoped>
</style>