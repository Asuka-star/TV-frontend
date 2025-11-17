import apiClient from "@/util/requests";

// ============ 类型定义 ============

export interface OrderVO {
  id: number;
  couponId: number;
  status: number;
  createTime: string;
}

// ============ API 接口 ============

/**
 * 订单支付
 * @param orderId 订单ID
 */
export const paymentOrderAPI = (orderId: number) => {
  return apiClient.put('/order/payment', null, {
    params: { arg0: orderId }
  });
}

/**
 * 查询当前用户名下的订单
 */
export const getOwnedOrdersAPI = () => {
  return apiClient.get('/order/owner');
}
