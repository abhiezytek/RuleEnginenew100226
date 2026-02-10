import React, { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { Plus, Edit2, Trash2, GripVertical, ChevronRight, Layers, Power, AlertTriangle } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Switch } from '../components/ui/switch';
import { Badge } from '../components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '../components/ui/dialog';
import { Textarea } from '../components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { getStages, createStage, updateStage, deleteStage, toggleStage, getRulesByStage } from '../lib/api';
import LoadingSpinner from '../components/shared/LoadingSpinner';

const STAGE_COLORS = [
  { value: 'slate', label: 'Slate', class: 'bg-slate-100 text-slate-800 border-slate-300' },
  { value: 'amber', label: 'Amber', class: 'bg-amber-100 text-amber-800 border-amber-300' },
  { value: 'blue', label: 'Blue', class: 'bg-blue-100 text-blue-800 border-blue-300' },
  { value: 'purple', label: 'Purple', class: 'bg-purple-100 text-purple-800 border-purple-300' },
  { value: 'emerald', label: 'Emerald', class: 'bg-emerald-100 text-emerald-800 border-emerald-300' },
  { value: 'rose', label: 'Rose', class: 'bg-rose-100 text-rose-800 border-rose-300' },
  { value: 'cyan', label: 'Cyan', class: 'bg-cyan-100 text-cyan-800 border-cyan-300' },
  { value: 'orange', label: 'Orange', class: 'bg-orange-100 text-orange-800 border-orange-300' },
];

const getColorClass = (color) => {
  const colorDef = STAGE_COLORS.find(c => c.value === color);
  return colorDef?.class || 'bg-slate-100 text-slate-800 border-slate-300';
};

