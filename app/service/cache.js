'use strict';

const Controller = require('egg').Controller;

class CacheController extends Controller {
    /**
     * 获取列表
     * @param {string} key 
     * @param {boolean} isChildObject 
     * @returns {array}返回数组
     */
    async getList(key, isChildObject = false) {
        const { redis } = this.app
        let data = await redis.lrange(key, 0, -1)
        if (isChildObject) {
            data = data.map(item => {
                return JSON.parse(item);
            });
        }
        return data;
    }
    /**
     * 设置列表
     * @param {*} key 
     * @param {*} value 
     * @param {*} type 类型 push和unshift
     * @param {*} expir 过期时间
     * @returns 
     */
    async setList(key,value,type='push',expir=0){
        const {redis}=this.app
        if(expir>0){
            await redis.expire(key,expir)
        }
        if(typeof value ==='object'){
            value =JSON.stringify(value)
        }
        if(type==='push'){
            return await redis.rpush(key,value)
        }
        return await redis.lpush(key,value)
    }
    /**
     * 设置redis缓存
     * @param {*} key 键
     * @param {*} value 值
     * @param {*} expir 过期时间s
     * @returns 
     */
    async set(key,value,expir=0){
        const{redis}=this.app
        if(expir===0){
            return await redis.set(key,JSON.stringify(value))
        }else{
            return await redis.set(key,JSON.stringify(value),'EX',expir)
        }
    }
    /**
     * 获取redis缓存
     * @param {*} key 
     * @returns 返回的数据
     */
    async get(key){
        const{redis}=this.app
        const result = await redis.get(key)
        return JSON.parse(result)
    }
    /**
     * 自增
     * @param {*} key 键
     * @param {*} number自增的值 
     */
    async incr(key,number=1){
        const{redis}=this.app
        if(number===1){
            return await redis.incr(key)
        }else{
            return await redis.incrby(key,number)
        }
    }
    /**
     * 删除查询长度
     * @param {*} key 
     * @returns 
     */
    async strlen(key){
        const{redis}=this.app
        return await redis.strlen(key)
    }
    /**
     * 删除指定key
     * @param {*} key 
     * @returns 
     */
    async remove(key){
        const{redis}=this.app
        return await redis.del(key)
    }
    // 清除缓存
    async clear(){
        return await this.app.redis.flushall()
    }
}
module.exports = CacheController;
