import { useState, useEffect, useCallback } from 'react';
import { FiPlus, FiEdit2, FiTrash2, FiEye, FiToggleLeft, FiToggleRight } from 'react-icons/fi';
import { toast } from '../utils/swal';
import { tenantService } from '../services/tenantService';
import { formatDate, formatCurrency } from '../utils/helpers';
import DataTable from '../components/common/DataTable.jsx';
import PageHeader from '../components/common/PageHeader.jsx';
import Button from '../components/common/Button.jsx';
import Modal from '../components/common/Modal.jsx';
import Input from '../components/common/Input.jsx';
import ConfirmDialog from '../components/common/ConfirmDialog.jsx';
import StatusBadge from '../components/common/StatusBadge.jsx';
import Card from '../components/common/Card.jsx';
import usePagination from '../hooks/usePagination';

const TenantsPage = () => {
  const [tenants, setTenants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [viewItem, setViewItem] = useState(null);
  const [deleteId, setDeleteId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [search, setSearch] = useState('');
  const [planFilter, setPlanFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [form, setForm] = useState({ name: '', email: '', phone: '', address: '', plan: 'free', status: 'trial' });
  const [formErrors, setFormErrors] = useState({});
  const pagination = usePagination();

  const fetchTenants = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page: pagination.page, limit: pagination.limit, ...(search && { search }), ...(planFilter !== 'all' && { plan: planFilter }), ...(statusFilter !== 'all' && { status: statusFilter }) };
      const res = await tenantService.getAll(params);
      setTenants(res.data?.data || res.data?.tenants || []);
      pagination.updatePagination(res.data);
    } catch { toast.error('Failed to load tenants'); }
    finally { setLoading(false); }
  }, [pagination.page, pagination.limit, search, planFilter, statusFilter]);

  useEffect(() => { fetchTenants(); }, [fetchTenants]);

  const openCreate = () => { setEditItem(null); setForm({ name: '', email: '', phone: '', address: '', plan: 'free', status: 'trial' }); setFormErrors({}); setShowModal(true); };
  const openEdit = (t) => { setEditItem(t); setForm({ name: t.name || '', email: t.email || '', phone: t.phone || '', address: t.address || '', plan: t.plan || 'free', status: t.status || 'active' }); setFormErrors({}); setShowModal(true); };

  const validate = () => {
    const errs = {};
    if (!form.name.trim()) errs.name = 'Store name is required';
    if (!form.email.trim()) errs.email = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(form.email)) errs.email = 'Invalid email';
    setFormErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSave = async () => {
    if (!validate()) return;
    setSaving(true);
    try {
      if (editItem) { await tenantService.update(editItem._id || editItem.id, form); toast.success('Tenant updated'); }
      else { await tenantService.create(form); toast.success('Tenant created'); }
      setShowModal(false); fetchTenants();
    } catch (err) { toast.error(err.response?.data?.message || 'Failed to save tenant'); }
    finally { setSaving(false); }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    setDeleting(true);
    try { await tenantService.delete(deleteId); toast.success('Tenant deleted'); setDeleteId(null); fetchTenants(); }
    catch { toast.error('Failed to delete tenant'); }
    finally { setDeleting(false); }
  };

  const toggleStatus = async (id, currentStatus) => {
    const newStatus = currentStatus === 'active' ? 'suspended' : 'active';
    try { await tenantService.updateStatus(id, newStatus); toast.success(`Store ${newStatus}`); fetchTenants(); }
    catch { toast.error('Failed to update status'); }
  };

  const columns = [
    { key: 'name', label: 'Store', render: (val) => <span className="font-medium text-secondary-900 dark:text-white">{val}</span> },
    { key: 'email', label: 'Email', render: (val) => <span className="text-sm">{val}</span> },
    { key: 'plan', label: 'Plan', render: (val) => <StatusBadge status={val || 'free'} /> },
    { key: 'status', label: 'Status', render: (val) => <StatusBadge status={val || 'active'} /> },
    { key: 'createdAt', label: 'Created', render: (val) => <span className="text-sm">{formatDate(val)}</span> },
    { key: 'trialEndsAt', label: 'Trial Ends', render: (val) => <span className="text-sm">{val ? formatDate(val) : '-'}</span> },
    {
      key: 'actions', label: 'Actions',
      render: (_, row) => (
        <div className="flex items-center gap-2">
          <button onClick={(e) => { e.stopPropagation(); setViewItem(row); }} className="p-1.5 rounded-lg hover:bg-secondary-100 dark:hover:bg-secondary-700 text-secondary-500 hover:text-primary-600"><FiEye size={16} /></button>
          <button onClick={(e) => { e.stopPropagation(); openEdit(row); }} className="p-1.5 rounded-lg hover:bg-secondary-100 dark:hover:bg-secondary-700 text-secondary-500 hover:text-primary-600"><FiEdit2 size={16} /></button>
          <button onClick={(e) => { e.stopPropagation(); toggleStatus(row._id || row.id, row.status); }} className="p-1.5 rounded-lg hover:bg-secondary-100 dark:hover:bg-secondary-700 text-secondary-500 hover:text-warning-600">{row.status === 'active' ? <FiToggleRight size={16} /> : <FiToggleLeft size={16} />}</button>
          <button onClick={(e) => { e.stopPropagation(); setDeleteId(row._id || row.id); }} className="p-1.5 rounded-lg hover:bg-secondary-100 dark:hover:bg-secondary-700 text-secondary-500 hover:text-danger-600"><FiTrash2 size={16} /></button>
        </div>
      ),
    },
  ];

  return (
    <div className="p-4 md:p-6 lg:p-8 space-y-6">
      <PageHeader title="Tenants" subtitle="Manage all stores on the platform" breadcrumbs={[{ label: 'Admin' }, { label: 'Tenants' }]} actions={<Button variant="primary" icon={FiPlus} onClick={openCreate}>Add Store</Button>} />
      <div className="flex flex-wrap gap-4 mb-4">
        <input type="text" placeholder="Search by store name or email..." value={search} onChange={(e) => { setSearch(e.target.value); pagination.setPage(1); }} className="flex-1 min-w-[200px] px-4 py-2 border border-secondary-300 rounded-lg bg-white dark:bg-secondary-800 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" />
        <select value={planFilter} onChange={(e) => { setPlanFilter(e.target.value); pagination.setPage(1); }} className="px-4 py-2 border border-secondary-300 rounded-lg bg-white dark:bg-secondary-800 text-sm">
          <option value="all">All Plans</option>
          <option value="free">Free</option>
          <option value="basic">Basic</option>
          <option value="professional">Professional</option>
          <option value="enterprise">Enterprise</option>
        </select>
        <select value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); pagination.setPage(1); }} className="px-4 py-2 border border-secondary-300 rounded-lg bg-white dark:bg-secondary-800 text-sm">
          <option value="all">All Status</option>
          <option value="active">Active</option>
          <option value="trial">Trial</option>
          <option value="suspended">Suspended</option>
          <option value="inactive">Inactive</option>
        </select>
      </div>
      <DataTable columns={columns} data={tenants} loading={loading} exportable exportFilename="tenants" page={pagination.page} totalPages={pagination.totalPages} totalItems={pagination.totalItems} limit={pagination.limit} onPageChange={pagination.goToPage} onLimitChange={pagination.changeLimit} emptyTitle="No stores found" emptyMessage="Onboard your first store to get started." emptyAction emptyActionLabel="Add Store" onEmptyAction={openCreate} />

      <Modal isOpen={!!viewItem} onClose={() => setViewItem(null)} title={viewItem?.name || 'Store Details'} size="lg">
        {viewItem && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div><span className="text-secondary-500">Email:</span><p className="font-medium">{viewItem.email}</p></div>
              <div><span className="text-secondary-500">Phone:</span><p className="font-medium">{viewItem.phone || '-'}</p></div>
              <div><span className="text-secondary-500">Plan:</span><StatusBadge status={viewItem.plan} /></div>
              <div><span className="text-secondary-500">Status:</span><StatusBadge status={viewItem.status} /></div>
              <div><span className="text-secondary-500">Created:</span><p className="font-medium">{formatDate(viewItem.createdAt)}</p></div>
              <div><span className="text-secondary-500">Trial Ends:</span><p className="font-medium">{viewItem.trialEndsAt ? formatDate(viewItem.trialEndsAt) : 'N/A'}</p></div>
            </div>
            {viewItem.address && <div><span className="text-sm text-secondary-500">Address:</span><p className="text-sm">{viewItem.address}</p></div>}
          </div>
        )}
      </Modal>

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title={editItem ? 'Edit Store' : 'Add Store'} size="md">
        <div className="space-y-4">
          <Input label="Store Name *" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required error={formErrors.name} placeholder="Store name" />
          <div className="grid grid-cols-2 gap-4">
            <Input label="Email *" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required error={formErrors.email} placeholder="store@example.com" />
            <Input label="Phone" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="+1 234 567 8900" />
          </div>
          <Input label="Address" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} placeholder="Store address" />
          <div className="grid grid-cols-2 gap-4">
            <Input label="Plan" type="select" value={form.plan} onChange={(e) => setForm({ ...form, plan: e.target.value })} options={[{ value: 'free', label: 'Free' }, { value: 'basic', label: 'Basic' }, { value: 'professional', label: 'Professional' }, { value: 'enterprise', label: 'Enterprise' }]} />
            <Input label="Status" type="select" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })} options={[{ value: 'active', label: 'Active' }, { value: 'trial', label: 'Trial' }, { value: 'suspended', label: 'Suspended' }, { value: 'inactive', label: 'Inactive' }]} />
          </div>
        </div>
        <div className="flex justify-end gap-3 mt-6">
          <Button variant="secondary" onClick={() => setShowModal(false)}>Cancel</Button>
          <Button variant="primary" onClick={handleSave} loading={saving}>{editItem ? 'Update' : 'Create'}</Button>
        </div>
      </Modal>

      <ConfirmDialog isOpen={!!deleteId} onClose={() => setDeleteId(null)} onConfirm={handleDelete} loading={deleting} title="Delete Store" message="Are you sure you want to delete this store? All data will be lost." confirmLabel="Delete" variant="danger" />
    </div>
  );
};

export default TenantsPage;
