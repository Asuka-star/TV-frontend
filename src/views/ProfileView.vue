<template>
  <div class="profile-container">
    <el-card class="header-card">
      <div class="profile-header">
        <el-avatar :size="80">{{ userStore.username.charAt(0) }}</el-avatar>
        <div class="profile-info">
          <h2>{{ userStore.username }}</h2>
          <p>ID: {{ userStore.userInfo?.id }}</p>
        </div>
        <el-button type="danger" @click="handleLogout">退出登录</el-button>
      </div>
    </el-card>

    <el-tabs v-model="activeTab" class="profile-tabs">
      <!-- 我的订单 -->
      <el-tab-pane label="我的订单" name="orders">
        <div v-loading="loadingOrders">
          <el-empty v-if="orders.length === 0 && !loadingOrders" description="暂无订单" />
          
          <el-card 
            v-for="order in orders" 
            :key="order.id" 
            class="order-card"
            shadow="hover"
          >
            <div class="order-content">
              <div class="order-info">
                <p><strong>订单ID:</strong> {{ order.id }}</p>
                <p><strong>优惠券ID:</strong> {{ order.couponId }}</p>
                <p><strong>状态:</strong> 
                  <el-tag :type="getOrderStatusType(order.status)">
                    {{ getOrderStatusText(order.status) }}
                  </el-tag>
                </p>
                <p><strong>创建时间:</strong> {{ formatDateTime(order.createTime) }}</p>
              </div>
              <div class="order-actions">
                <el-button 
                  v-if="order.status === 0"
                  type="primary" 
                  @click="handlePayment(order.id)"
                >
                  去支付
                </el-button>
              </div>
            </div>
          </el-card>
        </div>
      </el-tab-pane>

      <!-- 我的商铺 -->
      <el-tab-pane label="我的商铺" name="shops">
        <div v-loading="loadingShops">
          <el-button 
            type="primary" 
            @click="$router.push('/shops')" 
            style="margin-bottom: 16px;"
          >
            注册新商铺
          </el-button>
          
          <el-empty v-if="shops.length === 0 && !loadingShops" description="暂无商铺" />
          
          <el-card 
            v-for="shop in shops" 
            :key="shop.id" 
            class="shop-card"
            shadow="hover"
            @click="$router.push(`/shop/${shop.id}`)"
          >
            <div class="shop-content">
              <el-avatar :size="60" shape="square">{{ shop.name.charAt(0) }}</el-avatar>
              <div class="shop-info">
                <h3>{{ shop.name }}</h3>
                <p class="shop-address">{{ shop.address }}</p>
                <div class="shop-stats">
                  <span>点赞 {{ shop.thumbNumber }}</span>
                  <span>评论 {{ shop.commentNumber }}</span>
                  <span>粉丝 {{ shop.fansNumber }}</span>
                </div>
              </div>
              <div class="shop-actions">
                <el-button 
                  type="primary" 
                  @click.stop="$router.push(`/shop/${shop.id}/coupons`)"
                >
                  管理优惠券
                </el-button>
                <el-button 
                  type="danger" 
                  @click.stop="handleDeleteShop(shop.id)"
                >
                  删除商铺
                </el-button>
              </div>
            </div>
          </el-card>
        </div>
      </el-tab-pane>

      <!-- 我的关注 -->
      <el-tab-pane label="我的关注" name="follows">
        <div v-loading="loadingFollows">
          <el-empty v-if="follows.length === 0 && !loadingFollows" description="暂无关注" />
          
          <el-card 
            v-for="follow in follows" 
            :key="follow.id" 
            class="follow-card"
            shadow="hover"
          >
            <div class="follow-content">
              <div class="follow-info">
                <el-avatar :size="50">{{ follow.targetName.charAt(0) }}</el-avatar>
                <div>
                  <h4>{{ follow.targetName }}</h4>
                  <p class="follow-time">{{ formatDateTime(follow.createTime) }}</p>
                </div>
              </div>
              <el-button 
                type="danger" 
                @click="handleUnfollow(follow)"
              >
                取消关注
              </el-button>
            </div>
          </el-card>

          <!-- 分页 -->
          <el-pagination
            v-if="followTotal > 0"
            class="pagination"
            v-model:current-page="followPage"
            v-model:page-size="followPageSize"
            :total="followTotal"
            layout="total, prev, pager, next"
            @current-change="loadFollows"
          />
        </div>
      </el-tab-pane>
    </el-tabs>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { ElMessage, ElMessageBox } from 'element-plus';
import { useUserStore } from '@/stores/userStore';
import { getOwnedOrdersAPI, paymentOrderAPI, type OrderVO } from '@/api/order';
import { getOwnedShopsAPI, deleteShopByIdAPI, type ShopVO } from '@/api/shop';
import { queryFollowPageAPI, cancelFollowAPI, type FollowVO } from '@/api/follow';

