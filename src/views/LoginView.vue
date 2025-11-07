<template>
  <div class="login-container" style="display:flex;justify-content:center;align-items:center;min-height:60vh;">
    <el-card class="login-card" header="用户登录" style="width:360px;padding:16px;">
      <el-form
        class="login-form"
        :model="loginForm"
        :rules="loginRules"
        ref="loginFormRef"
        @submit.prevent="handleLogin"
      >
        <el-alert
          v-if="showError"
          :title="errorMessage"
          type="error"
          :closable="true"
          show-icon
          @close="showError = false"
          class="login-error"
        />
        <el-form-item prop="username">
          <el-input
            v-model="loginForm.username"
            placeholder="用户名"
            prefix-icon="User"
            size="small"
          />
        </el-form-item>

        <el-form-item prop="password">
          <el-input
            v-model="loginForm.password"
            type="password"
            placeholder="密码"
            prefix-icon="Lock"

            show-password
            size="small"
          />
        </el-form-item>

        <el-form-item>
          <el-button
            type="primary"
            class="login-button"
            native-type="submit"
            :loading="loading"
            size="small"
            style="width:100%;"
          >
            登录
          </el-button>
        </el-form-item>

        <div class="links" style="display:flex;justify-content:space-between;font-size:12px;">
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
// 6. 按钮加载状态和错误状态
const loading = ref(false);
const errorMessage = ref('');
const showError = ref(false);

// 7. 表单数据
const loginForm = reactive({
  username: '',
  password: '',
});

// 8. 表单校验规则
const loginRules = reactive({
  username: [
    { required: true, message: '用户名不能为空', trigger: 'blur' },
    { pattern: /^[\u4e00-\u9fa5a-zA-Z0-9]{6,12}$/, message: '"用户名不能包括特殊符号,并且长度为6-12位', trigger: 'blur' }
  ],
  password: [
    { required: true, message: '密码不能为空', trigger: 'blur' },
    { pattern: /^[a-zA-Z0-9]{8,16}$/, message: '密码只能包括大小写字母和数字,并且长度在8-16位', trigger: 'blur' }
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
        errorMessage.value = '';
        showError.value = false;
        router.push('/home');
      } catch (error) {
        // 处理不同类型的错误
        let msg = '登录失败，请稍后重试';
        
        if (error instanceof Error) {
          const errMsg = error.message.toLowerCase();
          if (errMsg.includes('password') || errMsg.includes('密码')) {
            msg = '密码错误，请重新输入';
          } else if (errMsg.includes('user') || errMsg.includes('用户')) {
            msg = '用户名不存在';
          } else if (errMsg.includes('network') || errMsg.includes('timeout')) {
            msg = '网络连接失败，请检查网络后重试';
          }
          errorMessage.value = msg;
        }
        
        showError.value = true;
        ElMessage({
          message: msg,
          type: 'error',
          duration: 3000,
          showClose: true
        });

      } finally {
        loading.value = false;
      }
    } else {
      ElMessage.warning('请检查登录信息');
    }
  });
};
</script>

<style scoped>
.login-card {
  /* 可通过修改这个变量来调整 input 之间的垂直间距 */
  --form-item-gap: 16px; /* 默认 12px，可改为 8px / 16px 等 */
}

.login-form {
  display: flex;
  flex-direction: column;
  gap: var(--form-item-gap);
}

/* 确保 Element Plus 默认的 .el-form-item margin 不会与 gap 冲突 */
.login-form ::v-deep .el-form-item {
  margin-bottom: 0;
}

.login-error {
  margin-bottom: var(--form-item-gap);
  border-radius: 4px;
}

.login-error ::v-deep .el-alert__title {
  font-size: 13px;
  line-height: 1.4;
}
</style>