import { useState, useEffect, useCallback } from 'react';
import { FiDownload, FiTrash2, FiRefreshCw, FiServer, FiClock, FiPlus } from 'react-icons/fi';
import { toast } from '../utils/swal';
import { backupService } from '../services/backupService';
import { formatDateTime, formatDate } from '../utils/helpers';
import PageHeader from '../components/common/PageHeader.jsx';
import Card from '../components/common/Card.jsx';
import Button from '../components/common/Button.jsx';
import DataTable from '../components/common/DataTable.jsx';
import ConfirmDialog from '../components/common/ConfirmDialog.jsx';
import LoadingSpinner from '../components/common/LoadingSpinner.jsx';
import StatusBadge from '../components/common/StatusBadge.jsx';
import usePagination from '../hooks/usePagination';

const BackupPage = () => {
  const [backups, setBackups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [deleteId, setDeleteId] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [restoreId, setRestoreId] = useState(null);
  const [restoring, setRestoring] = useState(false);
  const pagination = usePagination();

  const normalizeBackup = (backup) => ({
    ...backup,
    size: backup.size ?? backup.file_size,
    createdAt: backup.createdAt ?? backup.created_at,
  });

  const fetchBackups = useCallback(async () => {
    setLoading(true);
    try {
      const res = await backupService.getAll({ page: pagination.page, limit: pagination.limit });
      const payload = res.data?.data || res.data || {};
      const raw = Array.isArray(payload.backups) ? payload.backups : Array.isArray(payload) ? payload : [];
      setBackups(raw.map(normalizeBackup));
      pagination.updatePagination(res.data);
    } catch { toast.error('Failed to load backups'); }
    finally { setLoading(false); }
  }, [pagination.page, pagination.limit]);

  useEffect(() => { fetchBackups(); }, [fetchBackups]);

  const createBackup = async () => {
    setCreating(true);
    try {
      await backupService.create();
      toast.success('Backup created successfully');
      fetchBackups();
    } catch { toast.error('Failed to create backup'); }
    finally { setCreating(false); }
  };

  const downloadBackup = async (id, filename) => {
    try {
      const res = await backupService.download(id);
      const url = URL.createObjectURL(res.data);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename || `backup-${Date.now()}.sql`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      toast.success('Download started');
    } catch { toast.error('Failed to download backup'); }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    setDeleting(true);
    try { await backupService.delete(deleteId); toast.success('Backup deleted'); setDeleteId(null); fetchBackups(); }
    catch { toast.error('Failed to delete backup'); }
    finally { setDeleting(false); }
  };

  const handleRestore = async () => {
    if (!restoreId) return;
    setRestoring(true);
    try {
      await backupService.restore(restoreId);
      toast.success('Backup restored successfully');
      setRestoreId(null);
    } catch { toast.error('Failed to restore backup'); }
    finally { setRestoring(false); }
  };

  const formatSize = (bytes) => {
    if (!bytes) return '-';
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return `${(bytes / Math.pow(1024, i)).toFixed(2)} ${sizes[i]}`;
  };

  const columns = [
    { key: 'filename', label: 'Filename', render: (val) => <span className="font-medium text-secondary-900 dark:text-white">{val || 'backup.sql'}</span> },
    { key: 'size', label: 'Size', render: (val) => <span>{formatSize(val)}</span> },
    { key: 'createdAt', label: 'Created', render: (val) => <span>{formatDateTime(val)}</span> },
    { key: 'status', label: 'Status', render: (val) => <StatusBadge status={val || 'completed'} /> },
    {
      key: 'actions', label: 'Actions',
      render: (_, row) => (
        <div className="flex items-center gap-2">
          <button onClick={(e) => { e.stopPropagation(); downloadBackup(row._id || row.id, row.filename); }} className="p-1.5 rounded-lg hover:bg-secondary-100 dark:hover:bg-secondary-700 text-secondary-500 hover:text-primary-600"><FiDownload size={16} /></button>
          <button onClick={(e) => { e.stopPropagation(); setRestoreId(row._id || row.id); }} className="p-1.5 rounded-lg hover:bg-secondary-100 dark:hover:bg-secondary-700 text-secondary-500 hover:text-warning-600"><FiRefreshCw size={16} /></button>
          <button onClick={(e) => { e.stopPropagation(); setDeleteId(row._id || row.id); }} className="p-1.5 rounded-lg hover:bg-secondary-100 dark:hover:bg-secondary-700 text-secondary-500 hover:text-danger-600"><FiTrash2 size={16} /></button>
        </div>
      ),
    },
  ];

  return (
    <div className="page-container">
      <PageHeader title="Backup" subtitle="Manage database backups and restore" breadcrumbs={[{ label: 'System' }, { label: 'Backup' }]} actions={<Button variant="primary" icon={FiPlus} onClick={createBackup} loading={creating}>Create Backup</Button>} />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card><div className="flex items-center gap-3"><FiServer className="text-2xl text-primary-600" /><div><p className="text-sm text-secondary-500">Total Backups</p><p className="text-xl font-bold">{backups.length}</p></div></div></Card>
        <Card><div className="flex items-center gap-3"><FiRefreshCw className="text-2xl text-success-600" /><div><p className="text-sm text-secondary-500">Auto Backup</p><p className="text-xl font-bold">Disabled</p></div></div></Card>
        <Card><div className="flex items-center gap-3"><FiClock className="text-2xl text-warning-600" /><div><p className="text-sm text-secondary-500">Frequency</p><p className="text-xl font-bold capitalize">Manual</p></div></div></Card>
      </div>

      <DataTable columns={columns} data={backups} loading={loading} page={pagination.page} totalPages={pagination.totalPages} totalItems={pagination.totalItems} limit={pagination.limit} onPageChange={pagination.goToPage} onLimitChange={pagination.changeLimit} emptyTitle="No backups yet" emptyMessage="Create your first backup to protect your data." emptyAction emptyActionLabel="Create Backup" onEmptyAction={createBackup} />

      <ConfirmDialog isOpen={!!restoreId} onClose={() => setRestoreId(null)} onConfirm={handleRestore} loading={restoring} title="Restore Backup" message="Restoring will replace your current data. Are you sure you want to continue?" confirmLabel="Restore" variant="warning" />
      <ConfirmDialog isOpen={!!deleteId} onClose={() => setDeleteId(null)} onConfirm={handleDelete} loading={deleting} title="Delete Backup" message="Are you sure you want to delete this backup?" confirmLabel="Delete" variant="danger" />
    </div>
  );
};

export default BackupPage;
