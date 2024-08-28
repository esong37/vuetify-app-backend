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
import libraryRoutes from './routes/libraryRoutes.mjs';
import playlistRoutes from './routes/playlistRoutes.mjs';
import albumRoutes from './routes/albumRoutes.mjs';


dotenv.config();

const app = new Koa();
const router = new Router();

// __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// middleware
app.use(cors()); // allow cross-domain requests
app.use(bodyParser());

// static file services (images)
app.use(serve(path.join(__dirname, '/public')));

// use routes
app.use(router.routes()).use(router.allowedMethods());
app.use(streamRoutes.routes()).use(streamRoutes.allowedMethods()); 
app.use(userRouter.routes()).use(userRouter.allowedMethods()); 
app.use(libraryRoutes.routes()).use(libraryRoutes.allowedMethods());
app.use(playlistRoutes.routes()).use(playlistRoutes.allowedMethods());
app.use(albumRoutes.routes()).use(albumRoutes.allowedMethods());

// launch server
const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
