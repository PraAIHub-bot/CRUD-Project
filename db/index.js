// Database module entry point.
//
// Exports the shared mongoose singleton and the connectDB helper so every caller
// (models, controllers, app.js, tests) operates on the same connection.
//
// Keep this file free of model imports — models/index.js depends on this file,
// so importing models here would create a circular require at startup.

import mongoose from 'mongoose';
import connectDB from './connectDB.js';

export { mongoose, connectDB };
export default mongoose;
