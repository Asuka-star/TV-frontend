import apiClient from "@/util/requests";

// ============ 类型定义 ============

export interface CouponDTO {
  shopId?: number;
  type?: number;
  name?: string;
  description?: string;
  stock?: number;
  discountRate?: number;
  fullAmount?: number;
  reduceAmount?: number;
  beginTime?: string; // ISO 8601 格式
  endTime?: string; // ISO 8601 格式
}

export interface CouponVO {
  id: number;
  shopId: number;
  type: number;
  name: string;
  description: string;
  stock: number;
  discountRate: number;
  fullAmount: number;
  reduceAmount: number;
  beginTime: string;
  endTime: string;
}

// ============ API 接口 ============

/**
 * 新增优惠券
 * @param data 优惠券数据
 */
export const addCouponAPI = (data: CouponDTO) => {
  return apiClient.post('/coupon', data);
}

/**
 * 查询商铺下的优惠券
 * @param shopId 商铺ID
 */
export const queryCouponByShopIdAPI = (shopId: number) => {
  return apiClient.get('/coupon', {
    params: { shopId }
  });
}

/**
 * 删除优惠券
 * @param couponId 优惠券ID
 */
export const deleteCouponAPI = (couponId: number) => {
  return apiClient.delete('/coupon', {
    params: { couponId }
  });
}

/**
 * 查询缓存中的优惠券库存
 * @param couponId 优惠券ID
 */
export const getCouponStockAPI = (couponId: number) => {
  return apiClient.get('/coupon/stock', {
    params: { couponId }
  });
}

/**
 * 更改优惠券库存
 * @param couponId 优惠券ID
 * @param stockChange 库存变化量
 */
export const updateCouponStockAPI = (couponId: number, stockChange: number) => {
  return apiClient.put('/coupon/stock', null, {
    params: { couponId, stockChange }
  });
}

/**
 * 抢购优惠券（秒杀）
 * @param couponId 优惠券ID
 */
export const secKillCouponAPI = (couponId: number) => {
  return apiClient.post('/coupon/secKill', null, {
    params: { couponId }
  });
}
