import { useState, useRef, useEffect } from 'react';
import { FiDownload, FiFileText, FiGrid as FiGridIcon, FiPrinter } from 'react-icons/fi';
import Button from './Button.jsx';
import { exportToCSV, exportToExcel, exportToPDF, printElement } from '../../utils/helpers';

const ExportButton = ({ data, filename = 'export', elementId, className = '' }) => {
  const [open, setOpen] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    const handleClick = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const handleExport = (type) => {
    setOpen(false);
    switch (type) {
      case 'csv':
        exportToCSV(data, filename);
        break;
      case 'excel':
        exportToExcel(data, filename);
        break;
      case 'pdf':
        if (elementId) exportToPDF(elementId, filename);
        break;
      case 'print':
        if (elementId) printElement(elementId);
        break;
      default:
        break;
    }
  };

  return (
    <div className={`relative ${className}`} ref={menuRef}>
      <Button onClick={() => setOpen(!open)} variant="secondary" size="sm" icon={FiDownload}>
        Export
      </Button>
      {open && (
        <div className="absolute right-0 mt-2 w-44 bg-white dark:bg-secondary-800 rounded-xl shadow-lg border border-secondary-200 dark:border-secondary-700 py-1 z-20 animate-fade-in">
          <button
            onClick={() => handleExport('csv')}
            className="flex items-center gap-3 px-4 py-2.5 text-sm text-secondary-700 dark:text-secondary-300 hover:bg-secondary-50 dark:hover:bg-secondary-700 w-full transition-colors"
          >
            <FiFileText size={16} />
            Export CSV
          </button>
          <button
            onClick={() => handleExport('excel')}
            className="flex items-center gap-3 px-4 py-2.5 text-sm text-secondary-700 dark:text-secondary-300 hover:bg-secondary-50 dark:hover:bg-secondary-700 w-full transition-colors"
          >
            <FiGridIcon size={16} />
            Export Excel
          </button>
          {elementId && (
            <>
              <button
                onClick={() => handleExport('pdf')}
                className="flex items-center gap-3 px-4 py-2.5 text-sm text-secondary-700 dark:text-secondary-300 hover:bg-secondary-50 dark:hover:bg-secondary-700 w-full transition-colors"
              >
                <FiDownload size={16} />
                Export PDF
              </button>
              <button
                onClick={() => handleExport('print')}
                className="flex items-center gap-3 px-4 py-2.5 text-sm text-secondary-700 dark:text-secondary-300 hover:bg-secondary-50 dark:hover:bg-secondary-700 w-full transition-colors"
              >
                <FiPrinter size={16} />
                Print
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default ExportButton;
