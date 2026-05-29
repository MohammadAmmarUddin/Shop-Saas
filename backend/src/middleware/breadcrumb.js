const { getBreadcrumbs } = require('../services/breadcrumbService');

const breadcrumb = async (req, res, next) => {
  try {
    const crumbs = await getBreadcrumbs(req);
    res.locals.breadcrumbs = crumbs;
  } catch {
    res.locals.breadcrumbs = [];
  }
  next();
};

module.exports = breadcrumb;
