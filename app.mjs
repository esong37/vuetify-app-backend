// app.js
import Koa from 'koa';
import Router from 'koa-router';
import serve from 'koa-static';
import cors from '@koa/cors';
import path from 'path';
import bodyParser from 'koa-bodyparser';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

import streamRoutes from './routes/streamRoutes.mjs'; 
import userRouter from './routes/userRouter.mjs'; 


dotenv.config();

const app = new Koa();
const router = new Router();

// __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 中间件配置
app.use(cors()); // 允许跨域请求
app.use(bodyParser());

// 提供静态文件服务 (音频文件和图片)
app.use(serve(path.join(__dirname, '/public')));

// 使用路由
app.use(router.routes()).use(router.allowedMethods());
app.use(streamRoutes.routes()).use(streamRoutes.allowedMethods()); 
app.use(userRouter.routes()).use(userRouter.allowedMethods()); 

// 启动服务器
const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
