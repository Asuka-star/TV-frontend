<template>
  <div class="shop-detail-container">
    <el-card v-loading="loading">
      <!-- 商铺信息 -->
      <template #header>
        <div class="shop-header">
          <el-button @click="$router.back()" :icon="Back">返回</el-button>
        </div>
      </template>

      <div class="shop-content" v-if="shop">
        <div class="shop-main-info">
          <el-avatar :size="120" shape="square">{{ shop.name.charAt(0) }}</el-avatar>
          <div class="shop-details">
            <h2>{{ shop.name }}</h2>
            <p class="shop-address"><el-icon><Location /></el-icon> {{ shop.address }}</p>
            <p class="shop-time">
              <el-icon><Clock /></el-icon> 
              营业时间：{{ formatTime(shop.beginTime) }} - {{ formatTime(shop.endTime) }}
            </p>
            <div class="shop-stats">
              <el-statistic title="点赞" :value="shop.thumbNumber" />
              <el-statistic title="评论" :value="shop.commentNumber" />
              <el-statistic title="粉丝" :value="shop.fansNumber" />
            </div>
          </div>
          <div class="shop-actions">
            <el-button 
              :type="shop.hasFollow ? 'primary' : 'default'"
              @click="handleFollow"
              size="large"
            >
              {{ shop.hasFollow ? '已关注' : '关注商铺' }}
            </el-button>
            <el-button 
              :type="shop.hasThumb ? 'warning' : 'default'"
              :icon="shop.hasThumb ? StarFilled : Star"
              @click="handleThumb"
              size="large"
            >
              点赞
            </el-button>
          </div>
        </div>
      </div>
    </el-card>

    <!-- 优惠券列表 -->
    <el-card class="coupon-section" style="margin-top: 20px;">
      <template #header>
        <div class="section-header">
          <h3>优惠券</h3>
        </div>
      </template>

      <div class="coupon-list" v-loading="loadingCoupons">
        <el-empty v-if="coupons.length === 0 && !loadingCoupons" description="暂无优惠券" />
        
        <div v-for="coupon in coupons" :key="coupon.id" class="coupon-card">
          <div class="coupon-left">
            <div class="coupon-amount">
              <span class="amount-value" v-if="coupon.type === 0">{{ coupon.discountRate }}折</span>
              <span class="amount-value" v-else>¥{{ coupon.reduceAmount }}</span>
            </div>
            <div class="coupon-condition" v-if="coupon.type === 1">
              满{{ coupon.fullAmount }}可用
            </div>
          </div>
          <div class="coupon-right">
            <h4>{{ coupon.name }}</h4>
            <p>{{ coupon.description }}</p>
            <p class="coupon-time">
              有效期：{{ formatDate(coupon.beginTime) }} 至 {{ formatDate(coupon.endTime) }}
            </p>
            <div class="coupon-footer">
              <span class="coupon-stock">剩余 {{ coupon.stock }} 张</span>
              <el-button 
                type="danger" 
                size="small"
                @click="handleSecKill(coupon)"
                :disabled="coupon.stock <= 0"
              >
                {{ coupon.stock > 0 ? '立即抢购' : '已抢光' }}
              </el-button>
            </div>
          </div>
        </div>
      </div>
    </el-card>

    <!-- 评论区 -->
    <el-card class="comment-section" style="margin-top: 20px;">
      <template #header>
        <h3>评论 {{ comments.length }}</h3>
      </template>

      <!-- 发表评论 -->
      <div class="add-comment">
        <el-input
          v-model="commentContent"
          type="textarea"
          :rows="3"
          placeholder="写下你的评论..."
          maxlength="500"
          show-word-limit
        />
        <el-button 
          type="primary" 
          @click="handleAddComment"
          :loading="submittingComment"
          style="margin-top: 10px;"
        >
          发表评论
        </el-button>
      </div>

      <!-- 评论列表 -->
      <div class="comment-list" v-loading="loadingComments">
        <el-empty v-if="comments.length === 0 && !loadingComments" description="暂无评论" />
        
        <div v-for="comment in comments" :key="comment.id" class="comment-item">
          <el-avatar :size="40">{{ comment.username.charAt(0) }}</el-avatar>
          <div class="comment-content">
            <div class="comment-header">
              <span class="comment-username">{{ comment.username }}</span>
              <span class="comment-time">{{ formatDateTime(comment.createTime) }}</span>
            </div>
            <p>{{ comment.content }}</p>
            <div class="comment-actions">
              <el-button 
                :type="comment.hasThumb ? 'primary' : 'default'"
                :icon="comment.hasThumb ? StarFilled : Star"
                @click="handleThumbComment(comment)"
                text
                size="small"
              >
                {{ comment.thumbNumber }}
              </el-button>
            </div>
          </div>
        </div>
      </div>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import { ElMessage } from 'element-plus';
