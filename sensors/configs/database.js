import mongoose from 'mongoose';

export function initDatabase() {
    const dbUri = process.env.MONGO_URI || "mongodb://localhost:27017/juicy-forest";
    return mongoose.connect(dbUri);
}