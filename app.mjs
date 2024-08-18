// app.js
import Koa from 'koa';
import Router from 'koa-router';
import serve from 'koa-static';
import cors from '@koa/cors';
import path from 'path';
import fs from 'fs';
import bodyParser from 'koa-bodyparser';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import stream from 'koa-stream';

import { getLibraryIndex } from './models/library.mjs';
import { library, user } from './models/dbConnections.mjs'; 

const app = new Koa();
const router = new Router();

const libraryIndex = getLibraryIndex(library);

dotenv.config();
// __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 中间件配置
app.use(cors()); // 允许跨域请求
app.use(bodyParser());

// 提供静态文件服务 (音频文件和图片)
app.use(serve(path.join(__dirname, '/public')));

// // 模拟音轨数据
// const tracks = [
//     { title: 'Track 1', src: '/library/nt4.mp3', albumArt: "https://fastly.picsum.photos/id/896/400/400.jpg?hmac=t5cSR3FAX0B8F6RdKvfOrL0y7Ams72GPlnRbmN_arA4" },
//     { title: 'Track 2', src: '/library/oxp.mp3', albumArt: "https://fastly.picsum.photos/id/236/400/400.jpg?hmac=I-dzKO4vSyJQINuwJmpfiLsdHeRGLz5AWI9FE9zjDUc" },

// ];

// handle /stream , show all files
router.get('/api/stream', async (ctx) => {
  try {
    // get data from db
    const tracks = await libraryIndex.find(); 
    ctx.body = { tracks };
  } catch (err) {
    console.log(`Error retrieving tracks: ${err}`);
    ctx.status = 500;
    ctx.body = 'Internal Server Error';
  }
});

// 通过 `track_id` 串流音频文件
router.get('/api/stream/:track_id', async ctx => {
  try {
    const trackId = ctx.params.track_id;
    const track = await libraryIndex.findOne({ track_id: trackId });


    if (!track) {
      console.log("track no found!");
      ctx.status = 404;
      ctx.body = { error: 'Track not found' };
      return;
    }


    // koa-stream only applicable to koa1
    // thus using fs.creatReadStream here
    const filePath = path.join(__dirname, track.file.replace(/\\/g, '/'));
    const stat = fs.statSync(filePath);
    const fileSize = stat.size;
    const range = ctx.headers.range;

    console.log(`playing: ${filePath}`);

    if (range) {
        const parts = range.replace(/bytes=/, "").split("-");
        const start = parseInt(parts[0], 10);
        const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
        const chunksize = (end - start) + 1;
        const file = fs.createReadStream(filePath, { start, end });
        ctx.set('Content-Range', `bytes ${start}-${end}/${fileSize}`);
        ctx.set('Accept-Ranges', 'bytes');
        ctx.set('Content-Length', chunksize);
        ctx.set('Content-Type', 'audio/mpeg');
        ctx.status = 206;
        ctx.body = file;
    } else {
        ctx.set('Content-Length', fileSize);
        ctx.set('Content-Type', 'audio/mpeg');
        ctx.body = fs.createReadStream(filePath);
    }

  } catch (err) {
    console.log(`${err}`);

    ctx.status = 500;
    ctx.body = { error: 'Failed to stream track' };
  }
});


// 使用路由
app.use(router.routes()).use(router.allowedMethods());

// 启动服务器
const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
