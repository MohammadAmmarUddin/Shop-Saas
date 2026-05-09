const tenantContext = (req, res, next) => {
  if (req.user && req.user.store_id) {
    req.tenantId = req.user.store_id;
  }
  next();
};

module.exports = { tenantContext };
