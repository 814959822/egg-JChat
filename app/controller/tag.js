'use strict';

const Controller = require('egg').Controller;

class TagController extends Controller {
    // 标签列表
    async list() {
        const { ctx, app } = this
        // 拿到当前用户id
        let current_user_id = ctx.authUser.id


        let rows = await app.model.Tag.findAll({
            where: {
                user_id: current_user_id
            },
            attributess: ['id', 'name'],
            include: [{
                model: app.model.Friend,
                attributess: ['nickname'],
                include: [{
                    model: app.model.User,
                    as: "friendInfo",
                    attributess: ['id',],
                }]
            }]
        })
        ctx.apiSuccess(rows)
    }
    // 标签用户列表
    async read() {
        const { ctx, app } = this
        // 拿到当前用户id
        let current_user_id = ctx.authUser.id
        let id = parseInt(ctx.params.id)

        let rows = await app.model.Tag.findOne({
            where: {
                user_id: current_user_id,
                id
            },
            attributess: ['id', 'name'],
            include: [{
                model: app.model.Friend,
                attributess: ['nickname'],
                where:{
                    isblack:0
                },
                include: [{
                    model: app.model.User,
                    as: "friendInfo",
                    attributess: ['id','nickname','username','avatar'],
                }]
            }]
        })
        ctx.apiSuccess(rows.friends)
    }
}

module.exports = TagController;
