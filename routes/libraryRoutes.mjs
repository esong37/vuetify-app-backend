// routes/libraryRoutes.mjs
import Router from 'koa-router';
import { verifyToken } from '../middlewares/jwtMiddleware.mjs'; // JWT middleware
import { getUserLibrarySchema } from '../models/library.mjs';
import { library, user } from '../models/dbConnections.mjs'; 

const router = new Router();

// 获取用户数据
router.get('/api/library', verifyToken, async (ctx) => {
  try {
    const userId = ctx.state.user.uid; // 获取用户ID
    const userLibrary = getUserLibrarySchema(library, userId);

    const libraryItems = await userLibrary.find(); // 获取所有用户数据
    console.log(libraryItems);
    ctx.body = libraryItems.map(item => ({
      id: item.id,
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

// 处理收藏专辑的请求
router.post('/api/album/favorite', verifyToken, async (ctx) => {
  try {
      const userId = ctx.state.user.uid; // 从 JWT 中获取用户 ID
      const { id, type, added_date } = ctx.request.body; // 从请求中获取收藏信息

      // 获取用户的收藏集合
      const UserLibrary = getUserLibrarySchema(library, userId);

      // 检查专辑是否已存在于用户的收藏中
      const existingFavorite = await UserLibrary.findOne({ type, id });

      if (existingFavorite) {
          ctx.status = 200; // 返回 200 状态表示请求成功，但不添加重复项
          ctx.body = { message: 'Album already in favorites' };
          return;
      }

      // 创建新的收藏项
      const newFavorite = new UserLibrary({
          type,
          id,
          added_date,
      });

      await newFavorite.save(); // 保存收藏项

      ctx.status = 200;
      ctx.body = { message: 'Favorite added successfully' };
  } catch (err) {
      console.error(`Error adding favorite: ${err}`);
      ctx.status = 500;
      ctx.body = { error: 'Internal Server Error' };
  }
});

// 处理删除收藏的请求
router.delete('/api/library', verifyToken, async (ctx) => {
  try {
    const userId = ctx.state.user.uid; // 从 JWT 中获取用户 ID
    const { id, type } = ctx.request.body; // 从请求中获取删除的条目信息

    // 获取用户的收藏集合
    const UserLibrary = getUserLibrarySchema(library, userId);

    // 删除收藏的条目
    const deleteResult = await UserLibrary.deleteOne({ type, id });

    if (deleteResult.deletedCount === 0) {
      ctx.status = 404;
      ctx.body = { message: 'Item not found in favorites' };
    } else {
      ctx.status = 200;
      ctx.body = { message: 'Favorite deleted successfully' };
    }
  } catch (err) {
    console.error(`Error deleting favorite: ${err}`);
    ctx.status = 500;
    ctx.body = { error: 'Internal Server Error' };
  }
});

export default router;
