// app/controller/chat.js
const Controller = require('egg').Controller;

class ChatController extends Controller {
    // 连接socket
    async connect() {
        const { ctx, app, service } = this;
        if (!ctx.websocket) {
            ctx.throw(400, '非法访问');
        }

        // console.log(`clients: ${app.ws.clients.size}`);

        // 监听接收消息和关闭socket
        ctx.websocket
            .on('message', msg => {
                // console.log('接收消息', msg);
            })
            .on('close', (code, reason) => {
                // 用户下线
                console.log('用户下线', code, reason);
                let user_id = ctx.websocket.user_id;
                // 移除redis中的用户上线记录
                service.cache.remove('online_' + user_id);
                if (app.ws.user && app.ws.user[user_id]) {
                    delete app.ws.user[user_id];
                }
            });

    }
    // 发送消息
    async send() {
        const { ctx, app, service } = this
        // 拿到用户id
        let current_user_id = ctx.authUser.id
        // 验证参数
        // 参数验证
        ctx.validate({
            to_id: {
                type: "int",
                required: true,
                desc: '接受人/群id'
            },
            chat_type: {
                type: "string",
                required: true,
                range: {
                    in: ['user', 'group']
                },
                desc: '接收类型：单聊/群聊'
            },
            type: {
                type: "string",
                required: true,
                range: {
                    in: ['text', 'image', 'card', 'video', 'audio', 'emoticon']
                },
                desc: '消息类型'
            },
            data: {
                type: "string",
                required: true,
                desc: '消息内存'
            },
            options: {
                type: 'string',
                required: true,
            }
        })
        // 获取参数
        let { to_id, chat_type, type, data, options } = ctx.request.body
        // 单聊
        if (chat_type === 'user') {
            // 验证好友是否存在，并且对方没有把你拉黑
            let Friend = await app.model.Friend.findOne({
                where: {
                    user_id: to_id,
                    friend_id: current_user_id,
                    isblack: 0
                },
                include: [{
                    model: app.model.User,
                    as: "userInfo"
                }, {
                    model: app.model.User,
                    as: "friendInfo"
                }]
            })
            if (!Friend) {
                return ctx.apiFail('对方不存在或者已经把你拉黑')
            }
            // 验证好友是否被禁用
            if (!Friend.userInfo.status) {
                return ctx.apiFail('对方已被禁用')
            }
            // 构建消息格式
            let from_name = Friend.friendInfo.nickname ? Friend.friendInfo.nickname : Friend.friendInfo.username
            if (Friend.nickname) {
                from_name = Friend.nickname
            }
            let message = {
                id: (new Date()).getTime(), // 唯一id，后端生成唯一id
                from_avatar: Friend.friendInfo.avatar,// 发送者头像
                from_name, // 发送者昵称
                from_id: current_user_id, // 发送者id
                to_id, // 接收人/群 id
                to_name: Friend.userInfo.nickname ? Friend.userInfo.nickname : Friend.userInfo.username, // 接收人/群 名称
                to_avatar: Friend.userInfo.avatar, // 接收人/群 头像
                chat_type: 'user', // 接收类型
                type,// 消息类型
                data, // 消息内容
                options: {}, // 其他参数
                create_time: (new Date()).getTime(), // 创建时间
                isremove: 0, // 是否撤回
            }
            // 视频，截取封面
            if (message.type === 'video') {
                message.options.poster = message.data + '?x-oss-process=video/snapshot,t_10,m_fast,w_300,f_png';
            }
            // 音频，带上音频时长
            if (message.type === 'audio') {
                options = JSON.parse(options);
                message.options.time = options.time || 1;
            }
            // 名片
            if (message.type === 'card') {
                // 验证名片用户是否存在
                message.options = JSON.parse(options)
            }

            ctx.sendAndSaveMessage(to_id, message)
            // 存储到自己的聊天记录中 chatlog_当前用户id_user_对方用户id
            service.cache.setList(`chatlog_${current_user_id}_${message.chat_type}_${to_id}`, message)
            // 返回成功
            return ctx.apiSuccess(message)
        }
        // 群聊
        // 验证群聊是否存在，且你是否在该群中
        let group = await app.model.Group.findOne({
            where: {
                status: 1,
                id: to_id,
            },
            include: [{
                model: app.model.GroupUser,
                attributes: ['user_id', 'nickname']
            }]
        })
        if (!group) {
            return ctx.apiFail('该群聊不存在或者已被封禁')
        }
        let index = group.group_users.findIndex(item => item.user_id === current_user_id)
        if (index === -1) {
            return ctx.apiFail('你不是该群成员')
        }
        // 组织数据格式
        let from_name = group.group_users[index].nickname
        let message = {
            id: (new Date()).getTime(), // 唯一id，后端生成唯一id
            from_avatar: ctx.authUser.avatar,// 发送者头像
            from_name: from_name || ctx.authUser.nickname || ctx.authUser.username, // 发送者昵称
            from_id: current_user_id, // 发送者id
            to_id, // 接收人/群 id
            to_name: group.name,// 接收人/群 名称
            to_avatar: group.avatar, // 接收人/群 头像
            chat_type: 'group', // 接收类型
            type,// 消息类型
            data, // 消息内容
            options: {}, // 其他参数
            create_time: (new Date()).getTime(), // 创建时间
            isremove: 0, // 是否撤回
            group: group
        }
        // 视频，截取封面
        if (message.type === 'video') {
            message.options.poster = message.data + '?x-oss-process=video/snapshot,t_10,m_fast,w_300,f_png';
        }
        // 音频，带上音频时长
        if (message.type === 'audio') {
            options = JSON.parse(options);
            message.options.time = options.time || 1;
        }
        // 名片
        if (message.type === 'card') {
            // 验证名片用户是否存在
            message.options = JSON.parse(options)
        }
        // 批量推送消息
        group.group_users.forEach(item => {
            if (item.user_id !== current_user_id) {
                ctx.sendAndSaveMessage(item.user_id, message)
            }
        })
        ctx.apiSuccess(message)
    }
    // 获取离线消息
    async getmessage() {
        const { ctx, app, service } = this
        let current_user_id = ctx.authUser.id
        let key = 'getmessage_' + current_user_id
        let list = await service.cache.getList(key)
        // 清楚离线消息
        await service.cache.remove(key)
        // 批量推送
        list.forEach(async message => {
            let data = JSON.parse(message)
            ctx.sendAndSaveMessage(current_user_id, data.message ,data.msg)
        })
    }
    // 撤回
    async recall() {
        const { ctx, app } = this;
        let current_user_id = ctx.authUser.id;

        ctx.validate({
            to_id: {
                type: 'int',
                required: true,
                desc: '接收人/群id'
            },
            chat_type: {
                type: 'string',
                required: true,
                range: {
                    in: ['user', 'group']
                },
                desc: '接收类型'
            },
            id: {
                type: 'int',
                required: true,
                desc: '消息id'
            }
        });

        let { to_id, chat_type, id } = ctx.request.body;
        let message = {
            from_id: current_user_id,
            to_id,
            chat_type,
            id
        }
        // 单聊
        if (chat_type === 'user') {
            ctx.sendAndSaveMessage(to_id, message, 'recall');
            return ctx.apiSuccess(message);
        }
        // 群聊
        let group = await app.model.Group.findOne({
            where: {
                id: to_id,
                status: 1
            },
            include: [{
                model: app.model.GroupUser,
                attributes: ['user_id']
            }]
        });

        if (group) {
            group.group_users.forEach(item => {
                if (item.user_id !== current_user_id) {
                    ctx.sendAndSaveMessage(item.user_id, message, 'recall');
                }
            });
        }
        return ctx.apiSuccess(message);
    }

}
module.exports = ChatController;