const Stages = () => {
  const [stages, setStages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [expandedStage, setExpandedStage] = useState(null);
  const [stageRules, setStageRules] = useState({});
  const [editingStage, setEditingStage] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    execution_order: 1,
    stop_on_fail: false,
    color: 'slate',
    is_enabled: true
  });

  useEffect(() => {
    fetchStages();
  }, []);

  const fetchStages = async () => {
    try {
      const response = await getStages();
      setStages(response.data);
    } catch (error) {
      toast.error('Failed to load stages');
    } finally {
      setLoading(false);
    }
  };

  const fetchStageRules = async (stageId) => {
    try {
      const response = await getRulesByStage(stageId);
      setStageRules(prev => ({ ...prev, [stageId]: response.data }));
    } catch (error) {
      toast.error('Failed to load rules for stage');
    }
  };

  const handleExpandStage = (stageId) => {
    if (expandedStage === stageId) {
      setExpandedStage(null);
    } else {
      setExpandedStage(stageId);
      if (!stageRules[stageId]) {
        fetchStageRules(stageId);
      }
    }
  };

  const handleOpenDialog = (stage = null) => {
    if (stage) {
      setEditingStage(stage);
      setFormData({
        name: stage.name,
        description: stage.description || '',
        execution_order: stage.execution_order,
        stop_on_fail: stage.stop_on_fail,
        color: stage.color,
        is_enabled: stage.is_enabled
      });
    } else {
      setEditingStage(null);
      setFormData({
        name: '',
        description: '',
        execution_order: stages.length + 1,
        stop_on_fail: false,
        color: 'slate',
        is_enabled: true
      });
    }
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setEditingStage(null);
    setFormData({
      name: '',
      description: '',
      execution_order: 1,
      stop_on_fail: false,
      color: 'slate',
      is_enabled: true
    });
  };

  const handleSubmit = async () => {
    try {
      if (!formData.name.trim()) {
        toast.error('Stage name is required');
        return;
      }

      if (editingStage) {
        await updateStage(editingStage.id, formData);
        toast.success('Stage updated successfully');
      } else {
        await createStage(formData);
        toast.success('Stage created successfully');
      }
      handleCloseDialog();
      fetchStages();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to save stage');
    }
  };

  const handleDelete = async () => {
    try {
      await deleteStage(editingStage.id);
      toast.success('Stage deleted successfully');
      setDeleteDialogOpen(false);
      setEditingStage(null);
      fetchStages();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to delete stage');
    }
  };

  const handleToggle = async (stage) => {
    try {
      await toggleStage(stage.id);
      toast.success(`Stage ${stage.is_enabled ? 'disabled' : 'enabled'}`);
      fetchStages();
    } catch (error) {
      toast.error('Failed to toggle stage');
    }
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="space-y-6" data-testid="stages-page">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Rule Stages</h1>
          <p className="text-slate-600 mt-1">
            Configure sequential execution stages for rule processing
          </p>
        </div>
        <Button onClick={() => handleOpenDialog()} data-testid="create-stage-btn">
          <Plus className="h-4 w-4 mr-2" />
          Create Stage
        </Button>
      </div>

      {stages.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Layers className="h-12 w-12 mx-auto text-slate-400 mb-4" />
            <h3 className="text-lg font-medium text-slate-900 mb-2">No stages configured</h3>
            <p className="text-slate-600 mb-4">
              Create stages to organize rule execution in sequential order
            </p>
            <Button onClick={() => handleOpenDialog()}>
              <Plus className="h-4 w-4 mr-2" />
              Create First Stage
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {/* Stage Flow Visualization */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Execution Flow</CardTitle>
              <CardDescription>Rules are processed through stages in order</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2 overflow-x-auto pb-2">
                {stages.filter(s => s.is_enabled).map((stage, index) => (
                  <React.Fragment key={stage.id}>
                    <div className={`px-4 py-2 rounded-lg border ${getColorClass(stage.color)} whitespace-nowrap`}>
                      <span className="font-medium">{stage.name}</span>
                      <Badge variant="secondary" className="ml-2">{stage.rule_count}</Badge>
                    </div>
                    {index < stages.filter(s => s.is_enabled).length - 1 && (
                      <ChevronRight className="h-5 w-5 text-slate-400 flex-shrink-0" />
                    )}
                  </React.Fragment>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Stage List */}
          <div className="space-y-3">
            {stages.map((stage) => (
              <Card key={stage.id} className={!stage.is_enabled ? 'opacity-60' : ''} data-testid={`stage-card-${stage.id}`}>
                <CardContent className="p-4">
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0 pt-1">
                      <GripVertical className="h-5 w-5 text-slate-400" />
                    </div>
                    
                    <div className="flex-grow min-w-0">
                      <div className="flex items-center gap-3 mb-2">
                        <Badge className={`${getColorClass(stage.color)} border`}>
                          Order: {stage.execution_order}
                        </Badge>
                        <h3 className="font-semibold text-slate-900">{stage.name}</h3>
                        {stage.stop_on_fail && (
                          <Badge variant="destructive" className="text-xs">
                            <AlertTriangle className="h-3 w-3 mr-1" />
                            Stops on Fail
                          </Badge>
                        )}
                        {!stage.is_enabled && (
                          <Badge variant="secondary">Disabled</Badge>
                        )}
                      </div>
                      
                      {stage.description && (
                        <p className="text-sm text-slate-600 mb-3">{stage.description}</p>
                      )}
                      
                      <div className="flex items-center gap-4 text-sm">
                        <span className="text-slate-600">
                          <strong>{stage.rule_count}</strong> rules assigned
                        </span>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => handleExpandStage(stage.id)}
                          data-testid={`expand-stage-${stage.id}`}
                        >
                          {expandedStage === stage.id ? 'Hide Rules' : 'View Rules'}
                          <ChevronRight className={`h-4 w-4 ml-1 transition-transform ${expandedStage === stage.id ? 'rotate-90' : ''}`} />
                        </Button>
                      </div>

                      {/* Expanded Rules */}
                      {expandedStage === stage.id && (
                        <div className="mt-4 pl-4 border-l-2 border-slate-200 space-y-2">
                          {stageRules[stage.id]?.length > 0 ? (
                            stageRules[stage.id].map((rule) => (
                              <div key={rule.id} className="flex items-center justify-between bg-slate-50 rounded px-3 py-2">
                                <div className="flex items-center gap-2">
                                  <Badge variant="outline" className="text-xs">{rule.priority}</Badge>
                                  <span className="text-sm font-medium">{rule.name}</span>
                                </div>
                                <Badge variant="secondary" className="text-xs capitalize">{rule.category.replace('_', ' ')}</Badge>
                              </div>
                            ))
                          ) : (
                            <p className="text-sm text-slate-500 italic">No rules assigned to this stage</p>
                          )}
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-2 flex-shrink-0">
                      <Button 
                        variant="ghost" 
                        size="icon"
                        onClick={() => handleToggle(stage)}
                        title={stage.is_enabled ? 'Disable' : 'Enable'}
                        data-testid={`toggle-stage-${stage.id}`}
                      >
                        <Power className={`h-4 w-4 ${stage.is_enabled ? 'text-emerald-600' : 'text-slate-400'}`} />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon"
                        onClick={() => handleOpenDialog(stage)}
                        data-testid={`edit-stage-${stage.id}`}
                      >
                        <Edit2 className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon"
                        onClick={() => {
                          setEditingStage(stage);
                          setDeleteDialogOpen(true);
                        }}
                        data-testid={`delete-stage-${stage.id}`}
                      >
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editingStage ? 'Edit Stage' : 'Create Stage'}</DialogTitle>
            <DialogDescription>
              {editingStage ? 'Modify stage configuration' : 'Create a new execution stage'}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Stage Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g., 1. Data Validation"
                data-testid="stage-name-input"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Describe what this stage does..."
                rows={2}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="execution_order">Execution Order</Label>
                <Input
                  id="execution_order"
                  type="number"
                  min="1"
                  value={formData.execution_order}
                  onChange={(e) => setFormData({ ...formData, execution_order: parseInt(e.target.value) || 1 })}
                  data-testid="stage-order-input"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="color">Color</Label>
                <Select 
                  value={formData.color} 
                  onValueChange={(value) => setFormData({ ...formData, color: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select color" />
                  </SelectTrigger>
                  <SelectContent>
                    {STAGE_COLORS.map((color) => (
                      <SelectItem key={color.value} value={color.value}>
                        <div className="flex items-center gap-2">
                          <div className={`w-4 h-4 rounded ${color.class}`} />
                          {color.label}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex items-center justify-between rounded-lg border p-3">
              <div className="space-y-0.5">
                <Label htmlFor="stop_on_fail">Stop on Fail</Label>
                <p className="text-xs text-slate-500">
                  Stop evaluation if any rule in this stage fails
                </p>
              </div>
              <Switch
                id="stop_on_fail"
                checked={formData.stop_on_fail}
                onCheckedChange={(checked) => setFormData({ ...formData, stop_on_fail: checked })}
              />
            </div>

            <div className="flex items-center justify-between rounded-lg border p-3">
              <div className="space-y-0.5">
                <Label htmlFor="is_enabled">Enabled</Label>
                <p className="text-xs text-slate-500">
                  Include this stage in evaluation processing
                </p>
              </div>
              <Switch
                id="is_enabled"
                checked={formData.is_enabled}
                onCheckedChange={(checked) => setFormData({ ...formData, is_enabled: checked })}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={handleCloseDialog}>Cancel</Button>
            <Button onClick={handleSubmit} data-testid="save-stage-btn">
              {editingStage ? 'Save Changes' : 'Create Stage'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Delete Stage</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete "{editingStage?.name}"? 
              {editingStage?.rule_count > 0 && (
                <span className="block mt-2 text-amber-600">
                  {editingStage.rule_count} rules will be unassigned from this stage.
                </span>
              )}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
            <Button variant="destructive" onClick={handleDelete} data-testid="confirm-delete-btn">
              Delete Stage
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Stages;
