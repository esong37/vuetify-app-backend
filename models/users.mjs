import mongoose from 'mongoose';

// Define userSchema for the 'users' collection
const userSchema = new mongoose.Schema({
    uid: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    secret: { type: String, required: true }, // Password, should be hashed
    subscribe: { type: String, enum: ['Free', 'Premium'], default: 'Free', required: true },
    subscribe_expired: { type: Date, default: null }, // null for Free users, 1 year from subscription for Premium
    last_login: { type: Date, default: Date.now },
    playing: { type: String } // machine_id
}, { collection: 'users' });

export const getUserIndex = (connection) => {
    return connection.model('UserIndex', userSchema);
};