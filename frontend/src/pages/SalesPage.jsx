import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiEye, FiTrash2, FiPrinter } from 'react-icons/fi';
import { toast } from '../utils/swal';
import { saleService } from '../services/saleService';
import { formatCurrency, formatDate, formatDateTime } from '../utils/helpers';
import DataTable from '../components/common/DataTable.jsx';
import PageHeader from '../components/common/PageHeader.jsx';
import Button from '../components/common/Button.jsx';
import ConfirmDialog from '../components/common/ConfirmDialog.jsx';
import StatusBadge from '../components/common/StatusBadge.jsx';
import Modal from '../components/common/Modal.jsx';
import usePagination from '../hooks/usePagination';

const SalesPage = () => {
  const navigate = useNavigate();
  const [sales, setSales] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deleteId, setDeleteId] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [paymentFilter, setPaymentFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [viewSale, setViewSale] = useState(null);
  const pagination = usePagination();

  const normalizeSale = (sale) => ({
    ...sale,
    invoiceNumber: sale.invoiceNumber ?? sale.invoice_number,
    createdAt: sale.createdAt ?? sale.created_at,
    total: sale.total ?? sale.total_amount,
    paymentStatus: sale.paymentStatus ?? sale.payment_status,
    paymentMethod: sale.paymentMethod ?? sale.payment_method,
    discountAmount: sale.discountAmount ?? sale.discount_amount,
    taxAmount: sale.taxAmount ?? sale.tax_amount,
    items: Array.isArray(sale.items)
      ? sale.items.map((item) => ({
        ...item,
        price: item.price ?? item.unit_price,
        product: item.product,
      }))
      : [],
  });

  const fetchSales = useCallback(async () => {
    setLoading(true);
    try {
      const params = {
        page: pagination.page,
        limit: pagination.limit,
        ...(search && { search }),
        ...(dateFrom && { start_date: dateFrom }),
        ...(dateTo && { end_date: dateTo }),
        ...(statusFilter !== 'all' && { status: statusFilter }),
        ...(paymentFilter !== 'all' && { payment_status: paymentFilter }),
      };
      const res = await saleService.getAll(params);
      const payload = res.data?.data || res.data || {};
      const raw = Array.isArray(payload.sales) ? payload.sales : Array.isArray(payload) ? payload : [];
      const data = raw.map(normalizeSale);
      setSales(data);
      pagination.updatePagination(res.data);
    } catch {
      toast.error('Failed to load sales');
    } finally {
      setLoading(false);
    }
  }, [pagination.page, pagination.limit, search, dateFrom, dateTo, statusFilter, paymentFilter]);

  useEffect(() => { fetchSales(); }, [fetchSales]);

  const handleDelete = async () => {
    if (!deleteId) return;
    setDeleting(true);
    try {
      await saleService.delete(deleteId);
      toast.success('Sale deleted');
      setDeleteId(null);
      fetchSales();
    } catch {
      toast.error('Failed to delete sale');
    } finally {
      setDeleting(false);
    }
  };

  const columns = [
    {
      key: 'invoiceNumber',
      label: 'Invoice #',
      render: (val) => <span className="font-mono font-medium text-primary-600">#{val || 'N/A'}</span>,
    },
    {
      key: 'createdAt',
      label: 'Date',
      render: (val) => <span className="text-sm">{formatDateTime(val)}</span>,
    },
    {
      key: 'customer',
      label: 'Customer',
      render: (val) => <span>{val?.name || 'Walk-in'}</span>,
    },
    {
      key: 'items',
      label: 'Items',
      render: (val) => <span>{val?.length || 0}</span>,
    },
    {
      key: 'total',
      label: 'Total',
      render: (val) => <span className="font-semibold">{formatCurrency(val || 0)}</span>,
    },
    {
      key: 'paymentStatus',
      label: 'Payment',
      render: (val) => <StatusBadge status={val || 'unpaid'} />,
    },
    {
      key: 'status',
      label: 'Status',
      render: (val) => <StatusBadge status={val || 'completed'} />,
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (_, row) => (
        <div className="flex items-center gap-2">
          <button onClick={(e) => { e.stopPropagation(); setViewSale(row); }} className="p-1.5 rounded-lg hover:bg-secondary-100 dark:hover:bg-secondary-700 text-secondary-500 hover:text-primary-600">
            <FiEye size={16} />
          </button>
          <button onClick={(e) => { e.stopPropagation(); setDeleteId(row._id || row.id); }} className="p-1.5 rounded-lg hover:bg-secondary-100 dark:hover:bg-secondary-700 text-secondary-500 hover:text-danger-600">
            <FiTrash2 size={16} />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="page-container">
      <PageHeader
        title="Sales"
        subtitle="View and manage all sales transactions"
        breadcrumbs={[{ label: 'Transactions' }, { label: 'Sales' }]}
      />

      <div className="flex flex-wrap gap-4 mb-4">
        <input type="text" placeholder="Search invoice #..." value={search} onChange={(e) => { setSearch(e.target.value); pagination.setPage(1); }} className="flex-1 min-w-[200px] px-4 py-2 border border-secondary-300 dark:border-secondary-600 rounded-lg bg-white dark:bg-secondary-800 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" />
        <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className="px-4 py-2 border border-secondary-300 dark:border-secondary-600 rounded-lg bg-white dark:bg-secondary-800 text-sm" />
        <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className="px-4 py-2 border border-secondary-300 dark:border-secondary-600 rounded-lg bg-white dark:bg-secondary-800 text-sm" />
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="px-4 py-2 border border-secondary-300 dark:border-secondary-600 rounded-lg bg-white dark:bg-secondary-800 text-sm">
          <option value="all">All Status</option>
          <option value="completed">Completed</option>
          <option value="pending">Pending</option>
          <option value="cancelled">Cancelled</option>
          <option value="refunded">Refunded</option>
        </select>
        <select value={paymentFilter} onChange={(e) => setPaymentFilter(e.target.value)} className="px-4 py-2 border border-secondary-300 dark:border-secondary-600 rounded-lg bg-white dark:bg-secondary-800 text-sm">
          <option value="all">All Payments</option>
          <option value="paid">Paid</option>
          <option value="partial">Partial</option>
          <option value="unpaid">Unpaid</option>
        </select>
      </div>

      <DataTable
        columns={columns}
        data={sales}
        loading={loading}
        exportable
        exportFilename="sales"
        onRowClick={(row) => navigate(`/app/sales/${row._id || row.id}`)}
        page={pagination.page}
        totalPages={pagination.totalPages}
        totalItems={pagination.totalItems}
        limit={pagination.limit}
        onPageChange={pagination.goToPage}
        onLimitChange={pagination.changeLimit}
        emptyTitle="No sales found"
        emptyMessage="Sales will appear here once you start selling."
      />

      <Modal isOpen={!!viewSale} onClose={() => setViewSale(null)} title={`Invoice #${viewSale?.invoiceNumber || ''}`} size="lg">
        {viewSale && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div><span className="text-secondary-500">Date:</span> <span className="font-medium">{formatDateTime(viewSale.createdAt)}</span></div>
              <div><span className="text-secondary-500">Customer:</span> <span className="font-medium">{viewSale.customer?.name || 'Walk-in'}</span></div>
              <div><span className="text-secondary-500">Payment:</span> <StatusBadge status={viewSale.paymentStatus} /></div>
              <div><span className="text-secondary-500">Status:</span> <StatusBadge status={viewSale.status} /></div>
            </div>
            <table className="w-full text-sm">
              <thead><tr className="border-b"><th className="text-left py-2">Item</th><th className="text-center py-2">Qty</th><th className="text-right py-2">Price</th><th className="text-right py-2">Total</th></tr></thead>
              <tbody className="divide-y">
                {(viewSale.items || []).map((item, i) => (
                  <tr key={i}>
                    <td className="py-2">{item.product?.name || item.name}</td>
                    <td className="text-center py-2">{item.quantity}</td>
                    <td className="text-right py-2">{formatCurrency(item.price)}</td>
                    <td className="text-right py-2 font-medium">{formatCurrency(item.price * item.quantity)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="border-t pt-3 space-y-1 text-sm">
              <div className="flex justify-between"><span>Subtotal</span><span>{formatCurrency(viewSale.subtotal)}</span></div>
              {viewSale.discount_amount > 0 && <div className="flex justify-between text-success-600"><span>Discount</span><span>-{formatCurrency(viewSale.discount_amount)}</span></div>}
              <div className="flex justify-between font-bold text-base"><span>Total</span><span>{formatCurrency(viewSale.total || viewSale.total_amount)}</span></div>
            </div>
          </div>
        )}
      </Modal>

      <ConfirmDialog isOpen={!!deleteId} onClose={() => setDeleteId(null)} onConfirm={handleDelete} loading={deleting} title="Delete Sale" message="Are you sure you want to delete this sale?" confirmLabel="Delete" variant="danger" />
    </div>
  );
};

export default SalesPage;
