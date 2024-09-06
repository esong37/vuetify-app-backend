// routes/albumRoutes.mjs
import Router from 'koa-router';
import { verifyToken } from '../middlewares/jwtMiddleware.mjs';
import { getPlaylistSchema, getPlaylistItemSchema } from '../models/playlist.mjs';
import { playlist, library } from '../models/dbConnections.mjs';
import { getLibraryIndex, getUserLibrarySchema } from '../models/library.mjs';

const router = new Router();
const Playlist = getPlaylistSchema(playlist);
const libraryIndex = getLibraryIndex(library)

// get type= album
router.get('/api/album', verifyToken, async (ctx) => {
    try {
        const albums = await Playlist.find({ type: 'album' }, 'pid name type last_update');

        ctx.body = albums.map(album => ({
            pid: album.pid,
            name: album.name,
            type: album.type,
            last_update: album.last_update.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }),
            image: `https://picsum.photos/400?random=${Math.random()}`,
        }));
    } catch (err) {
        console.error(`Error fetching albums: ${err}`);
        ctx.status = 500;
        ctx.body = { error: 'Internal Server Error' };
    }
});

router.get('/api/album/:pid', verifyToken, async (ctx) => {
    try {
        const albumId = ctx.params.pid;
        const albumData = await Playlist.findOne({ pid: albumId });

        if (!albumData) {
            console.log("album not found")
            ctx.status = 404;
            ctx.body = { error: 'album not found' };
            return;
        }

        // check if pid exists
        const albumItem = getPlaylistItemSchema(playlist, albumId);
        const tracks = await albumItem.find({}).sort({ order: 1 }).exec();


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
            albumName: albumData.name,
            tracks: trackDetails,
        };
    } catch (err) {
        console.error(`Error fetching album: ${err}`);
        ctx.status = 500;
        ctx.body = { error: 'Internal Server Error' };
    }
});

// 处理收藏专辑的请求
router.post('/api/album/favorite', verifyToken, async (ctx) => {
    try {
        const userId = ctx.state.user.uid; // 从 JWT 中获取用户 ID
        const favoriteData = ctx.request.body;
        const UserLibrary = getUserLibrarySchema(library, userId);
    
        // add user library to personal library
        const newFavorite = new UserLibrary(favoriteData);
        await newFavorite.save();
    
        console.log("new libray record added!")
    
        ctx.status = 200;
        ctx.body = { message: 'Favorite added successfully' };
      } catch (err) {
        console.error(`Error adding favorite: ${err}`);
        ctx.status = 500;
        ctx.body = { error: 'Internal Server Error' };
      }
});

export default router;
