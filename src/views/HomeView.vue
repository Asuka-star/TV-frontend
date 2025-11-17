<template>
  <div class="common-layout">
    <el-container>
      <el-header class="myHeader">
        <div class="header-content">
          <h1 class="logo" @click="$router.push('/')">南亭探店</h1>
          <el-menu
            :default-active="activeMenu"
            mode="horizontal"
            :ellipsis="false"
            class="header-menu"
            @select="handleMenuSelect"
          >
            <el-menu-item index="/posts">动态广场</el-menu-item>
            <el-menu-item index="/shops">商铺列表</el-menu-item>
            <el-menu-item index="/profile" v-if="userStore.isLoggedIn">个人中心</el-menu-item>
          </el-menu>
          <div class="header-actions">
            <template v-if="userStore.isLoggedIn">
              <span class="username">{{ userStore.username }}</span>
              <el-button @click="userStore.logout()" size="small">退出</el-button>
            </template>
            <template v-else>
              <el-button @click="$router.push('/login')" size="small">登录</el-button>
              <el-button type="primary" @click="$router.push('/register')" size="small">注册</el-button>
            </template>
          </div>
        </div>
      </el-header>
      <el-main>
        <router-view />
      </el-main>
    </el-container>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useUserStore } from '@/stores/userStore';

const route = useRoute();
const router = useRouter();
const userStore = useUserStore();

const activeMenu = ref(route.path);

watch(() => route.path, (newPath) => {
  activeMenu.value = newPath;
});

const handleMenuSelect = (index: string) => {
  router.push(index);
};
</script>

<style scoped>
.common-layout {
  min-height: 100vh;
  width: 100%;
}

.el-container {
  min-height: 100vh;
}

.myHeader {
  background-color: #fff;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  padding: 0 20px;
  height: 60px;
  line-height: 60px;
}

.header-content {
  max-width: 1400px;
  margin: 0 auto;
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 100%;
}

.logo {
  font-size: 24px;
  font-weight: bold;
  color: #409eff;
  margin: 0;
  cursor: pointer;
  user-select: none;
}

.header-menu {
  flex: 1;
  margin: 0 40px;
  border-bottom: none;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 12px;
}

.username {
  color: #666;
  font-size: 14px;
}

:deep(.el-main) {
  background-color: #f5f5f5;
  padding: 20px;
  min-height: calc(100vh - 60px);
}
</style>