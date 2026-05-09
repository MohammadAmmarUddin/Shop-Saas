import { useState, useEffect } from 'react';
import { FiSave, FiUpload, FiUser, FiEye, FiEyeOff, FiPackage, FiCreditCard, FiShield } from 'react-icons/fi';
import { toast } from '../utils/swal';
import { storeService } from '../services/storeService';
import { userService } from '../services/userService';
import { subscriptionService } from '../services/subscriptionService';
import useAuth from '../hooks/useAuth';
import Card from '../components/common/Card.jsx';
import Button from '../components/common/Button.jsx';
import Input from '../components/common/Input.jsx';
import PageHeader from '../components/common/PageHeader.jsx';
import LoadingSpinner from '../components/common/LoadingSpinner.jsx';

const tabs = [
  { id: 'general', label: 'General', icon: FiPackage },
  { id: 'appearance', label: 'Appearance', icon: FiPackage },
  { id: 'receipt', label: 'Receipt', icon: FiPackage },
  { id: 'billing', label: 'Billing', icon: FiCreditCard },
  { id: 'security', label: 'Security', icon: FiShield },
];

const SettingsPage = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('general');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [store, setStore] = useState(null);
  const [settings, setSettings] = useState(null);
  const [subscription, setSubscription] = useState(null);

  const [generalForm, setGeneralForm] = useState({ name: '', email: '', phone: '', address: '', currency: 'USD', timezone: 'UTC' });
  const [receiptForm, setReceiptForm] = useState({ header: '', footer: '', taxRate: '0', showLogo: true, showBarcode: false });
  const [passwordForm, setPasswordForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [passwordErrors, setPasswordErrors] = useState({});

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [storeRes, settingsRes, subRes] = await Promise.allSettled([
          storeService.getCurrent(), storeService.getSettings(), subscriptionService.getCurrent(),
        ]);
        if (storeRes.status === 'fulfilled') {
          const s = storeRes.value.data?.data || storeRes.value.data;
          setStore(s);
          setGeneralForm({ name: s.name || '', email: s.email || '', phone: s.phone || '', address: s.address || '', currency: s.currency || 'USD', timezone: s.timezone || 'UTC' });
        }
        if (settingsRes.status === 'fulfilled') {
          const st = settingsRes.value.data?.data || settingsRes.value.data;
          setSettings(st);
          const stt = st.settings || st;
          setReceiptForm({
            header: stt.receiptHeader || stt.receipt_header || '',
            footer: stt.receiptFooter || stt.receipt_footer || '',
            taxRate: String(stt.taxRate ?? stt.tax_rate ?? '0'),
            showLogo: stt.showLogo !== false,
            showBarcode: stt.showBarcode ?? false,
          });
        }
        if (subRes.status === 'fulfilled') {
          const sub = subRes.value.data?.data || subRes.value.data;
          setSubscription({
            ...sub,
            trialEndsAt: sub.trialEndsAt ?? sub.trial_ends_at,
            status: sub.status,
            plan: sub.plan,
          });
        }
      } catch {} finally { setLoading(false); }
    };
    fetchData();
  }, []);

  const saveGeneral = async () => {
    setSaving(true);
    try {
      await storeService.update(generalForm);
      toast.success('Settings saved');
    } catch { toast.error('Failed to save settings'); }
    finally { setSaving(false); }
  };

  const saveReceipt = async () => {
    setSaving(true);
    try {
      await storeService.updateSettings({
        settings: {
          receiptHeader: receiptForm.header,
          receiptFooter: receiptForm.footer,
          taxRate: Number(receiptForm.taxRate),
          showLogo: receiptForm.showLogo,
          showBarcode: receiptForm.showBarcode,
        },
      });
      toast.success('Receipt settings saved');
    } catch { toast.error('Failed to save receipt settings'); }
    finally { setSaving(false); }
  };

  const handlePasswordChange = async () => {
    const errs = {};
    if (!passwordForm.currentPassword) errs.currentPassword = 'Current password is required';
    if (!passwordForm.newPassword || passwordForm.newPassword.length < 8) errs.newPassword = 'At least 8 characters';
    if (passwordForm.newPassword !== passwordForm.confirmPassword) errs.confirmPassword = 'Passwords do not match';
    setPasswordErrors(errs);
    if (Object.keys(errs).length > 0) return;
    setSaving(true);
    try {
      await userService.changePassword({ currentPassword: passwordForm.currentPassword, newPassword: passwordForm.newPassword });
      toast.success('Password changed successfully');
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch { toast.error('Failed to change password'); }
    finally { setSaving(false); }
  };

  const handleLogoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const formData = new FormData();
    formData.append('logo', file);
    try {
      await storeService.uploadLogo(formData);
      toast.success('Logo updated');
    } catch { toast.error('Failed to upload logo'); }
  };

  if (loading) return <LoadingSpinner fullPage />;

  return (
    <div className="page-container max-w-5xl">
      <PageHeader title="Settings" subtitle="Manage your store settings and preferences" breadcrumbs={[{ label: 'System' }, { label: 'Settings' }]} />

      <div className="flex gap-2 bg-secondary-100 dark:bg-secondary-800 rounded-xl p-1 mb-6 overflow-x-auto">
        {tabs.map((tab) => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${activeTab === tab.id ? 'bg-white dark:bg-secondary-700 text-primary-600 dark:text-primary-400 shadow-sm' : 'text-secondary-500 hover:text-secondary-700 dark:hover:text-secondary-300'}`}>
            <tab.icon size={16} /> {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'general' && (
        <div className="space-y-6">
          <Card header="Store Information">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input label="Store Name" value={generalForm.name} onChange={(e) => setGeneralForm({ ...generalForm, name: e.target.value })} />
              <Input label="Email" type="email" value={generalForm.email} onChange={(e) => setGeneralForm({ ...generalForm, email: e.target.value })} />
              <Input label="Phone" value={generalForm.phone} onChange={(e) => setGeneralForm({ ...generalForm, phone: e.target.value })} />
              <Input label="Address" value={generalForm.address} onChange={(e) => setGeneralForm({ ...generalForm, address: e.target.value })} />
              <Input label="Currency" type="select" value={generalForm.currency} onChange={(e) => setGeneralForm({ ...generalForm, currency: e.target.value })} options={[{ value: 'USD', label: 'USD ($)' }, { value: 'EUR', label: 'EUR (€)' }, { value: 'GBP', label: 'GBP (£)' }, { value: 'NGN', label: 'NGN (₦)' }, { value: 'KES', label: 'KES (KSh)' }, { value: 'GHS', label: 'GHS (₵)' }, { value: 'ZAR', label: 'ZAR (R)' }]} />
              <Input label="Timezone" type="select" value={generalForm.timezone} onChange={(e) => setGeneralForm({ ...generalForm, timezone: e.target.value })} options={[{ value: 'UTC', label: 'UTC' }, { value: 'America/New_York', label: 'Eastern Time' }, { value: 'America/Chicago', label: 'Central Time' }, { value: 'Europe/London', label: 'London' }, { value: 'Africa/Lagos', label: 'West Africa' }, { value: 'Africa/Nairobi', label: 'East Africa' }]} />
            </div>
            <div className="mt-6 flex justify-end"><Button onClick={saveGeneral} loading={saving} icon={FiSave}>Save Changes</Button></div>
          </Card>
        </div>
      )}

      {activeTab === 'appearance' && (
        <Card header="Store Logo">
          <div className="flex items-center gap-6">
            <div className="w-32 h-32 bg-secondary-100 dark:bg-secondary-700 rounded-xl flex items-center justify-center overflow-hidden border-2 border-dashed border-secondary-300 dark:border-secondary-600">
              {store?.logo ? <img src={store.logo} alt="Store logo" className="w-full h-full object-cover" /> : <FiPackage className="text-4xl text-secondary-400" />}
            </div>
            <div>
              <label className="btn-secondary cursor-pointer inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm"><FiUpload size={16} /> Upload Logo<input type="file" accept="image/*" onChange={handleLogoUpload} className="hidden" /></label>
              <p className="text-xs text-secondary-400 mt-2">Recommended size: 200x200px. Max 1MB.</p>
            </div>
          </div>
        </Card>
      )}

      {activeTab === 'receipt' && (
        <Card header="Receipt Settings">
          <div className="space-y-4">
            <Input label="Receipt Header" type="textarea" value={receiptForm.header} onChange={(e) => setReceiptForm({ ...receiptForm, header: e.target.value })} placeholder="Thank you for shopping with us!" rows={2} />
            <Input label="Receipt Footer" type="textarea" value={receiptForm.footer} onChange={(e) => setReceiptForm({ ...receiptForm, footer: e.target.value })} placeholder="Visit us again!" rows={2} />
            <div className="grid grid-cols-2 gap-4">
              <Input label="Tax Rate (%)" type="number" value={receiptForm.taxRate} onChange={(e) => setReceiptForm({ ...receiptForm, taxRate: e.target.value })} placeholder="0" />
            </div>
            <div className="flex items-center gap-6">
              <label className="flex items-center gap-2"><input type="checkbox" checked={receiptForm.showLogo} onChange={(e) => setReceiptForm({ ...receiptForm, showLogo: e.target.checked })} className="rounded border-secondary-300 text-primary-600 focus:ring-primary-500" /> <span className="text-sm">Show logo on receipt</span></label>
              <label className="flex items-center gap-2"><input type="checkbox" checked={receiptForm.showBarcode} onChange={(e) => setReceiptForm({ ...receiptForm, showBarcode: e.target.checked })} className="rounded border-secondary-300 text-primary-600 focus:ring-primary-500" /> <span className="text-sm">Show barcode on receipt</span></label>
            </div>
            <div className="flex justify-end"><Button onClick={saveReceipt} loading={saving} icon={FiSave}>Save Receipt Settings</Button></div>
          </div>
        </Card>
      )}

      {activeTab === 'billing' && (
        <div className="space-y-6">
          <Card header="Current Plan">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-lg font-semibold text-secondary-900 dark:text-white capitalize">{subscription?.plan?.name || 'Free'}</p>
                <p className="text-sm text-secondary-500">{subscription?.status === 'active' ? 'Active' : 'Trial'} {subscription?.trialEndsAt && `- Trial ends ${new Date(subscription.trialEndsAt).toLocaleDateString()}`}</p>
              </div>
              <Button variant="primary">Upgrade Plan</Button>
            </div>
          </Card>
          <Card header="Billing History"><p className="text-sm text-secondary-400 text-center py-4">No billing history available</p></Card>
        </div>
      )}

      {activeTab === 'security' && (
        <Card header="Change Password">
          <div className="max-w-md space-y-4">
            <Input label="Current Password" type="password" value={passwordForm.currentPassword} onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })} error={passwordErrors.currentPassword} icon={FiShield} />
            <Input label="New Password" type="password" value={passwordForm.newPassword} onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })} error={passwordErrors.newPassword} icon={FiEye} placeholder="Min. 8 characters" />
            <Input label="Confirm New Password" type="password" value={passwordForm.confirmPassword} onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })} error={passwordErrors.confirmPassword} icon={FiEyeOff} />
            <div className="flex justify-end"><Button onClick={handlePasswordChange} loading={saving} icon={FiSave}>Change Password</Button></div>
          </div>
        </Card>
      )}
    </div>
  );
};

export default SettingsPage;
