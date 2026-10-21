// Protects API routes so only a logged-in admin can access them.
function protect(req, res, next) {
  if (req.session && req.session.isAdmin) {
    return next();
  }
  return res.status(401).json({ success: false, message: 'Unauthorized. Please login first.' });
}

module.exports = { protect };
