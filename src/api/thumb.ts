import apiClient from "@/util/requests";

// ============ 类型定义 ============

export interface ThumbDTO {
  type?: number; // 0-2: 点赞类型（动态/评论/商铺等）
  targetId?: number; // 目标ID
  content?: string;
}

export interface ThumbVO {
  id: number;
  userId: number;
  type: number;
  targetId: number;
  content: string;
  createTime: string;
}

export interface ThumbPageQuery {
  page?: number;
  pageSize?: number;
  isAsc?: boolean;
  sortBy?: string;
  type?: number;
}

export interface PageResultThumbVO {
  total: number;
  records: ThumbVO[];
}

// ============ API 接口 ============

/**
 * 新增点赞记录
 * @param data 点赞数据
 */
export const addThumbAPI = (data: ThumbDTO) => {
  return apiClient.post('/thumb', data);
}

/**
 * 取消点赞
 * @param data 点赞数据
 */
export const cancelThumbAPI = (data: ThumbDTO) => {
  return apiClient.delete('/thumb', { data });
}

/**
 * 分页查询用户点赞记录
 * @param query 查询参数
 */
export const queryThumbPageAPI = (query: ThumbPageQuery) => {
  return apiClient.get('/thumb/page', {
    params: query
  });
}
