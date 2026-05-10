import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiEye, FiTrash2 } from 'react-icons/fi';
import { toast, confirmAction } from '../utils/swal';
import { purchaseService } from '../services/purchaseService';
import { formatCurrency, formatDateTime } from '../utils/helpers';
import DataTable from '../components/common/DataTable.jsx';
import PageHeader from '../components/common/PageHeader.jsx';
import StatusBadge from '../components/common/StatusBadge.jsx';
import usePagination from '../hooks/usePagination';

const PurchasesPage = () => {
  const navigate = useNavigate();
  const [purchases, setPurchases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [search, setSearch] = useState('');
  const pagination = usePagination();

  const normalizePurchase = (purchase) => ({
    ...purchase,
    reference: purchase.reference ?? purchase.purchase_number,
    createdAt: purchase.createdAt ?? purchase.created_at,
    total: purchase.total ?? purchase.total_amount,
    paymentStatus: purchase.paymentStatus ?? purchase.payment_status,
    paymentMethod: purchase.paymentMethod ?? purchase.payment_method,
    items: Array.isArray(purchase.items)
      ? purchase.items.map((item) => ({
        ...item,
        price: item.price ?? item.unit_price,
        cost: item.cost ?? item.unit_price,
        product: item.product,
      }))
      : [],
  });

  const fetchPurchases = useCallback(async () => {
    setLoading(true);
    try {
      const params = {
        page: pagination.page,
        limit: pagination.limit,
        ...(search && { search }),
        ...(dateFrom && { start_date: dateFrom }),
        ...(dateTo && { end_date: dateTo }),
      };
      const res = await purchaseService.getAll(params);
      const payload = res.data?.data || res.data || {};
      const raw = Array.isArray(payload.purchases) ? payload.purchases : Array.isArray(payload) ? payload : [];
      setPurchases(raw.map(normalizePurchase));
      pagination.updatePagination(res.data);
    } catch {
      toast.error('Failed to load purchases');
    } finally {
      setLoading(false);
    }
  }, [pagination.page, pagination.limit, search, dateFrom, dateTo]);

  useEffect(() => { fetchPurchases(); }, [fetchPurchases]);

  const handleDelete = async (id) => {
    const confirmed = await confirmAction({
      title: 'Delete Purchase',
      text: 'Are you sure you want to delete this purchase? This action cannot be undone.',
      confirmText: 'Yes, delete it!',
    });
    if (!confirmed) return;
    try {
      await purchaseService.delete(id);
      toast.success('Purchase deleted');
      await fetchPurchases();
    } catch {
      toast.error('Failed to delete purchase');
    }
  };

  const columns = [
    { key: 'reference', label: 'Reference', render: (val) => <span className="font-mono font-medium text-primary-600">{val || 'N/A'}</span> },
    { key: 'createdAt', label: 'Date', render: (val) => <span className="text-sm">{formatDateTime(val)}</span> },
    { key: 'supplier', label: 'Supplier', render: (val) => <span>{val?.name || 'N/A'}</span> },
    { key: 'items', label: 'Items', render: (val) => <span>{val?.length || 0}</span> },
    { key: 'total', label: 'Total', render: (val) => <span className="font-semibold">{formatCurrency(val || 0)}</span> },
    { key: 'status', label: 'Status', render: (val) => <StatusBadge status={val || 'pending'} /> },
    {
      key: 'actions', label: 'Actions',
      render: (_, row) => (
        <div className="flex items-center gap-2">
          <button onClick={(e) => { e.stopPropagation(); navigate(`/app/purchases/${row.id}`); }} className="p-1.5 rounded-lg hover:bg-secondary-100 dark:hover:bg-secondary-700 text-secondary-500 hover:text-primary-600"><FiEye size={16} /></button>
          <button onClick={(e) => { e.stopPropagation(); handleDelete(row.id); }} className="p-1.5 rounded-lg hover:bg-secondary-100 dark:hover:bg-secondary-700 text-secondary-500 hover:text-danger-600"><FiTrash2 size={16} /></button>
        </div>
      ),
    },
  ];

  return (
    <div className="page-container">
      <PageHeader title="Purchases" subtitle="Manage purchase orders and supplier transactions" breadcrumbs={[{ label: 'Transactions' }, { label: 'Purchases' }]} />
      <div className="flex flex-wrap gap-4 mb-4">
        <input type="text" placeholder="Search reference..." value={search} onChange={(e) => { setSearch(e.target.value); pagination.setPage(1); }} className="flex-1 min-w-[200px] px-4 py-2 border border-secondary-300 dark:border-secondary-600 rounded-lg bg-white dark:bg-secondary-800 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" />
        <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className="px-4 py-2 border border-secondary-300 dark:border-secondary-600 rounded-lg bg-white dark:bg-secondary-800 text-sm" />
        <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className="px-4 py-2 border border-secondary-300 dark:border-secondary-600 rounded-lg bg-white dark:bg-secondary-800 text-sm" />
      </div>
      <DataTable columns={columns} data={purchases} loading={loading} exportable exportFilename="purchases" onRowClick={(row) => navigate(`/app/purchases/${row.id}`)} page={pagination.page} totalPages={pagination.totalPages} totalItems={pagination.totalItems} limit={pagination.limit} onPageChange={pagination.goToPage} onLimitChange={pagination.changeLimit} emptyTitle="No purchases found" emptyMessage="Purchase orders will appear here." />
    </div>
  );
};

export default PurchasesPage;