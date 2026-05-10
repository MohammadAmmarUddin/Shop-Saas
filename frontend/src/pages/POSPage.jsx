import { useState, useEffect, useRef, useCallback } from 'react';
import { FiSearch, FiPlus, FiMinus, FiTrash2, FiUser, FiPercent, FiDollarSign, FiPrinter, FiX, FiShoppingCart, FiCamera, FiPackage } from 'react-icons/fi';
import { toast } from '../utils/swal';
import { productService } from '../services/productService';
import { saleService } from '../services/saleService';
import { customerService } from '../services/customerService';
import { categoryService } from '../services/categoryService';
import { formatCurrency } from '../utils/helpers';
import { PAYMENT_METHODS } from '../utils/constants';
import Button from '../components/common/Button.jsx';
import Card from '../components/common/Card.jsx';
import Modal from '../components/common/Modal.jsx';
import LoadingSpinner from '../components/common/LoadingSpinner.jsx';
import useDebounce from '../hooks/useDebounce';

const POSPage = () => {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [cart, setCart] = useState([]);
  const [customer, setCustomer] = useState(null);
  const [customers, setCustomers] = useState([]);
  const [customerSearch, setCustomerSearch] = useState('');
  const [showCustomerModal, setShowCustomerModal] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [discount, setDiscount] = useState(0);
  const [discountType, setDiscountType] = useState('percentage');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [invoice, setInvoice] = useState(null);
  const [showInvoice, setShowInvoice] = useState(false);
  const [productLoading, setProductLoading] = useState(false);
  const barcodeRef = useRef(null);
  const debouncedSearch = useDebounce(searchQuery, 400);
  const debouncedCustomerSearch = useDebounce(customerSearch, 400);

  const normalizeProduct = (product) => ({
    ...product,
    sellingPrice: product.sellingPrice ?? product.selling_price,
    stock: product.stock ?? product.stock_quantity,
    image: product.image ?? (Array.isArray(product.images) && product.images.length > 0 ? product.images[0] : null),
  });

  const normalizeCustomer = (customer) => ({
    ...customer,
    totalPurchases: customer.totalPurchases ?? customer.total_purchases,
    totalPaid: customer.totalPaid ?? customer.total_paid,
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [prodRes, catRes] = await Promise.all([
          productService.getAll({ limit: 200 }),
          categoryService.getAll(),
        ]);
        const prodPayload = prodRes.data?.data || prodRes.data || {};
        const catPayload = catRes.data?.data || catRes.data || {};
        const prodRows = Array.isArray(prodPayload.products) ? prodPayload.products : Array.isArray(prodPayload) ? prodPayload : [];
        const catRows = Array.isArray(catPayload.categories) ? catPayload.categories : Array.isArray(catPayload) ? catPayload : [];
        setProducts(prodRows.map(normalizeProduct));
        setCategories(catRows);
      } catch {
        toast.error('Failed to load products');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  useEffect(() => {
    if (!debouncedSearch) return;
    const fetchProducts = async () => {
      setProductLoading(true);
      try {
        const res = await productService.getAll({ search: debouncedSearch, limit: 50 });
        const payload = res.data?.data || res.data || {};
        const rows = Array.isArray(payload.products) ? payload.products : Array.isArray(payload) ? payload : [];
        setProducts(rows.map(normalizeProduct));
      } catch {
      } finally {
        setProductLoading(false);
      }
    };
    fetchProducts();
  }, [debouncedSearch]);

  useEffect(() => {
    if (selectedCategory === 'all') return;
    const fetchFiltered = async () => {
      setProductLoading(true);
      try {
        const res = await productService.getAll({ category: selectedCategory, limit: 200 });
        const payload = res.data?.data || res.data || {};
        const rows = Array.isArray(payload.products) ? payload.products : Array.isArray(payload) ? payload : [];
        setProducts(rows.map(normalizeProduct));
      } catch {
      } finally {
        setProductLoading(false);
      }
    };
    fetchFiltered();
  }, [selectedCategory]);

  const handleBarcodeScan = useCallback(async (barcode) => {
    if (!barcode) return;
    try {
      const res = await productService.getByBarcode(barcode);
      const product = normalizeProduct(res.data?.data || res.data);
      if (product) {
        addToCart(product);
        toast.success(`Added ${product.name}`);
      }
    } catch {
      toast.error('Product not found');
    }
  }, []);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Enter' && barcodeRef.current === document.activeElement) {
        const val = barcodeRef.current.value.trim();
        if (val) {
          handleBarcodeScan(val);
          barcodeRef.current.value = '';
        }
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleBarcodeScan]);

  const addToCart = (product) => {
    setCart((prev) => {
      const existing = prev.find((item) => item.product._id === product._id || item.product.id === product.id);
      if (existing) {
        return prev.map((item) =>
          (item.product._id === product._id || item.product.id === product.id)
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      return [...prev, { product, quantity: 1 }];
    });
  };

  const updateQuantity = (productId, delta) => {
    setCart((prev) =>
      prev
        .map((item) => {
          if ((item.product._id || item.product.id) === productId) {
            const newQty = item.quantity + delta;
            return newQty <= 0 ? null : { ...item, quantity: newQty };
          }
          return item;
        })
        .filter(Boolean)
    );
  };

  const removeFromCart = (productId) => {
    setCart((prev) => prev.filter((item) => (item.product._id || item.product.id) !== productId));
  };

  const clearCart = () => {
    setCart([]);
    setCustomer(null);
    setDiscount(0);
  };

  const subtotal = cart.reduce((sum, item) => {
    const price = item.product.sellingPrice || item.product.price || 0;
    return sum + price * item.quantity;
  }, 0);

  const discountAmount = discountType === 'percentage'
    ? subtotal * (discount / 100)
    : discount;

  const taxRate = 0;
  const taxAmount = (subtotal - discountAmount) * taxRate;
  const grandTotal = subtotal - discountAmount + taxAmount;

  const fetchCustomers = useCallback(async (query) => {
    try {
      const res = await customerService.getAll({ search: query, limit: 20 });
      const payload = res.data?.data || res.data || {};
      const rows = Array.isArray(payload.customers) ? payload.customers : Array.isArray(payload) ? payload : [];
      setCustomers(rows.map(normalizeCustomer));
    } catch {}
  }, []);

  useEffect(() => {
    if (showCustomerModal) fetchCustomers(debouncedCustomerSearch || '');
  }, [showCustomerModal, debouncedCustomerSearch, fetchCustomers]);

  const handleCompleteSale = async () => {
    if (cart.length === 0) {
      toast.error('Cart is empty');
      return;
    }
    setSubmitting(true);
    try {
      const cartProductMap = new Map(cart.map((item) => [String(item.product._id || item.product.id), item.product]));
      const saleData = {
        items: cart.map((item) => ({
          product_id: item.product._id || item.product.id,
          quantity: item.quantity,
          unit_price: item.product.sellingPrice || item.product.price || 0,
          discount_amount: 0,
          tax_percentage: 0,
        })),
        customer_id: customer?._id || customer?.id || null,
        discount_type: discountType,
        discount_amount: discountAmount,
        shipping_cost: 0,
        payment_method: paymentMethod,
        paid_amount: grandTotal,
        status: 'completed',
        notes: null,
        is_pharmacy: false,
      };
      const res = await saleService.create(saleData);
      const rawInvoice = res.data?.data || res.data;
      const newInvoice = {
        ...rawInvoice,
        invoiceNumber: rawInvoice.invoiceNumber ?? rawInvoice.invoice_number,
        createdAt: rawInvoice.createdAt ?? rawInvoice.created_at,
        total: rawInvoice.total ?? rawInvoice.total_amount,
        paymentMethod: rawInvoice.paymentMethod ?? rawInvoice.payment_method,
        paymentStatus: rawInvoice.paymentStatus ?? rawInvoice.payment_status,
        items: Array.isArray(rawInvoice.items)
          ? rawInvoice.items.map((item) => ({
            ...item,
            price: item.price ?? item.unit_price,
            product: item.product || cartProductMap.get(String(item.product_id)),
          }))
          : cart.map((item) => ({
            product: item.product,
            quantity: item.quantity,
            price: item.product.sellingPrice || item.product.price || 0,
          })),
      };
      setInvoice(newInvoice);
      setShowInvoice(true);
      clearCart();
      toast.success('Sale completed successfully!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to complete sale');
    } finally {
      setSubmitting(false);
    }
  };

  const printReceipt = () => {
    const printWindow = window.open('', '_blank');
    const receiptContent = document.getElementById('receipt-content');
    if (!receiptContent) return;
    printWindow.document.write(`
      <html><head><title>Receipt</title>
      <style>
        body { font-family: 'Courier New', monospace; width: 80mm; margin: 0 auto; padding: 10px; }
        table { width: 100%; border-collapse: collapse; }
        th, td { padding: 4px 2px; text-align: left; }
        .text-right { text-align: right; }
        .total { font-weight: bold; font-size: 1.1em; }
        hr { border: none; border-top: 1px dashed #000; }
      </style></head><body>
      ${receiptContent.innerHTML}
      </body></html>
    `);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => printWindow.print(), 500);
  };

  if (loading) return <LoadingSpinner fullPage />;

  return (
    <div className="h-full flex flex-col lg:flex-row">
      <div className="flex-1 p-4 lg:p-6 overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-bold text-secondary-900 dark:text-white">Point of Sale</h1>
          <div className="flex items-center gap-2">
            <input
              ref={barcodeRef}
              type="text"
              placeholder="Scan barcode..."
              className="w-48 px-3 py-2 border border-secondary-300 dark:border-secondary-600 rounded-lg bg-white dark:bg-secondary-800 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
            <FiCamera className="text-secondary-400" size={20} />
          </div>
        </div>

        <div className="relative mb-4">
          <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-secondary-400" />
          <input
            type="text"
            placeholder="Search products by name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 border border-secondary-300 dark:border-secondary-600 rounded-lg bg-white dark:bg-secondary-800 text-secondary-900 dark:text-secondary-100 focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
        </div>

        <div className="flex gap-2 overflow-x-auto pb-2 mb-4">
          <button
            onClick={() => setSelectedCategory('all')}
            className={`px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
              selectedCategory === 'all'
                ? 'bg-primary-600 text-white'
                : 'bg-secondary-100 dark:bg-secondary-700 text-secondary-600 dark:text-secondary-300 hover:bg-secondary-200 dark:hover:bg-secondary-600'
            }`}
          >
            All
          </button>
          {categories.map((cat) => (
            <button
              key={cat._id || cat.id}
              onClick={() => setSelectedCategory(cat._id || cat.id)}
              className={`px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                selectedCategory === (cat._id || cat.id)
                  ? 'bg-primary-600 text-white'
                  : 'bg-secondary-100 dark:bg-secondary-700 text-secondary-600 dark:text-secondary-300 hover:bg-secondary-200 dark:hover:bg-secondary-600'
              }`}
            >
              {cat.name}
            </button>
          ))}
        </div>

        {productLoading ? (
          <LoadingSpinner text="Loading products..." />
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-3">
            {products.map((product) => (
              <button
                key={product._id || product.id}
                onClick={() => addToCart(product)}
                disabled={product.track_stock && (product.stock ?? 0) <= 0}
                className="bg-white dark:bg-secondary-800 rounded-xl shadow-sm border border-secondary-200 dark:border-secondary-700 p-3 text-left hover:shadow-md hover:border-primary-300 dark:hover:border-primary-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <div className="w-full h-24 bg-secondary-100 dark:bg-secondary-700 rounded-lg mb-2 flex items-center justify-center overflow-hidden">
                  {product.image ? (
                    <img src={product.image} alt={product.name} className="w-full h-full object-cover" />
                  ) : (
                    <FiPackage className="text-secondary-400 text-2xl" />
                  )}
                </div>
                <p className="text-sm font-medium text-secondary-900 dark:text-white truncate">{product.name}</p>
                <p className="text-sm font-bold text-primary-600 dark:text-primary-400 mt-1">
                  {formatCurrency(product.sellingPrice || product.price || 0)}
                </p>
                <p className={`text-xs mt-1 ${product.track_stock && (product.stock ?? 0) <= 0 ? 'text-danger-500' : 'text-secondary-400'}`}>
                  {product.track_stock ? ((product.stock ?? 0) > 0 ? `Stock: ${product.stock ?? 0}` : 'Out of stock') : 'In stock'}
                </p>
              </button>
            ))}
            {products.length === 0 && (
              <div className="col-span-full text-center py-12 text-secondary-400">
                No products found. {searchQuery ? 'Try a different search.' : 'Add products to start selling.'}
              </div>
            )}
          </div>
        )}
      </div>

      <div className="w-full lg:w-96 xl:w-[28rem] bg-white dark:bg-secondary-800 border-t lg:border-t-0 lg:border-l border-secondary-200 dark:border-secondary-700 flex flex-col">
        <div className="p-4 border-b border-secondary-200 dark:border-secondary-700">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-secondary-900 dark:text-white flex items-center gap-2">
              <FiShoppingCart />
              Cart ({cart.length})
            </h2>
            {cart.length > 0 && (
              <button onClick={clearCart} className="text-sm text-danger-500 hover:text-danger-600 flex items-center gap-1">
                <FiTrash2 size={14} /> Clear
              </button>
            )}
          </div>

          <button
            onClick={() => setShowCustomerModal(true)}
            className="w-full mt-3 flex items-center gap-2 px-3 py-2 border border-dashed border-secondary-300 dark:border-secondary-600 rounded-lg text-sm text-secondary-500 hover:text-primary-600 hover:border-primary-400 transition-colors"
          >
            <FiUser size={16} />
            {customer ? customer.name || customer.phone : 'Select customer (optional)'}
            {customer && <FiX size={16} className="ml-auto" onClick={(e) => { e.stopPropagation(); setCustomer(null); }} />}
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {cart.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-secondary-400">
              <FiShoppingCart className="text-4xl mb-2" />
              <p className="text-sm">Cart is empty</p>
              <p className="text-xs">Click on products to add them</p>
            </div>
          ) : (
            cart.map((item) => {
              const price = item.product.sellingPrice || item.product.price || 0;
              return (
                <div key={item.product._id || item.product.id} className="flex items-center gap-3 p-3 bg-secondary-50 dark:bg-secondary-700/50 rounded-xl">
                  <div className="w-12 h-12 bg-secondary-200 dark:bg-secondary-600 rounded-lg flex items-center justify-center flex-shrink-0">
                    {item.product.image ? (
                      <img src={item.product.image} alt="" className="w-full h-full object-cover rounded-lg" />
                    ) : (
                      <FiPackage className="text-secondary-400" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-secondary-900 dark:text-white truncate">{item.product.name}</p>
                    <p className="text-sm font-semibold text-primary-600 dark:text-primary-400">{formatCurrency(price)}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => updateQuantity(item.product._id || item.product.id, -1)}
                      className="w-7 h-7 rounded-lg bg-secondary-200 dark:bg-secondary-600 flex items-center justify-center hover:bg-secondary-300 dark:hover:bg-secondary-500 transition-colors"
                    >
                      <FiMinus size={14} />
                    </button>
                    <span className="w-8 text-center font-medium text-secondary-900 dark:text-white">{item.quantity}</span>
                    <button
                      onClick={() => updateQuantity(item.product._id || item.product.id, 1)}
                      className="w-7 h-7 rounded-lg bg-secondary-200 dark:bg-secondary-600 flex items-center justify-center hover:bg-secondary-300 dark:hover:bg-secondary-500 transition-colors"
                    >
                      <FiPlus size={14} />
                    </button>
                  </div>
                  <div className="text-right min-w-[80px]">
                    <p className="text-sm font-semibold text-secondary-900 dark:text-white">{formatCurrency(price * item.quantity)}</p>
                  </div>
                  <button
                    onClick={() => removeFromCart(item.product._id || item.product.id)}
                    className="p-1.5 text-secondary-400 hover:text-danger-500 transition-colors"
                  >
                    <FiTrash2 size={16} />
                  </button>
                </div>
              );
            })
          )}
        </div>

        <div className="p-4 border-t border-secondary-200 dark:border-secondary-700 space-y-3">
          <div className="flex items-center gap-2">
            <select
              value={discountType}
              onChange={(e) => setDiscountType(e.target.value)}
              className="px-2 py-1.5 border border-secondary-300 dark:border-secondary-600 rounded-lg bg-white dark:bg-secondary-800 text-sm"
            >
              <option value="percentage">%</option>
              <option value="fixed">$</option>
            </select>
            <div className="relative flex-1">
              <FiPercent className="absolute left-3 top-1/2 -translate-y-1/2 text-secondary-400" size={16} />
              <input
                type="number"
                value={discount}
                onChange={(e) => setDiscount(Math.max(0, Number(e.target.value)))}
                placeholder="Discount"
                className="w-full pl-10 pr-3 py-1.5 border border-secondary-300 dark:border-secondary-600 rounded-lg bg-white dark:bg-secondary-800 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
          </div>

          <div className="space-y-1 text-sm">
            <div className="flex justify-between text-secondary-500">
              <span>Subtotal</span>
              <span>{formatCurrency(subtotal)}</span>
            </div>
            {discountAmount > 0 && (
              <div className="flex justify-between text-success-600">
                <span>Discount</span>
                <span>-{formatCurrency(discountAmount)}</span>
              </div>
            )}
            <div className="flex justify-between text-secondary-500">
              <span>Tax</span>
              <span>{formatCurrency(taxAmount)}</span>
            </div>
            <div className="flex justify-between text-lg font-bold text-secondary-900 dark:text-white pt-2 border-t border-secondary-200 dark:border-secondary-700">
              <span>Total</span>
              <span>{formatCurrency(grandTotal)}</span>
            </div>
          </div>

          <select
            value={paymentMethod}
            onChange={(e) => setPaymentMethod(e.target.value)}
            className="w-full px-3 py-2 border border-secondary-300 dark:border-secondary-600 rounded-lg bg-white dark:bg-secondary-800 text-secondary-900 dark:text-secondary-100 focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            {Object.entries(PAYMENT_METHODS).map(([key, val]) => (
              <option key={val} value={val}>{key.replace(/_/g, ' ')}</option>
            ))}
          </select>

          <Button
            onClick={handleCompleteSale}
            disabled={cart.length === 0 || submitting}
            loading={submitting}
            className="w-full"
            size="lg"
          >
            <FiDollarSign size={18} />
            Complete Sale ({formatCurrency(grandTotal)})
          </Button>
        </div>
      </div>

      <Modal isOpen={showCustomerModal} onClose={() => setShowCustomerModal(false)} title="Select Customer" size="lg">
        <div className="relative mb-4">
          <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-secondary-400" />
          <input
            type="text"
            placeholder="Search customers..."
            value={customerSearch}
            onChange={(e) => setCustomerSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-secondary-300 dark:border-secondary-600 rounded-lg bg-white dark:bg-secondary-800 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
        </div>
        <div className="max-h-80 overflow-y-auto space-y-2">
          {customers.map((c) => (
            <button
              key={c._id || c.id}
              onClick={() => { setCustomer(c); setShowCustomerModal(false); }}
              className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-secondary-50 dark:hover:bg-secondary-700 text-left transition-colors"
            >
              <div className="w-10 h-10 bg-primary-100 dark:bg-primary-900/30 rounded-full flex items-center justify-center">
                <FiUser className="text-primary-600 dark:text-primary-400" />
              </div>
              <div>
                <p className="text-sm font-medium text-secondary-900 dark:text-white">{c.name || 'Unknown'}</p>
                <p className="text-xs text-secondary-500">{c.phone || c.email || 'No contact'}</p>
              </div>
            </button>
          ))}
          {customers.length === 0 && (
            <p className="text-center text-sm text-secondary-400 py-4">No customers found</p>
          )}
        </div>
      </Modal>

      <Modal isOpen={showInvoice} onClose={() => setShowInvoice(false)} title="Sale Complete" size="md">
        <div id="receipt-content" className="text-sm space-y-3">
          <div className="text-center border-b pb-3 mb-3">
            <h3 className="font-bold text-lg">ShopManager</h3>
            <p className="text-secondary-500">Sale Receipt</p>
            <p className="text-secondary-400 text-xs">{invoice?.createdAt ? new Date(invoice.createdAt).toLocaleString() : new Date().toLocaleString()}</p>
            <p className="text-secondary-400 text-xs">Invoice: #{invoice?.invoiceNumber || invoice?._id?.slice(-6) || 'N/A'}</p>
          </div>
          {customer && (
            <p className="text-secondary-500">Customer: {customer.name || customer.phone}</p>
          )}
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b">
                <th className="text-left py-1">Item</th>
                <th className="text-center py-1">Qty</th>
                <th className="text-right py-1">Price</th>
                <th className="text-right py-1">Total</th>
              </tr>
            </thead>
            <tbody>
              {(invoice?.items || cart).map((item, i) => (
                <tr key={i}>
                  <td className="py-1">{item.product?.name || item.name}</td>
                  <td className="text-center py-1">{item.quantity}</td>
                  <td className="text-right py-1">{formatCurrency(item.price)}</td>
                  <td className="text-right py-1">{formatCurrency(item.price * item.quantity)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <hr />
          <div className="space-y-1">
            <div className="flex justify-between"><span>Subtotal</span><span>{formatCurrency(invoice?.subtotal || subtotal)}</span></div>
            {(invoice?.discount || discountAmount) > 0 && (
              <div className="flex justify-between text-success-600"><span>Discount</span><span>-{formatCurrency(invoice?.discount || discountAmount)}</span></div>
            )}
            <div className="flex justify-between font-bold text-base"><span>Total</span><span>{formatCurrency(invoice?.total || grandTotal)}</span></div>
          </div>
          <div className="text-center text-secondary-400 text-xs pt-2 border-t">
            <p>Payment: {(invoice?.paymentMethod || paymentMethod).replace('_', ' ')}</p>
            <p>Thank you for your purchase!</p>
          </div>
        </div>
        <div className="flex gap-3 mt-4">
          <Button onClick={printReceipt} variant="secondary" icon={FiPrinter} className="flex-1">Print Receipt</Button>
          <Button onClick={() => setShowInvoice(false)} variant="primary" className="flex-1">Done</Button>
        </div>
      </Modal>
    </div>
  );
};

export default POSPage;