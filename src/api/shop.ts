import apiClient from "@/util/requests";

// ============ 类型定义 ============

export interface LocalTime {
  hour: number;
  minute: number;
  second: number;
  nano: number;
}

export interface ShopDTO {
  name?: string;
  address?: string;
  beginTime: LocalTime;
  endTime: LocalTime;
}

export interface ShopVO {
  id: number;
  name: string;
  ownerId: number;
  address: string;
  commentNumber: number;
  thumbNumber: number;
  fansNumber: number;
  hasFollow: boolean;
  hasThumb: boolean;
  beginTime: LocalTime;
  endTime: LocalTime;
}

export interface ShopPageQuery {
  page?: number;
  pageSize?: number;
  isAsc?: boolean;
  sortBy?: string;
  name?: string;
  userId?: number;
}

export interface PageResultShopVO {
  total: number;
  records: ShopVO[];
}

// ============ API 接口 ============

/**
 * 商铺注册
 * @param data 商铺数据
 */
export const registerShopAPI = (data: ShopDTO) => {
  return apiClient.post('/shop', data);
}

/**
 * 根据商铺id查询商铺
 * @param id 商铺ID
 */
export const getShopByIdAPI = (id: number) => {
  return apiClient.get('/shop', {
    params: { id }
  });
}

/**
 * 根据商铺id删除商铺
 * @param id 商铺ID
 */
export const deleteShopByIdAPI = (id: number) => {
  return apiClient.delete('/shop', {
    params: { id }
  });
}

/**
 * 分页查询商铺
 * @param query 查询参数
 */
export const queryShopPageAPI = (query: ShopPageQuery) => {
  return apiClient.get('/shop/page', {
    params: query
  });
}

/**
 * 查询用户名下商铺
 */
export const getOwnedShopsAPI = () => {
  return apiClient.get('/shop/owner');
}
