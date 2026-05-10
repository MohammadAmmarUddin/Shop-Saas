import { useState, useEffect, useCallback } from 'react';
import { FiPlus, FiEdit2, FiTrash2, FiUser, FiPhone, FiMail, FiMapPin } from 'react-icons/fi';
import { toast, confirmAction } from '../utils/swal';
import { supplierService } from '../services/supplierService';
import DataTable from '../components/common/DataTable.jsx';
import PageHeader from '../components/common/PageHeader.jsx';
import Button from '../components/common/Button.jsx';
import Modal from '../components/common/Modal.jsx';
import Input from '../components/common/Input.jsx';
import usePagination from '../hooks/usePagination';

const initialForm = { name: '', company: '', phone: '', email: '', address: '', notes: '' };

const SuppliersPage = () => {
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState('');
  const [form, setForm] = useState({ ...initialForm });
  const [formErrors, setFormErrors] = useState({});
  const pagination = usePagination();

  const normalizeSupplier = (supplier) => ({
    ...supplier,
    totalPurchases: supplier.totalPurchases ?? supplier.total_purchases,
    totalPaid: supplier.totalPaid ?? supplier.total_paid,
    isActive: supplier.isActive ?? supplier.is_active,
    name: supplier.name ?? '',
    company: supplier.company ?? '',
    phone: supplier.phone ?? '',
    email: supplier.email ?? '',
    address: supplier.address ?? '',
    notes: supplier.notes ?? '',
  });

  const fetchSuppliers = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page: pagination.page, limit: pagination.limit, ...(search && { search }) };
      const res = await supplierService.getAll(params);
      const payload = res.data?.data || res.data || {};
      const raw = Array.isArray(payload) ? payload : Array.isArray(payload.suppliers) ? payload.suppliers : Array.isArray(payload.rows) ? payload.rows : [];
      setSuppliers(raw.map(normalizeSupplier));
      pagination.updatePagination(res.data);
    } catch { toast.error('Failed to load suppliers'); }
    finally { setLoading(false); }
  }, [pagination.page, pagination.limit, search]);

  useEffect(() => { fetchSuppliers(); }, [fetchSuppliers]);

  const resetForm = () => {
    setEditItem(null);
    setForm({ ...initialForm });
    setFormErrors({});
  };

  const openCreate = () => {
    resetForm();
    setShowModal(true);
  };

  const openEdit = (s) => {
    setEditItem(s);
    setForm({
      name: s.name ?? '',
      company: s.company ?? '',
      phone: s.phone ?? '',
      email: s.email ?? '',
      address: s.address ?? '',
      notes: s.notes ?? '',
    });
    setFormErrors({});
    setShowModal(true);
  };

  const validate = () => {
    const errs = {};
    if (!form.name?.trim()) errs.name = 'Name is required';
    if (form.email && !/\S+@\S+\.\S+/.test(form.email)) errs.email = 'Invalid email';
    setFormErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSave = async () => {
    if (saving) return;
    if (!validate()) return;
    setSaving(true);
    try {
      if (editItem) {
        await supplierService.update(editItem.id, form);
        toast.success('Supplier updated');
      } else {
        await supplierService.create(form);
        toast.success('Supplier created');
      }
      setShowModal(false);
      resetForm();
      await fetchSuppliers();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save supplier');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    const confirmed = await confirmAction({
      title: 'Delete Supplier',
      text: 'Are you sure you want to delete this supplier?',
      confirmText: 'Yes, delete it!',
    });
    if (!confirmed) return;
    try {
      await supplierService.delete(id);
      toast.success('Supplier deleted');
      await fetchSuppliers();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete supplier');
    }
  };

  const columns = [
    {
      key: 'name', label: 'Supplier',
      render: (val, row) => (
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-warning-100 dark:bg-warning-900/30 rounded-full flex items-center justify-center"><FiUser className="text-warning-600 dark:text-warning-400" /></div>
          <div><p className="font-medium text-secondary-900 dark:text-white">{val}</p>{row.company && <p className="text-xs text-secondary-500">{row.company}</p>}</div>
        </div>
      ),
    },
    { key: 'phone', label: 'Phone', render: (val) => <span className="flex items-center gap-1 text-sm"><FiPhone size={14} className="text-secondary-400" />{val || '-'}</span> },
    { key: 'email', label: 'Email', render: (val) => <span className="flex items-center gap-1 text-sm"><FiMail size={14} className="text-secondary-400" />{val || '-'}</span> },
    { key: 'address', label: 'Address', render: (val) => <span className="flex items-center gap-1 text-sm"><FiMapPin size={14} className="text-secondary-400" />{val || '-'}</span> },
    {
      key: 'actions', label: 'Actions',
      render: (_, row) => (
        <div className="flex items-center gap-2">
          <button onClick={(e) => { e.stopPropagation(); openEdit(row); }} className="p-1.5 rounded-lg hover:bg-secondary-100 dark:hover:bg-secondary-700 text-secondary-500 hover:text-primary-600"><FiEdit2 size={16} /></button>
          <button onClick={(e) => { e.stopPropagation(); handleDelete(row.id); }} className="p-1.5 rounded-lg hover:bg-secondary-100 dark:hover:bg-secondary-700 text-secondary-500 hover:text-danger-600"><FiTrash2 size={16} /></button>
        </div>
      ),
    },
  ];

  return (
    <div className="page-container">
      <PageHeader title="Suppliers" subtitle="Manage your suppliers and vendors" breadcrumbs={[{ label: 'People' }, { label: 'Suppliers' }]} actions={<Button variant="primary" icon={FiPlus} onClick={openCreate}>Add Supplier</Button>} />
      <div className="flex flex-wrap gap-4 mb-4">
        <input type="text" placeholder="Search by name, company, or phone..." value={search} onChange={(e) => { setSearch(e.target.value); pagination.setPage(1); }} className="flex-1 min-w-[200px] px-4 py-2 border border-secondary-300 rounded-lg bg-white dark:bg-secondary-800 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" />
      </div>
      <DataTable columns={columns} data={suppliers} loading={loading} exportable exportFilename="suppliers" page={pagination.page} totalPages={pagination.totalPages} totalItems={pagination.totalItems} limit={pagination.limit} onPageChange={pagination.goToPage} onLimitChange={pagination.changeLimit} emptyTitle="No suppliers found" emptyMessage="Add your first supplier." emptyAction emptyActionLabel="Add Supplier" onEmptyAction={openCreate} />
      <Modal isOpen={showModal} onClose={() => { setShowModal(false); resetForm(); }} title={editItem ? 'Edit Supplier' : 'New Supplier'} size="lg">
        <div className="space-y-4">
          <Input label="Contact Name *" name="name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required error={formErrors.name} placeholder="Supplier contact name" icon={FiUser} />
          <Input label="Company Name" name="company" value={form.company} onChange={(e) => setForm({ ...form, company: e.target.value })} placeholder="Company name" />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input label="Phone" name="phone" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="+1 234 567 8900" icon={FiPhone} />
            <Input label="Email" name="email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} error={formErrors.email} placeholder="supplier@example.com" icon={FiMail} />
          </div>
          <Input label="Address" name="address" type="textarea" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} placeholder="Full address..." rows={2} />
          <Input label="Notes" name="notes" type="textarea" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} placeholder="Additional notes..." rows={2} />
        </div>
        <div className="flex justify-end gap-3 mt-6">
          <Button variant="secondary" onClick={() => { setShowModal(false); resetForm(); }}>Cancel</Button>
          <Button variant="primary" onClick={handleSave} loading={saving}>{editItem ? 'Update' : 'Create'}</Button>
        </div>
      </Modal>
    </div>
  );
};

export default SuppliersPage;