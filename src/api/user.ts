import apiClient from "@/util/requests";

interface ILoginData{
    username:string;
    password:string;
}

interface IRegisterData{
    username:string;
    password:string;
}


/**
 * 登录接口
 * @param data
 * @returns 
 */
export const loginAPI = (data:ILoginData)=>{
    return apiClient.post('/user/login',data);
}

/**
 * 注册接口
 * @param data 
 * @returns 
 */
export const registerAPI=(data:IRegisterData)=>{
    return apiClient.post('/user',data);
}