const router = useRouter();
const userStore = useUserStore();

const activeTab = ref('orders');

// 订单
const loadingOrders = ref(false);
const orders = ref<OrderVO[]>([]);

// 商铺
const loadingShops = ref(false);
const shops = ref<ShopVO[]>([]);

// 关注
const loadingFollows = ref(false);
const follows = ref<FollowVO[]>([]);
const followPage = ref(1);
const followPageSize = ref(10);
const followTotal = ref(0);

// 加载订单
const loadOrders = async () => {
  loadingOrders.value = true;
  try {
    const res = await getOwnedOrdersAPI();
    orders.value = res.data.data || [];
  } catch (error) {
    ElMessage.error('加载订单失败');
  } finally {
    loadingOrders.value = false;
  }
};

// 加载商铺
const loadShops = async () => {
  loadingShops.value = true;
  try {
    const res = await getOwnedShopsAPI();
    shops.value = res.data.data || [];
  } catch (error) {
    ElMessage.error('加载商铺失败');
  } finally {
    loadingShops.value = false;
  }
};

// 加载关注
const loadFollows = async () => {
  loadingFollows.value = true;
  try {
    const res = await queryFollowPageAPI({
      page: followPage.value - 1,
      pageSize: followPageSize.value
    });
    const data = res.data.data;
    follows.value = data.records || [];
    followTotal.value = data.total || 0;
  } catch (error) {
    ElMessage.error('加载关注列表失败');
  } finally {
    loadingFollows.value = false;
  }
};

// 支付订单
const handlePayment = async (orderId: number) => {
  try {
    await ElMessageBox.confirm('确定要支付这个订单吗？', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    });
    await paymentOrderAPI(orderId);
    ElMessage.success('支付成功');
    loadOrders();
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('支付失败');
    }
  }
};

// 删除商铺
const handleDeleteShop = async (shopId: number) => {
  try {
    await ElMessageBox.confirm('确定要删除这个商铺吗？', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    });
    await deleteShopByIdAPI(shopId);
    ElMessage.success('删除成功');
    loadShops();
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('删除失败');
    }
  }
};

// 取消关注
const handleUnfollow = async (follow: FollowVO) => {
  try {
    await cancelFollowAPI({
      fansId: follow.fansId,
      type: follow.type,
      targetId: follow.targetId,
      targetName: follow.targetName
    });
    ElMessage.success('取消关注成功');
    loadFollows();
  } catch (error) {
    ElMessage.error('取消关注失败');
  }
};

// 退出登录
const handleLogout = () => {
  userStore.logout();
  ElMessage.success('已退出登录');
};

// 获取订单状态文本
const getOrderStatusText = (status: number) => {
  const statusMap: Record<number, string> = {
    0: '待支付',
    1: '已支付',
    2: '已取消'
  };
  return statusMap[status] || '未知';
};

// 获取订单状态类型
const getOrderStatusType = (status: number): 'success' | 'warning' | 'danger' | 'info' => {
  const typeMap: Record<number, 'success' | 'warning' | 'danger' | 'info'> = {
    0: 'warning',
    1: 'success',
    2: 'info'
  };
  return typeMap[status] || 'info';
};

// 格式化时间
const formatDateTime = (time: string) => {
  const date = new Date(time);
  return date.toLocaleString('zh-CN');
};

onMounted(() => {
  loadOrders();
  loadShops();
  loadFollows();
});
</script>

<style scoped>
.profile-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
}

.header-card {
  margin-bottom: 20px;
}

.profile-header {
  display: flex;
  align-items: center;
  gap: 20px;
}

.profile-info {
  flex: 1;
}

.profile-info h2 {
  margin: 0 0 8px 0;
  font-size: 24px;
}

.profile-info p {
  margin: 0;
  color: #666;
}

.profile-tabs {
  background: white;
  padding: 20px;
  border-radius: 8px;
}

.order-card, .shop-card, .follow-card {
  margin-bottom: 16px;
  cursor: pointer;
}

.order-content, .shop-content, .follow-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.order-info p, .shop-info p {
  margin: 4px 0;
}

.shop-content {
  gap: 20px;
}

.shop-info {
  flex: 1;
}

.shop-info h3 {
  margin: 0 0 8px 0;
}

.shop-address {
  color: #666;
  font-size: 14px;
}

.shop-stats {
  display: flex;
  gap: 16px;
  font-size: 14px;
  color: #999;
  margin-top: 8px;
}

.shop-actions {
  display: flex;
  gap: 8px;
}

.follow-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.follow-info {
  display: flex;
  align-items: center;
  gap: 12px;
}

.follow-info h4 {
  margin: 0 0 4px 0;
}

.follow-time {
  margin: 0;
  font-size: 12px;
  color: #999;
}

.pagination {
  margin-top: 20px;
  display: flex;
  justify-content: center;
}
</style>
