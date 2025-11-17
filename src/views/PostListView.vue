<template>
  <div class="post-list-container">
    <el-card class="header-card">
      <div class="header-content">
        <h2>动态广场</h2>
        <el-button type="primary" @click="showAddPostDialog = true" :icon="Plus">发布动态</el-button>
      </div>
    </el-card>

    <!-- 动态列表 -->
    <div class="post-list" v-loading="loading" element-loading-text="加载中...">
      <el-empty v-if="postList.length === 0 && !loading" description="暂无动态" />
      
      <el-card 
        v-for="post in postList" 
        :key="post.id" 
        class="post-card"
        shadow="hover"
      >
        <template #header>
          <div class="post-header">
            <div class="publisher-info">
              <el-avatar :size="40">{{ post.publisherName.charAt(0) }}</el-avatar>
              <div class="publisher-details">
                <span class="publisher-name">{{ post.publisherName }}</span>
                <span class="post-time">{{ formatTime(post.createTime) }}</span>
              </div>
            </div>
          </div>
        </template>

        <div class="post-content">
          <h3 v-if="post.title">{{ post.title }}</h3>
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
        </div>

        <div class="post-actions">
          <el-button 
            :type="post.hasThumb ? 'primary' : 'default'" 
            :icon="post.hasThumb ? StarFilled : Star"
            @click="handleThumb(post)"
            text
          >
            点赞 {{ post.thumbNumber }}
          </el-button>
          <el-button 
            :icon="ChatDotRound" 
            @click="handleComment(post)"
            text
          >
            评论 {{ post.commentNumber }}
          </el-button>
          <el-button 
            :type="post.hasFavorite ? 'warning' : 'default'"
            :icon="post.hasFavorite ? Collection : Collection"
            @click="handleFavorite(post)"
            text
          >
            收藏 {{ post.favoriteNumber }}
          </el-button>
        </div>
      </el-card>

      <!-- 加载更多按钮 -->
      <div class="load-more" v-if="hasMore">
        <el-button @click="loadMore" :loading="loadingMore">加载更多</el-button>
      </div>
    </div>

    <!-- 发布动态对话框 -->
    <el-dialog
      v-model="showAddPostDialog"
      title="发布动态"
      width="600px"
    >
      <el-form :model="postForm" :rules="postRules" ref="postFormRef" label-width="80px">
        <el-form-item label="标题" prop="title">
          <el-input v-model="postForm.title" placeholder="请输入标题" maxlength="20" show-word-limit />
        </el-form-item>
        <el-form-item label="内容" prop="content">
          <el-input 
            v-model="postForm.content" 
            type="textarea" 
            :rows="5"
            placeholder="分享你的想法..." 
            maxlength="2048"
            show-word-limit
          />
        </el-form-item>
        <el-form-item label="图片">
          <el-upload
            :action="uploadUrl"
            list-type="picture-card"
            :on-success="handleUploadSuccess"
            :on-remove="handleRemove"
            :file-list="fileList"
            :limit="9"
          >
            <el-icon><Plus /></el-icon>
          </el-upload>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showAddPostDialog = false">取消</el-button>
        <el-button type="primary" @click="handleAddPost" :loading="submitting">发布</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue';
import { ElMessage } from 'element-plus';
import { Plus, Star, StarFilled, ChatDotRound, Collection } from '@element-plus/icons-vue';
import type { FormInstance } from 'element-plus';
import { queryPostPageAPI, addPostAPI, type Post, type PostDTO } from '@/api/post';
import { addThumbAPI, cancelThumbAPI } from '@/api/thumb';
import { addFavoriteAPI, cancelFavoriteAPI } from '@/api/favorite';
import { useUserStore } from '@/stores/userStore';
import { useRouter } from 'vue-router';

const router = useRouter();
const userStore = useUserStore();

// 状态
const loading = ref(false);
const loadingMore = ref(false);
const submitting = ref(false);
const postList = ref<Post[]>([]);
const cursor = ref<number>(0);
const offset = ref<number>(10);
const hasMore = ref(true);

// 发布动态
const showAddPostDialog = ref(false);
const postFormRef = ref<FormInstance>();
const postForm = reactive<PostDTO>({
  title: '',
  content: '',
  urls: '',
});

const postRules = {
  content: [
    { required: true, message: '请输入内容', trigger: 'blur' },
    { min: 1, max: 2048, message: '内容长度在 1 到 2048 个字符', trigger: 'blur' }
  ]
};

const fileList = ref<any[]>([]);
const uploadUrl = 'http://10.21.76.53:8090/upload';

