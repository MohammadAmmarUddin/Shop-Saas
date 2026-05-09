import { useState, useEffect } from 'react';
import { FiUsers, FiCreditCard, FiTrendingUp, FiUserPlus, FiDollarSign } from 'react-icons/fi';
import { Line, Bar, Doughnut } from 'react-chartjs-2';
import { ArcElement } from 'chart.js';
import { tenantService } from '../services/tenantService';
import { formatCurrency, formatNumber, formatDate } from '../utils/helpers';
import { CHART_COLORS, CHART_COLOR_ARRAYS } from '../utils/constants';
import StatsCard from '../components/common/StatsCard.jsx';
import Card from '../components/common/Card.jsx';
import LoadingSpinner from '../components/common/LoadingSpinner.jsx';
import PageHeader from '../components/common/PageHeader.jsx';

const AnalyticsPage = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await tenantService.getStats();
        setStats(res.data?.data || res.data);
      } catch {} finally { setLoading(false); }
    };
    fetchStats();
  }, []);

  if (loading) return <LoadingSpinner fullPage />;

  const storeGrowthData = stats?.storeGrowth ? {
    labels: stats.storeGrowth.labels || ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
    datasets: [{
      label: 'Total Stores',
      data: stats.storeGrowth.data || [0, 0, 0, 0, 0, 0],
      borderColor: CHART_COLORS.primary,
      backgroundColor: 'rgba(79,70,229,0.1)',
      fill: true,
      tension: 0.4,
    }],
  } : null;

  const revenueData = stats?.revenueData ? {
    labels: stats.revenueData.labels || ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
    datasets: [{
      label: 'MRR',
      data: stats.revenueData.data || [0, 0, 0, 0, 0, 0],
      backgroundColor: 'rgba(34,197,94,0.8)',
      borderRadius: 4,
    }],
  } : null;

  const planDistribution = stats?.planDistribution ? {
    labels: Object.keys(stats.planDistribution).map((k) => k.charAt(0).toUpperCase() + k.slice(1)),
    datasets: [{
      data: Object.values(stats.planDistribution),
      backgroundColor: CHART_COLOR_ARRAYS.default,
      borderWidth: 0,
    }],
  } : null;

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

  return (
    <div className="p-4 md:p-6 lg:p-8 space-y-6">
      <PageHeader title="Analytics" subtitle="Platform-wide SaaS metrics and insights" breadcrumbs={[{ label: 'Admin' }, { label: 'Analytics' }]} />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard icon={FiUsers} label="Total Stores" value={stats?.totalStores ?? 0} trend={stats?.storeGrowthRate ?? 0} trendLabel="this month" color="primary" />
        <StatsCard icon={FiCreditCard} label="Active Subscriptions" value={stats?.activeSubscriptions ?? 0} trend={stats?.subscriptionRate ?? 0} trendLabel="this month" color="success" />
        <StatsCard icon={FiDollarSign} label="Monthly Recurring Revenue" value={stats?.mrr ?? 0} trend={stats?.mrrGrowth ?? 0} color="warning" currency />
        <StatsCard icon={FiUserPlus} label="Trial Users" value={stats?.trialUsers ?? 0} trend={stats?.trialConversion ?? 0} trendLabel="conversion rate" color="info" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card header="Store Growth"><div className="h-72">{storeGrowthData ? <Line data={storeGrowthData} options={{ ...chartOptions, scales: { ...chartOptions.scales, y: { ...chartOptions.scales.y, ticks: { ...chartOptions.scales.y.ticks, callback: undefined } } } }} /> : <div className="flex items-center justify-center h-full text-secondary-400">No data</div>}</div></Card>
        <Card header="Revenue (MRR)"><div className="h-72">{revenueData ? <Bar data={revenueData} options={{ ...chartOptions, scales: { ...chartOptions.scales, y: { ...chartOptions.scales.y, ticks: { ...chartOptions.scales.y.ticks, callback: undefined } } } }} /> : <div className="flex items-center justify-center h-full text-secondary-400">No data</div>}</div></Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card header="Plan Distribution"><div className="h-64 flex items-center justify-center">{planDistribution ? <Doughnut data={planDistribution} options={{ cutout: '60%', plugins: { legend: { position: 'bottom', labels: { color: '#94a3b8', padding: 16 } } } }} /> : <p className="text-secondary-400">No data</p>}</div></Card>
        <Card header="Recent Registrations" className="lg:col-span-2">
          {stats?.recentRegistrations?.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead><tr className="border-b"><th className="text-left py-2 text-xs text-secondary-500 uppercase">Store</th><th className="text-left py-2 text-xs text-secondary-500 uppercase">Plan</th><th className="text-left py-2 text-xs text-secondary-500 uppercase">Date</th></tr></thead>
                <tbody className="divide-y">{(stats.recentRegistrations || []).map((r, i) => <tr key={i}><td className="py-2 font-medium">{r.name}</td><td className="py-2"><span className="badge-info capitalize">{r.plan}</span></td><td className="py-2 text-secondary-500">{formatDate(r.createdAt)}</td></tr>)}</tbody>
              </table>
            </div>
          ) : <p className="text-sm text-secondary-400 text-center py-8">No recent registrations</p>}
        </Card>
      </div>
    </div>
  );
};

export default AnalyticsPage;
