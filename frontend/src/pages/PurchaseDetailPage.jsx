import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FiArrowLeft, FiTrash2, FiTruck } from 'react-icons/fi';
import { toast } from '../utils/swal';
import { purchaseService } from '../services/purchaseService';
import { formatCurrency, formatDateTime } from '../utils/helpers';
import Button from '../components/common/Button.jsx';
import Card from '../components/common/Card.jsx';
import ConfirmDialog from '../components/common/ConfirmDialog.jsx';
import StatusBadge from '../components/common/StatusBadge.jsx';
import LoadingSpinner from '../components/common/LoadingSpinner.jsx';
import PageHeader from '../components/common/PageHeader.jsx';

const PurchaseDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [purchase, setPurchase] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showDelete, setShowDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    const fetchPurchase = async () => {
      try {
        const res = await purchaseService.getById(id);
        const raw = res.data?.data || res.data;
        setPurchase({
          ...raw,
          reference: raw.reference ?? raw.purchase_number,
          createdAt: raw.createdAt ?? raw.created_at,
          total: raw.total ?? raw.total_amount,
          paymentMethod: raw.paymentMethod ?? raw.payment_method,
          paymentStatus: raw.paymentStatus ?? raw.payment_status,
          discount: raw.discount ?? raw.discount_amount,
          tax: raw.tax ?? raw.tax_amount,
          items: Array.isArray(raw.items)
            ? raw.items.map((item) => ({
              ...item,
              price: item.price ?? item.unit_price,
              cost: item.cost ?? item.unit_price,
            }))
            : [],
        });
      } catch {
        toast.error('Failed to load purchase details');
        navigate('/app/purchases');
      } finally {
        setLoading(false);
      }
    };
    fetchPurchase();
  }, [id, navigate]);

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await purchaseService.delete(id);
      toast.success('Purchase deleted');
      setShowDelete(false);
      navigate('/app/purchases');
    } catch {
      toast.error('Failed to delete purchase');
    } finally {
      setDeleting(false);
    }
  };

  if (loading) return <LoadingSpinner fullPage />;
  if (!purchase) return null;

  return (
    <div className="page-container max-w-4xl">
      <PageHeader
        title={`Purchase #${purchase.reference || purchase._id?.slice(-6) || 'N/A'}`}
        breadcrumbs={[{ label: 'Transactions' }, { to: '/app/purchases', label: 'Purchases' }, { label: `#${purchase.reference || ''}` }]}
        actions={
          <div className="flex items-center gap-2">
            <Button variant="secondary" icon={FiArrowLeft} onClick={() => navigate('/app/purchases')}>Back</Button>
            <Button variant="danger" icon={FiTrash2} onClick={() => setShowDelete(true)}>Delete</Button>
          </div>
        }
      />

      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <h3 className="font-semibold text-secondary-900 dark:text-white mb-3">Purchase Information</h3>
            <div className="space-y-2 text-sm">
              <div><span className="text-secondary-500">Reference:</span> <span className="font-mono font-medium">{purchase.reference || 'N/A'}</span></div>
              <div><span className="text-secondary-500">Date:</span> <span>{formatDateTime(purchase.createdAt)}</span></div>
              <div><span className="text-secondary-500">Status:</span> <StatusBadge status={purchase.status || 'pending'} /></div>
            </div>
          </Card>
          <Card>
            <h3 className="font-semibold text-secondary-900 dark:text-white mb-3">Supplier Information</h3>
            {purchase.supplier ? (
              <div className="space-y-1 text-sm">
                <p className="font-medium text-secondary-900 dark:text-white">{purchase.supplier.name}</p>
                <p className="text-secondary-500">{purchase.supplier.phone}</p>
                <p className="text-secondary-500">{purchase.supplier.email}</p>
                <p className="text-secondary-500">{purchase.supplier.address}</p>
              </div>
            ) : (
              <p className="text-sm text-secondary-400">No supplier information</p>
            )}
          </Card>
        </div>

        <Card header="Items">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-secondary-200 dark:border-secondary-700">
                  <th className="text-left py-3 text-xs font-semibold text-secondary-500 uppercase">#</th>
                  <th className="text-left py-3 text-xs font-semibold text-secondary-500 uppercase">Product</th>
                  <th className="text-center py-3 text-xs font-semibold text-secondary-500 uppercase">Quantity</th>
                  <th className="text-right py-3 text-xs font-semibold text-secondary-500 uppercase">Unit Cost</th>
                  <th className="text-right py-3 text-xs font-semibold text-secondary-500 uppercase">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-secondary-200 dark:divide-secondary-700">
                {(purchase.items || []).map((item, i) => (
                  <tr key={i}>
                    <td className="py-3 text-secondary-500">{i + 1}</td>
                    <td className="py-3 font-medium text-secondary-900 dark:text-white">{item.product?.name || item.name}</td>
                    <td className="py-3 text-center">{item.quantity}</td>
                    <td className="py-3 text-right">{formatCurrency(item.cost || item.price)}</td>
                    <td className="py-3 text-right font-medium">{formatCurrency((item.cost || item.price) * item.quantity)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        <Card>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between py-1"><span className="text-secondary-500">Subtotal</span><span>{formatCurrency(purchase.subtotal || 0)}</span></div>
            {(purchase.discount || 0) > 0 && (
              <div className="flex justify-between py-1 text-success-600"><span>Discount</span><span>-{formatCurrency(purchase.discount)}</span></div>
            )}
            {(purchase.tax || 0) > 0 && (
              <div className="flex justify-between py-1"><span>Tax</span><span>{formatCurrency(purchase.tax)}</span></div>
            )}
            <div className="flex justify-between py-3 text-lg font-bold border-t border-secondary-200 dark:border-secondary-700">
              <span>Grand Total</span><span>{formatCurrency(purchase.total || 0)}</span>
            </div>
          </div>
        </Card>

        {purchase.notes && (
          <Card header="Notes">
            <p className="text-sm text-secondary-600 dark:text-secondary-400">{purchase.notes}</p>
          </Card>
        )}
      </div>
      <ConfirmDialog
        isOpen={showDelete}
        onClose={() => setShowDelete(false)}
        onConfirm={handleDelete}
        loading={deleting}
        title="Delete Purchase"
        message="Are you sure you want to delete this purchase? This action cannot be undone."
        confirmLabel="Delete"
        variant="danger"
      />
    </div>
  );
};

export default PurchaseDetailPage;
