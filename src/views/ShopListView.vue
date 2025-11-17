<template>
  <div class="shop-list-container">
    <el-card class="header-card">
      <div class="header-content">
        <h2>商铺列表</h2>
        <el-button type="primary" @click="showAddShopDialog = true" :icon="Plus">注册商铺</el-button>
      </div>
    </el-card>

    <!-- 搜索栏 -->
    <el-card class="search-card">
      <el-form :inline="true" :model="searchForm">
        <el-form-item label="商铺名称">
          <el-input v-model="searchForm.name" placeholder="请输入商铺名称" clearable />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleSearch" :icon="Search">搜索</el-button>
          <el-button @click="handleReset">重置</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <!-- 商铺列表 -->
    <div class="shop-list" v-loading="loading">
      <el-empty v-if="shopList.length === 0 && !loading" description="暂无商铺" />
      
      <el-card 
        v-for="shop in shopList" 
        :key="shop.id" 
        class="shop-card"
        shadow="hover"
        @click="handleViewShop(shop.id)"
      >
        <div class="shop-content">
          <el-avatar :size="80" shape="square">{{ shop.name.charAt(0) }}</el-avatar>
          <div class="shop-info">
            <h3>{{ shop.name }}</h3>
            <p class="shop-address"><el-icon><Location /></el-icon> {{ shop.address }}</p>
            <p class="shop-time">
              <el-icon><Clock /></el-icon> 
              营业时间：{{ formatTime(shop.beginTime) }} - {{ formatTime(shop.endTime) }}
            </p>
            <div class="shop-stats">
              <span><el-icon><Star /></el-icon> 点赞 {{ shop.thumbNumber }}</span>
              <span><el-icon><ChatDotRound /></el-icon> 评论 {{ shop.commentNumber }}</span>
              <span><el-icon><User /></el-icon> 粉丝 {{ shop.fansNumber }}</span>
            </div>
          </div>
          <div class="shop-actions">
            <el-button 
              :type="shop.hasFollow ? 'primary' : 'default'"
              @click.stop="handleFollow(shop)"
            >
              {{ shop.hasFollow ? '已关注' : '关注' }}
            </el-button>
            <el-button 
              :type="shop.hasThumb ? 'warning' : 'default'"
              :icon="shop.hasThumb ? StarFilled : Star"
              @click.stop="handleThumb(shop)"
            >
              点赞
            </el-button>
          </div>
        </div>
      </el-card>

      <!-- 分页 -->
      <el-pagination
        v-if="total > 0"
        class="pagination"
        v-model:current-page="currentPage"
        v-model:page-size="pageSize"
        :total="total"
        :page-sizes="[10, 20, 50]"
        layout="total, sizes, prev, pager, next, jumper"
        @size-change="handleSizeChange"
        @current-change="handleCurrentChange"
      />
    </div>

    <!-- 注册商铺对话框 -->
    <el-dialog
      v-model="showAddShopDialog"
      title="注册商铺"
      width="500px"
    >
      <el-form :model="shopForm" :rules="shopRules" ref="shopFormRef" label-width="100px">
        <el-form-item label="商铺名称" prop="name">
          <el-input v-model="shopForm.name" placeholder="请输入商铺名称" maxlength="20" show-word-limit />
        </el-form-item>
        <el-form-item label="商铺地址" prop="address">
          <el-input v-model="shopForm.address" placeholder="请输入商铺地址" maxlength="100" show-word-limit />
        </el-form-item>
        <el-form-item label="营业时间" required>
          <el-col :span="11">
            <el-form-item prop="beginTime">
              <el-time-picker 
                v-model="beginTime" 
                placeholder="开始时间"
                format="HH:mm:ss"
                value-format="HH:mm:ss"
              />
            </el-form-item>
          </el-col>
          <el-col :span="2" style="text-align: center;">-</el-col>
          <el-col :span="11">
            <el-form-item prop="endTime">
              <el-time-picker 
                v-model="endTime" 
                placeholder="结束时间"
                format="HH:mm:ss"
                value-format="HH:mm:ss"
              />
            </el-form-item>
          </el-col>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showAddShopDialog = false">取消</el-button>
        <el-button type="primary" @click="handleAddShop" :loading="submitting">注册</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { ElMessage } from 'element-plus';
