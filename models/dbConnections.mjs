import mongoose from 'mongoose';
import dotenv from 'dotenv';


dotenv.config();

const library = mongoose.createConnection('mongodb://localhost:27017/library');
const user = mongoose.createConnection('mongodb://localhost:27017/users');
const playlist = mongoose.createConnection('mongodb://localhost:27017/playlist');

export { library, user, playlist };