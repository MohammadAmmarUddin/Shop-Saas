import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { FiArrowLeft, FiPrinter, FiMail, FiTrash2, FiShoppingCart } from 'react-icons/fi';
import { toast } from '../utils/swal';
import { saleService } from '../services/saleService';
import { formatCurrency, formatDateTime } from '../utils/helpers';
import Button from '../components/common/Button.jsx';
import Card from '../components/common/Card.jsx';
import ConfirmDialog from '../components/common/ConfirmDialog.jsx';
import StatusBadge from '../components/common/StatusBadge.jsx';
import LoadingSpinner from '../components/common/LoadingSpinner.jsx';
import PageHeader from '../components/common/PageHeader.jsx';

const SaleDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [sale, setSale] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showDelete, setShowDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    const fetchSale = async () => {
      try {
        const res = await saleService.getById(id);
        const raw = res.data?.data || res.data;
        setSale({
          ...raw,
          invoiceNumber: raw.invoiceNumber ?? raw.invoice_number,
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
            }))
            : [],
        });
      } catch {
        toast.error('Failed to load sale details');
        navigate('/app/sales');
      } finally {
        setLoading(false);
      }
    };
    fetchSale();
  }, [id, navigate]);

  const handlePrint = () => { window.print(); };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await saleService.delete(id);
      toast.success('Sale deleted');
      setShowDelete(false);
      navigate('/app/sales');
    } catch {
      toast.error('Failed to delete sale');
    } finally {
      setDeleting(false);
    }
  };

  if (loading) return <LoadingSpinner fullPage />;
  if (!sale) return null;

  return (
    <div className="page-container max-w-4xl">
      <PageHeader
        title={`Sale #${sale.invoiceNumber || sale._id?.slice(-6) || 'N/A'}`}
        breadcrumbs={[{ label: 'Transactions' }, { to: '/app/sales', label: 'Sales' }, { label: `#${sale.invoiceNumber || ''}` }]}
        actions={
          <div className="flex items-center gap-2">
            <Button variant="secondary" icon={FiArrowLeft} onClick={() => navigate('/app/sales')}>Back</Button>
            <Button variant="secondary" icon={FiPrinter} onClick={handlePrint}>Print</Button>
            <Button variant="danger" icon={FiTrash2} onClick={() => setShowDelete(true)}>Delete</Button>
          </div>
        }
      />

      <div id="sale-detail" className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 print-break-inside">
          <Card>
            <h3 className="font-semibold text-secondary-900 dark:text-white mb-3">Store Information</h3>
            <p className="text-sm text-secondary-600 dark:text-secondary-400">ShopManager POS</p>
            <p className="text-sm text-secondary-600 dark:text-secondary-400">contact@shopmanager.com</p>
            <p className="text-sm text-secondary-600 dark:text-secondary-400">+1 234 567 890</p>
          </Card>
          <Card>
            <h3 className="font-semibold text-secondary-900 dark:text-white mb-3">Customer Information</h3>
            <p className="text-sm text-secondary-600 dark:text-secondary-400">
              {sale.customer ? (
                <>{sale.customer.name}<br />{sale.customer.phone}<br />{sale.customer.email}</>
              ) : 'Walk-in Customer'}
            </p>
          </Card>
        </div>

        <Card>
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-secondary-900 dark:text-white">Invoice Details</h3>
            <div className="flex items-center gap-3 text-sm">
              <span className="text-secondary-500">Date:</span>
              <span className="font-medium">{formatDateTime(sale.createdAt)}</span>
            </div>
          </div>
          <div className="flex flex-wrap gap-4 text-sm mb-4">
            <div><span className="text-secondary-500">Invoice #:</span> <span className="font-mono font-medium">{sale.invoiceNumber || 'N/A'}</span></div>
            <div><span className="text-secondary-500">Status:</span> <StatusBadge status={sale.status} /></div>
            <div><span className="text-secondary-500">Payment:</span> <StatusBadge status={sale.paymentStatus} /></div>
            <div><span className="text-secondary-500">Method:</span> <span className="capitalize">{sale.paymentMethod?.replace('_', ' ') || 'N/A'}</span></div>
          </div>
        </Card>

        <Card>
          <h3 className="font-semibold text-secondary-900 dark:text-white mb-4">Items</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-secondary-200 dark:border-secondary-700">
                  <th className="text-left py-3 text-xs font-semibold text-secondary-500 uppercase">#</th>
                  <th className="text-left py-3 text-xs font-semibold text-secondary-500 uppercase">Product</th>
                  <th className="text-center py-3 text-xs font-semibold text-secondary-500 uppercase">Quantity</th>
                  <th className="text-right py-3 text-xs font-semibold text-secondary-500 uppercase">Unit Price</th>
                  <th className="text-right py-3 text-xs font-semibold text-secondary-500 uppercase">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-secondary-200 dark:divide-secondary-700">
                {(sale.items || []).map((item, i) => (
                  <tr key={i}>
                    <td className="py-3 text-secondary-500">{i + 1}</td>
                    <td className="py-3 font-medium text-secondary-900 dark:text-white">{item.product?.name || item.name}</td>
                    <td className="py-3 text-center">{item.quantity}</td>
                    <td className="py-3 text-right">{formatCurrency(item.price)}</td>
                    <td className="py-3 text-right font-medium">{formatCurrency(item.price * item.quantity)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        <Card>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between py-1"><span className="text-secondary-500">Subtotal</span><span>{formatCurrency(sale.subtotal || 0)}</span></div>
            {(sale.discount || 0) > 0 && (
              <div className="flex justify-between py-1 text-success-600"><span>Discount</span><span>-{formatCurrency(sale.discount)}</span></div>
            )}
            {(sale.tax || 0) > 0 && (
              <div className="flex justify-between py-1"><span>Tax</span><span>{formatCurrency(sale.tax)}</span></div>
            )}
            <div className="flex justify-between py-3 text-lg font-bold border-t border-secondary-200 dark:border-secondary-700">
              <span>Grand Total</span><span>{formatCurrency(sale.total || 0)}</span>
            </div>
          </div>
        </Card>

        {sale.notes && (
          <Card header="Notes">
            <p className="text-sm text-secondary-600 dark:text-secondary-400">{sale.notes}</p>
          </Card>
        )}
      </div>
      <ConfirmDialog
        isOpen={showDelete}
        onClose={() => setShowDelete(false)}
        onConfirm={handleDelete}
        loading={deleting}
        title="Delete Sale"
        message="Are you sure you want to delete this sale? This action cannot be undone."
        confirmLabel="Delete"
        variant="danger"
      />
    </div>
  );
};

export default SaleDetailPage;
