import apiClient from "@/util/requests";

// ============ 类型定义 ============

export interface FavoriteDTO {
  postId?: number; // 动态ID
}

// ============ API 接口 ============

/**
 * 新增收藏
 * @param data 收藏数据
 */
export const addFavoriteAPI = (data: FavoriteDTO) => {
  return apiClient.post('/favorite', data);
}

/**
 * 取消收藏
 * @param data 收藏数据
 */
export const cancelFavoriteAPI = (data: FavoriteDTO) => {
  return apiClient.delete('/favorite', {
    params: data
  });
}