import { Plus, Search, Location, Clock, Star, StarFilled, ChatDotRound, User } from '@element-plus/icons-vue';
import type { FormInstance } from 'element-plus';
import { queryShopPageAPI, registerShopAPI, type ShopVO, type LocalTime } from '@/api/shop';
import { addThumbAPI, cancelThumbAPI } from '@/api/thumb';
import { addFollowAPI, cancelFollowAPI } from '@/api/follow';
import { useUserStore } from '@/stores/userStore';

const router = useRouter();

// 状态
const loading = ref(false);
const submitting = ref(false);
const shopList = ref<ShopVO[]>([]);
const currentPage = ref(1);
const pageSize = ref(10);
const total = ref(0);

// 搜索表单
const searchForm = reactive({
  name: ''
});

// 注册商铺
const showAddShopDialog = ref(false);
const shopFormRef = ref<FormInstance>();
const shopForm = reactive({
  name: '',
  address: ''
});

const beginTime = ref('');
const endTime = ref('');

const shopRules = {
  name: [
    { required: true, message: '请输入商铺名称', trigger: 'blur' },
    { min: 1, max: 20, message: '商铺名称长度在 1 到 20 个字符', trigger: 'blur' }
  ],
  address: [
    { required: true, message: '请输入商铺地址', trigger: 'blur' },
    { min: 1, max: 100, message: '商铺地址长度在 1 到 100 个字符', trigger: 'blur' }
  ],
  beginTime: [
    { required: true, message: '请选择开始营业时间', trigger: 'change' }
  ],
  endTime: [
    { required: true, message: '请选择结束营业时间', trigger: 'change' }
  ]
};

const userStore = useUserStore();

// 加载商铺列表
const loadShops = async () => {
  loading.value = true;
  try {
    const res = await queryShopPageAPI({
      page: currentPage.value - 1,
      pageSize: pageSize.value,
      name: searchForm.name || undefined
    });
    const data = res.data.data;
    shopList.value = data.records || [];
    total.value = data.total || 0;
  } catch (error) {
    ElMessage.error('加载商铺列表失败');
  } finally {
    loading.value = false;
  }
};

// 搜索
const handleSearch = () => {
  currentPage.value = 1;
  loadShops();
};

// 重置
const handleReset = () => {
  searchForm.name = '';
  currentPage.value = 1;
  loadShops();
};

// 分页变化
const handleSizeChange = () => {
  loadShops();
};

const handleCurrentChange = () => {
  loadShops();
};

// 查看商铺详情
const handleViewShop = (shopId: number) => {
  router.push(`/shop/${shopId}`);
};

// 关注商铺
const handleFollow = async (shop: ShopVO) => {
  try {
    if (shop.hasFollow) {
      const payload: Record<string, any> = {
        type: 1,
        targetId: shop.id,
        targetName: shop.name
      };
      if (userStore.userInfo?.id) payload.fansId = userStore.userInfo.id;
      await cancelFollowAPI(payload);
      shop.hasFollow = false;
      shop.fansNumber--;
      ElMessage.success('取消关注');
    } else {
      const payload: Record<string, any> = {
        type: 1,
        targetId: shop.id,
        targetName: shop.name
      };
      if (userStore.userInfo?.id) payload.fansId = userStore.userInfo.id;
      await addFollowAPI(payload);
      shop.hasFollow = true;
      shop.fansNumber++;
      ElMessage.success('关注成功');
    }
  } catch (error) {
    ElMessage.error('操作失败');
  }
};

