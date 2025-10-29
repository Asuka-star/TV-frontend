<template>
  <div class="register-container">
    <el-card class="register-card" header="用户注册">
      <el-form
        :model="registerForm"
        :rules="registerRules"
        ref="registerFormRef"
        @submit.prevent="handleRegister"
        label-position="top"
      >
        <el-form-item label="用户名" prop="username">
          <el-input
            v-model="registerForm.username"
            placeholder="设置您的用户名"
            prefix-icon="User"
            size="large"
          />
        </el-form-item>

        <el-form-item label="密码" prop="password">
          <el-input
            v-model="registerForm.password"
            type="password"
            placeholder="设置您的密码 (建议6位以上)"
            prefix-icon="Lock"
            show-password
            size="large"
          />
        </el-form-item>

        <el-form-item label="确认密码" prop="checkPass">
          <el-input
            v-model="registerForm.checkPass"
            type="password"
            placeholder="请再次输入密码"
            prefix-icon="Lock"
            show-password
            size="large"
          />
        </el-form-item>

        <el-form-item>
          <el-button
            type="primary"
            class="register-button"
            native-type="submit"
            :loading="loading"
            size="large"
          >
            注 册
          </el-button>
        </el-form-item>

        <div class="links">
          <router-link to="/login">
            <el-link type="primary">已有账户？立即登录</el-link>
          </router-link>
        </div>
      </el-form>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue';
import { useRouter } from 'vue-router';
import { ElMessage } from 'element-plus';
// 👈 修复 1 & 4：导入类型
import type { FormInstance, FormRules } from 'element-plus';
// 👈 修复 3：导入 isAxiosError
import axios, { isAxiosError } from 'axios';

// --- 状态定义 ---
const router = useRouter();
// 👈 修复 1：指定类型
const registerFormRef = ref<FormInstance | null>(null);
const loading = ref(false);

const registerForm = reactive({
  username: '',
  password: '',
  checkPass: '',
});

// --- 校验逻辑 ---

// 👈 修复 2：为参数添加类型
const validatePass2 = (
  rule: any,
  value: any,
  callback: (error?: Error) => void
) => {
  if (value === '') {
    callback(new Error('请再次输入密码'));
  } else if (value !== registerForm.password) {
    callback(new Error('两次输入的密码不一致!'));
  } else {
    callback();
  }
};

// 👈 修复 4：指定类型
const registerRules = reactive<FormRules>({
  username: [
    { required: true, message: '用户名不能为空', trigger: 'blur' },
  ],
  password: [
    { required: true, message: '密码不能为空', trigger: 'blur' },
    { min: 6, message: '密码长度不能少于 6 位', trigger: 'blur' },
  ],
  checkPass: [
    { required: true, validator: validatePass2, trigger: 'blur' },
  ],
});

// --- 方法定义 ---
const handleRegister = async () => {
  if (!registerFormRef.value) return;

  // (现在 .validate 和 valid 不会报错)
  await registerFormRef.value.validate(async (valid) => {
    if (valid) {
      loading.value = true;
      try {
        const resp = await axios({
          method: 'post',
          url: '/api/user',
          data: {
            username: registerForm.username,
            password: registerForm.password,
          },
        });

        if (resp.status === 200) {
          ElMessage.success('注册成功！即将跳转到登录页...');
          setTimeout(() => {
            router.push('/login');
          }, 1500);
        } else {
          ElMessage.error(resp.data.message || '注册失败');
        }
      } catch (error) {
        // 👈 修复 3：安全地处理 error
        let errorMessage = '注册请求失败';
        if (isAxiosError(error)) {
          errorMessage = error.response?.data?.message || '服务器响应错误';
        } else if (error instanceof Error) {
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
/* 样式与登录页基本一致 */
.register-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  background-color: #f0f2f5;
}

.register-card {
  width: 400px;
}

.register-button {
  width: 100%;
}

.links {
  display: flex;
  justify-content: center;
  margin-top: 10px;
}
</style>