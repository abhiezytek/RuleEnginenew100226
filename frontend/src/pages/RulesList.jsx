import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Header } from '../components/layout/Header';
import { Card, CardContent } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '../components/ui/select';
import { Switch } from '../components/ui/switch';
import { CategoryBadge, ProductBadge, EnabledBadge } from '../components/shared/StatusBadge';
import { EmptyState } from '../components/shared/EmptyState';
import { PageLoader } from '../components/shared/LoadingSpinner';
import { getRules, toggleRule, deleteRule } from '../lib/api';
import { RULE_CATEGORIES, PRODUCT_TYPES } from '../lib/constants';
import { toast } from 'sonner';
import { 
  Plus, 
  Search, 
  Filter, 
  Edit, 
  Trash2, 
  Copy,
  MoreVertical,
  FileCode2,
  Eye
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '../components/ui/alert-dialog';

const RulesList = () => {
  const navigate = useNavigate();
  const [rules, setRules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [productFilter, setProductFilter] = useState('all');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [ruleToDelete, setRuleToDelete] = useState(null);

  const fetchRules = async () => {
    try {
      setLoading(true);
      const params = {};
      if (categoryFilter !== 'all') params.category = categoryFilter;
      if (productFilter !== 'all') params.product = productFilter;
      if (searchTerm) params.search = searchTerm;
      
      const response = await getRules(params);
      setRules(response.data);
    } catch (error) {
      console.error('Failed to fetch rules:', error);
      toast.error('Failed to load rules');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRules();
  }, [categoryFilter, productFilter]);

  useEffect(() => {
    const debounce = setTimeout(() => {
      fetchRules();
    }, 300);
    return () => clearTimeout(debounce);
  }, [searchTerm]);

  const handleToggle = async (ruleId) => {
    try {
      await toggleRule(ruleId);
      setRules(rules.map(r => 
        r.id === ruleId ? { ...r, is_enabled: !r.is_enabled } : r
      ));
      toast.success('Rule status updated');
    } catch (error) {
      toast.error('Failed to toggle rule');
    }
  };

  const handleDelete = async () => {
    if (!ruleToDelete) return;
    try {
      await deleteRule(ruleToDelete.id);
      setRules(rules.filter(r => r.id !== ruleToDelete.id));
      toast.success('Rule deleted successfully');
    } catch (error) {
      toast.error('Failed to delete rule');
    } finally {
      setDeleteDialogOpen(false);
      setRuleToDelete(null);
    }
  };

  const confirmDelete = (rule) => {
    setRuleToDelete(rule);
    setDeleteDialogOpen(true);
  };

  if (loading && rules.length === 0) {
    return (
      <div className="p-6">
        <Header title="Rules" subtitle="Manage underwriting rules" />
        <PageLoader />
      </div>
    );
  }

  return (
    <div className="min-h-screen" data-testid="rules-list-page">
      <Header title="Rules" subtitle="Manage underwriting rules" />
      
      <div className="p-6 space-y-6">
        {/* Filters Bar */}
        <Card className="border-slate-200">
          <CardContent className="pt-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input
                  placeholder="Search rules by name or description..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                  data-testid="rules-search-input"
                />
              </div>
              
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="w-[180px]" data-testid="category-filter">
                  <Filter className="w-4 h-4 mr-2" />
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {RULE_CATEGORIES.map(cat => (
                    <SelectItem key={cat.value} value={cat.value}>{cat.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={productFilter} onValueChange={setProductFilter}>
                <SelectTrigger className="w-[180px]" data-testid="product-filter">
                  <SelectValue placeholder="Product" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Products</SelectItem>
                  {PRODUCT_TYPES.map(prod => (
                    <SelectItem key={prod.value} value={prod.value}>{prod.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Link to="/rules/new">
                <Button data-testid="create-rule-btn">
                  <Plus className="w-4 h-4 mr-2" />
                  Create Rule
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* Rules Table */}
        {rules.length === 0 ? (
          <EmptyState
            icon={FileCode2}
            title="No rules found"
            description="Create your first underwriting rule to get started with the rule engine."
            actionLabel="Create Rule"
            onAction={() => navigate('/rules/new')}
          />
        ) : (
          <Card className="border-slate-200">
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-sm" data-testid="rules-table">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50">
                      <th className="text-left py-3 px-4 font-semibold text-slate-600">Status</th>
                      <th className="text-left py-3 px-4 font-semibold text-slate-600">Name</th>
                      <th className="text-left py-3 px-4 font-semibold text-slate-600">Category</th>
                      <th className="text-left py-3 px-4 font-semibold text-slate-600">Products</th>
                      <th className="text-left py-3 px-4 font-semibold text-slate-600">Priority</th>
                      <th className="text-left py-3 px-4 font-semibold text-slate-600">Version</th>
                      <th className="text-right py-3 px-4 font-semibold text-slate-600">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rules.map((rule) => (
                      <tr 
                        key={rule.id} 
                        className="border-b border-slate-100 hover:bg-slate-50 transition-colors"
                        data-testid={`rule-row-${rule.id}`}
                      >
                        <td className="py-3 px-4">
                          <Switch
                            checked={rule.is_enabled}
                            onCheckedChange={() => handleToggle(rule.id)}
                            data-testid={`rule-toggle-${rule.id}`}
                          />
                        </td>
                        <td className="py-3 px-4">
                          <div>
                            <p className="font-medium text-slate-900">{rule.name}</p>
                            {rule.description && (
                              <p className="text-xs text-slate-500 mt-0.5 line-clamp-1">
                                {rule.description}
                              </p>
                            )}
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <CategoryBadge category={rule.category} />
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex flex-wrap gap-1">
                            {rule.products?.slice(0, 2).map(prod => (
                              <ProductBadge key={prod} product={prod} />
                            ))}
                            {rule.products?.length > 2 && (
                              <span className="text-xs text-slate-500">
                                +{rule.products.length - 2}
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-slate-100 text-sm font-semibold text-slate-700">
                            {rule.priority}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <span className="text-slate-500">v{rule.version}</span>
                        </td>
                        <td className="py-3 px-4 text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button 
                                variant="ghost" 
                                size="icon"
                                data-testid={`rule-menu-${rule.id}`}
                              >
                                <MoreVertical className="w-4 h-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => navigate(`/rules/${rule.id}`)}>
                                <Eye className="w-4 h-4 mr-2" />
                                View
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => navigate(`/rules/${rule.id}/edit`)}>
                                <Edit className="w-4 h-4 mr-2" />
                                Edit
                              </DropdownMenuItem>
                              <DropdownMenuItem>
                                <Copy className="w-4 h-4 mr-2" />
                                Duplicate
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem 
                                className="text-red-600"
                                onClick={() => confirmDelete(rule)}
                              >
                                <Trash2 className="w-4 h-4 mr-2" />
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Delete Confirmation Dialog */}
        <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Rule</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete "{ruleToDelete?.name}"? This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel data-testid="delete-cancel-btn">Cancel</AlertDialogCancel>
              <AlertDialogAction 
                onClick={handleDelete}
                className="bg-red-600 hover:bg-red-700"
                data-testid="delete-confirm-btn"
              >
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
};

export default RulesList;
