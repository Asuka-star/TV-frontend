import axios from "axios";
import { useUserStore } from "@/stores/userStore";
import { ElMessage } from "element-plus";

// 创建一个 axios 实例
const apiClient = axios.create({
    baseURL: 'http://10.21.76.53:8090', // 基础 URL
    timeout: 5000, //请求超时时间
})

// 请求拦截器
apiClient.interceptors.request.use(
    (config) => {
        // 在请求发送之前做些什么，比如添加 token 到请求头
        const userStore = useUserStore();
        // 如果有token
        if (userStore.token) {
            config.headers['Authorization'] = `Bearer ${userStore.token}`;
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
        // 任何超出 2xx 范围的状态码都会触发该函数
        // 统一处理 HTTP 错误
        let message = '请求失败'
        if (error.response) {
            switch (error.response.status) {
                case 401:
                    message = '未授权，请重新登录'
                    // 可以在这里调用 userStore.logout() 并跳转到登录页
                    useUserStore().logout() // 假设 store 里有 logout 方法
                    break
                case 403:
                    message = '禁止访问'
                    break
                case 404:
                    message = '请求地址不存在'
                    break
                case 500:
                    message = '服务器内部错误'
                    break
                default:
                    message = error.message
            }
        }
        ElMessage.error(message)
        return Promise.reject(error)
    }
);
export default apiClient;