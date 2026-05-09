import { useState, useEffect, useCallback } from 'react';
import { FiPlus, FiEdit2, FiTrash2, FiDollarSign } from 'react-icons/fi';
import { toast } from '../utils/swal';
import { expenseService } from '../services/expenseService';
import { formatCurrency, formatDate } from '../utils/helpers';
import DataTable from '../components/common/DataTable.jsx';
import PageHeader from '../components/common/PageHeader.jsx';
import Button from '../components/common/Button.jsx';
import Modal from '../components/common/Modal.jsx';
import Input from '../components/common/Input.jsx';
import ConfirmDialog from '../components/common/ConfirmDialog.jsx';
import Card from '../components/common/Card.jsx';
import usePagination from '../hooks/usePagination';

const expenseCategories = [
  'Rent', 'Utilities', 'Salaries', 'Supplies', 'Transportation', 'Maintenance',
  'Marketing', 'Insurance', 'Taxes', 'Licenses', 'Software', 'Other',
];

const ExpensesPage = () => {
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [deleteId, setDeleteId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [totalExpenses, setTotalExpenses] = useState(0);
  const [form, setForm] = useState({ description: '', amount: '', category: 'Other', date: new Date().toISOString().split('T')[0], notes: '', paymentMethod: 'cash' });
  const [formErrors, setFormErrors] = useState({});
  const pagination = usePagination();

  const normalizeExpense = (expense) => ({
    ...expense,
    date: expense.date ?? expense.expense_date,
    paymentMethod: expense.paymentMethod ?? expense.payment_method,
    createdAt: expense.createdAt ?? expense.created_at,
  });

  const fetchExpenses = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page: pagination.page, limit: pagination.limit, ...(dateFrom && { start_date: dateFrom }), ...(dateTo && { end_date: dateTo }), ...(categoryFilter !== 'all' && { category: categoryFilter }) };
      const res = await expenseService.getAll(params);
      const payload = res.data?.data || res.data || {};
      const raw = Array.isArray(payload.expenses) ? payload.expenses : Array.isArray(payload) ? payload : [];
      const data = raw.map(normalizeExpense);
      setExpenses(data);
      setTotalExpenses(data.reduce((sum, e) => sum + Number(e.amount || 0), 0));
      pagination.updatePagination(res.data);
    } catch { toast.error('Failed to load expenses'); }
    finally { setLoading(false); }
  }, [pagination.page, pagination.limit, dateFrom, dateTo, categoryFilter]);

  useEffect(() => { fetchExpenses(); }, [fetchExpenses]);

  const openCreate = () => { setEditItem(null); setForm({ description: '', amount: '', category: 'Other', date: new Date().toISOString().split('T')[0], notes: '', paymentMethod: 'cash' }); setFormErrors({}); setShowModal(true); };
  const openEdit = (e) => { setEditItem(e); setForm({ description: e.description || '', amount: e.amount || '', category: e.category || 'Other', date: e.date ? e.date.split('T')[0] : '', notes: e.notes || '', paymentMethod: e.paymentMethod || 'cash' }); setFormErrors({}); setShowModal(true); };

  const validate = () => {
    const errs = {};
    if (!form.description.trim()) errs.description = 'Description is required';
    if (!form.amount || Number(form.amount) <= 0) errs.amount = 'Valid amount is required';
    setFormErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSave = async () => {
    if (!validate()) return;
    setSaving(true);
    try {
      const payload = {
        description: form.description,
        amount: form.amount,
        category: form.category,
        expense_date: form.date,
        payment_method: form.paymentMethod,
        notes: form.notes,
      };
      if (editItem) { await expenseService.update(editItem._id || editItem.id, payload); toast.success('Expense updated'); }
      else { await expenseService.create(payload); toast.success('Expense added'); }
      setShowModal(false); fetchExpenses();
    } catch (err) { toast.error(err.response?.data?.message || 'Failed to save expense'); }
    finally { setSaving(false); }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    setDeleting(true);
    try { await expenseService.delete(deleteId); toast.success('Expense deleted'); setDeleteId(null); fetchExpenses(); }
    catch { toast.error('Failed to delete expense'); }
    finally { setDeleting(false); }
  };

  const columns = [
    { key: 'date', label: 'Date', render: (val) => <span>{formatDate(val, 'MMM dd, yyyy')}</span> },
    { key: 'description', label: 'Description', render: (val) => <span className="font-medium text-secondary-900 dark:text-white">{val}</span> },
    { key: 'category', label: 'Category', render: (val) => <span className="badge-info">{val || 'Other'}</span> },
    { key: 'amount', label: 'Amount', render: (val) => <span className="font-semibold text-danger-600">{formatCurrency(val || 0)}</span> },
    { key: 'paymentMethod', label: 'Payment', render: (val) => <span className="capitalize text-sm">{val?.replace('_', ' ') || 'cash'}</span> },
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
      <PageHeader title="Expenses" subtitle="Track and manage business expenses" breadcrumbs={[{ label: 'Management' }, { label: 'Expenses' }]} actions={<Button variant="primary" icon={FiPlus} onClick={openCreate}>Add Expense</Button>} />
      <Card className="mb-6">
        <div className="flex items-center justify-between">
          <div><p className="text-sm text-secondary-500">Total Expenses (current page)</p><p className="text-2xl font-bold text-danger-600">{formatCurrency(totalExpenses)}</p></div>
          <FiDollarSign className="text-4xl text-danger-200 dark:text-danger-800" />
        </div>
      </Card>
      <div className="flex flex-wrap gap-4 mb-4">
        <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className="px-4 py-2 border border-secondary-300 rounded-lg bg-white dark:bg-secondary-800 text-sm" />
        <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className="px-4 py-2 border border-secondary-300 rounded-lg bg-white dark:bg-secondary-800 text-sm" />
        <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)} className="px-4 py-2 border border-secondary-300 rounded-lg bg-white dark:bg-secondary-800 text-sm">
          <option value="all">All Categories</option>
          {expenseCategories.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
      </div>
      <DataTable columns={columns} data={expenses} loading={loading} exportable exportFilename="expenses" page={pagination.page} totalPages={pagination.totalPages} totalItems={pagination.totalItems} limit={pagination.limit} onPageChange={pagination.goToPage} onLimitChange={pagination.changeLimit} emptyTitle="No expenses found" emptyMessage="Record your business expenses to track spending." emptyAction emptyActionLabel="Add Expense" onEmptyAction={openCreate} />
      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title={editItem ? 'Edit Expense' : 'Add Expense'} size="md">
        <div className="space-y-4">
          <Input label="Description *" name="description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} required error={formErrors.description} placeholder="What was this expense for?" />
          <div className="grid grid-cols-2 gap-4">
            <Input label="Amount *" name="amount" type="number" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} required error={formErrors.amount} placeholder="0.00" />
            <Input label="Date" name="date" type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input label="Category" name="category" type="select" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} options={expenseCategories.map((c) => ({ value: c, label: c }))} />
            <Input label="Payment Method" name="paymentMethod" type="select" value={form.paymentMethod} onChange={(e) => setForm({ ...form, paymentMethod: e.target.value })} options={[{ value: 'cash', label: 'Cash' }, { value: 'card', label: 'Card' }, { value: 'bank_transfer', label: 'Bank Transfer' }, { value: 'mobile_payment', label: 'Mobile Payment' }]} />
          </div>
          <Input label="Notes" name="notes" type="textarea" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} placeholder="Additional notes..." rows={2} />
        </div>
        <div className="flex justify-end gap-3 mt-6">
          <Button variant="secondary" onClick={() => setShowModal(false)}>Cancel</Button>
          <Button variant="primary" onClick={handleSave} loading={saving}>{editItem ? 'Update' : 'Add Expense'}</Button>
        </div>
      </Modal>
      <ConfirmDialog isOpen={!!deleteId} onClose={() => setDeleteId(null)} onConfirm={handleDelete} loading={deleting} title="Delete Expense" message="Are you sure you want to delete this expense?" confirmLabel="Delete" variant="danger" />
    </div>
  );
};

export default ExpensesPage;
