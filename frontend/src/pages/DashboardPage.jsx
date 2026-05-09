import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FiDollarSign, FiPackage, FiUsers, FiTrendingUp, FiShoppingCart, FiAlertTriangle, FiClock, FiArrowRight } from 'react-icons/fi';
import { Line, Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';
import { formatCurrency, formatDate, timeAgo, formatNumber } from '../utils/helpers';
import { CHART_COLORS } from '../utils/constants';
import { dashboardService } from '../services/dashboardService';
import StatsCard from '../components/common/StatsCard.jsx';
import Card from '../components/common/Card.jsx';
import LoadingSpinner from '../components/common/LoadingSpinner.jsx';
import StatusBadge from '../components/common/StatusBadge.jsx';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, ArcElement, Title, Tooltip, Legend, Filler);

const DashboardPage = () => {
  const [stats, setStats] = useState(null);
  const [salesChart, setSalesChart] = useState(null);
  const [revenueChart, setRevenueChart] = useState(null);
  const [recentSales, setRecentSales] = useState([]);
  const [lowStock, setLowStock] = useState([]);
  const [topProducts, setTopProducts] = useState([]);
  const [recentActivity, setRecentActivity] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [statsRes, chartsRes, activityRes] = await Promise.allSettled([
          dashboardService.getStats(),
          dashboardService.getCharts('week'),
          dashboardService.getActivity(5),
        ]);

        if (statsRes.status === 'fulfilled') {
          const d = statsRes.value.data?.data || statsRes.value.data;
          const s = d?.stats || d;
          setStats({
            todaySales: s?.sales?.today?.total || 0,
            totalProducts: s?.products?.total || s?.productCount || 0,
            totalCustomers: s?.customers || 0,
            monthlyRevenue: s?.sales?.this_month?.total || 0,
            todaySalesTrend: 0,
            productsTrend: 0,
            customersTrend: 0,
            revenueTrend: 0,
          });
          setRecentSales((d?.recent_sales || []).map(sale => ({
            ...sale,
            invoiceNumber: sale.invoice_number,
            createdAt: sale.created_at,
            total: sale.total_amount,
            paymentStatus: sale.payment_status,
          })));
          setLowStock((d?.low_stock_products || []).map(p => ({
            ...p,
            stock: p.stock_quantity,
          })));
          setTopProducts((d?.top_products || []).map(p => ({
            ...p,
            name: p.name,
            quantity: p.total_sold || p.quantity,
            revenue: p.total_revenue || p.revenue,
          })));
        }

        if (chartsRes.status === 'fulfilled') {
          const d = chartsRes.value.data?.data || chartsRes.value.data;
          const sales = d?.sales || [];
          const expenses = d?.expenses || [];
          const uniqueLabels = [...new Set([...sales.map(s => s.period), ...expenses.map(s => s.period)])].sort();
          setSalesChart({
            labels: uniqueLabels,
            data: uniqueLabels.map(l => { const found = sales.find(s => s.period === l); return found ? parseFloat(found.total) || 0 : 0; }),
          });
          setRevenueChart({
            labels: uniqueLabels,
            revenue: uniqueLabels.map(l => { const found = sales.find(s => s.period === l); return found ? parseFloat(found.total) || 0 : 0; }),
            expenses: uniqueLabels.map(l => { const found = expenses.find(s => s.period === l); return found ? parseFloat(found.total) || 0 : 0; }),
          });
        }

        if (activityRes.status === 'fulfilled') {
          const d = activityRes.value.data?.data || activityRes.value.data;
          setRecentActivity(Array.isArray(d) ? d : []);
        }
      } catch {
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const salesLineData = salesChart ? {
    labels: salesChart.labels || ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
    datasets: [{
      label: 'Sales',
      data: salesChart.data || [0, 0, 0, 0, 0, 0, 0],
      fill: true,
      borderColor: CHART_COLORS.primary,
      backgroundColor: 'rgba(79, 70, 229, 0.1)',
      tension: 0.4,
      pointBackgroundColor: CHART_COLORS.primary,
      pointBorderColor: '#fff',
      pointBorderWidth: 2,
      pointRadius: 4,
    }],
  } : null;

  const revenueBarData = revenueChart ? {
    labels: revenueChart.labels || ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
    datasets: [
      {
        label: 'Revenue',
        data: revenueChart.revenue || revenueChart.data || [0, 0, 0, 0, 0, 0],
        backgroundColor: 'rgba(79, 70, 229, 0.8)',
        borderColor: CHART_COLORS.primary,
        borderWidth: 1,
        borderRadius: 4,
      },
      {
        label: 'Expenses',
        data: revenueChart.expenses || [0, 0, 0, 0, 0, 0],
        backgroundColor: 'rgba(239, 68, 68, 0.8)',
        borderColor: CHART_COLORS.danger,
        borderWidth: 1,
        borderRadius: 4,
      },
    ],
  } : null;

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: '#1e293b',
        titleColor: '#f1f5f9',
        bodyColor: '#cbd5e1',
        padding: 12,
        cornerRadius: 8,
      },
    },
    scales: {
      x: {
        grid: { display: false },
        ticks: { color: '#94a3b8', font: { size: 11 } },
      },
      y: {
        grid: { color: 'rgba(148, 163, 184, 0.1)' },
        ticks: { color: '#94a3b8', font: { size: 11 }, callback: (v) => '$' + v },
      },
    },
  };

  if (loading) return <LoadingSpinner fullPage />;

  return (
    <div className="p-4 md:p-6 lg:p-8 space-y-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold text-secondary-900 dark:text-white">Dashboard</h1>
        <p className="mt-1 text-sm text-secondary-500 dark:text-secondary-400">Overview of your store performance</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard
          icon={FiDollarSign}
          label="Today's Sales"
          value={stats?.todaySales ?? 0}
          trend={stats?.todaySalesTrend ?? 0}
          trendLabel="vs yesterday"
          color="primary"
          currency
        />
        <StatsCard
          icon={FiPackage}
          label="Total Products"
          value={stats?.totalProducts ?? 0}
          trend={stats?.productsTrend ?? 0}
          trendLabel="this month"
          color="success"
        />
        <StatsCard
          icon={FiUsers}
          label="Total Customers"
          value={stats?.totalCustomers ?? 0}
          trend={stats?.customersTrend ?? 0}
          trendLabel="this month"
          color="info"
        />
        <StatsCard
          icon={FiTrendingUp}
          label="Monthly Revenue"
          value={stats?.monthlyRevenue ?? 0}
          trend={stats?.revenueTrend ?? 0}
          trendLabel="vs last month"
          color="warning"
          currency
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2" header="Sales Overview (Last 7 Days)">
          <div className="h-72">
            {salesLineData ? (
              <Line data={salesLineData} options={chartOptions} />
            ) : (
              <div className="flex items-center justify-center h-full text-secondary-400">No data available</div>
            )}
          </div>
        </Card>

        <Card header="Recent Sales">
          <div className="space-y-3">
            {recentSales.length === 0 ? (
              <p className="text-sm text-secondary-400 text-center py-8">No recent sales</p>
            ) : (
              recentSales.map((sale, i) => (
                <Link key={sale._id || sale.id || i} to={`/app/sales/${sale._id || sale.id}`} className="flex items-center justify-between p-3 rounded-lg hover:bg-secondary-50 dark:hover:bg-secondary-700/50 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 bg-primary-100 dark:bg-primary-900/30 rounded-lg flex items-center justify-center">
                      <FiShoppingCart className="text-primary-600 dark:text-primary-400" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-secondary-900 dark:text-white">
                        #{sale.invoiceNumber || sale._id?.slice(-6) || 'N/A'}
                      </p>
                      <p className="text-xs text-secondary-500">{formatDate(sale.createdAt)}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-secondary-900 dark:text-white">{formatCurrency(sale.total)}</p>
                    <StatusBadge status={sale.paymentStatus} size="sm" />
                  </div>
                </Link>
              ))
            )}
            <Link to="/app/sales" className="flex items-center justify-center gap-1 text-sm text-primary-600 hover:text-primary-500 font-medium py-2">
              View All Sales <FiArrowRight size={16} />
            </Link>
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card header="Monthly Revenue vs Expenses">
          <div className="h-72">
            {revenueBarData ? (
              <Bar data={revenueBarData} options={chartOptions} />
            ) : (
              <div className="flex items-center justify-center h-full text-secondary-400">No data available</div>
            )}
          </div>
        </Card>

        <div className="space-y-6">
          <Card header="Low Stock Alerts">
            <div className="space-y-2">
              {lowStock.length === 0 ? (
                <p className="text-sm text-secondary-400 text-center py-4">All products are well stocked</p>
              ) : (
                lowStock.map((product, i) => (
                  <Link key={product._id || product.id || i} to={`/app/products/${product._id || product.id}/edit`} className="flex items-center justify-between p-3 rounded-lg hover:bg-secondary-50 dark:hover:bg-secondary-700/50 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 bg-danger-100 dark:bg-danger-900/30 rounded-lg flex items-center justify-center">
                        <FiAlertTriangle className="text-danger-600 dark:text-danger-400" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-secondary-900 dark:text-white">{product.name}</p>
                        <p className="text-xs text-secondary-500">SKU: {product.sku || 'N/A'}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={`text-sm font-semibold ${product.stock <= 0 ? 'text-danger-600' : 'text-warning-600'}`}>
                        {product.stock ?? 0} left
                      </p>
                    </div>
                  </Link>
                ))
              )}
              <Link to="/app/products" className="flex items-center justify-center gap-1 text-sm text-primary-600 hover:text-primary-500 font-medium py-2">
                View All Products <FiArrowRight size={16} />
              </Link>
            </div>
          </Card>

          <Card header="Recent Activity">
            <div className="space-y-2">
              {recentActivity.length === 0 ? (
                <p className="text-sm text-secondary-400 text-center py-4">No recent activity</p>
              ) : (
                recentActivity.map((activity, i) => (
                  <div key={i} className="flex items-start gap-3 p-2">
                    <div className="w-2 h-2 mt-2 bg-primary-500 rounded-full flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-secondary-700 dark:text-secondary-300">{activity.message}</p>
                      <p className="text-xs text-secondary-400">{timeAgo(activity.createdAt)}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </Card>
        </div>
      </div>

      <Card header="Top Selling Products">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-secondary-200 dark:border-secondary-700">
                <th className="px-4 py-3 text-left text-xs font-semibold text-secondary-500 uppercase">Product</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-secondary-500 uppercase">Sold</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-secondary-500 uppercase">Revenue</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-secondary-200 dark:divide-secondary-700">
              {topProducts.length === 0 ? (
                <tr>
                  <td colSpan={3} className="px-4 py-8 text-center text-sm text-secondary-400">No data available</td>
                </tr>
              ) : (
                topProducts.map((product, i) => (
                  <tr key={i} className="hover:bg-secondary-50 dark:hover:bg-secondary-700/50">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <span className="text-sm font-medium text-secondary-900 dark:text-white">{product.name || product.product?.name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-secondary-600 dark:text-secondary-400">{formatNumber(product.quantity || product.totalSold || 0)}</td>
                    <td className="px-4 py-3 text-sm text-right font-medium text-secondary-900 dark:text-white">{formatCurrency(product.revenue || product.totalRevenue || 0)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};

export default DashboardPage;
