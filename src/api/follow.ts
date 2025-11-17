import apiClient from "@/util/requests";

// ============ 类型定义 ============

export interface FollowDTO {
  fansId?: number; // 粉丝ID
  type?: number; // 0-1: 关注类型
  targetId?: number; // 目标ID
  targetName?: string; // 目标名称
}

export interface FollowVO {
  id: number;
  fansId: number;
  type: number;
  targetId: number;
  targetName: string;
  createTime: string;
}

export interface FollowPageQuery {
  page?: number;
  pageSize?: number;
  isAsc?: boolean;
  sortBy?: string;
  type?: number;
}

export interface PageResultFollowVO {
  total: number;
  records: FollowVO[];
}

// ============ API 接口 ============

/**
 * 新增关注
 * @param data 关注数据
 */
export const addFollowAPI = (data: FollowDTO) => {
  return apiClient.post('/follow', data);
}

/**
 * 取消关注
 * @param data 关注数据
 */
export const cancelFollowAPI = (data: FollowDTO) => {
  return apiClient.delete('/follow', { data });
}

/**
 * 分页查询关注
 * @param query 查询参数
 */
export const queryFollowPageAPI = (query: FollowPageQuery) => {
  return apiClient.get('/follow/page', {
    params: query
  });
}