import { Back, Location, Clock, Star, StarFilled } from '@element-plus/icons-vue';
import { getShopByIdAPI, type ShopVO, type LocalTime } from '@/api/shop';
import { queryCouponByShopIdAPI, secKillCouponAPI, type CouponVO } from '@/api/coupon';
import { addThumbAPI, cancelThumbAPI } from '@/api/thumb';
import { addFollowAPI, cancelFollowAPI } from '@/api/follow';
import { useUserStore } from '@/stores/userStore';
import { addCommentAPI, queryCommentPageAPI, type CommentVO } from '@/api/comment';

const route = useRoute();
const userStore = useUserStore();

const loading = ref(false);
const shop = ref<ShopVO | null>(null);

// 优惠券
const loadingCoupons = ref(false);
const coupons = ref<CouponVO[]>([]);

// 评论
const comments = ref<CommentVO[]>([]);
const commentContent = ref('');
const loadingComments = ref(false);
const submittingComment = ref(false);

// 加载商铺详情
const loadShop = async () => {
  loading.value = true;
  try {
    const shopId = Number(route.params.id);
    const res = await getShopByIdAPI(shopId);
    shop.value = res.data.data;
  } catch (error) {
    ElMessage.error('加载商铺信息失败');
  } finally {
    loading.value = false;
  }
};

// 加载优惠券
const loadCoupons = async () => {
  loadingCoupons.value = true;
  try {
    const shopId = Number(route.params.id);
    const res = await queryCouponByShopIdAPI(shopId);
    coupons.value = res.data.data || [];
  } catch (error) {
    ElMessage.error('加载优惠券失败');
  } finally {
    loadingCoupons.value = false;
  }
};

// 加载评论
const loadComments = async () => {
  loadingComments.value = true;
  try {
    const shopId = Number(route.params.id);
    const res = await queryCommentPageAPI({
      type: 2,
      targetId: shopId,
      page: 0,
      pageSize: 20
    });
    const data = res.data.data;
    comments.value = data.records || [];
  } catch (error) {
    ElMessage.error('加载评论失败');
  } finally {
    loadingComments.value = false;
  }
};

// 关注商铺
const handleFollow = async () => {
  if (!shop.value) return;
  try {
    if (shop.value.hasFollow) {
      const payload: Record<string, any> = {
        type: 1,
        targetId: shop.value.id,
        targetName: shop.value.name
      };
      if (userStore.userInfo?.id) payload.fansId = userStore.userInfo.id;
      await cancelFollowAPI(payload);
      shop.value.hasFollow = false;
      shop.value.fansNumber--;
      ElMessage.success('取消关注');
    } else {
      const payload: Record<string, any> = {
        type: 1,
        targetId: shop.value.id,
        targetName: shop.value.name
      };
      if (userStore.userInfo?.id) payload.fansId = userStore.userInfo.id;
      await addFollowAPI(payload);
      shop.value.hasFollow = true;
      shop.value.fansNumber++;
      ElMessage.success('关注成功');
    }
  } catch (error) {
    ElMessage.error('操作失败');
  }
};

// 点赞商铺
const handleThumb = async () => {
  if (!shop.value) return;
  try {
    if (shop.value.hasThumb) {
      await cancelThumbAPI({ type: 2, targetId: shop.value.id });
      shop.value.hasThumb = false;
      shop.value.thumbNumber--;
      ElMessage.success('取消点赞');
    } else {
      await addThumbAPI({ type: 2, targetId: shop.value.id });
      shop.value.hasThumb = true;
      shop.value.thumbNumber++;
      ElMessage.success('点赞成功');
    }
  } catch (error) {
    ElMessage.error('操作失败');
  }
};

// 抢购优惠券
const handleSecKill = async (coupon: CouponVO) => {
  try {
    const res = await secKillCouponAPI(coupon.id);
    ElMessage.success(`抢购成功！订单ID：${res.data.data}`);
    coupon.stock--;
  } catch (error) {
    ElMessage.error('抢购失败');
  }
};

