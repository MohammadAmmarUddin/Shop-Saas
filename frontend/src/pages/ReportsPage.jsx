import { useState, useEffect } from 'react';
import { FiBarChart2, FiDollarSign, FiPackage, FiUsers, FiPrinter, FiDownload } from 'react-icons/fi';
import { Bar, Line, Doughnut } from 'react-chartjs-2';
import {
  Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, BarElement, ArcElement, Title, Tooltip, Legend, Filler,
} from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, ArcElement, Title, Tooltip, Legend, Filler);
import { toast } from '../utils/swal';
import { reportService } from '../services/reportService';
import { formatCurrency, formatNumber } from '../utils/helpers';
import { CHART_COLORS, CHART_COLOR_ARRAYS } from '../utils/constants';
import PageHeader from '../components/common/PageHeader.jsx';
import Card from '../components/common/Card.jsx';
import Button from '../components/common/Button.jsx';
import LoadingSpinner from '../components/common/LoadingSpinner.jsx';
import ExportButton from '../components/common/ExportButton.jsx';

const tabs = [
  { id: 'sales', label: 'Sales', icon: FiDollarSign },
  { id: 'purchases', label: 'Purchases', icon: FiPackage },
  { id: 'profit', label: 'Profit / Loss', icon: FiBarChart2 },
  { id: 'inventory', label: 'Inventory', icon: FiPackage },
  { id: 'customers', label: 'Customers', icon: FiUsers },
];

