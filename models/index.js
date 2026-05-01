// Models barrel.
//
// Import db first so the shared mongoose instance is initialized before any
// mongoose.model() call in the model files below. ESM evaluates imports in
// the order they appear, which mirrors the Mongoose "multiple files" pattern:
// define the connection once, require it before any model file.

import '../db/index.js';

import StudentModel from './Student.js';

export { StudentModel };

export default {
  StudentModel,
};
