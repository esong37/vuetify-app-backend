import mongoose from 'mongoose';

const PlaylistSchema = new mongoose.Schema({
    pid: { type: String, required: true, unique: true }, // Randomly generated ID
    author: { type: String }, // uid of the author
    name: { type: String },
    description: { type: String },
    added: { type: Number, default: 0 },
    liked: { type: Number, default: 0 },
    shared: { type: Number, default: 0 },
    played: { type: Number, default: 0 },
    public: { type: Boolean, default: true },
    image: { type: String }, // Path to the image
    type: { type: String, enum: ['playlist', 'album'], required: true },
    last_update: { type: Date, default: Date.now }
});

// Playlist Items Schema (p_<pid>)
const PlaylistItemSchema = new mongoose.Schema({
    tid: { type: String, required: true }, // track_id
    order: { type: Number } // Order of the track in the playlist
});

// Middleware to auto-increment 'order'
PlaylistItemSchema.pre('save', async function (next) {
    if (this.isNew) {
        const model = this.constructor;
        const count = await model.countDocuments();
        this.order = count;
    }
    next();
});




export const getPlaylistSchema = (connection) => {
    return connection.model('playlist', PlaylistSchema);
};

export const getPlaylistItemSchema = (connection,pid) => {
    const collectionName = `p_${pid}`;
    return connection.model(collectionName, PlaylistItemSchema, collectionName);
};