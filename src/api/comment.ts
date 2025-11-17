import apiClient from "@/util/requests";

// ============ 类型定义 ============

export interface CommentDTO {
  username?: string;
  type?: number; // 0-2: 评论类型
  targetId?: number; // 目标ID（动态/商铺等）
  content?: string;
}

export interface CommentVO {
  id: number;
  userId: number;
  username: string;
  content: string;
  thumbNumber: number;
  hasFollow: boolean;
  hasThumb: boolean;
  createTime: string;
}

export interface CommentPageQuery {
  page?: number;
  pageSize?: number;
  isAsc?: boolean;
  sortBy?: string;
  type?: number;
  targetId?: number;
  userId?: number;
}

export interface PageResultCommentVO {
  total: number;
  records: CommentVO[];
}

// ============ API 接口 ============

/**
 * 新增评论
 * @param data 评论数据
 */
export const addCommentAPI = (data: CommentDTO) => {
  return apiClient.post('/comment', data);
}

/**
 * 根据评论id删除评论
 * @param id 评论ID
 */
export const deleteCommentByIdAPI = (id: number) => {
  return apiClient.delete('/comment', {
    params: { id }
  });
}

/**
 * 分页查询评论
 * @param query 查询参数
 */
export const queryCommentPageAPI = (query: CommentPageQuery) => {
  return apiClient.get('/comment/page', {
    params: query
  });
}
