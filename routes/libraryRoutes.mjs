// routes/libraryRoutes.mjs
import Router from 'koa-router';
import { verifyToken } from '../middlewares/jwtMiddleware.mjs'; // JWT middleware
import { getUserLibrarySchema } from '../models/library.mjs';
import { library, user } from '../models/dbConnections.mjs'; 

const router = new Router();


// get user data
router.get('/api/library', verifyToken, async (ctx) => {
  try {
    const userId = ctx.state.user.uid; // get user id 
    const userLibrary = getUserLibrarySchema(library,userId);

    const libraryItems = await userLibrary.find(); // get all user data
    console.log(libraryItems);
    ctx.body = libraryItems.map(item => ({
      id: item.track_id,
      type: item.type,
      added_date: item.added_date,
    }));


  } catch (err) {
    console.error(`Error fetching library items: ${err}`);
    ctx.status = 500;
    ctx.body = { error: 'Internal Server Error' };
  }
});

router.post('/api/library/favorite', verifyToken, async (ctx) => {
  try {
    const userId = ctx.state.user.uid;
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
