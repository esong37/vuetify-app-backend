// middlewares/jwtMiddleware.mjs
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';

dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET;

export const verifyToken = async (ctx, next) => {
    const authHeader = ctx.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    
    if (!token) {
        console.log("Access Denied!!!!!!!!!!!!!!")
        ctx.status = 401; // 返回未授权状态码
        ctx.body = { msg: 'Access Denied' };
        return;
    }

    try {
        const verified = jwt.verify(token, JWT_SECRET);
        ctx.state.user = verified;
        await next();
    } catch (err) {
        console.log("wrong id or password!!!!")
        ctx.status = 403;
        ctx.body = { msg: 'Invalid Token' };
        
    }
};
