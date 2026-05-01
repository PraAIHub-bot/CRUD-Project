import mongoose from 'mongoose';

let connectionPromise = null;
let listenersAttached = false;

const attachLifecycleListeners = () => {
    if (listenersAttached) return;
    listenersAttached = true;

    mongoose.connection.on('error', (err) => {
        console.error('MongoDB connection error:', err && err.message ? err.message : err);
        process.exit(1);
    });

    mongoose.connection.once('open', () => {
        console.log('MongoDB connected');
    });
};

const connectDB = async (uri) => {
    // Idempotent: if a connection is already open, return it without reconnecting.
    if (mongoose.connection.readyState === 1) {
        return mongoose.connection;
    }

    // If a connection attempt is already in flight, return the same promise.
    if (connectionPromise) {
        return connectionPromise;
    }

    if (!uri || typeof uri !== 'string') {
        console.error('MongoDB connection failed: no connection string provided. Set MONGODB_URI in your environment.');
        process.exit(1);
        return;
    }

    attachLifecycleListeners();

    connectionPromise = mongoose
        .connect(uri)
        .then(() => mongoose.connection)
        .catch((err) => {
            console.error('MongoDB connection error:', err && err.message ? err.message : err);
            process.exit(1);
        });

    return connectionPromise;
};

export default connectDB;
