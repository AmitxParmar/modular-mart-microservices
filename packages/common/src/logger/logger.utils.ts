/**
 * Standardized serializers for Pino.
 */
export const serializers = {
  /**
   * Request serializer.
   * Includes essential info while excluding noise and sensitive headers.
   */
  req: (req: any) => ({
    id: req.id,
    method: req.method,
    url: req.url,
    query: req.query,
    params: req.params,
    ip: req.remoteAddress || req.ip,
  }),

  /**
   * Response serializer.
   */
  res: (res: any) => ({
    statusCode: res.statusCode,
  }),

  /**
   * Error serializer.
   * Ensures errors are consistently formatted.
   */
  err: (err: any) => ({
    type: err.constructor.name,
    message: err.message,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
  }),
};
