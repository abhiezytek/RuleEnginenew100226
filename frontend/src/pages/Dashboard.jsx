import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Header } from '../components/layout/Header';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { StatusBadge, CaseTypeBadge } from '../components/shared/StatusBadge';
import { PageLoader } from '../components/shared/LoadingSpinner';
import { getDashboardStats, seedData } from '../lib/api';
import { toast } from 'sonner';
import { 
  FileCode2, 
  CheckCircle, 
  XCircle, 
  TrendingUp,
  Plus,
  RefreshCw,
  Clock,
  Database
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';

const COLORS = ['#0ea5e9', '#8b5cf6', '#f59e0b', '#10b981', '#ef4444', '#6366f1', '#ec4899', '#14b8a6'];

const Dashboard = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [seeding, setSeeding] = useState(false);

  const fetchStats = async () => {
    try {
      setLoading(true);
      const response = await getDashboardStats();
      setStats(response.data);
    } catch (error) {
      console.error('Failed to fetch stats:', error);
      toast.error('Failed to load dashboard stats');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  const handleSeedData = async () => {
    try {
      setSeeding(true);
      await seedData();
      toast.success('Sample data seeded successfully');
      fetchStats();
    } catch (error) {
      console.error('Failed to seed data:', error);
      toast.error('Failed to seed sample data');
    } finally {
      setSeeding(false);
    }
  };

  if (loading) {
    return (
      <div className="p-6">
        <Header title="Dashboard" subtitle="Underwriting Rule Engine Overview" />
        <PageLoader />
      </div>
    );
  }

  const categoryData = stats?.category_distribution?.map((item, index) => ({
    name: item.category?.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()) || 'Unknown',
    value: item.count,
    fill: COLORS[index % COLORS.length]
  })) || [];

  const stpData = [
    { name: 'Pass', value: stats?.stp_pass || 0, fill: '#10b981' },
    { name: 'Fail', value: stats?.stp_fail || 0, fill: '#ef4444' },
  ];

  return (
    <div className="min-h-screen" data-testid="dashboard-page">
      <Header title="Dashboard" subtitle="Underwriting Rule Engine Overview" />
      
      <div className="p-6 space-y-6">
        {/* Quick Actions */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link to="/rules/new">
              <Button data-testid="create-rule-btn">
                <Plus className="w-4 h-4 mr-2" />
                Create Rule
              </Button>
            </Link>
            <Link to="/evaluate">
              <Button variant="outline" data-testid="evaluate-btn">
                <TrendingUp className="w-4 h-4 mr-2" />
                Evaluate Proposal
              </Button>
            </Link>
          </div>
          <div className="flex items-center gap-2">
            <Button 
              variant="outline" 
              onClick={handleSeedData} 
              disabled={seeding}
              data-testid="seed-data-btn"
            >
              <Database className="w-4 h-4 mr-2" />
              {seeding ? 'Seeding...' : 'Seed Sample Data'}
            </Button>
            <Button variant="ghost" size="icon" onClick={fetchStats} data-testid="refresh-btn">
              <RefreshCw className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Metrics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="border-slate-200" data-testid="total-rules-card">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-500 uppercase tracking-wide">Total Rules</p>
                  <p className="text-3xl font-bold text-slate-900 mt-1">{stats?.total_rules || 0}</p>
                </div>
                <div className="w-12 h-12 rounded-full bg-sky-100 flex items-center justify-center">
                  <FileCode2 className="w-6 h-6 text-sky-600" />
                </div>
              </div>
              <p className="text-xs text-slate-500 mt-3">
                <span className="text-emerald-600 font-medium">{stats?.active_rules || 0} active</span>
                {' · '}
                <span className="text-slate-400">{stats?.inactive_rules || 0} inactive</span>
              </p>
            </CardContent>
          </Card>

          <Card className="border-slate-200" data-testid="stp-rate-card">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-500 uppercase tracking-wide">STP Rate</p>
                  <p className="text-3xl font-bold text-slate-900 mt-1">{stats?.stp_rate || 0}%</p>
                </div>
                <div className="w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center">
                  <TrendingUp className="w-6 h-6 text-emerald-600" />
                </div>
              </div>
              <p className="text-xs text-slate-500 mt-3">
                Based on {stats?.total_evaluations || 0} evaluations
              </p>
            </CardContent>
          </Card>

          <Card className="border-slate-200" data-testid="stp-pass-card">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-500 uppercase tracking-wide">STP Pass</p>
                  <p className="text-3xl font-bold text-emerald-600 mt-1">{stats?.stp_pass || 0}</p>
                </div>
                <div className="w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center">
                  <CheckCircle className="w-6 h-6 text-emerald-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-slate-200" data-testid="stp-fail-card">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-500 uppercase tracking-wide">STP Fail</p>
                  <p className="text-3xl font-bold text-red-600 mt-1">{stats?.stp_fail || 0}</p>
                </div>
                <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center">
                  <XCircle className="w-6 h-6 text-red-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Rule Categories Chart */}
          <Card className="border-slate-200" data-testid="category-chart-card">
            <CardHeader>
              <CardTitle className="text-lg">Rules by Category</CardTitle>
            </CardHeader>
            <CardContent>
              {categoryData.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={categoryData} layout="vertical" margin={{ left: 80 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis type="number" tick={{ fill: '#64748b', fontSize: 12 }} />
                    <YAxis 
                      dataKey="name" 
                      type="category" 
                      tick={{ fill: '#64748b', fontSize: 12 }} 
                      width={80}
                    />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: '#fff', 
                        border: '1px solid #e2e8f0',
                        borderRadius: '8px'
                      }} 
                    />
                    <Bar dataKey="value" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-[300px] flex items-center justify-center text-slate-500">
                  No rules created yet
                </div>
              )}
            </CardContent>
          </Card>

          {/* STP Distribution Chart */}
          <Card className="border-slate-200" data-testid="stp-chart-card">
            <CardHeader>
              <CardTitle className="text-lg">STP Decision Distribution</CardTitle>
            </CardHeader>
            <CardContent>
              {stats?.total_evaluations > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={stpData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      paddingAngle={5}
                      dataKey="value"
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    >
                      {stpData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.fill} />
                      ))}
                    </Pie>
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: '#fff', 
                        border: '1px solid #e2e8f0',
                        borderRadius: '8px'
                      }} 
                    />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-[300px] flex items-center justify-center text-slate-500">
                  No evaluations yet
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Recent Evaluations */}
        <Card className="border-slate-200" data-testid="recent-evaluations-card">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Clock className="w-5 h-5 text-slate-400" />
              Recent Evaluations
            </CardTitle>
          </CardHeader>
          <CardContent>
            {stats?.recent_evaluations?.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-200">
                      <th className="text-left py-3 px-4 font-semibold text-slate-600">Proposal ID</th>
                      <th className="text-left py-3 px-4 font-semibold text-slate-600">STP Decision</th>
                      <th className="text-left py-3 px-4 font-semibold text-slate-600">Case Type</th>
                      <th className="text-left py-3 px-4 font-semibold text-slate-600">Score</th>
                      <th className="text-left py-3 px-4 font-semibold text-slate-600">Rules Triggered</th>
                      <th className="text-left py-3 px-4 font-semibold text-slate-600">Time</th>
                    </tr>
                  </thead>
                  <tbody>
                    {stats.recent_evaluations.map((evaluation, index) => (
                      <tr key={index} className="border-b border-slate-100 hover:bg-slate-50">
                        <td className="py-3 px-4 font-mono text-xs">{evaluation.proposal_id}</td>
                        <td className="py-3 px-4">
                          <StatusBadge status={evaluation.stp_decision} />
                        </td>
                        <td className="py-3 px-4">
                          <CaseTypeBadge caseType={evaluation.case_type} label={evaluation.case_type_label} />
                        </td>
                        <td className="py-3 px-4 font-semibold">{evaluation.scorecard_value}</td>
                        <td className="py-3 px-4">{evaluation.triggered_rules?.length || 0}</td>
                        <td className="py-3 px-4 text-slate-500">
                          {evaluation.evaluation_time_ms?.toFixed(1)} ms
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-8 text-slate-500">
                No evaluations yet. Try evaluating a proposal!
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;