// 发表评论
const handleAddComment = async () => {
  if (!commentContent.value.trim()) {
    ElMessage.warning('请输入评论内容');
    return;
  }
  submittingComment.value = true;
  try {
    const shopId = Number(route.params.id);
    await addCommentAPI({
      username: userStore.username,
      type: 2,
      targetId: shopId,
      content: commentContent.value
    });
    ElMessage.success('评论成功');
    commentContent.value = '';
    loadComments();
    if (shop.value) {
      shop.value.commentNumber++;
    }
  } catch (error) {
    ElMessage.error('评论失败');
  } finally {
    submittingComment.value = false;
  }
};

// 点赞评论
const handleThumbComment = async (comment: CommentVO) => {
  try {
    if (comment.hasThumb) {
      await cancelThumbAPI({ type: 1, targetId: comment.id });
      comment.hasThumb = false;
      comment.thumbNumber--;
      ElMessage.success('取消点赞');
    } else {
      await addThumbAPI({ type: 1, targetId: comment.id });
      comment.hasThumb = true;
      comment.thumbNumber++;
      ElMessage.success('点赞成功');
    }
  } catch (error) {
    ElMessage.error('操作失败');
  }
};

// 格式化时间
const formatTime = (time: LocalTime) => {
  const pad = (n: number) => n.toString().padStart(2, '0');
  return `${pad(time.hour)}:${pad(time.minute)}`;
};

const formatDate = (dateStr: string) => {
  const date = new Date(dateStr);
  return `${date.getMonth() + 1}月${date.getDate()}日`;
};

const formatDateTime = (time: string) => {
  const date = new Date(time);
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const minute = 1000 * 60;
  const hour = minute * 60;
  const day = hour * 24;

  if (diff < minute) {
    return '刚刚';
  } else if (diff < hour) {
    return Math.floor(diff / minute) + '分钟前';
  } else if (diff < day) {
    return Math.floor(diff / hour) + '小时前';
  } else if (diff < day * 7) {
    return Math.floor(diff / day) + '天前';
  } else {
    return date.toLocaleDateString();
  }
};

onMounted(() => {
  loadShop();
  loadCoupons();
  loadComments();
});
</script>

<style scoped>
.shop-detail-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
}

.shop-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.shop-main-info {
  display: flex;
  gap: 30px;
  align-items: flex-start;
}

.shop-details {
  flex: 1;
}

.shop-details h2 {
  margin: 0 0 16px 0;
  font-size: 28px;
}

.shop-details p {
  margin: 8px 0;
  color: #666;
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 16px;
}

.shop-stats {
  display: flex;
  gap: 40px;
  margin-top: 20px;
}

.shop-actions {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.coupon-section, .comment-section {
  margin-top: 20px;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.coupon-list {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(400px, 1fr));
  gap: 16px;
}

.coupon-card {
  display: flex;
  border: 2px solid #ff6b6b;
  border-radius: 8px;
  overflow: hidden;
  background: linear-gradient(135deg, #fff5f5 0%, #ffffff 100%);
}

.coupon-left {
  background: #ff6b6b;
  color: white;
  padding: 20px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  min-width: 120px;
}

.amount-value {
  font-size: 32px;
  font-weight: bold;
}

.coupon-condition {
  font-size: 12px;
  margin-top: 4px;
}

.coupon-right {
  flex: 1;
  padding: 16px;
  display: flex;
  flex-direction: column;
}

.coupon-right h4 {
  margin: 0 0 8px 0;
  font-size: 18px;
}

.coupon-right p {
  margin: 4px 0;
  color: #666;
  font-size: 14px;
}

.coupon-time {
  font-size: 12px !important;
  color: #999 !important;
}

.coupon-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: auto;
  padding-top: 8px;
}

.coupon-stock {
  font-size: 14px;
  color: #999;
}

.add-comment {
  margin-bottom: 24px;
}

.comment-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.comment-item {
  display: flex;
  gap: 12px;
  padding: 12px;
  background: #f9f9f9;
  border-radius: 8px;
}

.comment-content {
  flex: 1;
}

.comment-header {
  display: flex;
  justify-content: space-between;
  margin-bottom: 8px;
}

.comment-username {
  font-weight: bold;
}

.comment-time {
  font-size: 12px;
  color: #999;
}

.comment-content p {
  margin: 0 0 8px 0;
  line-height: 1.6;
}

.comment-actions {
  display: flex;
  gap: 8px;
}
</style>