const ReportsPage = () => {
  const [activeTab, setActiveTab] = useState('sales');
  const [dateFrom, setDateFrom] = useState(() => {
    const d = new Date(); d.setDate(1); return d.toISOString().split('T')[0];
  });
  const [dateTo, setDateTo] = useState(() => new Date().toISOString().split('T')[0]);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);

  const toNumber = (value) => Number(value || 0);

  const buildChart = (labels, datasets, type = 'line') => ({
    labels,
    datasets: datasets.map((dataset) => ({
      ...dataset,
      borderWidth: dataset.borderWidth ?? 2,
      tension: dataset.tension ?? (type === 'line' ? 0.35 : 0),
      fill: dataset.fill ?? (type === 'line'),
      pointRadius: dataset.pointRadius ?? (type === 'line' ? 3 : 0),
    })),
  });

  useEffect(() => {
    const fetchReport = async () => {
      setLoading(true);
      try {
        const params = { start_date: dateFrom, end_date: dateTo };
        let res;
        switch (activeTab) {
          case 'sales': res = await reportService.getSalesReport(params); break;
          case 'purchases': res = await reportService.getPurchasesReport(params); break;
          case 'profit': res = await reportService.getProfitLoss(params); break;
          case 'inventory': res = await reportService.getInventoryReport(params); break;
          case 'customers': res = await reportService.getCustomerReport(params); break;
          default: return;
        }
        const raw = res.data?.data || res.data || {};

        if (activeTab === 'sales') {
          const breakdown = raw.breakdown || [];
          const totals = raw.totals || {};
          const labels = breakdown.map((row) => row.period);
          const values = breakdown.map((row) => toNumber(row.total_revenue));
          setData({
            totalSales: toNumber(totals.total_revenue),
            totalTransactions: toNumber(totals.total_orders),
            averageOrder: toNumber(totals.total_orders) > 0 ? toNumber(totals.total_revenue) / toNumber(totals.total_orders) : 0,
            chart: buildChart(labels, [{
              label: 'Sales',
              data: values,
              borderColor: CHART_COLORS.primary,
              backgroundColor: 'rgba(79, 70, 229, 0.12)',
            }]),
            topProducts: [],
          });
          return;
        }

        if (activeTab === 'purchases') {
          const breakdown = raw.breakdown || [];
          const totals = raw.totals || {};
          const labels = breakdown.map((row) => row.period);
          const values = breakdown.map((row) => toNumber(row.total_amount));
          setData({
            totalPurchases: toNumber(totals.total_amount),
            totalOrders: toNumber(totals.total_purchases),
            activeSuppliers: 0,
            chart: buildChart(labels, [{
              label: 'Purchases',
              data: values,
              borderColor: CHART_COLORS.warning,
              backgroundColor: 'rgba(245, 158, 11, 0.18)',
            }], 'bar'),
          });
          return;
        }

        if (activeTab === 'profit') {
          const breakdown = raw.breakdown || [];
          const totals = raw.totals || {};
          const labels = breakdown.map((row) => row.period);
          setData({
            revenue: toNumber(totals.revenue),
            expenses: toNumber(totals.expenses),
            netProfit: toNumber(totals.net_profit),
            margin: toNumber(totals.revenue) > 0 ? (toNumber(totals.net_profit) / toNumber(totals.revenue)) * 100 : 0,
            chart: buildChart(labels, [
              {
                label: 'Revenue',
                data: breakdown.map((row) => toNumber(row.revenue)),
                borderColor: CHART_COLORS.success,
                backgroundColor: 'rgba(34, 197, 94, 0.18)',
              },
              {
                label: 'Expenses',
                data: breakdown.map((row) => toNumber(row.expenses)),
                borderColor: CHART_COLORS.danger,
                backgroundColor: 'rgba(239, 68, 68, 0.18)',
              },
            ], 'bar'),
          });
          return;
        }

        if (activeTab === 'inventory') {
          const products = raw.products || [];
          const stats = raw.stats || {};
          const categoryCounts = products.reduce((acc, product) => {
            const key = product.category_name || 'Uncategorized';
            acc[key] = (acc[key] || 0) + 1;
            return acc;
          }, {});
          setData({
            totalProducts: toNumber(stats.total_products),
            stockValue: toNumber(stats.total_inventory_value),
            lowStock: toNumber(stats.low_stock_count),
            outOfStock: toNumber(stats.out_of_stock),
            categoryChart: {
              labels: Object.keys(categoryCounts),
              datasets: [{
                data: Object.values(categoryCounts),
                backgroundColor: CHART_COLOR_ARRAYS.default.slice(0, Math.max(Object.keys(categoryCounts).length, 1)),
              }],
            },
            lowStockItems: products.filter((product) => toNumber(product.stock_quantity) <= toNumber(product.low_stock_threshold)),
          });
          return;
        }

        if (activeTab === 'customers') {
          const rows = Array.isArray(raw) ? raw : [];
          const totalSpent = rows.reduce((sum, row) => sum + toNumber(row.total_spent), 0);
          const totalOrders = rows.reduce((sum, row) => sum + toNumber(row.total_orders), 0);
          setData({
            totalCustomers: rows.length,
            newCustomers: 0,
            avgSpend: rows.length > 0 ? totalSpent / rows.length : 0,
            topCustomers: rows.map((row) => ({
              name: row.customer_name,
              orders: toNumber(row.total_orders),
              totalSpent: toNumber(row.total_spent),
            })),
          });
          return;
        }

        setData(raw);
      } catch { toast.error('Failed to load report'); }
      finally { setLoading(false); }
    };
    fetchReport();
  }, [activeTab, dateFrom, dateTo]);

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { labels: { color: '#94a3b8', font: { size: 11 } } },
    },
    scales: {
      x: { grid: { display: false }, ticks: { color: '#94a3b8' } },
      y: { grid: { color: 'rgba(148,163,184,0.1)' }, ticks: { color: '#94a3b8', callback: (v) => '$' + v } },
    },
  };

  const renderTabContent = () => {
    if (loading) return <div className="py-20"><LoadingSpinner /></div>;
    if (!data) return <div className="py-20 text-center text-secondary-400">No data available for the selected period</div>;

    switch (activeTab) {
      case 'sales':
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Card><p className="text-sm text-secondary-500">Total Sales</p><p className="text-2xl font-bold text-secondary-900 dark:text-white">{formatCurrency(data.totalSales || 0)}</p></Card>
              <Card><p className="text-sm text-secondary-500">Total Transactions</p><p className="text-2xl font-bold text-secondary-900 dark:text-white">{formatNumber(data.totalTransactions || 0)}</p></Card>
              <Card><p className="text-sm text-secondary-500">Average Order Value</p><p className="text-2xl font-bold text-secondary-900 dark:text-white">{formatCurrency(data.averageOrder || 0)}</p></Card>
            </div>
            <Card header="Sales Trend"><div className="h-80">{data.chart && <Line data={data.chart} options={chartOptions} />}</div></Card>
            {data.topProducts && (
              <Card header="Top Products">
                <div className="overflow-x-auto"><table className="w-full text-sm"><thead><tr className="border-b"><th className="text-left py-2 text-xs text-secondary-500 uppercase">Product</th><th className="text-right py-2 text-xs text-secondary-500 uppercase">Sold</th><th className="text-right py-2 text-xs text-secondary-500 uppercase">Revenue</th></tr></thead><tbody className="divide-y">{(data.topProducts || []).map((p, i) => <tr key={i}><td className="py-2">{p.name}</td><td className="text-right py-2">{formatNumber(p.quantity)}</td><td className="text-right py-2 font-medium">{formatCurrency(p.revenue)}</td></tr>)}</tbody></table></div>
              </Card>
            )}
          </div>
        );

      case 'purchases':
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Card><p className="text-sm text-secondary-500">Total Purchases</p><p className="text-2xl font-bold text-secondary-900 dark:text-white">{formatCurrency(data.totalPurchases || 0)}</p></Card>
              <Card><p className="text-sm text-secondary-500">Total Orders</p><p className="text-2xl font-bold text-secondary-900 dark:text-white">{formatNumber(data.totalOrders || 0)}</p></Card>
              <Card><p className="text-sm text-secondary-500">Active Suppliers</p><p className="text-2xl font-bold text-secondary-900 dark:text-white">{formatNumber(data.activeSuppliers || 0)}</p></Card>
            </div>
            <Card header="Purchase Trend"><div className="h-80">{data.chart && <Bar data={data.chart} options={chartOptions} />}</div></Card>
          </div>
        );

      case 'profit':
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
              <Card><p className="text-sm text-secondary-500">Revenue</p><p className="text-2xl font-bold text-success-600">{formatCurrency(data.revenue || 0)}</p></Card>
              <Card><p className="text-sm text-secondary-500">Expenses</p><p className="text-2xl font-bold text-danger-600">{formatCurrency(data.expenses || 0)}</p></Card>
              <Card><p className="text-sm text-secondary-500">Net Profit</p><p className={`text-2xl font-bold ${(data.netProfit || 0) >= 0 ? 'text-success-600' : 'text-danger-600'}`}>{formatCurrency(data.netProfit || 0)}</p></Card>
              <Card><p className="text-sm text-secondary-500">Margin</p><p className="text-2xl font-bold text-secondary-900 dark:text-white">{(data.margin || 0).toFixed(1)}%</p></Card>
            </div>
            <Card header="Revenue vs Expenses"><div className="h-80">{data.chart && <Bar data={data.chart} options={chartOptions} />}</div></Card>
          </div>
        );

      case 'inventory':
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
              <Card><p className="text-sm text-secondary-500">Total Products</p><p className="text-2xl font-bold">{formatNumber(data.totalProducts || 0)}</p></Card>
              <Card><p className="text-sm text-secondary-500">Stock Value</p><p className="text-2xl font-bold">{formatCurrency(data.stockValue || 0)}</p></Card>
              <Card><p className="text-sm text-secondary-500">Low Stock Items</p><p className="text-2xl font-bold text-warning-600">{formatNumber(data.lowStock || 0)}</p></Card>
              <Card><p className="text-sm text-secondary-500">Out of Stock</p><p className="text-2xl font-bold text-danger-600">{formatNumber(data.outOfStock || 0)}</p></Card>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card header="Stock by Category"><div className="h-64">{data.categoryChart && <Doughnut data={data.categoryChart} options={{ ...chartOptions, scales: undefined }} />}</div></Card>
              <Card header="Low Stock Items">{data.lowStockItems?.length > 0 ? <div className="overflow-x-auto"><table className="w-full text-sm"><thead><tr className="border-b"><th className="text-left py-2 text-xs text-secondary-500 uppercase">Product</th><th className="text-right py-2 text-xs text-secondary-500 uppercase">Stock</th></tr></thead><tbody className="divide-y">{(data.lowStockItems || []).map((p, i) => <tr key={i}><td className="py-2">{p.name}</td><td className="text-right py-2 text-warning-600 font-medium">{p.stock || p.quantity}</td></tr>)}</tbody></table></div> : <p className="text-sm text-secondary-400 text-center py-8">All products well stocked</p>}</Card>
            </div>
          </div>
        );

      case 'customers':
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Card><p className="text-sm text-secondary-500">Total Customers</p><p className="text-2xl font-bold">{formatNumber(data.totalCustomers || 0)}</p></Card>
              <Card><p className="text-sm text-secondary-500">New Customers</p><p className="text-2xl font-bold text-primary-600">{formatNumber(data.newCustomers || 0)}</p></Card>
              <Card><p className="text-sm text-secondary-500">Avg. Spend</p><p className="text-2xl font-bold">{formatCurrency(data.avgSpend || 0)}</p></Card>
            </div>
            <Card header="Top Customers">
              {data.topCustomers?.length > 0 ? <div className="overflow-x-auto"><table className="w-full text-sm"><thead><tr className="border-b"><th className="text-left py-2 text-xs text-secondary-500 uppercase">Customer</th><th className="text-right py-2 text-xs text-secondary-500 uppercase">Orders</th><th className="text-right py-2 text-xs text-secondary-500 uppercase">Total Spent</th></tr></thead><tbody className="divide-y">{(data.topCustomers || []).map((c, i) => <tr key={i}><td className="py-2 font-medium">{c.name}</td><td className="text-right py-2">{formatNumber(c.orders || c.totalOrders)}</td><td className="text-right py-2 font-medium">{formatCurrency(c.totalSpent || c.revenue)}</td></tr>)}</tbody></table></div> : <p className="text-sm text-secondary-400 text-center py-8">No customer data</p>}
            </Card>
          </div>
        );

      default: return null;
    }
  };

  return (
    <div className="page-container">
      <PageHeader title="Reports" subtitle="Analyze your business performance" breadcrumbs={[{ label: 'Management' }, { label: 'Reports' }]} />

      <div className="flex flex-wrap items-center gap-4 mb-6">
        <div className="flex gap-2 bg-secondary-100 dark:bg-secondary-800 rounded-xl p-1">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeTab === tab.id
                  ? 'bg-white dark:bg-secondary-700 text-primary-600 dark:text-primary-400 shadow-sm'
                  : 'text-secondary-500 hover:text-secondary-700 dark:hover:text-secondary-300'
              }`}
            >
              <tab.icon size={16} />
              {tab.label}
            </button>
          ))}
        </div>
        <div className="flex-1" />
        <div className="flex items-center gap-2">
          <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className="px-3 py-2 border border-secondary-300 dark:border-secondary-600 rounded-lg bg-white dark:bg-secondary-800 text-sm" />
          <span className="text-secondary-400">to</span>
          <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className="px-3 py-2 border border-secondary-300 dark:border-secondary-600 rounded-lg bg-white dark:bg-secondary-800 text-sm" />
        </div>
      </div>

      {renderTabContent()}
    </div>
  );
};

export default ReportsPage;
