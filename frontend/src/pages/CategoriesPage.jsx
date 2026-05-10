import { useState, useEffect, useCallback } from 'react';
import { FiPlus, FiEdit2, FiTrash2, FiFolder } from 'react-icons/fi';
import { toast, confirmAction } from '../utils/swal';
import { categoryService } from '../services/categoryService';
import DataTable from '../components/common/DataTable.jsx';
import PageHeader from '../components/common/PageHeader.jsx';
import Button from '../components/common/Button.jsx';
import Modal from '../components/common/Modal.jsx';
import Input from '../components/common/Input.jsx';
import StatusBadge from '../components/common/StatusBadge.jsx';
import usePagination from '../hooks/usePagination';

const initialForm = { name: '', description: '', sortOrder: 0, status: 'active' };

const CategoriesPage = () => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ ...initialForm });
  const [formErrors, setFormErrors] = useState({});
  const pagination = usePagination();

  const normalizeCategory = (category) => ({
    ...category,
    sortOrder: category.sortOrder ?? category.sort_order,
    status: category.status ?? (category.is_active ? 'active' : 'inactive'),
  });

  const fetchCategories = useCallback(async () => {
    setLoading(true);
    try {
      const res = await categoryService.getAll({ page: pagination.page, limit: pagination.limit });
      const payload = res.data?.data || res.data || {};
      const raw = Array.isArray(payload.categories) ? payload.categories : Array.isArray(payload) ? payload : [];
      const data = raw.map(normalizeCategory);
      setCategories(data);
      pagination.updatePagination(res.data);
    } catch {
      toast.error('Failed to load categories');
    } finally {
      setLoading(false);
    }
  }, [pagination.page, pagination.limit]);

  useEffect(() => { fetchCategories(); }, [fetchCategories]);

  const resetForm = () => {
    setEditItem(null);
    setForm({ ...initialForm });
    setFormErrors({});
  };

  const openCreate = () => {
    resetForm();
    setShowModal(true);
  };

  const openEdit = (cat) => {
    setEditItem(cat);
    setForm({
      name: cat.name ?? '',
      description: cat.description ?? '',
      sortOrder: cat.sortOrder ?? cat.sort_order ?? 0,
      status: cat.status || (cat.is_active === false ? 'inactive' : 'active'),
    });
    setFormErrors({});
    setShowModal(true);
  };

  const validate = () => {
    const errs = {};
    if (!form.name?.trim()) errs.name = 'Category name is required';
    setFormErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSave = async () => {
    if (!validate()) return;
    setSaving(true);
    try {
      const payload = {
        name: form.name,
        description: form.description,
        sort_order: form.sortOrder,
        is_active: form.status === 'active',
      };
      if (editItem) {
        await categoryService.update(editItem._id || editItem.id, payload);
        toast.success('Category updated');
      } else {
        await categoryService.create(payload);
        toast.success('Category created');
      }
      setShowModal(false);
      fetchCategories();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save category');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    const confirmed = await confirmAction({
      title: 'Delete Category',
      text: 'Are you sure? This may affect products in this category.',
      confirmText: 'Yes, delete it!',
    });
    if (!confirmed) return;
    try {
      await categoryService.delete(id);
      toast.success('Category deleted');
      fetchCategories();
    } catch {
      toast.error('Failed to delete category');
    }
  };

  const columns = [
    {
      key: 'name',
      label: 'Name',
      render: (val, row) => (
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-primary-100 dark:bg-primary-900/30 rounded-lg flex items-center justify-center">
            <FiFolder className="text-primary-600 dark:text-primary-400" />
          </div>
          <div>
            <p className="font-medium text-secondary-900 dark:text-white">{val}</p>
            {row.description && <p className="text-xs text-secondary-500">{row.description}</p>}
          </div>
        </div>
      ),
    },
    { key: 'sortOrder', label: 'Sort Order', render: (val) => <span>{val || 0}</span> },
    { key: 'status', label: 'Status', render: (val) => <StatusBadge status={val || 'active'} /> },
    {
      key: 'actions',
      label: 'Actions',
      render: (_, row) => (
        <div className="flex items-center gap-2">
          <button onClick={(e) => { e.stopPropagation(); openEdit(row); }} className="p-1.5 rounded-lg hover:bg-secondary-100 dark:hover:bg-secondary-700 text-secondary-500 hover:text-primary-600">
            <FiEdit2 size={16} />
          </button>
          <button onClick={(e) => { e.stopPropagation(); handleDelete(row._id || row.id); }} className="p-1.5 rounded-lg hover:bg-secondary-100 dark:hover:bg-secondary-700 text-secondary-500 hover:text-danger-600">
            <FiTrash2 size={16} />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="page-container">
      <PageHeader
        title="Categories"
        subtitle="Organize your products into categories"
        breadcrumbs={[{ label: 'Inventory' }, { label: 'Categories' }]}
        actions={<Button variant="primary" icon={FiPlus} onClick={openCreate}>Add Category</Button>}
      />

      <DataTable
        columns={columns}
        data={categories}
        loading={loading}
        exportable
        exportFilename="categories"
        page={pagination.page}
        totalPages={pagination.totalPages}
        totalItems={pagination.totalItems}
        limit={pagination.limit}
        onPageChange={pagination.goToPage}
        onLimitChange={pagination.changeLimit}
        emptyTitle="No categories found"
        emptyMessage="Create categories to organize your products."
        emptyAction
        emptyActionLabel="Add Category"
        onEmptyAction={openCreate}
      />

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title={editItem ? 'Edit Category' : 'New Category'} size="md">
        <div className="space-y-4">
          <Input label="Category Name" name="name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required error={formErrors.name} placeholder="e.g. Beverages" />
          <Input label="Description" name="description" type="textarea" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Category description..." rows={3} />
          <Input label="Sort Order" name="sortOrder" type="number" value={form.sortOrder} onChange={(e) => setForm({ ...form, sortOrder: Number(e.target.value) })} placeholder="0" />
          <Input label="Status" name="status" type="select" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })} options={[{ value: 'active', label: 'Active' }, { value: 'inactive', label: 'Inactive' }]} />
        </div>
        <div className="flex justify-end gap-3 mt-6">
          <Button variant="secondary" onClick={() => setShowModal(false)}>Cancel</Button>
          <Button variant="primary" onClick={handleSave} loading={saving}>
            {editItem ? 'Update' : 'Create'}
          </Button>
        </div>
      </Modal>
    </div>
  );
};

export default CategoriesPage;