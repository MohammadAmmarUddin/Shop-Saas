import { useState, useEffect, useCallback } from 'react';
import { FiPlus, FiEdit2, FiTrash2, FiUser, FiPhone, FiMail } from 'react-icons/fi';
import { toast } from '../utils/swal';
import { customerService } from '../services/customerService';
import { formatCurrency, formatDate } from '../utils/helpers';
import DataTable from '../components/common/DataTable.jsx';
import PageHeader from '../components/common/PageHeader.jsx';
import Button from '../components/common/Button.jsx';
import Modal from '../components/common/Modal.jsx';
import Input from '../components/common/Input.jsx';
import ConfirmDialog from '../components/common/ConfirmDialog.jsx';
import usePagination from '../hooks/usePagination';

const CustomersPage = () => {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [deleteId, setDeleteId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [search, setSearch] = useState('');
  const [balanceFilter, setBalanceFilter] = useState('all');
  const [form, setForm] = useState({ name: '', phone: '', email: '', address: '', notes: '' });
  const [formErrors, setFormErrors] = useState({});
  const pagination = usePagination();

  const normalizeCustomer = (customer) => ({
    ...customer,
    totalPurchases: customer.totalPurchases ?? customer.total_purchases,
    totalPaid: customer.totalPaid ?? customer.total_paid,
    isActive: customer.isActive ?? customer.is_active,
  });

  const fetchCustomers = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page: pagination.page, limit: pagination.limit, ...(search && { search }), ...(balanceFilter !== 'all' && { balanceStatus: balanceFilter }) };
      const res = await customerService.getAll(params);
      const payload = res.data?.data || res.data || {};
      const raw = Array.isArray(payload.customers) ? payload.customers : Array.isArray(payload) ? payload : [];
      setCustomers(raw.map(normalizeCustomer));
      pagination.updatePagination(res.data);
    } catch { toast.error('Failed to load customers'); }
    finally { setLoading(false); }
  }, [pagination.page, pagination.limit, search, balanceFilter]);

  useEffect(() => { fetchCustomers(); }, [fetchCustomers]);

  const openCreate = () => { setEditItem(null); setForm({ name: '', phone: '', email: '', address: '', notes: '' }); setFormErrors({}); setShowModal(true); };
  const openEdit = (c) => { setEditItem(c); setForm({ name: c.name || '', phone: c.phone || '', email: c.email || '', address: c.address || '', notes: c.notes || '' }); setFormErrors({}); setShowModal(true); };

  const validate = () => {
    const errs = {};
    if (!form.name.trim()) errs.name = 'Name is required';
    if (form.email && !/\S+@\S+\.\S+/.test(form.email)) errs.email = 'Invalid email';
    setFormErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSave = async () => {
    if (!validate()) return;
    setSaving(true);
    try {
      if (editItem) { await customerService.update(editItem._id || editItem.id, form); toast.success('Customer updated'); }
      else { await customerService.create(form); toast.success('Customer created'); }
      setShowModal(false);
      fetchCustomers();
    } catch (err) { toast.error(err.response?.data?.message || 'Failed to save customer'); }
    finally { setSaving(false); }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    setDeleting(true);
    try { await customerService.delete(deleteId); toast.success('Customer deleted'); setDeleteId(null); fetchCustomers(); }
    catch { toast.error('Failed to delete customer'); }
    finally { setDeleting(false); }
  };

  const columns = [
    {
      key: 'name', label: 'Customer',
      render: (val, row) => (
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-primary-100 dark:bg-primary-900/30 rounded-full flex items-center justify-center"><FiUser className="text-primary-600 dark:text-primary-400" /></div>
          <div><p className="font-medium text-secondary-900 dark:text-white">{val}</p>{row.email && <p className="text-xs text-secondary-500">{row.email}</p>}</div>
        </div>
      ),
    },
    { key: 'phone', label: 'Phone', render: (val) => <span className="flex items-center gap-1 text-sm"><FiPhone size={14} className="text-secondary-400" />{val || '-'}</span> },
    { key: 'email', label: 'Email', render: (val) => <span className="flex items-center gap-1 text-sm"><FiMail size={14} className="text-secondary-400" />{val || '-'}</span> },
    { key: 'totalPurchases', label: 'Total Purchases', render: (val) => <span className="font-medium">{formatCurrency(val || 0)}</span> },
    { key: 'balance', label: 'Balance', render: (val) => <span className={`font-medium ${(val || 0) > 0 ? 'text-danger-600' : 'text-success-600'}`}>{formatCurrency(val || 0)}</span> },
    {
      key: 'actions', label: 'Actions',
      render: (_, row) => (
        <div className="flex items-center gap-2">
          <button onClick={(e) => { e.stopPropagation(); openEdit(row); }} className="p-1.5 rounded-lg hover:bg-secondary-100 dark:hover:bg-secondary-700 text-secondary-500 hover:text-primary-600"><FiEdit2 size={16} /></button>
          <button onClick={(e) => { e.stopPropagation(); setDeleteId(row._id || row.id); }} className="p-1.5 rounded-lg hover:bg-secondary-100 dark:hover:bg-secondary-700 text-secondary-500 hover:text-danger-600"><FiTrash2 size={16} /></button>
        </div>
      ),
    },
  ];

  return (
    <div className="page-container">
      <PageHeader title="Customers" subtitle="Manage your customer database" breadcrumbs={[{ label: 'People' }, { label: 'Customers' }]} actions={<Button variant="primary" icon={FiPlus} onClick={openCreate}>Add Customer</Button>} />
      <div className="flex flex-wrap gap-4 mb-4">
        <input type="text" placeholder="Search by name, phone, or email..." value={search} onChange={(e) => { setSearch(e.target.value); pagination.setPage(1); }} className="flex-1 min-w-[200px] px-4 py-2 border border-secondary-300 rounded-lg bg-white dark:bg-secondary-800 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" />
        <select value={balanceFilter} onChange={(e) => { setBalanceFilter(e.target.value); pagination.setPage(1); }} className="px-4 py-2 border border-secondary-300 rounded-lg bg-white dark:bg-secondary-800 text-sm">
          <option value="all">All Balances</option>
          <option value="with_dues">With Dues</option>
          <option value="paid">Paid</option>
        </select>
      </div>
      <DataTable columns={columns} data={customers} loading={loading} exportable exportFilename="customers" page={pagination.page} totalPages={pagination.totalPages} totalItems={pagination.totalItems} limit={pagination.limit} onPageChange={pagination.goToPage} onLimitChange={pagination.changeLimit} emptyTitle="No customers found" emptyMessage="Add your first customer to get started." emptyAction emptyActionLabel="Add Customer" onEmptyAction={openCreate} />
      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title={editItem ? 'Edit Customer' : 'New Customer'} size="lg">
        <div className="space-y-4">
          <Input label="Full Name *" name="name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required error={formErrors.name} placeholder="Customer name" icon={FiUser} />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input label="Phone" name="phone" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="+1 234 567 8900" icon={FiPhone} />
            <Input label="Email" name="email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} error={formErrors.email} placeholder="customer@example.com" icon={FiMail} />
          </div>
          <Input label="Address" name="address" type="textarea" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} placeholder="Full address..." rows={2} />
          <Input label="Notes" name="notes" type="textarea" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} placeholder="Additional notes..." rows={2} />
        </div>
        <div className="flex justify-end gap-3 mt-6">
          <Button variant="secondary" onClick={() => setShowModal(false)}>Cancel</Button>
          <Button variant="primary" onClick={handleSave} loading={saving}>{editItem ? 'Update' : 'Create'}</Button>
        </div>
      </Modal>
      <ConfirmDialog isOpen={!!deleteId} onClose={() => setDeleteId(null)} onConfirm={handleDelete} loading={deleting} title="Delete Customer" message="Are you sure you want to delete this customer?" confirmLabel="Delete" variant="danger" />
    </div>
  );
};

export default CustomersPage;
