import apiClient from "@/util/requests";

// ============ 类型定义 ============

export interface PostDTO {
  publisherId?: number;
  publisherName?: string;
  publisherType?: number;
  type?: number;
  title?: string;
  urls?: string;
  content?: string;
}

export interface PostVO {
  id: number;
  publisherId: number;
  publisherName: string;
  publisherType: number;
  type: number;
  title: string;
  urls: string;
  content: string;
  thumbNumber: number;
  commentNumber: number;
  favoriteNumber: number;
  createTime: string;
  hasThumb: boolean;
  hasFavorite: boolean;
}

export interface Post {
  id: number;
  publisherId: number;
  publisherName: string;
  publisherType: number;
  type: number;
  title: string;
  urls: string;
  content: string;
  thumbNumber: number;
  commentNumber: number;
  favoriteNumber: number;
  createTime: string;
  hasThumb?: boolean;
  hasFavorite?: boolean;
}

export interface ScrollResultPost {
  cursor: number;
  offset: number;
  records: Post[];
}

// ============ API 接口 ============

/**
 * 上传文件
 * @param file 文件对象
 */
export const uploadFileAPI = (file: File) => {
  const formData = new FormData();
  formData.append('file', file);
  return apiClient.post('/upload', formData, {
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  });
}

/**
 * 新增动态
 * @param data 动态数据
 */
export const addPostAPI = (data: PostDTO) => {
  return apiClient.post('/post', data);
}

/**
 * 查询单个动态
 * @param postId 动态ID
 */
export const getPostByIdAPI = (postId: number) => {
  return apiClient.get('/post', {
    params: { postId }
  });
}

/**
 * 游标查询动态（分页）
 * @param cursor 游标
 * @param offset 偏移量
 */
export const queryPostPageAPI = (cursor: number, offset: number) => {
  return apiClient.get('/post/page', {
    params: { cursor, offset }
  });
}
