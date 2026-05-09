import { useState } from 'react';
import { FiSave, FiShield, FiMail, FiCreditCard, FiSettings, FiGlobe } from 'react-icons/fi';
import { toast } from '../utils/swal';
import Card from '../components/common/Card.jsx';
import Button from '../components/common/Button.jsx';
import Input from '../components/common/Input.jsx';
import PageHeader from '../components/common/PageHeader.jsx';

const tabs = [
  { id: 'general', label: 'General', icon: FiSettings },
  { id: 'smtp', label: 'SMTP / Email', icon: FiMail },
  { id: 'payment', label: 'Payment Gateway', icon: FiCreditCard },
  { id: 'maintenance', label: 'Maintenance', icon: FiShield },
];

const SystemSettingsPage = () => {
  const [activeTab, setActiveTab] = useState('general');
  const [saving, setSaving] = useState(false);
  const [maintenanceMode, setMaintenanceMode] = useState(false);

  const [generalForm, setGeneralForm] = useState({
    appName: 'ShopManager',
    supportEmail: 'support@shopmanager.com',
    defaultPlan: 'free',
    trialDays: '14',
    currency: 'USD',
    timezone: 'UTC',
  });

  const [smtpForm, setSmtpForm] = useState({
    host: '',
    port: '587',
    user: '',
    password: '',
    fromEmail: '',
    fromName: '',
    encryption: 'tls',
  });

  const [paymentForm, setPaymentForm] = useState({
    provider: 'stripe',
    publicKey: '',
    secretKey: '',
    webhookSecret: '',
    sandbox: true,
  });

  const handleSave = () => {
    setSaving(true);
    setTimeout(() => {
      toast.success('Settings saved successfully');
      setSaving(false);
    }, 1000);
  };

  return (
    <div className="p-4 md:p-6 lg:p-8 space-y-6">
      <PageHeader title="System Settings" subtitle="Configure global platform settings" breadcrumbs={[{ label: 'Admin' }, { label: 'System Settings' }]} />

      <div className="flex gap-2 bg-secondary-100 dark:bg-secondary-800 rounded-xl p-1 mb-6 overflow-x-auto">
        {tabs.map((tab) => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${activeTab === tab.id ? 'bg-white dark:bg-secondary-700 text-primary-600 dark:text-primary-400 shadow-sm' : 'text-secondary-500 hover:text-secondary-700 dark:hover:text-secondary-300'}`}>
            <tab.icon size={16} /> {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'general' && (
        <Card header="General Settings">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input label="Application Name" value={generalForm.appName} onChange={(e) => setGeneralForm({ ...generalForm, appName: e.target.value })} />
            <Input label="Support Email" type="email" value={generalForm.supportEmail} onChange={(e) => setGeneralForm({ ...generalForm, supportEmail: e.target.value })} />
            <Input label="Default Plan" type="select" value={generalForm.defaultPlan} onChange={(e) => setGeneralForm({ ...generalForm, defaultPlan: e.target.value })} options={[{ value: 'free', label: 'Free' }, { value: 'basic', label: 'Basic' }, { value: 'professional', label: 'Professional' }, { value: 'enterprise', label: 'Enterprise' }]} />
            <Input label="Trial Duration (days)" type="number" value={generalForm.trialDays} onChange={(e) => setGeneralForm({ ...generalForm, trialDays: e.target.value })} />
            <Input label="Default Currency" type="select" value={generalForm.currency} onChange={(e) => setGeneralForm({ ...generalForm, currency: e.target.value })} options={[{ value: 'USD', label: 'USD' }, { value: 'EUR', label: 'EUR' }, { value: 'GBP', label: 'GBP' }]} />
            <Input label="Default Timezone" type="select" value={generalForm.timezone} onChange={(e) => setGeneralForm({ ...generalForm, timezone: e.target.value })} options={[{ value: 'UTC', label: 'UTC' }, { value: 'America/New_York', label: 'Eastern' }, { value: 'Europe/London', label: 'London' }]} />
          </div>
          <div className="mt-6 flex justify-end"><Button onClick={handleSave} loading={saving} icon={FiSave}>Save Settings</Button></div>
        </Card>
      )}

      {activeTab === 'smtp' && (
        <Card header="SMTP Configuration">
          <div className="space-y-4">
            <p className="text-sm text-secondary-500 mb-4">Configure email server for sending transactional emails.</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input label="SMTP Host" value={smtpForm.host} onChange={(e) => setSmtpForm({ ...smtpForm, host: e.target.value })} placeholder="smtp.gmail.com" />
              <Input label="Port" value={smtpForm.port} onChange={(e) => setSmtpForm({ ...smtpForm, port: e.target.value })} placeholder="587" />
              <Input label="Username" value={smtpForm.user} onChange={(e) => setSmtpForm({ ...smtpForm, user: e.target.value })} placeholder="user@gmail.com" />
              <Input label="Password" type="password" value={smtpForm.password} onChange={(e) => setSmtpForm({ ...smtpForm, password: e.target.value })} placeholder="App password" />
              <Input label="From Email" type="email" value={smtpForm.fromEmail} onChange={(e) => setSmtpForm({ ...smtpForm, fromEmail: e.target.value })} placeholder="noreply@shopmanager.com" />
              <Input label="From Name" value={smtpForm.fromName} onChange={(e) => setSmtpForm({ ...smtpForm, fromName: e.target.value })} placeholder="ShopManager" />
              <Input label="Encryption" type="select" value={smtpForm.encryption} onChange={(e) => setSmtpForm({ ...smtpForm, encryption: e.target.value })} options={[{ value: 'tls', label: 'TLS' }, { value: 'ssl', label: 'SSL' }, { value: 'none', label: 'None' }]} />
            </div>
            <div className="flex justify-end gap-3 mt-4">
              <Button variant="secondary">Test Connection</Button>
              <Button onClick={handleSave} loading={saving} icon={FiSave}>Save SMTP Settings</Button>
            </div>
          </div>
        </Card>
      )}

      {activeTab === 'payment' && (
        <Card header="Payment Gateway">
          <div className="space-y-4">
            <p className="text-sm text-secondary-500 mb-4">Configure payment gateway for subscription billing.</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input label="Provider" type="select" value={paymentForm.provider} onChange={(e) => setPaymentForm({ ...paymentForm, provider: e.target.value })} options={[{ value: 'stripe', label: 'Stripe' }, { value: 'paypal', label: 'PayPal' }, { value: 'paystack', label: 'Paystack' }, { value: 'flutterwave', label: 'Flutterwave' }]} />
              <Input label="Public Key" value={paymentForm.publicKey} onChange={(e) => setPaymentForm({ ...paymentForm, publicKey: e.target.value })} placeholder="pk_..." />
              <Input label="Secret Key" type="password" value={paymentForm.secretKey} onChange={(e) => setPaymentForm({ ...paymentForm, secretKey: e.target.value })} placeholder="sk_..." />
              <Input label="Webhook Secret" type="password" value={paymentForm.webhookSecret} onChange={(e) => setPaymentForm({ ...paymentForm, webhookSecret: e.target.value })} placeholder="whsec_..." />
            </div>
            <label className="flex items-center gap-2"><input type="checkbox" checked={paymentForm.sandbox} onChange={(e) => setPaymentForm({ ...paymentForm, sandbox: e.target.checked })} className="rounded border-secondary-300 text-primary-600 focus:ring-primary-500" /> <span className="text-sm">Sandbox / Test Mode</span></label>
            <div className="flex justify-end"><Button onClick={handleSave} loading={saving} icon={FiSave}>Save Payment Settings</Button></div>
          </div>
        </Card>
      )}

      {activeTab === 'maintenance' && (
        <Card header="Maintenance Mode">
          <div className="space-y-6">
            <div className="flex items-center justify-between p-4 bg-warning-50 dark:bg-warning-900/10 rounded-xl border border-warning-200 dark:border-warning-800">
              <div>
                <p className="font-medium text-secondary-900 dark:text-white">Maintenance Mode</p>
                <p className="text-sm text-secondary-500">When enabled, only super admins can access the platform.</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" checked={maintenanceMode} onChange={(e) => setMaintenanceMode(e.target.checked)} className="sr-only peer" />
                <div className="w-11 h-6 bg-secondary-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-primary-300 dark:peer-focus:ring-primary-800 rounded-full peer dark:bg-secondary-600 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-secondary-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-secondary-500 peer-checked:bg-primary-600" />
              </label>
            </div>
            {maintenanceMode && (
              <Input label="Maintenance Message" type="textarea" placeholder="We're currently undergoing maintenance. We'll be back shortly." rows={3} />
            )}
            <div className="flex justify-end"><Button onClick={handleSave} loading={saving} icon={FiSave}>Save Changes</Button></div>
          </div>
        </Card>
      )}
    </div>
  );
};

export default SystemSettingsPage;
