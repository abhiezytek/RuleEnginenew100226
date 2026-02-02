import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Header } from '../components/layout/Header';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '../components/ui/select';
import { Switch } from '../components/ui/switch';
import { ProductBadge } from '../components/shared/StatusBadge';
import { EmptyState } from '../components/shared/EmptyState';
import { PageLoader } from '../components/shared/LoadingSpinner';
import { getScorecards, createScorecard, updateScorecard, deleteScorecard } from '../lib/api';
import { PRODUCT_TYPES } from '../lib/constants';
import { toast } from 'sonner';
import { 
  Plus, 
  Calculator, 
  Edit, 
  Trash2, 
  Save,
  X
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '../components/ui/dialog';
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

const Scorecards = () => {
  const navigate = useNavigate();
  const [scorecards, setScorecards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedScorecard, setSelectedScorecard] = useState(null);
  const [saving, setSaving] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    product: 'term_life',
    parameters: [],
    threshold_direct_accept: 80,
    threshold_normal: 50,
    threshold_refer: 30,
    is_enabled: true
  });

  const fetchScorecards = async () => {
    try {
      setLoading(true);
      const response = await getScorecards();
      setScorecards(response.data);
    } catch (error) {
      toast.error('Failed to load scorecards');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchScorecards();
  }, []);

  const openCreateDialog = () => {
    setSelectedScorecard(null);
    setFormData({
      name: '',
      description: '',
      product: 'term_life',
      parameters: [],
      threshold_direct_accept: 80,
      threshold_normal: 50,
      threshold_refer: 30,
      is_enabled: true
    });
    setDialogOpen(true);
  };

  const openEditDialog = (scorecard) => {
    setSelectedScorecard(scorecard);
    setFormData({
      name: scorecard.name,
      description: scorecard.description || '',
      product: scorecard.product,
      parameters: scorecard.parameters || [],
      threshold_direct_accept: scorecard.threshold_direct_accept,
      threshold_normal: scorecard.threshold_normal,
      threshold_refer: scorecard.threshold_refer,
      is_enabled: scorecard.is_enabled
    });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!formData.name.trim()) {
      toast.error('Name is required');
      return;
    }

    try {
      setSaving(true);
      if (selectedScorecard) {
        await updateScorecard(selectedScorecard.id, formData);
        toast.success('Scorecard updated');
      } else {
        await createScorecard(formData);
        toast.success('Scorecard created');
      }
      setDialogOpen(false);
      fetchScorecards();
    } catch (error) {
      toast.error('Failed to save scorecard');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedScorecard) return;
    try {
      await deleteScorecard(selectedScorecard.id);
      toast.success('Scorecard deleted');
      setDeleteDialogOpen(false);
      fetchScorecards();
    } catch (error) {
      toast.error('Failed to delete scorecard');
    }
  };

  const addParameter = () => {
    setFormData({
      ...formData,
      parameters: [
        ...formData.parameters,
        {
          id: `param-${Date.now()}`,
          name: '',
          field: '',
          weight: 1.0,
          bands: []
        }
      ]
    });
  };

  const removeParameter = (index) => {
    setFormData({
      ...formData,
      parameters: formData.parameters.filter((_, i) => i !== index)
    });
  };

  const updateParameter = (index, field, value) => {
    const updated = [...formData.parameters];
    updated[index] = { ...updated[index], [field]: value };
    setFormData({ ...formData, parameters: updated });
  };

  const addBand = (paramIndex) => {
    const updated = [...formData.parameters];
    updated[paramIndex].bands = [
      ...updated[paramIndex].bands,
      { min: 0, max: 100, score: 10, label: '' }
    ];
    setFormData({ ...formData, parameters: updated });
  };

  const updateBand = (paramIndex, bandIndex, field, value) => {
    const updated = [...formData.parameters];
    updated[paramIndex].bands[bandIndex] = {
      ...updated[paramIndex].bands[bandIndex],
      [field]: field === 'label' ? value : parseFloat(value) || 0
    };
    setFormData({ ...formData, parameters: updated });
  };

  const removeBand = (paramIndex, bandIndex) => {
    const updated = [...formData.parameters];
    updated[paramIndex].bands = updated[paramIndex].bands.filter((_, i) => i !== bandIndex);
    setFormData({ ...formData, parameters: updated });
  };

  if (loading) {
    return (
      <div className="p-6">
        <Header title="Scorecards" subtitle="Configure scoring methodology" />
        <PageLoader />
      </div>
    );
  }

  return (
    <div className="min-h-screen" data-testid="scorecards-page">
      <Header title="Scorecards" subtitle="Configure scoring methodology for underwriting" />
      
      <div className="p-6 space-y-6">
        <div className="flex justify-end">
          <Button onClick={openCreateDialog} data-testid="create-scorecard-btn">
            <Plus className="w-4 h-4 mr-2" />
            Create Scorecard
          </Button>
        </div>

        {scorecards.length === 0 ? (
          <EmptyState
            icon={Calculator}
            title="No scorecards found"
            description="Create your first scorecard to define scoring parameters and bands."
            actionLabel="Create Scorecard"
            onAction={openCreateDialog}
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {scorecards.map((scorecard) => (
              <Card 
                key={scorecard.id} 
                className="border-slate-200 hover:shadow-md transition-shadow"
                data-testid={`scorecard-card-${scorecard.id}`}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-lg">{scorecard.name}</CardTitle>
                      <p className="text-sm text-slate-500 mt-1">{scorecard.description}</p>
                    </div>
                    <ProductBadge product={scorecard.product} />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-slate-500">Parameters</span>
                      <span className="font-semibold">{scorecard.parameters?.length || 0}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-slate-500">Direct Accept</span>
                      <span className="font-semibold text-emerald-600">≥ {scorecard.threshold_direct_accept}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-slate-500">Refer Threshold</span>
                      <span className="font-semibold text-amber-600">≤ {scorecard.threshold_refer}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-slate-500">Status</span>
                      <span className={`font-medium ${scorecard.is_enabled ? 'text-emerald-600' : 'text-slate-400'}`}>
                        {scorecard.is_enabled ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                  </div>
                  
                  <div className="flex gap-2 mt-4 pt-4 border-t border-slate-100">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="flex-1"
                      onClick={() => openEditDialog(scorecard)}
                      data-testid={`edit-scorecard-${scorecard.id}`}
                    >
                      <Edit className="w-4 h-4 mr-1" />
                      Edit
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm"
                      className="text-red-600 hover:text-red-700"
                      onClick={() => {
                        setSelectedScorecard(scorecard);
                        setDeleteDialogOpen(true);
                      }}
                      data-testid={`delete-scorecard-${scorecard.id}`}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Create/Edit Dialog */}
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {selectedScorecard ? 'Edit Scorecard' : 'Create Scorecard'}
              </DialogTitle>
            </DialogHeader>
            
            <div className="space-y-6 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <Label>Name *</Label>
                  <Input
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Scorecard name"
                    className="mt-1.5"
                    data-testid="scorecard-name-input"
                  />
                </div>
                <div className="col-span-2">
                  <Label>Description</Label>
                  <Input
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Brief description"
                    className="mt-1.5"
                  />
                </div>
                <div>
                  <Label>Product</Label>
                  <Select 
                    value={formData.product} 
                    onValueChange={(v) => setFormData({ ...formData, product: v })}
                  >
                    <SelectTrigger className="mt-1.5" data-testid="scorecard-product-select">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {PRODUCT_TYPES.map(p => (
                        <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-center gap-2 pt-6">
                  <Switch
                    checked={formData.is_enabled}
                    onCheckedChange={(checked) => setFormData({ ...formData, is_enabled: checked })}
                  />
                  <Label>Enabled</Label>
                </div>
              </div>

              {/* Thresholds */}
              <div className="pt-4 border-t border-slate-200">
                <h4 className="text-sm font-semibold text-slate-700 mb-3">Thresholds</h4>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <Label>Direct Accept (≥)</Label>
                    <Input
                      type="number"
                      value={formData.threshold_direct_accept}
                      onChange={(e) => setFormData({ ...formData, threshold_direct_accept: parseInt(e.target.value) || 0 })}
                      className="mt-1.5"
                    />
                  </div>
                  <div>
                    <Label>Normal (≥)</Label>
                    <Input
                      type="number"
                      value={formData.threshold_normal}
                      onChange={(e) => setFormData({ ...formData, threshold_normal: parseInt(e.target.value) || 0 })}
                      className="mt-1.5"
                    />
                  </div>
                  <div>
                    <Label>Refer (≤)</Label>
                    <Input
                      type="number"
                      value={formData.threshold_refer}
                      onChange={(e) => setFormData({ ...formData, threshold_refer: parseInt(e.target.value) || 0 })}
                      className="mt-1.5"
                    />
                  </div>
                </div>
              </div>

              {/* Parameters */}
              <div className="pt-4 border-t border-slate-200">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-sm font-semibold text-slate-700">Parameters</h4>
                  <Button variant="outline" size="sm" onClick={addParameter}>
                    <Plus className="w-4 h-4 mr-1" />
                    Add Parameter
                  </Button>
                </div>

                <div className="space-y-4">
                  {formData.parameters.map((param, paramIdx) => (
                    <Card key={param.id} className="border-slate-200">
                      <CardContent className="pt-4">
                        <div className="flex items-start justify-between mb-3">
                          <div className="grid grid-cols-3 gap-3 flex-1">
                            <Input
                              placeholder="Parameter name"
                              value={param.name}
                              onChange={(e) => updateParameter(paramIdx, 'name', e.target.value)}
                            />
                            <Input
                              placeholder="Field (e.g., applicant_age)"
                              value={param.field}
                              onChange={(e) => updateParameter(paramIdx, 'field', e.target.value)}
                            />
                            <Input
                              type="number"
                              step="0.1"
                              placeholder="Weight"
                              value={param.weight}
                              onChange={(e) => updateParameter(paramIdx, 'weight', parseFloat(e.target.value) || 1)}
                            />
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => removeParameter(paramIdx)}
                            className="text-red-500 ml-2"
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        </div>

                        {/* Bands */}
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-xs text-slate-500 uppercase">Bands</span>
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              onClick={() => addBand(paramIdx)}
                              className="h-6 text-xs"
                            >
                              <Plus className="w-3 h-3 mr-1" />
                              Add Band
                            </Button>
                          </div>
                          
                          {param.bands.map((band, bandIdx) => (
                            <div key={bandIdx} className="flex items-center gap-2 p-2 bg-slate-50 rounded">
                              <Input
                                type="number"
                                placeholder="Min"
                                value={band.min}
                                onChange={(e) => updateBand(paramIdx, bandIdx, 'min', e.target.value)}
                                className="w-20 h-8 text-sm"
                              />
                              <span className="text-slate-400">-</span>
                              <Input
                                type="number"
                                placeholder="Max"
                                value={band.max}
                                onChange={(e) => updateBand(paramIdx, bandIdx, 'max', e.target.value)}
                                className="w-20 h-8 text-sm"
                              />
                              <span className="text-slate-400">=</span>
                              <Input
                                type="number"
                                placeholder="Score"
                                value={band.score}
                                onChange={(e) => updateBand(paramIdx, bandIdx, 'score', e.target.value)}
                                className="w-20 h-8 text-sm"
                              />
                              <Input
                                placeholder="Label"
                                value={band.label}
                                onChange={(e) => updateBand(paramIdx, bandIdx, 'label', e.target.value)}
                                className="flex-1 h-8 text-sm"
                              />
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => removeBand(paramIdx, bandIdx)}
                                className="h-8 w-8 text-slate-400 hover:text-red-500"
                              >
                                <X className="w-3 h-3" />
                              </Button>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleSave} disabled={saving} data-testid="save-scorecard-btn">
                <Save className="w-4 h-4 mr-2" />
                {saving ? 'Saving...' : 'Save Scorecard'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Delete Dialog */}
        <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Scorecard</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete "{selectedScorecard?.name}"? This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700">
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
};

export default Scorecards;
