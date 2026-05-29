const success = (res, data = null, message = 'Success', statusCode = 200) => {
  const response = { success: true, message, data };
  if (res.locals?.breadcrumbs?.length) response.breadcrumbs = res.locals.breadcrumbs;
  return res.status(statusCode).json(response);
};

const created = (res, data = null, message = 'Created successfully') => {
  const response = { success: true, message, data };
  if (res.locals?.breadcrumbs?.length) response.breadcrumbs = res.locals.breadcrumbs;
  return res.status(201).json(response);
};

const paginated = (res, data, pagination, message = 'Success') => {
  const response = { success: true, message, data, pagination };
  if (res.locals?.breadcrumbs?.length) response.breadcrumbs = res.locals.breadcrumbs;
  return res.status(200).json(response);
};

const error = (res, message = 'Internal server error', statusCode = 500, errors = null) => {
  const response = { success: false, message };
  if (errors) response.errors = errors;
  return res.status(statusCode).json(response);
};

const notFound = (res, message = 'Resource not found') => {
  return res.status(404).json({ success: false, message });
};

const forbidden = (res, message = 'Access denied') => {
  return res.status(403).json({ success: false, message });
};

const unauthorized = (res, message = 'Unauthorized') => {
  return res.status(401).json({ success: false, message });
};

const validationError = (res, errors, message = 'Validation failed') => {
  return res.status(422).json({ success: false, message, errors });
};

module.exports = {
  success, created, paginated, error, notFound, forbidden, unauthorized, validationError,
};