// 加载动态列表
const loadPosts = async () => {
  loading.value = true;
  try {
    const res = await queryPostPageAPI(cursor.value, offset.value);
    const data = res.data.data;
    postList.value = data.records || [];
    cursor.value = data.cursor || 0;
    hasMore.value = data.records && data.records.length >= offset.value;
  } catch (error: any) {
    console.error('加载动态失败:', error);
    ElMessage.error('加载动态失败: ' + (error.response?.data?.message || error.message || '网络错误'));
    // 即使失败也设置空数组，避免页面空白
    postList.value = [];
  } finally {
    loading.value = false;
  }
};

// 加载更多
const loadMore = async () => {
  loadingMore.value = true;
  try {
    const res = await queryPostPageAPI(cursor.value, offset.value);
    const data = res.data.data;
    postList.value.push(...(data.records || []));
    cursor.value = data.cursor || 0;
    hasMore.value = data.records && data.records.length >= offset.value;
  } catch (error) {
    ElMessage.error('加载更多失败');
  } finally {
    loadingMore.value = false;
  }
};

// 处理点赞
const handleThumb = async (post: Post) => {
  try {
    if ((post as any).hasThumb) {
      await cancelThumbAPI({ type: 0, targetId: post.id });
      (post as any).hasThumb = false;
      post.thumbNumber--;
      ElMessage.success('取消点赞');
    } else {
      await addThumbAPI({ type: 0, targetId: post.id });
      (post as any).hasThumb = true;
      post.thumbNumber++;
      ElMessage.success('点赞成功');
    }
  } catch (error) {
    ElMessage.error('操作失败');
  }
};

// 处理收藏
const handleFavorite = async (post: Post) => {
  try {
    if ((post as any).hasFavorite) {
      await cancelFavoriteAPI({ postId: post.id });
      (post as any).hasFavorite = false;
      post.favoriteNumber--;
      ElMessage.success('取消收藏');
    } else {
      await addFavoriteAPI({ postId: post.id });
      (post as any).hasFavorite = true;
      post.favoriteNumber++;
      ElMessage.success('收藏成功');
    }
  } catch (error) {
    ElMessage.error('操作失败');
  }
};

// 处理评论
const handleComment = (post: Post) => {
  router.push(`/post/${post.id}`);
};

// 上传成功
const handleUploadSuccess = (response: any, file: any) => {
  if (response.data) {
    const urls = postForm.urls ? postForm.urls.split(',') : [];
    urls.push(response.data);
    postForm.urls = urls.join(',');
  }
};

// 移除图片
const handleRemove = (file: any) => {
  const urls = postForm.urls ? postForm.urls.split(',') : [];
  const index = urls.findIndex(url => url === file.response?.data);
  if (index > -1) {
    urls.splice(index, 1);
    postForm.urls = urls.join(',');
  }
};

// 发布动态
const handleAddPost = async () => {
  if (!postFormRef.value) return;
  await postFormRef.value.validate(async (valid) => {
    if (valid) {
      submitting.value = true;
      try {
        await addPostAPI({
          ...postForm,
          publisherId: userStore.userInfo?.id,
          publisherName: userStore.username,
          publisherType: 0,
          type: 0
        });
        ElMessage.success('发布成功');
        showAddPostDialog.value = false;
        postForm.title = '';
        postForm.content = '';
        postForm.urls = '';
        fileList.value = [];
        loadPosts();
      } catch (error) {
        ElMessage.error('发布失败');
      } finally {
        submitting.value = false;
      }
    }
  });
};

// 格式化时间
const formatTime = (time: string) => {
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
  console.log('PostListView mounted');
  loadPosts();
});
</script>

<style scoped>
.post-list-container {
  max-width: 800px;
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

.post-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.post-card {
  transition: transform 0.2s;
}

.post-card:hover {
  transform: translateY(-2px);
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
  font-size: 16px;
}

.post-time {
  font-size: 12px;
  color: #999;
}

.post-content {
  margin-bottom: 16px;
}

.post-content h3 {
  margin: 0 0 12px 0;
  font-size: 18px;
}

.post-content p {
  margin: 0;
  line-height: 1.6;
  white-space: pre-wrap;
}

.post-images {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 8px;
  margin-top: 12px;
}

.post-image {
  width: 100%;
  height: 150px;
  border-radius: 4px;
}

.post-actions {
  display: flex;
  gap: 16px;
  padding-top: 12px;
  border-top: 1px solid #f0f0f0;
}

.load-more {
  text-align: center;
  margin-top: 20px;
}
</style>
