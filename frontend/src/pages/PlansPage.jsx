import { useState } from 'react';
import { FiPlus, FiEdit2, FiTrash2, FiCheck } from 'react-icons/fi';
import { toast, confirmAction } from '../utils/swal';
import { PLANS } from '../utils/constants';
import { formatCurrency } from '../utils/helpers';
import PageHeader from '../components/common/PageHeader.jsx';
import Button from '../components/common/Button.jsx';
import Card from '../components/common/Card.jsx';
import Modal from '../components/common/Modal.jsx';
import Input from '../components/common/Input.jsx';

const PlansPage = () => {
  const [plans, setPlans] = useState(PLANS);
  const [showModal, setShowModal] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ name: '', price: '', features: '', description: '' });
  const [formErrors, setFormErrors] = useState({});

  const openCreate = () => { setEditItem(null); setForm({ name: '', price: '', features: '', description: '' }); setFormErrors({}); setShowModal(true); };
  const openEdit = (p) => { setEditItem(p); setForm({ name: p.name || '', price: p.price || '', features: (p.features || []).join('\n'), description: p.description || '' }); setFormErrors({}); setShowModal(true); };

  const validate = () => {
    const errs = {};
    if (!form.name.trim()) errs.name = 'Plan name is required';
    if (!form.price && form.price !== 0) errs.price = 'Price is required';
    setFormErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSave = () => {
    if (!validate()) return;
    setSaving(true);
    const data = {
      ...form,
      price: Number(form.price),
      features: form.features.split('\n').filter(Boolean),
    };
    if (editItem) {
      setPlans((prev) => prev.map((p) => p.id === editItem.id ? { ...p, ...data } : p));
      toast.success('Plan updated');
    } else {
      setPlans((prev) => [...prev, { ...data, id: `plan_${Date.now()}` }]);
      toast.success('Plan created');
    }
    setShowModal(false);
    setSaving(false);
  };

  const handleDelete = async (id) => {
    const confirmed = await confirmAction({
      title: 'Delete Plan',
      text: 'Are you sure you want to delete this plan?',
      confirmText: 'Yes, delete it!',
    });
    if (!confirmed) return;
    setPlans((prev) => prev.filter((p) => p.id !== id));
    toast.success('Plan deleted');
  };

  return (
    <div className="p-4 md:p-6 lg:p-8 space-y-6">
      <PageHeader title="Subscription Plans" subtitle="Manage pricing plans and features" breadcrumbs={[{ label: 'Admin' }, { label: 'Plans' }]} actions={<Button variant="primary" icon={FiPlus} onClick={openCreate}>Add Plan</Button>} />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {plans.map((plan) => (
          <Card key={plan.id} className="relative flex flex-col">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-secondary-900 dark:text-white capitalize">{plan.name}</h3>
              <div className="flex gap-1">
                <button onClick={() => openEdit(plan)} className="p-1.5 rounded-lg hover:bg-secondary-100 dark:hover:bg-secondary-700 text-secondary-400 hover:text-primary-600"><FiEdit2 size={14} /></button>
                <button onClick={() => handleDelete(plan.id)} className="p-1.5 rounded-lg hover:bg-secondary-100 dark:hover:bg-secondary-700 text-secondary-400 hover:text-danger-600"><FiTrash2 size={14} /></button>
              </div>
            </div>
            <div className="mb-4">
              <span className="text-3xl font-bold text-secondary-900 dark:text-white">
                {plan.price === 0 ? 'Free' : formatCurrency(plan.price)}
              </span>
              {plan.price > 0 && <span className="text-sm text-secondary-400">/month</span>}
            </div>
            {plan.description && <p className="text-sm text-secondary-500 mb-4">{plan.description}</p>}
            <ul className="space-y-2 flex-1">
              {(plan.features || []).map((feature, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-secondary-600 dark:text-secondary-400">
                  <FiCheck className="text-success-500 mt-0.5 flex-shrink-0" size={16} />
                  {feature}
                </li>
              ))}
            </ul>
            <Button variant={plan.price === 0 ? 'secondary' : 'primary'} className="w-full mt-6">
              {plan.price === 0 ? 'Current Plan' : 'Select Plan'}
            </Button>
          </Card>
        ))}
      </div>

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title={editItem ? 'Edit Plan' : 'New Plan'} size="lg">
        <div className="space-y-4">
          <Input label="Plan Name *" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required error={formErrors.name} placeholder="e.g. Professional" />
          <Input label="Monthly Price *" type="number" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} required error={formErrors.price} placeholder="0.00" />
          <Input label="Description" type="textarea" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Brief plan description..." rows={2} />
          <Input label="Features (one per line)" type="textarea" value={form.features} onChange={(e) => setForm({ ...form, features: e.target.value })} placeholder="Up to 1000 products&#10;3 users&#10;Sales reports" rows={5} />
        </div>
        <div className="flex justify-end gap-3 mt-6">
          <Button variant="secondary" onClick={() => setShowModal(false)}>Cancel</Button>
          <Button variant="primary" onClick={handleSave} loading={saving}>{editItem ? 'Update' : 'Create'}</Button>
        </div>
      </Modal>
    </div>
  );
};

export default PlansPage;