import React, { useState, useEffect } from 'react';
import { Header } from '../components/layout/Header';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '../components/ui/select';
import { PageLoader } from '../components/shared/LoadingSpinner';
import { getAuditLogs } from '../lib/api';
import { toast } from 'sonner';
import { History, Search, Filter } from 'lucide-react';
import { format } from 'date-fns';

const AuditLogs = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [entityTypeFilter, setEntityTypeFilter] = useState('all');
  const [actionFilter, setActionFilter] = useState('all');

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const params = {};
      if (entityTypeFilter !== 'all') params.entity_type = entityTypeFilter;
      if (actionFilter !== 'all') params.action = actionFilter;
      
      const response = await getAuditLogs(params);
      setLogs(response.data);
    } catch (error) {
      toast.error('Failed to load audit logs');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [entityTypeFilter, actionFilter]);

  const getActionColor = (action) => {
    switch (action) {
      case 'CREATE': return 'bg-emerald-100 text-emerald-700';
      case 'UPDATE': return 'bg-blue-100 text-blue-700';
      case 'DELETE': return 'bg-red-100 text-red-700';
      case 'TOGGLE': return 'bg-amber-100 text-amber-700';
      default: return 'bg-slate-100 text-slate-700';
    }
  };

  const formatDate = (dateStr) => {
    try {
      return format(new Date(dateStr), 'MMM dd, yyyy HH:mm:ss');
    } catch {
      return dateStr;
    }
  };

  if (loading && logs.length === 0) {
    return (
      <div className="p-6">
        <Header title="Audit Logs" subtitle="Track all system changes" />
        <PageLoader />
      </div>
    );
  }

  return (
    <div className="min-h-screen" data-testid="audit-logs-page">
      <Header title="Audit Logs" subtitle="Track all system changes and rule modifications" />
      
      <div className="p-6 space-y-6">
        {/* Filters */}
        <Card className="border-slate-200">
          <CardContent className="pt-6">
            <div className="flex flex-col md:flex-row gap-4">
              <Select value={entityTypeFilter} onValueChange={setEntityTypeFilter}>
                <SelectTrigger className="w-[180px]" data-testid="entity-type-filter">
                  <Filter className="w-4 h-4 mr-2" />
                  <SelectValue placeholder="Entity Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Entities</SelectItem>
                  <SelectItem value="rule">Rules</SelectItem>
                  <SelectItem value="scorecard">Scorecards</SelectItem>
                  <SelectItem value="grid">Grids</SelectItem>
                  <SelectItem value="product">Products</SelectItem>
                </SelectContent>
              </Select>

              <Select value={actionFilter} onValueChange={setActionFilter}>
                <SelectTrigger className="w-[180px]" data-testid="action-filter">
                  <SelectValue placeholder="Action" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Actions</SelectItem>
                  <SelectItem value="CREATE">Create</SelectItem>
                  <SelectItem value="UPDATE">Update</SelectItem>
                  <SelectItem value="DELETE">Delete</SelectItem>
                  <SelectItem value="TOGGLE">Toggle</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Logs Table */}
        <Card className="border-slate-200">
          <CardContent className="p-0">
            {logs.length === 0 ? (
              <div className="text-center py-16">
                <History className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-slate-700 mb-2">No audit logs found</h3>
                <p className="text-sm text-slate-500">Changes to rules, scorecards, and grids will appear here</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm" data-testid="audit-logs-table">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50">
                      <th className="text-left py-3 px-4 font-semibold text-slate-600">Timestamp</th>
                      <th className="text-left py-3 px-4 font-semibold text-slate-600">Action</th>
                      <th className="text-left py-3 px-4 font-semibold text-slate-600">Entity</th>
                      <th className="text-left py-3 px-4 font-semibold text-slate-600">Name</th>
                      <th className="text-left py-3 px-4 font-semibold text-slate-600">Changes</th>
                      <th className="text-left py-3 px-4 font-semibold text-slate-600">User</th>
                    </tr>
                  </thead>
                  <tbody>
                    {logs.map((log) => (
                      <tr 
                        key={log.id} 
                        className="border-b border-slate-100 hover:bg-slate-50 transition-colors"
                        data-testid={`audit-log-${log.id}`}
                      >
                        <td className="py-3 px-4 text-slate-500 font-mono text-xs">
                          {formatDate(log.performed_at)}
                        </td>
                        <td className="py-3 px-4">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${getActionColor(log.action)}`}>
                            {log.action}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <span className="text-slate-600 capitalize">{log.entity_type}</span>
                        </td>
                        <td className="py-3 px-4">
                          <span className="font-medium text-slate-900">{log.entity_name}</span>
                        </td>
                        <td className="py-3 px-4">
                          {Object.keys(log.changes || {}).length > 0 ? (
                            <details className="cursor-pointer">
                              <summary className="text-sky-600 text-xs">
                                {Object.keys(log.changes).length} field(s) changed
                              </summary>
                              <pre className="mt-2 text-xs font-mono bg-slate-50 p-2 rounded max-w-md overflow-x-auto">
                                {JSON.stringify(log.changes, null, 2)}
                              </pre>
                            </details>
                          ) : (
                            <span className="text-slate-400 text-xs">-</span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-slate-500">
                          {log.performed_by}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AuditLogs;
