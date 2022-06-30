module.exports = (option, app) => {
    return async (ctx, next) => {
        // 1，获取header头token
        let token = ctx.header.token||ctx.query.token
        if (!token) {
            ctx.throw(400, '您没有权利访问该接口')
        }
        // 2，根据token解密，获取用户信息
        let user = {}
        try {
            user = ctx.checkToken(token)
        } catch (error) {
            let fail = error.name === 'TokenExpiredError' ? 'token 已过期！请重新获取令牌' : 'Token令牌不合法！'
            ctx.throw(400, fail)
        }
        // 3，判断当前用户是否登陆
        let t = await ctx.service.cache.get('user_' + user.id)
        if (!t || t !== token) {
            ctx.throw(400, 'Token令牌不合法')
        }
        // 4,获取当前用户，验证当前用户是否被禁用
        user = await app.model.User.findByPk(user.id)
        if (!user || user.status == 0) {
            ctx.throw(400,'用户不存在或已被禁用')
        }
        // 5，吧user信息挂在到全局ctx上
        ctx.authUser = user
        // 6继续执行
        await next()
    }
}