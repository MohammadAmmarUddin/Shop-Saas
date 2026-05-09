import { useState, useEffect, useCallback } from 'react';
import { FiPlus, FiEdit2, FiTrash2, FiUser, FiShield } from 'react-icons/fi';
import { toast } from '../utils/swal';
import { userService } from '../services/userService';
import { formatDateTime } from '../utils/helpers';
import DataTable from '../components/common/DataTable.jsx';
import PageHeader from '../components/common/PageHeader.jsx';
import Button from '../components/common/Button.jsx';
import Modal from '../components/common/Modal.jsx';
import Input from '../components/common/Input.jsx';
import ConfirmDialog from '../components/common/ConfirmDialog.jsx';
import StatusBadge from '../components/common/StatusBadge.jsx';
import usePagination from '../hooks/usePagination';
import { ROLES } from '../utils/constants';

const roleOptions = [
  { value: ROLES.STORE_OWNER, label: 'Store Owner' },
  { value: ROLES.MANAGER, label: 'Manager' },
  { value: ROLES.EMPLOYEE, label: 'Employee' },
];

const UsersPage = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [deleteId, setDeleteId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [search, setSearch] = useState('');
  const [form, setForm] = useState({ name: '', email: '', password: '', role: ROLES.EMPLOYEE, status: 'active' });
  const [formErrors, setFormErrors] = useState({});
  const pagination = usePagination();

  const normalizeUser = (user) => ({
    ...user,
    lastLogin: user.lastLogin ?? user.last_login_at,
    createdAt: user.createdAt ?? user.created_at,
    updatedAt: user.updatedAt ?? user.updated_at,
  });

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page: pagination.page, limit: pagination.limit, ...(search && { search }) };
      const res = await userService.getAll(params);
      const payload = res.data?.data || res.data || {};
      const raw = Array.isArray(payload.users) ? payload.users : Array.isArray(payload) ? payload : [];
      setUsers(raw.map(normalizeUser));
      pagination.updatePagination(res.data);
    } catch { toast.error('Failed to load users'); }
    finally { setLoading(false); }
  }, [pagination.page, pagination.limit, search]);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  const openCreate = () => { setEditItem(null); setForm({ name: '', email: '', password: '', role: ROLES.EMPLOYEE, status: 'active' }); setFormErrors({}); setShowModal(true); };
  const openEdit = (u) => { setEditItem(u); setForm({ name: u.name || '', email: u.email || '', password: '', role: u.role || ROLES.EMPLOYEE, status: u.status || 'active' }); setFormErrors({}); setShowModal(true); };

  const validate = () => {
    const errs = {};
    if (!form.name.trim()) errs.name = 'Name is required';
    if (!form.email.trim()) errs.email = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(form.email)) errs.email = 'Invalid email';
    if (!editItem && !form.password) errs.password = 'Password is required';
    else if (!editItem && form.password.length < 6) errs.password = 'At least 6 characters';
    setFormErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSave = async () => {
    if (!validate()) return;
    setSaving(true);
    try {
      const data = { ...form };
      if (editItem && !data.password) delete data.password;
      if (editItem) { await userService.update(editItem._id || editItem.id, data); toast.success('User updated'); }
      else { await userService.create(data); toast.success('User created'); }
      setShowModal(false); fetchUsers();
    } catch (err) { toast.error(err.response?.data?.message || 'Failed to save user'); }
    finally { setSaving(false); }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    setDeleting(true);
    try { await userService.delete(deleteId); toast.success('User deleted'); setDeleteId(null); fetchUsers(); }
    catch { toast.error('Failed to delete user'); }
    finally { setDeleting(false); }
  };

  const toggleStatus = async (userId, currentStatus) => {
    try {
      await userService.updateStatus(userId, currentStatus === 'active' ? 'inactive' : 'active');
      toast.success('User status updated');
      fetchUsers();
    } catch { toast.error('Failed to update status'); }
  };

  const columns = [
    {
      key: 'name', label: 'User',
      render: (val, row) => (
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-primary-100 dark:bg-primary-900/30 rounded-full flex items-center justify-center"><FiUser className="text-primary-600 dark:text-primary-400" /></div>
          <div><p className="font-medium text-secondary-900 dark:text-white">{val}</p><p className="text-xs text-secondary-500">{row.email}</p></div>
        </div>
      ),
    },
    { key: 'role', label: 'Role', render: (val) => <StatusBadge status={val || 'employee'} /> },
    { key: 'status', label: 'Status', render: (val) => <StatusBadge status={val || 'active'} /> },
    { key: 'lastLogin', label: 'Last Login', render: (val) => <span className="text-sm">{val ? formatDateTime(val) : 'Never'}</span> },
    {
      key: 'actions', label: 'Actions',
      render: (_, row) => (
        <div className="flex items-center gap-2">
          <button onClick={(e) => { e.stopPropagation(); toggleStatus(row._id || row.id, row.status); }} className="px-2 py-1 text-xs rounded-lg border border-secondary-300 dark:border-secondary-600 hover:bg-secondary-100 dark:hover:bg-secondary-700 transition-colors">{row.status === 'active' ? 'Deactivate' : 'Activate'}</button>
          <button onClick={(e) => { e.stopPropagation(); openEdit(row); }} className="p-1.5 rounded-lg hover:bg-secondary-100 dark:hover:bg-secondary-700 text-secondary-500 hover:text-primary-600"><FiEdit2 size={16} /></button>
          <button onClick={(e) => { e.stopPropagation(); setDeleteId(row._id || row.id); }} className="p-1.5 rounded-lg hover:bg-secondary-100 dark:hover:bg-secondary-700 text-secondary-500 hover:text-danger-600"><FiTrash2 size={16} /></button>
        </div>
      ),
    },
  ];

  return (
    <div className="page-container">
      <PageHeader title="Users" subtitle="Manage staff accounts and permissions" breadcrumbs={[{ label: 'System' }, { label: 'Users' }]} actions={<Button variant="primary" icon={FiPlus} onClick={openCreate}>Add User</Button>} />
      <div className="flex flex-wrap gap-4 mb-4">
        <input type="text" placeholder="Search by name or email..." value={search} onChange={(e) => { setSearch(e.target.value); pagination.setPage(1); }} className="flex-1 min-w-[200px] px-4 py-2 border border-secondary-300 rounded-lg bg-white dark:bg-secondary-800 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" />
      </div>
      <DataTable columns={columns} data={users} loading={loading} exportable exportFilename="users" page={pagination.page} totalPages={pagination.totalPages} totalItems={pagination.totalItems} limit={pagination.limit} onPageChange={pagination.goToPage} onLimitChange={pagination.changeLimit} emptyTitle="No users found" emptyMessage="Invite your team members to collaborate." emptyAction emptyActionLabel="Add User" onEmptyAction={openCreate} />
      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title={editItem ? 'Edit User' : 'Add User'} size="md">
        <div className="space-y-4">
          <Input label="Full Name *" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required error={formErrors.name} placeholder="John Doe" />
          <Input label="Email *" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required error={formErrors.email} placeholder="user@example.com" />
          {!editItem && <Input label="Password *" type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required error={formErrors.password} placeholder="Min. 6 characters" />}
          {editItem && <Input label="New Password (leave blank to keep)" type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} placeholder="Leave blank to keep current" />}
          <div className="grid grid-cols-2 gap-4">
            <Input label="Role" type="select" value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })} options={roleOptions} />
            <Input label="Status" type="select" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })} options={[{ value: 'active', label: 'Active' }, { value: 'inactive', label: 'Inactive' }]} />
          </div>
        </div>
        <div className="flex justify-end gap-3 mt-6">
          <Button variant="secondary" onClick={() => setShowModal(false)}>Cancel</Button>
          <Button variant="primary" onClick={handleSave} loading={saving}>{editItem ? 'Update' : 'Create'}</Button>
        </div>
      </Modal>
      <ConfirmDialog isOpen={!!deleteId} onClose={() => setDeleteId(null)} onConfirm={handleDelete} loading={deleting} title="Delete User" message="Are you sure you want to delete this user?" confirmLabel="Delete" variant="danger" />
    </div>
  );
};

export default UsersPage;
