<template>
  <el-card class="follow-list-container">
    <el-form :model="queryParams" :inline="true">
      <el-form-item label="关注类型">
        <el-select
          v-model="queryParams.type"
          placeholder="请选择类型"
          style="width: 120px"
          @change="handleQuery"
        >
          <el-option label="用户" value="0" />
          <el-option label="商铺" value="1" />
        </el-select>
      </el-form-item>

      <el-form-item label="排序方式">
        <el-select v-model="queryParams.isAsc" style="width: 100px">
          <el-option label="升序" :value="true" />
          <el-option label="降序" :value="false" />
        </el-select>
      </el-form-item>

      <el-form-item>
        <el-button type="primary" icon="Search" @click="handleQuery">查询</el-button>
        <el-button icon="Back" @click="goHome">返回首页</el-button>
      </el-form-item>
    </el-form>

    <el-table :data="tableData" v-loading="loading" style="width: 100%">
      <el-table-column prop="id" label="ID" width="180" />

      <template v-if="queryParams.type === '1'">
        <el-table-column prop="targetId" label="商铺ID" />
        <el-table-column prop="targetName" label="商铺名称" />
      </template>

      <template v-if="queryParams.type === '0'">
        <el-table-column prop="targetId" label="用户ID" />
        <el-table-column prop="targetName" label="用户名" />
      </template>

      <el-table-column prop="createTime" label="关注时间" />
      
      </el-table>

    <el-pagination
      v-model:current-page="queryParams.page"
      v-model:page-size="queryParams.pageSize"
      :page-sizes="[10, 20, 50, 100]"
      layout="total, sizes, prev, pager, next, jumper"
      :total="total"
      @size-change="getList"
      @current-change="getList"
      style="margin-top: 20px; justify-content: flex-end"
    />
  </el-card>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { ElMessage } from 'element-plus';
import axios from 'axios';

// --- 状态定义 ---
const router = useRouter();
const loading = ref(false);
const tableData = ref([]); // 对应你原来的 follows
const total = ref(0); // 对应你原来的 count

// 对应你原来的 params
// 注意：<el-select> 的 value 是字符串，所以 type 默认值设为 '1'
const queryParams = reactive({
  page: 1,
  pageSize: 10,
  sortBy: 'create_time',
  isAsc: true,
  type: '1', // 默认查询商铺 (原文件为 1)
});

// (最佳实践是使用 Pinia Store，这里为保持一致性暂时从 localStorage 取)
const token = localStorage.getItem('token');

// --- API 方法 ---

// 1. 获取列表 (你原来的 fetchData) 
const getList = async () => {
  // 校验登录
  if (!token) {
    ElMessage.error('请先登录');
    router.push('/login');
    return;
  }
  
  // 参数校验
  if (queryParams.page < 1) queryParams.page = 1;
  if (queryParams.pageSize < 1) queryParams.pageSize = 10;

  loading.value = true;
  try {
    const response = await axios.get('/api/follow/page', {
      params: queryParams,
      headers: { 'token': token },
    });
    tableData.value = response.data.data.records;
    total.value = response.data.data.total;
  } catch (error: any) {
    // 替换 alert
    ElMessage.error('查询失败: ' + error.response?.data?.message);
  } finally {
    loading.value = false;
  }
};

// 2. 处理查询 (重置页码)
const handleQuery = () => {
  queryParams.page = 1;
  getList();
};

// 3. 返回首页
const goHome = () => {
  router.push('/home'); // 替换 window.location.href
};

// --- 生命周期 ---
onMounted(() => {
  getList(); // 页面加载时获取数据
});
</script>

<style scoped>
.follow-list-container {
  padding: 20px;
}
</style>