<template>
  <div class="register-container" style="display:flex;justify-content:center;align-items:center;min-height:60vh;">
    <el-card class="register-card" header="用户注册" style="width:360px;padding:16px;">
      <el-form
        class="register-form"
        :model="registerForm"
        :rules="registerRules"
        ref="registerFormRef"
        @submit.prevent="handleRegister"
      >
        <el-alert
          v-if="showError"
          :title="errorMessage"
          type="error"
          :closable="true"
          show-icon
          @close="showError = false"
          class="register-error"
        />
        <el-form-item prop="username">
          <el-input
            v-model="registerForm.username"
            placeholder="用户名"
            prefix-icon="User"
            size="small"
          />
        </el-form-item>

        <el-form-item prop="password">
          <el-input
            v-model="registerForm.password"
            type="password"
            placeholder="密码"
            prefix-icon="Lock"

            show-password
            size="small"
          />
        </el-form-item>

        <el-form-item prop="checkPass">
          <el-input
            v-model="registerForm.checkPass"
            type="password"
            placeholder="请确认密码"
            prefix-icon="Lock"
            show-password
            size="small"
          />
        </el-form-item>

        <el-form-item>
          <el-button
            type="primary"
            class="register-button"
            native-type="submit"
            :loading="loading"
            size="small"
            style="width:100%;"
          >
            注册
          </el-button>
        </el-form-item>

        <div class="links" style="display:flex;justify-content:space-between;font-size:12px;">
          <router-link to="/login">
            <el-link type="info">用户登录</el-link>
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
import { registerAPI } from '@/api/user';

// --- 状态定义 ---

// 3. 获取路由实例，用于跳转
const router = useRouter();

// 5. 绑定表单 DOM，用于校验
const registerFormRef = ref<FormInstance | null>(null); // 👈 修复 1：指定类型
// 6. 按钮加载状态和错误状态
const loading = ref(false);
const errorMessage = ref('');
const showError = ref(false);

// 7. 表单数据
const registerForm = reactive({
  username: '',
  password: '',
  checkPass: '',  // 确认密码字段
});

// 确认密码的校验函数
const validateCheckPass = (rule: any, value: string, callback: (error?: Error) => void) => {
  if (value === '') {
    callback(new Error('请再次输入密码'));
  } else if (value !== registerForm.password) {
    callback(new Error('两次输入的密码不一致'));
  } else {
    callback();
  }
};

// 8. 表单校验规则
const registerRules = reactive({
  username: [
    { required: true, message: '用户名不能为空', trigger: 'blur' },
    { pattern: /^[\u4e00-\u9fa5a-zA-Z0-9]{6,12}$/, message: '"用户名不能包括特殊符号,并且长度为6-12位', trigger: 'blur' }
  ],
  password: [
    { required: true, message: '密码不能为空', trigger: 'blur' },
    { pattern: /^[a-zA-Z0-9]{8,16}$/, message: '密码只能包括大小写字母和数字,并且长度在8-16位', trigger: 'blur' }
  ],
  checkPass: [
    { required: true, message: '请再次输入密码', trigger: 'blur' },
    { validator: validateCheckPass, trigger: 'blur' }
  ],
});

// --- 方法定义 ---

// 9. 注册逻辑
const handleRegister = async () => {
  if (!registerFormRef.value) return; 

  // 现在 registerFormRef.value.validate 和 valid 都不会报错
  await registerFormRef.value.validate(async (valid) => {
    if (valid) {
      loading.value = true;
      try {
        await registerAPI({ username: registerForm.username, password: registerForm.password }); 
        ElMessage.success('注册成功！即将跳转到登录页...');
        errorMessage.value = '';
        showError.value = false;
        // 延迟跳转，让用户看到成功消息
        setTimeout(() => {
          router.push('/login');
        }, 1000);
      } catch (error) {
        // 处理不同类型的错误，优先展示后端返回的 message
        let msg = '注册失败，请稍后重试';

        const backendMsg = (error as any)?.response?.data?.message;
        const errSource = backendMsg ? String(backendMsg).toLowerCase() : (error instanceof Error ? error.message.toLowerCase() : '');

        if (errSource) {
          if (errSource.includes('exist') || errSource.includes('已存在')) {
            msg = '用户名已被注册';
          } else if (errSource.includes('format') || errSource.includes('格式')) {
            msg = '用户名或密码格式不正确';
          } else if (errSource.includes('network') || errSource.includes('timeout')) {
            msg = '网络连接失败，请检查网络后重试';
          } else {
            // 如果后端直接返回了可用的中文提示，优先展示
            if (backendMsg) msg = String(backendMsg);
          }
        }

        errorMessage.value = msg;
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
      ElMessage.warning('请检查注册信息');
    }
  });
};
</script>

<style scoped>
.register-card {
  /* 可通过修改这个变量来调整 input 之间的垂直间距 */
  --form-item-gap: 16px; /* 默认 12px，可改为 8px / 16px 等 */
}

.register-form {
  display: flex;
  flex-direction: column;
  gap: var(--form-item-gap);
}

/* 确保 Element Plus 默认的 .el-form-item margin 不会与 gap 冲突 */
.register-form :deep(.el-form-item) {
  margin-bottom: 0;
}

.register-error {
  margin-bottom: var(--form-item-gap);
  border-radius: 4px;
}

.register-error :deep(.el-alert__title) {
  font-size: 13px;
  line-height: 1.4;
}
</style>