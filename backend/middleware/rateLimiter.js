const rateLimits = new Map();

const rateLimiter = (maxRequests = 100, windowMs = 15 * 60 * 1000) => {
  return (req, res, next) => {
    const ip = req.ip || req.headers['x-forwarded-for'] || req.socket.remoteAddress;
    const now = Date.now();
    
    if (!rateLimits.has(ip)) {
      rateLimits.set(ip, {
        requests: 1,
        resetTime: now + windowMs
      });
      return next();
    }
    
    const limitData = rateLimits.get(ip);
    
    if (now > limitData.resetTime) {
      // Window expired, reset
      limitData.requests = 1;
      limitData.resetTime = now + windowMs;
      return next();
    }
    
    limitData.requests += 1;
    
    if (limitData.requests > maxRequests) {
      return res.status(429).json({
        error: 'Too many requests, please try again later.',
        retryAfterMs: limitData.resetTime - now
      });
    }
    
    next();
  };
};

module.exports = rateLimiter;
