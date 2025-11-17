<template>
  <div class="post-detail-container">
    <el-card v-loading="loading">
      <!-- 动态内容 -->
      <template #header>
        <div class="post-header">
          <div class="publisher-info">
            <el-avatar :size="50">{{ post?.publisherName?.charAt(0) }}</el-avatar>
            <div class="publisher-details">
              <span class="publisher-name">{{ post?.publisherName }}</span>
              <span class="post-time">{{ formatTime(post?.createTime || '') }}</span>
            </div>
          </div>
          <el-button @click="$router.back()" :icon="Back">返回</el-button>
        </div>
      </template>

      <div class="post-content" v-if="post">
        <h2 v-if="post.title">{{ post.title }}</h2>
        <p>{{ post.content }}</p>
        <div v-if="post.urls" class="post-images">
          <el-image 
            v-for="(url, index) in post.urls.split(',')" 
            :key="index"
            :src="url"
            :preview-src-list="post.urls.split(',')"
            fit="cover"
            class="post-image"
          />
        </div>

        <div class="post-actions">
          <el-button 
            :type="post.hasThumb ? 'primary' : 'default'" 
            :icon="post.hasThumb ? StarFilled : Star"
            @click="handleThumb"
          >
            点赞 {{ post.thumbNumber }}
          </el-button>
          <el-button 
            :type="post.hasFavorite ? 'warning' : 'default'"
            :icon="post.hasFavorite ? Collection : Collection"
            @click="handleFavorite"
          >
            收藏 {{ post.favoriteNumber }}
          </el-button>
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
              <span class="comment-time">{{ formatTime(comment.createTime) }}</span>
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
              <el-button 
                v-if="userStore.username === comment.username"
                type="danger"
                @click="handleDeleteComment(comment.id)"
                text
                size="small"
              >
                删除
              </el-button>
            </div>
          </div>
        </div>

        <!-- 加载更多评论 -->
        <div class="load-more" v-if="hasMoreComments">
          <el-button @click="loadMoreComments" :loading="loadingMoreComments">加载更多评论</el-button>
        </div>
      </div>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { ElMessage, ElMessageBox } from 'element-plus';
import { Star, StarFilled, Collection, Back } from '@element-plus/icons-vue';
import { getPostByIdAPI, type PostVO } from '@/api/post';
import { addThumbAPI, cancelThumbAPI } from '@/api/thumb';
import { addFavoriteAPI, cancelFavoriteAPI } from '@/api/favorite';
import { addCommentAPI, deleteCommentByIdAPI, queryCommentPageAPI, type CommentVO } from '@/api/comment';
import { useUserStore } from '@/stores/userStore';

const route = useRoute();
const router = useRouter();
const userStore = useUserStore();

const loading = ref(false);
const post = ref<PostVO | null>(null);

// 评论相关
const comments = ref<CommentVO[]>([]);
const commentContent = ref('');
const loadingComments = ref(false);
const submittingComment = ref(false);
const commentPage = ref(1);
const commentPageSize = ref(10);
const hasMoreComments = ref(true);
const loadingMoreComments = ref(false);

// 加载动态详情
const loadPost = async () => {
  loading.value = true;
  try {
    const postId = Number(route.params.id);
    const res = await getPostByIdAPI(postId);
    post.value = res.data.data;
  } catch (error) {
    ElMessage.error('加载动态失败');
  } finally {
    loading.value = false;
  }
};

// 加载评论
const loadComments = async () => {
  loadingComments.value = true;
  try {
    const postId = Number(route.params.id);
    const res = await queryCommentPageAPI({
      type: 0,
      targetId: postId,
      page: commentPage.value,
      pageSize: commentPageSize.value
    });
    const data = res.data.data;
    comments.value = data.records || [];
    hasMoreComments.value = (data.records?.length || 0) >= commentPageSize.value;
  } catch (error) {
    ElMessage.error('加载评论失败');
  } finally {
    loadingComments.value = false;
  }
};

// 加载更多评论
const loadMoreComments = async () => {
  loadingMoreComments.value = true;
  commentPage.value++;
  try {
    const postId = Number(route.params.id);
    const res = await queryCommentPageAPI({
      type: 0,
      targetId: postId,
      page: commentPage.value,
      pageSize: commentPageSize.value
    });
    const data = res.data.data;
    comments.value.push(...(data.records || []));
    hasMoreComments.value = (data.records?.length || 0) >= commentPageSize.value;
  } catch (error) {
    ElMessage.error('加载更多评论失败');
  } finally {
    loadingMoreComments.value = false;
  }
};

// 点赞动态
const handleThumb = async () => {
  if (!post.value) return;
  try {
    if (post.value.hasThumb) {
      await cancelThumbAPI({ type: 0, targetId: post.value.id });
      post.value.hasThumb = false;
      post.value.thumbNumber--;
      ElMessage.success('取消点赞');
    } else {
      await addThumbAPI({ type: 0, targetId: post.value.id });
      post.value.hasThumb = true;
      post.value.thumbNumber++;
      ElMessage.success('点赞成功');
    }
  } catch (error) {
    ElMessage.error('操作失败');
  }
};

// 收藏动态
const handleFavorite = async () => {
  if (!post.value) return;
  try {
    if (post.value.hasFavorite) {
      await cancelFavoriteAPI({ postId: post.value.id });
      post.value.hasFavorite = false;
      post.value.favoriteNumber--;
      ElMessage.success('取消收藏');
    } else {
      await addFavoriteAPI({ postId: post.value.id });
      post.value.hasFavorite = true;
      post.value.favoriteNumber++;
      ElMessage.success('收藏成功');
    }
  } catch (error) {
    ElMessage.error('操作失败');
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
    const postId = Number(route.params.id);
    await addCommentAPI({
      username: userStore.username,
      type: 0,
      targetId: postId,
      content: commentContent.value
    });
    ElMessage.success('评论成功');
    commentContent.value = '';
    commentPage.value = 1;
    loadComments();
    if (post.value) {
      post.value.commentNumber++;
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

// 删除评论
const handleDeleteComment = async (commentId: number) => {
  try {
    await ElMessageBox.confirm('确定要删除这条评论吗？', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    });
    await deleteCommentByIdAPI(commentId);
    ElMessage.success('删除成功');
    loadComments();
    if (post.value) {
      post.value.commentNumber--;
    }
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('删除失败');
    }
  }
};

// 格式化时间
const formatTime = (time: string) => {
  if (!time) return '';
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
  loadPost();
  loadComments();
});
</script>

<style scoped>
.post-detail-container {
  max-width: 800px;
  margin: 0 auto;
  padding: 20px;
}

.post-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.publisher-info {
  display: flex;
  align-items: center;
  gap: 12px;
}

.publisher-details {
  display: flex;
  flex-direction: column;
}

.publisher-name {
  font-weight: bold;
  font-size: 18px;
}

.post-time {
  font-size: 12px;
  color: #999;
}

.post-content h2 {
  margin: 0 0 16px 0;
}

.post-content p {
  line-height: 1.8;
  white-space: pre-wrap;
  margin-bottom: 16px;
}

.post-images {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
  margin-bottom: 16px;
}

.post-image {
  width: 100%;
  height: 200px;
  border-radius: 8px;
}

.post-actions {
  display: flex;
  gap: 16px;
  padding-top: 16px;
  border-top: 1px solid #f0f0f0;
}

.comment-section {
  margin-top: 20px;
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

.load-more {
  text-align: center;
  margin-top: 16px;
}
</style>
