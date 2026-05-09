const prisma = require('../prisma');
const { exec } = require('child_process');
const path = require('path');
const fs = require('fs');
const util = require('util');

const execPromise = util.promisify(exec);

const BACKUP_DIR = path.join(__dirname, '../../backups');

if (!fs.existsSync(BACKUP_DIR)) {
  fs.mkdirSync(BACKUP_DIR, { recursive: true });
}

const createBackup = async (storeId = null, type = 'manual') => {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
  const prefix = storeId ? `store_${storeId}` : 'full';
  const filename = `backup_${prefix}_${timestamp}.sql`;
  const filepath = path.join(BACKUP_DIR, filename);

  const backup = await prisma.backup.create({
    data: {
      store_id: storeId,
      filename,
      filepath,
      type,
      status: 'pending',
    },
  });

  try {
    const dbName = process.env.DB_NAME;
    const dbUser = process.env.DB_USER;
    const dbPass = process.env.DB_PASSWORD;
    const dbHost = process.env.DB_HOST;

    let cmd;
    if (storeId) {
      const tables = ['stores', 'users', 'categories', 'products', 'customers', 'suppliers',
        'sales', 'sale_items', 'purchases', 'purchase_items', 'expenses', 'payments',
        'subscriptions', 'notifications', 'activity_logs', 'backups'];
      const tableFilter = tables.join(' ');
      cmd = `mysqldump -h ${dbHost} -u ${dbUser} -p${dbPass} ${dbName} ${tableFilter} --where="store_id=${storeId}" --no-create-info > "${filepath}"`;
    } else {
      cmd = `mysqldump -h ${dbHost} -u ${dbUser} -p${dbPass} ${dbName} > "${filepath}"`;
    }

    await execPromise(cmd);

    const stats = fs.statSync(filepath);
    const filesize = stats.size;

    await prisma.backup.update({
      where: { id: backup.id },
      data: { status: 'completed', file_size: filesize },
    });

    return { backup: { ...backup, status: 'completed', file_size: filesize }, filepath };
  } catch (error) {
    await prisma.backup.update({
      where: { id: backup.id },
      data: { status: 'failed' },
    });
    if (fs.existsSync(filepath)) {
      fs.unlinkSync(filepath);
    }
    throw error;
  }
};

const restoreBackup = async (backupId) => {
  const backup = await prisma.backup.findUnique({ where: { id: BigInt(backupId) } });
  if (!backup) throw new Error('Backup not found');
  if (backup.status !== 'completed') throw new Error('Backup is not in completed state');
  if (!fs.existsSync(backup.filepath)) throw new Error('Backup file not found');

  try {
    const dbName = process.env.DB_NAME;
    const dbUser = process.env.DB_USER;
    const dbPass = process.env.DB_PASSWORD;
    const dbHost = process.env.DB_HOST;

    const cmd = `mysql -h ${dbHost} -u ${dbUser} -p${dbPass} ${dbName} < "${backup.filepath}"`;
    await execPromise(cmd);

    await prisma.backup.update({
      where: { id: backup.id },
      data: { notes: 'Restored successfully' },
    });
    return true;
  } catch (error) {
    throw new Error(`Restore failed: ${error.message}`);
  }
};

const listBackups = async (storeId = null, { page = 1, limit = 20 }) => {
  const where = {};
  if (storeId) where.store_id = storeId;

  const offset = (page - 1) * limit;
  const [count, rows] = await prisma.$transaction([
    prisma.backup.count({ where }),
    prisma.backup.findMany({
      where,
      orderBy: { created_at: 'desc' },
      skip: offset,
      take: limit,
    }),
  ]);

  return {
    backups: rows,
    total: count,
    page,
    totalPages: Math.ceil(count / limit),
  };
};

const deleteBackup = async (backupId) => {
  const backup = await prisma.backup.findUnique({ where: { id: BigInt(backupId) } });
  if (!backup) throw new Error('Backup not found');

  try {
    if (fs.existsSync(backup.filepath)) {
      fs.unlinkSync(backup.filepath);
    }
  } catch (e) {}

  await prisma.backup.delete({ where: { id: backup.id } });
  return true;
};

const getBackupInfo = async (backupId) => {
  const backup = await prisma.backup.findUnique({ where: { id: BigInt(backupId) } });
  if (!backup) throw new Error('Backup not found');
  return backup;
};

const cleanupOldBackups = async (keepDays = 30) => {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - keepDays);

  const oldBackups = await prisma.backup.findMany({
    where: {
      created_at: { lt: cutoff },
      status: 'completed',
    },
  });

  for (const backup of oldBackups) {
    try {
      if (fs.existsSync(backup.filepath)) {
        fs.unlinkSync(backup.filepath);
      }
    } catch (e) {}
    await prisma.backup.delete({ where: { id: backup.id } });
  }

  return oldBackups.length;
};

module.exports = {
  createBackup,
  restoreBackup,
  listBackups,
  deleteBackup,
  getBackupInfo,
  cleanupOldBackups,
};
