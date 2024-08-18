import mongoose from 'mongoose';

// Define indexSchema for the 'index' collection
const indexSchema = new mongoose.Schema({
    track_id: { type: String, unique: true, required: true },
    title: { type: String },
    artist: { type: [String] }, // Array of strings to store multiple artists
    album: { type: String, },
    album_id: { type: String },
    genre: { type: String },
    copyright: { type: String },
    length: { type: String  }, // MM:ss format
    track_number: { type: Number },
    quality: { type: String, enum: ['STD', 'HQ'], default: 'STD' },
    file: { type: String, required: true }
}, { collection: 'index' });

// User Library Schema (u_<uid>)
const UserLibrarySchema = new mongoose.Schema({
    type: { type: String, enum: ['track', 'album', 'playlist'], required: true },
    id: { type: String, required: true }, // This will be track_id or album_id or playlist_id
    added_date: { type: Date, default: Date.now }
});


export const getLibraryIndex = (connection) => {
    return connection.model('Index', indexSchema);
};

export const getUserLibrarySchema = (connection,uid) => {
    const collectionName = `u_${uid}`;
    return connection.model(collectionName, UserLibrarySchema, collectionName);
};