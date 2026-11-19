function requireAdminKey(req, res, next) {
  const configured = process.env.ADMIN_API_KEY;
  if (!configured) return res.status(503).json({ message: 'Admin API is disabled until ADMIN_API_KEY is configured.' });
  if (req.get('x-admin-key') !== configured) return res.status(401).json({ message: 'Invalid or missing admin key.' });
  next();
}
module.exports = requireAdminKey;