// 点赞商铺
const handleThumb = async (shop: ShopVO) => {
  try {
    if (shop.hasThumb) {
      await cancelThumbAPI({ type: 2, targetId: shop.id });
      shop.hasThumb = false;
      shop.thumbNumber--;
      ElMessage.success('取消点赞');
    } else {
      await addThumbAPI({ type: 2, targetId: shop.id });
      shop.hasThumb = true;
      shop.thumbNumber++;
      ElMessage.success('点赞成功');
    }
  } catch (error) {
    ElMessage.error('操作失败');
  }
};

// 解析时间字符串为 LocalTime
const parseLocalTime = (timeStr: string): LocalTime => {
  const [hour, minute, second] = timeStr.split(':').map(Number);
  return { hour, minute, second, nano: 0 };
};

// 注册商铺
const handleAddShop = async () => {
  if (!shopFormRef.value) return;
  
  if (!beginTime.value || !endTime.value) {
    ElMessage.warning('请选择营业时间');
    return;
  }

  await shopFormRef.value.validate(async (valid) => {
    if (valid) {
      submitting.value = true;
      try {
        await registerShopAPI({
          name: shopForm.name,
          address: shopForm.address,
          beginTime: parseLocalTime(beginTime.value),
          endTime: parseLocalTime(endTime.value)
        });
        ElMessage.success('注册成功');
        showAddShopDialog.value = false;
        shopForm.name = '';
        shopForm.address = '';
        beginTime.value = '';
        endTime.value = '';
        loadShops();
      } catch (error) {
        ElMessage.error('注册失败');
      } finally {
        submitting.value = false;
      }
    }
  });
};

// 格式化时间（更健壮，兼容 LocalTime、字符串或 undefined）
const formatTime = (time: LocalTime | string | undefined) => {
  // 未定义或空值
  if (!time) return '--:--';

  // 如果后端直接返回字符串（例如 ISO 时间或 HH:mm:ss）
  if (typeof time === 'string') {
    // 尝试匹配 HH:mm 或 HH:mm:ss
    const hm = time.match(/(\d{1,2}):(\d{2})/);
    if (hm) {
      const hh = hm[1].padStart(2, '0');
      const mm = hm[2];
      return `${hh}:${mm}`;
    }
    // 尝试解析为 Date
    const d = new Date(time);
    if (!isNaN(d.getTime())) {
      return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
    }
    return '--:--';
  }

  // 处理 LocalTime 对象
  try {
    const pad = (n: number | undefined) => (n == null ? '00' : String(n).padStart(2, '0'));
    return `${pad((time as LocalTime).hour)}:${pad((time as LocalTime).minute)}`;
  } catch (e) {
    // 出错时返回占位符，避免抛出异常中断渲染
    console.warn('formatTime 解析失败：', time, e);
    return '--:--';
  }
};

onMounted(() => {
  loadShops();
});
</script>

<style scoped>
.shop-list-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
}

.header-card {
  margin-bottom: 20px;
}

.header-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.header-content h2 {
  margin: 0;
  font-size: 24px;
}

.search-card {
  margin-bottom: 20px;
}

.shop-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.shop-card {
  cursor: pointer;
  transition: transform 0.2s;
}

.shop-card:hover {
  transform: translateY(-2px);
}

.shop-content {
  display: flex;
  gap: 20px;
  align-items: center;
}

.shop-info {
  flex: 1;
}

.shop-info h3 {
  margin: 0 0 8px 0;
  font-size: 20px;
}

.shop-info p {
  margin: 4px 0;
  color: #666;
  
  display: flex;
  align-items: center;
  gap: 4px;
}

.shop-address {
  font-size: 14px;
}

.shop-time {
  font-size: 14px;
}

.shop-stats {
  display: flex;
  gap: 16px;
  margin-top: 8px;
  font-size: 14px;
  color: #999;
}

.shop-stats span {
  display: flex;
  align-items: center;
  gap: 4px;
}

.shop-actions {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.pagination {
  margin-top: 20px;
  display: flex;
  justify-content: center;
}
</style>
