import React from 'react';
import { FiChevronRight, FiHome } from 'react-icons/fi';
import { Link } from 'react-router-dom';

const PageHeader = ({ title, subtitle, breadcrumbs = [], actions }) => {
  return (
    <div className="mb-6">
      {breadcrumbs.length > 0 && (
        <nav className="flex items-center gap-1 text-sm text-secondary-500 dark:text-secondary-400 mb-2">
          <Link to="/app/dashboard" className="hover:text-primary-600 transition-colors">
            <FiHome size={14} />
          </Link>
          {breadcrumbs.map((crumb, i) => (
            <React.Fragment key={i}>
              <FiChevronRight size={12} />
              {crumb.to ? (
                <Link to={crumb.to} className="hover:text-primary-600 transition-colors">
                  {crumb.label}
                </Link>
              ) : (
                <span className="text-secondary-900 dark:text-white font-medium">{crumb.label}</span>
              )}
            </React.Fragment>
          ))}
        </nav>
      )}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-secondary-900 dark:text-white">{title}</h1>
          {subtitle && (
            <p className="mt-1 text-sm text-secondary-500 dark:text-secondary-400">{subtitle}</p>
          )}
        </div>
        {actions && (
          <div className="flex items-center gap-3">{actions}</div>
        )}
      </div>
    </div>
  );
};

export default PageHeader;
