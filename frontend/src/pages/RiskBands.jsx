import React, { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { Plus, Edit2, Trash2, Power, TrendingUp, Percent, Target } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Switch } from '../components/ui/switch';
import { Badge } from '../components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '../components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { getRiskBands, createRiskBand, updateRiskBand, deleteRiskBand, toggleRiskBand } from '../lib/api';
import { LoadingSpinner } from '../components/shared/LoadingSpinner';
import { PRODUCT_TYPES, AVAILABLE_FIELDS, OPERATORS } from '../lib/constants';

const CATEGORIES = [
  { value: 'age', label: 'Age', color: 'blue' },
  { value: 'smoking', label: 'Smoking', color: 'amber' },
  { value: 'medical', label: 'Medical', color: 'rose' },
  { value: 'bmi', label: 'BMI', color: 'green' },
  { value: 'occupation', label: 'Occupation', color: 'purple' },
];

const getCategoryColor = (category) => {
  const cat = CATEGORIES.find(c => c.value === category);
  return cat?.color || 'slate';
};

const RiskBands = () => {
  const [bands, setBands] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editingBand, setEditingBand] = useState(null);
  const [activeCategory, setActiveCategory] = useState('all');
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: 'age',
    condition: {
      field: 'applicant_age',
      operator: 'between',
      value: 0,
      value2: null
    },
    loading_percentage: 0,
    risk_score: 0,
    products: [],
    priority: 100,
    is_enabled: true
  });

  useEffect(() => {
    fetchBands();
  }, []);

  const fetchBands = async () => {
    try {
      const response = await getRiskBands();
      setBands(response.data);
    } catch (error) {
      toast.error('Failed to load risk bands');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (band = null) => {
    if (band) {
      setEditingBand(band);
      setFormData({
        name: band.name,
        description: band.description || '',
        category: band.category,
        condition: band.condition,
        loading_percentage: band.loading_percentage,
        risk_score: band.risk_score,
        products: band.products || [],
        priority: band.priority,
        is_enabled: band.is_enabled
      });
    } else {
      setEditingBand(null);
      setFormData({
        name: '',
        description: '',
        category: 'age',
        condition: {
          field: 'applicant_age',
          operator: 'between',
          value: 0,
          value2: null
        },
        loading_percentage: 0,
        risk_score: 0,
        products: [],
        priority: 100,
        is_enabled: true
      });
    }
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setEditingBand(null);
  };

  const handleSubmit = async () => {
    try {
      if (!formData.name.trim()) {
        toast.error('Band name is required');
        return;
      }

      if (editingBand) {
        await updateRiskBand(editingBand.id, formData);
        toast.success('Risk band updated successfully');
      } else {
        await createRiskBand(formData);
        toast.success('Risk band created successfully');
      }
      handleCloseDialog();
      fetchBands();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to save risk band');
    }
  };

  const handleDelete = async () => {
    try {
      await deleteRiskBand(editingBand.id);
      toast.success('Risk band deleted successfully');
      setDeleteDialogOpen(false);
      setEditingBand(null);
      fetchBands();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to delete risk band');
    }
  };

  const handleToggle = async (band) => {
    try {
      await toggleRiskBand(band.id);
      toast.success(`Risk band ${band.is_enabled ? 'disabled' : 'enabled'}`);
      fetchBands();
    } catch (error) {
      toast.error('Failed to toggle risk band');
    }
  };

  const filteredBands = activeCategory === 'all' 
    ? bands 
    : bands.filter(b => b.category === activeCategory);

  const groupedBands = filteredBands.reduce((acc, band) => {
    if (!acc[band.category]) acc[band.category] = [];
    acc[band.category].push(band);
    return acc;
  }, {});

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="space-y-6" data-testid="risk-bands-page">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Risk Bands</h1>
          <p className="text-slate-600 mt-1">
            Configure premium loading factors based on risk criteria
          </p>
        </div>
        <Button onClick={() => handleOpenDialog()} data-testid="create-risk-band-btn">
          <Plus className="h-4 w-4 mr-2" />
          Create Risk Band
        </Button>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">Total Bands</p>
                <p className="text-2xl font-bold">{bands.length}</p>
              </div>
              <TrendingUp className="h-8 w-8 text-purple-500 opacity-50" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">Active</p>
                <p className="text-2xl font-bold text-emerald-600">{bands.filter(b => b.is_enabled).length}</p>
              </div>
              <Power className="h-8 w-8 text-emerald-500 opacity-50" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">Max Loading</p>
                <p className="text-2xl font-bold text-red-600">+{Math.max(...bands.map(b => b.loading_percentage), 0)}%</p>
              </div>
              <Percent className="h-8 w-8 text-red-500 opacity-50" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">Categories</p>
                <p className="text-2xl font-bold">{Object.keys(groupedBands).length}</p>
              </div>
              <Target className="h-8 w-8 text-blue-500 opacity-50" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Category Tabs */}
      <Tabs value={activeCategory} onValueChange={setActiveCategory}>
        <TabsList>
          <TabsTrigger value="all">All</TabsTrigger>
          {CATEGORIES.map(cat => (
            <TabsTrigger key={cat.value} value={cat.value}>
              {cat.label} ({bands.filter(b => b.category === cat.value).length})
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value={activeCategory} className="mt-4">
          {Object.entries(groupedBands).length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <TrendingUp className="h-12 w-12 mx-auto text-slate-400 mb-4" />
                <h3 className="text-lg font-medium text-slate-900 mb-2">No risk bands found</h3>
                <p className="text-slate-600 mb-4">
                  Create risk bands to configure premium loading factors
                </p>
                <Button onClick={() => handleOpenDialog()}>
                  <Plus className="h-4 w-4 mr-2" />
                  Create First Band
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-6">
              {Object.entries(groupedBands).map(([category, categoryBands]) => (
                <div key={category}>
                  <h3 className="text-lg font-semibold text-slate-800 mb-3 capitalize flex items-center gap-2">
                    <span className={`w-3 h-3 rounded-full bg-${getCategoryColor(category)}-500`} />
                    {category} Risk Bands
                  </h3>
                  <div className="grid gap-3">
                    {categoryBands.map((band) => (
                      <Card 
                        key={band.id} 
                        className={`${!band.is_enabled ? 'opacity-60' : ''}`}
                        data-testid={`risk-band-${band.id}`}
                      >
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                              <div className={`w-12 h-12 rounded-lg flex items-center justify-center bg-${getCategoryColor(category)}-100`}>
                                <span className={`text-lg font-bold text-${getCategoryColor(category)}-700`}>
                                  {band.loading_percentage > 0 ? '+' : ''}{band.loading_percentage}%
                                </span>
                              </div>
                              <div>
                                <h4 className="font-semibold text-slate-900">{band.name}</h4>
                                <p className="text-sm text-slate-500">
                                  {band.condition?.field}: {band.condition?.operator} {band.condition?.value}
                                  {band.condition?.value2 && ` - ${band.condition.value2}`}
                                </p>
                              </div>
                            </div>
                            
                            <div className="flex items-center gap-4">
                              <div className="text-right">
                                <p className="text-sm text-slate-500">Risk Score</p>
                                <p className="font-semibold">{band.risk_score} pts</p>
                              </div>
                              <div className="flex items-center gap-2">
                                <Button 
                                  variant="ghost" 
                                  size="icon"
                                  onClick={() => handleToggle(band)}
                                >
                                  <Power className={`h-4 w-4 ${band.is_enabled ? 'text-emerald-600' : 'text-slate-400'}`} />
                                </Button>
                                <Button 
                                  variant="ghost" 
                                  size="icon"
                                  onClick={() => handleOpenDialog(band)}
                                >
                                  <Edit2 className="h-4 w-4" />
                                </Button>
                                <Button 
                                  variant="ghost" 
                                  size="icon"
                                  onClick={() => {
                                    setEditingBand(band);
                                    setDeleteDialogOpen(true);
                                  }}
                                >
                                  <Trash2 className="h-4 w-4 text-red-500" />
                                </Button>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingBand ? 'Edit Risk Band' : 'Create Risk Band'}</DialogTitle>
            <DialogDescription>
              Configure premium loading based on risk factors
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Band Name *</Label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., Young Adult Discount"
                />
              </div>
              <div className="space-y-2">
                <Label>Category</Label>
                <Select 
                  value={formData.category} 
                  onValueChange={(v) => setFormData({ ...formData, category: v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map(cat => (
                      <SelectItem key={cat.value} value={cat.value}>{cat.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Condition Field</Label>
              <Select 
                value={formData.condition.field} 
                onValueChange={(v) => setFormData({ 
                  ...formData, 
                  condition: { ...formData.condition, field: v } 
                })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {AVAILABLE_FIELDS.map(f => (
                    <SelectItem key={f.value} value={f.value}>{f.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Operator</Label>
                <Select 
                  value={formData.condition.operator} 
                  onValueChange={(v) => setFormData({ 
                    ...formData, 
                    condition: { ...formData.condition, operator: v } 
                  })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="equals">Equals</SelectItem>
                    <SelectItem value="greater_than">Greater Than</SelectItem>
                    <SelectItem value="less_than">Less Than</SelectItem>
                    <SelectItem value="between">Between</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Value</Label>
                <Input
                  value={formData.condition.value || ''}
                  onChange={(e) => setFormData({ 
                    ...formData, 
                    condition: { ...formData.condition, value: e.target.value } 
                  })}
                />
              </div>
              {formData.condition.operator === 'between' && (
                <div className="space-y-2">
                  <Label>Value 2</Label>
                  <Input
                    value={formData.condition.value2 || ''}
                    onChange={(e) => setFormData({ 
                      ...formData, 
                      condition: { ...formData.condition, value2: e.target.value } 
                    })}
                  />
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Loading Percentage (%)</Label>
                <Input
                  type="number"
                  value={formData.loading_percentage}
                  onChange={(e) => setFormData({ ...formData, loading_percentage: parseFloat(e.target.value) || 0 })}
                  placeholder="e.g., 25 for +25%"
                />
                <p className="text-xs text-slate-500">Use negative for discounts</p>
              </div>
              <div className="space-y-2">
                <Label>Risk Score (Points)</Label>
                <Input
                  type="number"
                  value={formData.risk_score}
                  onChange={(e) => setFormData({ ...formData, risk_score: parseInt(e.target.value) || 0 })}
                />
              </div>
            </div>

            <div className="flex items-center justify-between rounded-lg border p-3">
              <Label>Enabled</Label>
              <Switch
                checked={formData.is_enabled}
                onCheckedChange={(checked) => setFormData({ ...formData, is_enabled: checked })}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={handleCloseDialog}>Cancel</Button>
            <Button onClick={handleSubmit}>
              {editingBand ? 'Save Changes' : 'Create Band'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Delete Risk Band</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete "{editingBand?.name}"?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
            <Button variant="destructive" onClick={handleDelete}>Delete</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default RiskBands;
