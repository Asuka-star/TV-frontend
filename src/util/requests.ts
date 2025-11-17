import axios from "axios";
import { useUserStore } from "@/stores/userStore";
import { ElMessage } from "element-plus";

// 创建一个 axios 实例
const apiClient = axios.create({
    baseURL: 'http://localhost:8090', // 基础 URL
    timeout: 5000, //请求超时时间
})

// 请求拦截器
apiClient.interceptors.request.use(
    (config) => {
        // 白名单：这些接口不需要 token（游客也可以访问）
        const publicPaths = ['/user/login', '/user','/shop','shop/page','/coupon','/coupon/stock','comment/page'];
        
        // 在请求发送之前做些什么，比如添加 token 到请求头
        const userStore = useUserStore();
        
        // 检查是否是公开路径
        const isPublic = publicPaths.some(path => config.url?.includes(path));
        
        // 如果不是白名单且有 token，就添加 token
        // 注意：这里使用 'token' 作为 header 名称，而不是 'Authorization'
        if (!isPublic && userStore.token) {
            config.headers['token'] = userStore.token;
        } else if (isPublic && userStore.token) {
            // 公开接口也可以带 token（可选）
            config.headers['token'] = userStore.token;
        }

        // 调试日志：打印将要发送的请求信息
        try {
            // 避免在生产环境打印过多日志
            if (import.meta.env.DEV) {
                console.debug('[api request]', config.method?.toUpperCase(), apiClient.defaults.baseURL + (config.url || ''), 'params=', config.params, 'data=', config.data, 'headers=', config.headers);
            }
        } catch (e) {
            // ignore
        }

        return config;
    },
    (error) => {
        // 处理请求错误
        return Promise.reject(error);
    }
)

// 响应拦截器
apiClient.interceptors.response.use(
    (response) => {
        // 任何状态码在 2xx 范围内的都会触发该函数
        // 进行数据剥离，只取有用的data
        return response;
    },
    (error) => {
        // 统一处理 HTTP 错误，优先展示后端返回的 message
        let message = '请求失败';
        if (error.response) {
            // 优先展示后端返回的 message 字段
            if (error.response.data && error.response.data.message) {
                message = error.response.data.message;
            } else {
                switch (error.response.status) {
                    case 401:
                        message = '未授权，请重新登录';
                        useUserStore().logout();
                        break;
                    case 403:
                        message = '禁止访问';
                        break;
                    case 404:
                        message = '请求地址不存在';
                        break;
                    case 500:
                        message = '服务器内部错误';
                        break;
                    default:
                        message = error.message;
                }
            }
        }
        ElMessage.error(message);
        // 不再传递详细错误到页面，页面只需处理成功逻辑
        return Promise.reject(error);
    }
);
export default apiClient;