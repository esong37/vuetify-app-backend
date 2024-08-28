// routes/streamRoutes.js
import Router from 'koa-router';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { getLibraryIndex } from '../models/library.mjs';
import { library, user } from '../models/dbConnections.mjs'; 
import { verifyToken } from '../middlewares/jwtMiddleware.mjs';

const router = new Router();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const libraryIndex = getLibraryIndex(library);

// get all tracks
router.get('/api/stream',verifyToken, async (ctx) => {
  try {
    const tracks = await libraryIndex.find(); 
    ctx.body = { tracks };
  } catch (err) {
    console.log(`Error retrieving tracks: ${err}`);
    ctx.status = 500;
    ctx.body = 'Internal Server Error';
  }
});

router.get('/api/stream/:track_id', async ctx => {
  try {
    const trackId = ctx.params.track_id;
    const track = await libraryIndex.findOne({ track_id: trackId });

    if (!track) {
      console.log("Track not found!");
      ctx.status = 404;
      ctx.body = { error: 'Track not found' };
      return;
    }

    const filePath = path.join(__dirname, '../public', track.file.replace(/\\/g, '/'));
    const stat = fs.statSync(filePath);
    const fileSize = stat.size;
    const range = ctx.headers.range;

    console.log(`Playing: ${filePath}`);

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

export default router;
