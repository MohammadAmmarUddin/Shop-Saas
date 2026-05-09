import { format, formatDistanceToNow, parseISO } from 'date-fns';

export const formatCurrency = (amount, currency = 'USD') => {
  if (amount === null || amount === undefined) return '-';
  try {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  } catch {
    return `${currency} ${Number(amount).toFixed(2)}`;
  }
};

export const formatNumber = (number) => {
  if (number === null || number === undefined) return '-';
  try {
    return new Intl.NumberFormat('en-US').format(number);
  } catch {
    return String(number);
  }
};

export const formatDate = (date, dateFormat = 'MMM dd, yyyy') => {
  if (!date) return '-';
  try {
    const d = typeof date === 'string' ? parseISO(date) : date;
    return format(d, dateFormat);
  } catch {
    return '-';
  }
};

export const formatDateTime = (date) => {
  if (!date) return '-';
  try {
    const d = typeof date === 'string' ? parseISO(date) : date;
    return format(d, 'MMM dd, yyyy HH:mm');
  } catch {
    return '-';
  }
};

export const timeAgo = (date) => {
  if (!date) return '-';
  try {
    const d = typeof date === 'string' ? parseISO(date) : date;
    return formatDistanceToNow(d, { addSuffix: true });
  } catch {
    return '-';
  }
};

export const truncate = (str, length = 50) => {
  if (!str) return '';
  if (str.length <= length) return str;
  return str.substring(0, length) + '...';
};

export const generateSlug = (str) => {
  if (!str) return '';
  return str
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
};

export const calculateDiscount = (price, discount, type = 'percentage') => {
  const p = Number(price) || 0;
  const d = Number(discount) || 0;
  if (type === 'percentage') {
    return p - (p * d) / 100;
  }
  return p - d;
};

export const calculateTax = (amount, taxRate) => {
  const a = Number(amount) || 0;
  const t = Number(taxRate) || 0;
  return (a * t) / 100;
};

export const getStatusColor = (status) => {
  const map = {
    active: 'success',
    inactive: 'secondary',
    suspended: 'danger',
    completed: 'success',
    pending: 'warning',
    cancelled: 'danger',
    refunded: 'info',
    paid: 'success',
    unpaid: 'danger',
    partial: 'warning',
    on_hold: 'warning',
    trial: 'info',
    low_stock: 'warning',
    out_of_stock: 'danger',
    in_stock: 'success',
    published: 'success',
    draft: 'secondary',
    enabled: 'success',
    disabled: 'secondary',
  };
  return map[status?.toLowerCase()] || 'secondary';
};

export const getStatusLabel = (status) => {
  if (!status) return '-';
  return status
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());
};

export const exportToCSV = (data, filename = 'export') => {
  if (!data || !data.length) return;
  const headers = Object.keys(data[0]);
  const csvContent = [
    headers.join(','),
    ...data.map((row) =>
      headers.map((h) => {
        const val = row[h];
        if (val === null || val === undefined) return '';
        const str = String(val);
        if (str.includes(',') || str.includes('"') || str.includes('\n')) {
          return `"${str.replace(/"/g, '""')}"`;
        }
        return str;
      }).join(',')
    ),
  ].join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = `${filename}.csv`;
  link.click();
  URL.revokeObjectURL(link.href);
};

export const exportToExcel = (data, filename = 'export') => {
  const XLSX = require('xlsx');
  const ws = XLSX.utils.json_to_sheet(data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Sheet1');
  XLSX.writeFile(wb, `${filename}.xlsx`);
};

export const exportToPDF = async (elementId, filename = 'export') => {
  const html2canvas = require('html2canvas');
  const jsPDF = require('jspdf');
  const element = document.getElementById(elementId);
  if (!element) return;
  const canvas = await html2canvas(element);
  const imgData = canvas.toDataURL('image/png');
  const pdf = new jsPDF('p', 'mm', 'a4');
  const imgWidth = 210;
  const imgHeight = (canvas.height * imgWidth) / canvas.width;
  pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight);
  pdf.save(`${filename}.pdf`);
};

export const printElement = (elementId) => {
  const element = document.getElementById(elementId);
  if (!element) return;
  const printWindow = window.open('', '_blank');
  printWindow.document.write(`
    <html>
      <head>
        <title>Print</title>
        <style>
          body { font-family: 'Inter', sans-serif; padding: 20px; }
          @media print { body { -webkit-print-color-adjust: exact; } }
        </style>
      </head>
      <body>${element.innerHTML}</body>
    </html>
  `);
  printWindow.document.close();
  printWindow.focus();
  setTimeout(() => printWindow.print(), 500);
};

export const debounce = (fn, delay = 300) => {
  let timeoutId;
  return (...args) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => fn(...args), delay);
  };
};

export const classNames = (...classes) => {
  return classes.filter(Boolean).join(' ');
};

export const getInitials = (name) => {
  if (!name) return '?';
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
};

export const generateId = () => {
  return Math.random().toString(36).substring(2, 11);
};

export const downloadFile = (blob, filename) => {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

export const copyToClipboard = async (text) => {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    const textarea = document.createElement('textarea');
    textarea.value = text;
    document.body.appendChild(textarea);
    textarea.select();
    document.execCommand('copy');
    document.body.removeChild(textarea);
    return true;
  }
};
