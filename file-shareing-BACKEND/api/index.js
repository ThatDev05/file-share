// Vercel serverless entrypoint
// This file routes all incoming requests to the Express app exported from server.js
const app = require('../server');

// For Vercel, export a request handler function. Express apps are callable (function(req,res)),
// so we can forward requests directly to the app.
module.exports = (req, res) => {
  return app(req, res);
};

// Disable Vercel's default body parser to allow multer to process the multipart/form-data stream natively
export const config = {
    api: {
        bodyParser: false,
    },
};
