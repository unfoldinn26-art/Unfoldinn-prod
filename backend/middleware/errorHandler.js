const errorHandler = (err, req, res, next) => {
  console.error(err.stack || err.message);

  let statusCode = err.statusCode || (res.statusCode === 200 ? 500 : res.statusCode);
  let message = err.message || 'Server Error';

  // 1. Mongoose bad ObjectId (CastError) -> 404 Not Found (prevents leaking schema/model paths)
  if (err.name === 'CastError') {
    statusCode = 404;
    message = 'Requested resource not found.';
  }

  // 2. MongoDB duplicate key (E11000) -> 409 Conflict (prevents leaking db/collection/index names)
  if (err.code === 11000) {
    statusCode = 409;
    const dupField = err.keyValue ? Object.keys(err.keyValue)[0] : 'record';
    message = `A record with this ${dupField} already exists.`;
  }

  // 3. Mongoose validation error -> 400 Bad Request
  if (err.name === 'ValidationError' && err.errors) {
    statusCode = 400;
    message = Object.values(err.errors)
      .map((val) => val.message)
      .join(', ');
  }

  // 4. Malformed JSON payload -> 400 Bad Request
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    statusCode = 400;
    message = 'Invalid JSON request payload.';
  }

  res.status(statusCode).json({
    success: false,
    error: message,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
  });
};

module.exports = errorHandler;
