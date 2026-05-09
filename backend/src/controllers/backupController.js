const path = require('path');
const fs = require('fs');
const backupService = require('../services/backupService');
const response = require('../utils/response');

const createBackup = async (req, res, next) => {
  try {
    const result = await backupService.createBackup(req.tenantId, 'manual');
    response.created(res, {
      id: result.backup.id,
      filename: result.backup.filename,
      filepath: result.filepath,
      status: result.backup.status,
    }, 'Backup created successfully');
  } catch (error) {
    next(error);
  }
};

const listBackups = async (req, res, next) => {
  try {
    const { page, limit } = req.query;
    const result = await backupService.listBackups(req.tenantId, {
      page: parseInt(page) || 1,
      limit: parseInt(limit) || 20,
    });
    response.success(res, result);
  } catch (error) {
    next(error);
  }
};

const getBackup = async (req, res, next) => {
  try {
    const backup = await backupService.getBackupInfo(req.params.id);
    if (!backup || (backup.store_id !== req.tenantId && req.user.role !== 'super_admin')) {
      return response.notFound(res, 'Backup not found');
    }
    response.success(res, backup);
  } catch (error) {
    next(error);
  }
};

const downloadBackup = async (req, res, next) => {
  try {
    const backup = await backupService.getBackupInfo(req.params.id);
    if (!backup || (backup.store_id !== req.tenantId && req.user.role !== 'super_admin')) {
      return response.notFound(res, 'Backup not found');
    }
    if (!fs.existsSync(backup.filepath)) {
      return response.notFound(res, 'Backup file not found on disk');
    }
    res.download(backup.filepath, backup.filename);
  } catch (error) {
    next(error);
  }
};

const restoreBackup = async (req, res, next) => {
  try {
    if (req.user.role !== 'super_admin') {
      return response.forbidden(res, 'Only super admin can restore backups');
    }
    const result = await backupService.restoreBackup(req.params.id);
    response.success(res, { restored: result }, 'Backup restored successfully');
  } catch (error) {
    next(error);
  }
};

const deleteBackup = async (req, res, next) => {
  try {
    const backup = await backupService.getBackupInfo(req.params.id);
    if (!backup || (backup.store_id !== req.tenantId && req.user.role !== 'super_admin')) {
      return response.notFound(res, 'Backup not found');
    }
    await backupService.deleteBackup(req.params.id);
    response.success(res, null, 'Backup deleted successfully');
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createBackup,
  listBackups,
  getBackup,
  downloadBackup,
  restoreBackup,
  deleteBackup,
};
