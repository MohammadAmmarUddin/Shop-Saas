import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { FiSave, FiArrowLeft, FiPackage, FiUpload } from 'react-icons/fi';
import { toast } from '../utils/swal';
import { productService } from '../services/productService';
import { categoryService } from '../services/categoryService';
import Button from '../components/common/Button.jsx';
import Card from '../components/common/Card.jsx';
import Input from '../components/common/Input.jsx';
import PageHeader from '../components/common/PageHeader.jsx';
import LoadingSpinner from '../components/common/LoadingSpinner.jsx';
import { PRODUCT_UNITS } from '../utils/constants';

const initialForm = {
  name: '',
  description: '',
  sku: '',
  barcode: '',
  category: '',
  purchasePrice: '',
  sellingPrice: '',
  wholesalePrice: '',
  stock: '',
  lowStockThreshold: '5',
  unit: 'piece',
  tax: '0',
  type: 'good',
  prescription: false,
  expiryDate: '',
  manufacturer: '',
  batchNumber: '',
  status: 'active',
  image: null,
  imagePreview: '',
};

const ProductFormPage = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = !!id;
  const [form, setForm] = useState(initialForm);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await categoryService.getAll();
        setCategories(res.data?.data || res.data?.categories || []);
      } catch {}
    };
    fetchCategories();
    if (isEdit) {
      const fetchProduct = async () => {
        try {
          const res = await productService.getById(id);
          const product = res.data?.data || res.data;
          const status = product.is_active === false ? 'inactive' : product.status || 'active';
          setForm({
            name: product.name || '',
            description: product.description || '',
            sku: product.sku || '',
            barcode: product.barcode || '',
            category: product.category_id || product.category?._id || product.category || '',
            purchasePrice: product.purchase_price || product.purchasePrice || '',
            sellingPrice: product.selling_price || product.sellingPrice || product.price || '',
            wholesalePrice: product.wholesale_price || product.wholesalePrice || '',
            stock: product.stock_quantity || product.stock || product.quantity || '',
            lowStockThreshold: product.low_stock_threshold || product.lowStockThreshold || '5',
            unit: product.unit || 'piece',
            tax: product.tax_percentage || product.tax || '0',
            type: product.type || 'good',
            prescription: product.requires_prescription || product.prescription || false,
            expiryDate: (product.expiry_date || product.expiryDate || '').split('T')[0] || '',
            manufacturer: product.manufacturer || '',
            batchNumber: product.batch_number || product.batchNumber || '',
            status,
            image: null,
            imagePreview: product.images?.[0] || product.image || '',
          });
        } catch {
          toast.error('Failed to load product');
          navigate('/app/products');
        } finally {
          setLoading(false);
        }
      };
      fetchProduct();
    }
  }, [id, isEdit, navigate]);

  const validate = () => {
    const errs = {};
    if (!form.name.trim()) errs.name = 'Product name is required';
    if (!form.sellingPrice && !form.price) errs.sellingPrice = 'Selling price is required';
    else if (Number(form.sellingPrice) < 0) errs.sellingPrice = 'Price cannot be negative';
    if (form.stock !== '' && Number(form.stock) < 0) errs.stock = 'Stock cannot be negative';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: '' }));
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setForm((prev) => ({
        ...prev,
        image: file,
        imagePreview: URL.createObjectURL(file),
      }));
    }
  };

  const fieldMap = {
    name: 'name', description: 'description', sku: 'sku', barcode: 'barcode',
    category: 'category_id', purchasePrice: 'purchase_price', sellingPrice: 'selling_price',
    wholesalePrice: 'wholesale_price', stock: 'stock_quantity', lowStockThreshold: 'low_stock_threshold',
    unit: 'unit', tax: 'tax_percentage', type: 'type',
    prescription: 'requires_prescription', expiryDate: 'expiry_date',
    manufacturer: 'manufacturer', batchNumber: 'batch_number',
  };

  const statusMap = { active: true, inactive: false, draft: false };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setSaving(true);
    try {
      const numericFields = ['category_id', 'purchase_price', 'selling_price', 'wholesale_price', 'stock_quantity', 'low_stock_threshold', 'tax_percentage'];
      const payload = {};
      Object.entries(form).forEach(([key, value]) => {
        if (key === 'imagePreview' || key === 'image' || key === 'status') return;
        const mapped = fieldMap[key] || key;
        payload[mapped] = numericFields.includes(mapped) ? (value === '' ? null : Number(value)) : value;
      });
      payload.is_active = statusMap[form.status] !== false;
      if (payload.expiry_date === '') payload.expiry_date = null;
      if (payload.category_id === null || payload.category_id === 0) payload.category_id = null;

      if (isEdit) {
        await productService.update(id, payload);
        toast.success('Product updated successfully');
      } else {
        await productService.create(payload);
        toast.success('Product created successfully');
      }
      navigate('/app/products');
    } catch (err) {
      toast.error(err.response?.data?.message || `Failed to ${isEdit ? 'update' : 'create'} product`);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <LoadingSpinner fullPage />;

  return (
    <div className="page-container max-w-4xl">
      <PageHeader
        title={isEdit ? 'Edit Product' : 'New Product'}
        subtitle={isEdit ? 'Update product information' : 'Add a new product to inventory'}
        breadcrumbs={[
          { label: 'Inventory' },
          { to: '/app/products', label: 'Products' },
          { label: isEdit ? 'Edit' : 'New' },
        ]}
        actions={
          <Button variant="secondary" icon={FiArrowLeft} onClick={() => navigate('/app/products')}>
            Back
          </Button>
        }
      />

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card header="Basic Information">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Product Name" name="name" value={form.name} onChange={handleChange}
              required error={errors.name} placeholder="Enter product name"
            />
            <Input
              label="Category" name="category" type="select" value={form.category}
              onChange={handleChange}
              options={[
                { value: '', label: 'Select category' },
                ...categories.map((c) => ({ value: c._id || c.id, label: c.name })),
              ]}
            />
            <Input label="SKU (Stock Keeping Unit)" name="sku" value={form.sku} onChange={handleChange} placeholder="e.g. PRD-001" />
            <Input label="Barcode" name="barcode" value={form.barcode} onChange={handleChange} placeholder="e.g. 8901234567890" />
            <Input label="Type" name="type" type="select" value={form.type} onChange={handleChange}
              options={[{ value: 'good', label: 'Good' }, { value: 'service', label: 'Service' }]}
            />
            <Input label="Unit" name="unit" type="select" value={form.unit} onChange={handleChange}
              options={PRODUCT_UNITS.map((u) => ({ value: u, label: u.charAt(0).toUpperCase() + u.slice(1) }))}
            />
          </div>
          <div className="mt-4">
            <Input label="Description" name="description" type="textarea" value={form.description}
              onChange={handleChange} placeholder="Product description..." rows={3}
            />
          </div>
        </Card>

        <Card header="Pricing">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Input label="Purchase Price" name="purchasePrice" type="number" value={form.purchasePrice}
              onChange={handleChange} placeholder="0.00" icon={FiPackage}
            />
            <Input label="Selling Price *" name="sellingPrice" type="number" value={form.sellingPrice}
              onChange={handleChange} required error={errors.sellingPrice} placeholder="0.00" icon={FiPackage}
            />
            <Input label="Wholesale Price" name="wholesalePrice" type="number" value={form.wholesalePrice}
              onChange={handleChange} placeholder="0.00" icon={FiPackage}
            />
            <Input label="Tax (%)" name="tax" type="number" value={form.tax} onChange={handleChange} placeholder="0" />
          </div>
        </Card>

        <Card header="Inventory">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Input label="Stock Quantity" name="stock" type="number" value={form.stock}
              onChange={handleChange} error={errors.stock} placeholder="0"
            />
            <Input label="Low Stock Threshold" name="lowStockThreshold" type="number" value={form.lowStockThreshold}
              onChange={handleChange} placeholder="5"
            />
          </div>
        </Card>

        {(form.type === 'good') && (
          <Card header="Additional Information">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input label="Manufacturer" name="manufacturer" value={form.manufacturer} onChange={handleChange} placeholder="Manufacturer name" />
              <Input label="Batch Number" name="batchNumber" value={form.batchNumber} onChange={handleChange} placeholder="Batch #" />
              <Input label="Expiry Date" name="expiryDate" type="date" value={form.expiryDate} onChange={handleChange} />
              <div className="flex items-center gap-3 pt-6">
                <input
                  type="checkbox" name="prescription" checked={form.prescription}
                  onChange={handleChange}
                  className="rounded border-secondary-300 dark:border-secondary-600 text-primary-600 focus:ring-primary-500"
                />
                <label className="text-sm font-medium text-secondary-700 dark:text-secondary-300">
                  Requires Prescription (Pharmacy)
                </label>
              </div>
            </div>
          </Card>
        )}

        <Card header="Image">
          <div className="flex items-center gap-6">
            <div className="w-32 h-32 bg-secondary-100 dark:bg-secondary-700 rounded-xl flex items-center justify-center overflow-hidden border-2 border-dashed border-secondary-300 dark:border-secondary-600">
              {form.imagePreview ? (
                <img src={form.imagePreview} alt="Preview" className="w-full h-full object-cover" />
              ) : (
                <FiPackage className="text-secondary-400 text-3xl" />
              )}
            </div>
            <div>
              <label className="btn-secondary cursor-pointer inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm">
                <FiUpload size={16} />
                Upload Image
                <input type="file" accept="image/*" onChange={handleImageChange} className="hidden" />
              </label>
              <p className="text-xs text-secondary-400 mt-2">PNG, JPG or WEBP. Max 2MB.</p>
            </div>
          </div>
        </Card>

        <Card header="Status">
          <Input name="status" type="select" value={form.status} onChange={handleChange}
            options={[
              { value: 'active', label: 'Active' },
              { value: 'inactive', label: 'Inactive' },
              { value: 'draft', label: 'Draft' },
            ]}
          />
        </Card>

        <div className="flex justify-end gap-3">
          <Button variant="secondary" onClick={() => navigate('/app/products')}>Cancel</Button>
          <Button type="submit" variant="primary" icon={FiSave} loading={saving}>
            {isEdit ? 'Update Product' : 'Create Product'}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default ProductFormPage;
