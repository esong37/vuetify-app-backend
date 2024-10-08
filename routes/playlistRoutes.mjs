// routes/playlistRoutes.mjs
import Router from 'koa-router';
import { verifyToken } from '../middlewares/jwtMiddleware.mjs'; // JWT 
import { getPlaylistSchema, getPlaylistItemSchema } from '../models/playlist.mjs';
import { playlist, library } from '../models/dbConnections.mjs';
import { getLibraryIndex } from '../models/library.mjs';
import crypto from 'crypto';

const router = new Router();
const Playlist = getPlaylistSchema(playlist);
const libraryIndex = getLibraryIndex(library)

// get all playlists
router.get('/api/playlist', verifyToken, async (ctx) => {
  try {
    const playlists = await Playlist.find({}, 'name pid type last_update');

    ctx.body = playlists.map(pl => ({
      name: pl.name,
      pid: pl.pid,
      type: pl.type,
      last_update: pl.last_update.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }),
      image: `https://picsum.photos/400?random=${Math.random()}`,
    }));
  } catch (err) {
    console.error(`Error fetching playlists: ${err}`);
    ctx.status = 500;
    ctx.body = { error: 'Internal Server Error' };
  }
});


router.get('/api/track/:id', verifyToken, async (ctx) => {
  try {
    const trackId = ctx.params.id;
    // 从index集合查找track_id
    const track = await libraryIndex.findOne({ track_id: trackId });

    if (!track) {
      ctx.status = 404;
      ctx.body = { error: 'Track not found' };
      return;
    }

    ctx.body = {
      id: track.track_id,
      title: track.title,
      artist: track.artist,
      album: track.album,
      albumArt: track.albumArt,
      length: track.length,
    };
  } catch (err) {
    console.error(`Error fetching track: ${err}`);
    ctx.status = 500;
    ctx.body = { error: 'Internal Server Error' };
  }
});

router.get('/api/playlist/:pid', verifyToken, async (ctx) => {
  try {
    const playlistId = ctx.params.pid;
    const playlistData = await Playlist.findOne({ pid: playlistId });

    if (!playlistData) {
      console.log("Playlist not found")
      ctx.status = 404;
      ctx.body = { error: 'Playlist not found' };
      return;
    }

    // check if pid exists
    const PlaylistItem = getPlaylistItemSchema(playlist, playlistId);
    const tracks = await PlaylistItem.find({}).sort({ order: 1 }).exec();


    const trackDetails = await Promise.all(
      tracks.map(async (track) => {
        const libraryData = await libraryIndex.findOne({ track_id: track.tid });
        return {
          track_id: track.tid,
          title: libraryData ? libraryData.title : 'Unknown Title',
          src: `http://localhost:3000/api/stream/${track.tid}`,
          albumArt: `https://picsum.photos/400?random=${Math.random()}`,
          order: track.order,
        };
      })
    );


    console.log(trackDetails)
    ctx.body = {
      playlistName: playlistData.name,
      tracks: trackDetails,
    };
  } catch (err) {
    console.error(`Error fetching playlist: ${err}`);
    ctx.status = 500;
    ctx.body = { error: 'Internal Server Error' };
  }
});


// 创建播放列表
router.post('/api/playlist/create', verifyToken, async (ctx) => {
  try {
    const { tracks } = ctx.request.body;
    const userId = ctx.state.user.uid;

    const newPid = crypto.randomBytes(8).toString('hex');
    const newPlaylist = new Playlist({
      pid: newPid,
      author: userId,
      name: `Playlist by ${userId}`,
      description: 'User-created playlist',
      type: 'playlist',
      last_update: new Date(),
    });

    await newPlaylist.save();

    // 创建播放列表项
    const PlaylistItem = getPlaylistItemSchema(playlist, newPlaylist.pid);
    for (const [index, track] of tracks.entries()) {
      const newPlaylistItem = new PlaylistItem({
        tid: track.id,
        order: index
      });
      await newPlaylistItem.save();
    }

    ctx.status = 201;
    ctx.body = { message: 'Playlist created successfully' };
  } catch (err) {
    console.error(`Error creating playlist: ${err}`);
    ctx.status = 500;
    ctx.body = { error: 'Internal Server Error' };
  }
});

export default router;
