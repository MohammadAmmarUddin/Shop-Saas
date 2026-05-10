import { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { FiPlus, FiEdit2, FiTrash2, FiPackage } from 'react-icons/fi';
import { toast, confirmAction } from '../utils/swal';
import { productService } from '../services/productService';
import { formatCurrency } from '../utils/helpers';
import DataTable from '../components/common/DataTable.jsx';
import PageHeader from '../components/common/PageHeader.jsx';
import Button from '../components/common/Button.jsx';
import StatusBadge from '../components/common/StatusBadge.jsx';
import usePagination from '../hooks/usePagination';
import useDebounce from '../hooks/useDebounce';

const ProductsPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState(searchParams.get('search') || '');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [stockFilter, setStockFilter] = useState('all');
  const debouncedSearch = useDebounce(search, 400);
  const pagination = usePagination();

  const normalizeProduct = (product) => ({
    ...product,
    sellingPrice: product.sellingPrice ?? product.selling_price,
    stock: product.stock ?? product.stock_quantity,
    lowStockThreshold: product.lowStockThreshold ?? product.low_stock_threshold,
    status: product.status ?? (product.is_active ? 'active' : 'inactive'),
    image: product.image ?? (Array.isArray(product.images) && product.images.length > 0 ? product.images[0] : null),
  });

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      const params = {
        page: pagination.page,
        limit: pagination.limit,
        ...(debouncedSearch && { search: debouncedSearch }),
        ...(categoryFilter !== 'all' && { category: categoryFilter }),
        ...(stockFilter !== 'all' && { stockStatus: stockFilter }),
      };
      const res = await productService.getAll(params);
      const payload = res.data?.data || res.data || {};
      const raw = Array.isArray(payload.products) ? payload.products : Array.isArray(payload) ? payload : [];
      const data = raw.map(normalizeProduct);
      setProducts(data);
      pagination.updatePagination(res.data);
    } catch {
      toast.error('Failed to load products');
    } finally {
      setLoading(false);
    }
  }, [pagination.page, pagination.limit, debouncedSearch, categoryFilter, stockFilter]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const handleDelete = async (id) => {
    const confirmed = await confirmAction({
      title: 'Delete Product',
      text: 'Are you sure you want to delete this product? This action cannot be undone.',
      confirmText: 'Yes, delete it!',
    });
    if (!confirmed) return;
    try {
      await productService.delete(id);
      toast.success('Product deleted successfully');
      fetchProducts();
    } catch {
      toast.error('Failed to delete product');
    }
  };

  const columns = [
    {
      key: 'name',
      label: 'Product',
      render: (val, row) => (
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-secondary-100 dark:bg-secondary-700 rounded-lg flex items-center justify-center flex-shrink-0 overflow-hidden">
            {row.image ? (
              <img src={row.image} alt={val} className="w-full h-full object-cover" />
            ) : (
              <FiPackage className="text-secondary-400" />
            )}
          </div>
          <div>
            <p className="font-medium text-secondary-900 dark:text-white">{val}</p>
            {row.sku && <p className="text-xs text-secondary-500">SKU: {row.sku}</p>}
          </div>
        </div>
      ),
    },
    { key: 'sku', label: 'SKU', render: (val) => <span className="text-sm text-secondary-500">{val || '-'}</span> },
    { key: 'category', label: 'Category', render: (val) => <span className="text-sm">{val?.name || '-'}</span> },
    {
      key: 'sellingPrice',
      label: 'Price',
      render: (val) => <span className="font-medium">{formatCurrency(val || 0)}</span>,
    },
    {
      key: 'stock',
      label: 'Stock',
      render: (val, row) => {
        const threshold = row.lowStockThreshold || 5;
        if (val <= 0) return <span className="text-danger-600 font-medium">{val || 0}</span>;
        if (val <= threshold) return <span className="text-warning-600 font-medium">{val}</span>;
        return <span className="text-success-600 font-medium">{val}</span>;
      },
    },
    {
      key: 'status',
      label: 'Status',
      render: (val) => <StatusBadge status={val || 'active'} />,
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (_, row) => (
        <div className="flex items-center gap-2">
          <Link
            to={`/app/products/${row._id || row.id}/edit`}
            className="p-1.5 rounded-lg hover:bg-secondary-100 dark:hover:bg-secondary-700 text-secondary-500 hover:text-primary-600 transition-colors"
          >
            <FiEdit2 size={16} />
          </Link>
          <button
            onClick={(e) => { e.stopPropagation(); handleDelete(row._id || row.id); }}
            className="p-1.5 rounded-lg hover:bg-secondary-100 dark:hover:bg-secondary-700 text-secondary-500 hover:text-danger-600 transition-colors"
          >
            <FiTrash2 size={16} />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="page-container">
      <PageHeader
        title="Products"
        subtitle="Manage your product inventory"
        breadcrumbs={[{ label: 'Inventory' }, { label: 'Products' }]}
        actions={
          <Link to="/app/products/new">
            <Button variant="primary" icon={FiPlus}>Add Product</Button>
          </Link>
        }
      />

      <div className="flex flex-col sm:flex-row gap-4 mb-4">
        <input
          type="text"
          placeholder="Search by name, SKU, or barcode..."
          value={search}
          onChange={(e) => { setSearch(e.target.value); pagination.setPage(1); }}
          className="flex-1 px-4 py-2 border border-secondary-300 dark:border-secondary-600 rounded-lg bg-white dark:bg-secondary-800 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
        />
        <select
          value={categoryFilter}
          onChange={(e) => { setCategoryFilter(e.target.value); pagination.setPage(1); }}
          className="px-4 py-2 border border-secondary-300 dark:border-secondary-600 rounded-lg bg-white dark:bg-secondary-800 text-sm"
        >
          <option value="all">All Categories</option>
          <option value="category1">Category 1</option>
          <option value="category2">Category 2</option>
        </select>
        <select
          value={stockFilter}
          onChange={(e) => { setStockFilter(e.target.value); pagination.setPage(1); }}
          className="px-4 py-2 border border-secondary-300 dark:border-secondary-600 rounded-lg bg-white dark:bg-secondary-800 text-sm"
        >
          <option value="all">All Stock</option>
          <option value="in_stock">In Stock</option>
          <option value="low_stock">Low Stock</option>
          <option value="out_of_stock">Out of Stock</option>
        </select>
      </div>

      <DataTable
        columns={columns}
        data={products}
        loading={loading}
        searchable={false}
        exportable
        exportFilename="products"
        onRowClick={(row) => navigate(`/app/products/${row._id || row.id}/edit`)}
        page={pagination.page}
        totalPages={pagination.totalPages}
        totalItems={pagination.totalItems}
        limit={pagination.limit}
        onPageChange={pagination.goToPage}
        onLimitChange={pagination.changeLimit}
        emptyTitle="No products found"
        emptyMessage="Get started by adding your first product."
        emptyAction
        emptyActionLabel="Add Product"
        onEmptyAction={() => navigate('/app/products/new')}
      />
    </div>
  );
};

export default ProductsPage;