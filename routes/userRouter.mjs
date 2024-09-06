// routes/userRouter.mjs
import Router from 'koa-router';
import { getUserIndex } from '../models/users.mjs';
import {  user } from '../models/dbConnections.mjs'; 
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import { verifyToken } from '../middlewares/jwtMiddleware.mjs'; // JWT 

const router = new Router();
const userIndex = getUserIndex(user);

// load .env and jwt secret
dotenv.config();
const JWT_SECRET = process.env.JWT_SECRET

// handle login request
router.post('/auth/login', async (ctx) => {
    const { uid, secret } = ctx.request.body;

    try {
        // find user
        const user = await userIndex.findOne({ uid, secret });

        console.log(`find user: ${user}`);
        if (user) {


            // generate JWT
            const token = jwt.sign({ uid: user.uid }, JWT_SECRET, { expiresIn: '1h' });

            ctx.body = {
                status: 0,
                msg: "Login successful",
                token,
                user: {
                    uid: user.uid,
                    name: user.name,
                    subscribe: user.subscribe,
                    subscribe_expired: user.subscribe_expired,
                    last_login: user.last_login,
                    playing: user.playing
                },
            };
        } else {
            ctx.body = {
                status: 1,
                msg: "Username or Password error."
            };
        }
    } catch (err) {
        console.log(`err: ${err}`);
        ctx.status = 500;
        ctx.body = {
            status: 1,
            msg: "Internal Server Error"
        };
    }
});

// handle register request
router.post('/auth/register', async (ctx) => {
    const { uid, name, secret } = ctx.request.body;
    console.log(`Registration attempt: ${uid}`);


    try {
        // check if user alread exist
        const existingUser = await userIndex.findOne({ uid });
        if (existingUser) {
            ctx.body = {
                status: 1,
                msg: "User Already Exist."
            };
            return;
        }

        const subscribeDuration = {
            'Free': null,
            'Monthly': new Date(new Date().setMonth(new Date().getMonth() + 1)), // add one month
            'Yearly': new Date(new Date().setFullYear(new Date().getFullYear() + 1)) // add a year
        };

        // new user
        const newUser = new userIndex({
            uid,
            name,
            secret,
            subscribe: 'Free', // default
            subscribe_expired: null,
            last_login: new Date(),
            playing: ''
        });

        console.log(`new user register: ${newUser}`)

        await newUser.save();
            ctx.body = {
                status: 0,
                msg: "Registration successful"
            };
    } catch (err) {
        ctx.status = 500;
        ctx.body = {
            status: 1,
            msg: "Internal Server Error"
        };
    }
});

router.get('/api/user/info', verifyToken, async (ctx) => {
    try {
      const userId = ctx.state.user.uid; // 从 JWT 中获取用户 ID
  
      const userInfo = await userIndex.findOne({ uid: userId });
  
      if (userInfo) {
        ctx.body = {
          uid: userInfo.uid,
          name: userInfo.name,
          subscribe: userInfo.subscribe,
          subscribe_expired: userInfo.subscribe_expired,
          last_login: userInfo.last_login,
        };
      } else {
        ctx.status = 404;
        ctx.body = { error: 'User not found' };
      }
    } catch (err) {
      console.error(`Error fetching user info: ${err}`);
      ctx.status = 500;
      ctx.body = { error: 'Internal Server Error' };
    }
  });

export default router;
