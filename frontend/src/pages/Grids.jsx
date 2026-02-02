import React, { useState, useEffect } from 'react';
import { Header } from '../components/layout/Header';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { Checkbox } from '../components/ui/checkbox';
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
import { getGrids, createGrid, updateGrid, deleteGrid } from '../lib/api';
import { PRODUCT_TYPES, GRID_TYPES, GRID_RESULTS } from '../lib/constants';
import { toast } from 'sonner';
import { 
  Plus, 
  Grid3X3, 
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

const Grids = () => {
  const [grids, setGrids] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedGrid, setSelectedGrid] = useState(null);
  const [saving, setSaving] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    grid_type: 'bmi',
    row_field: '',
    col_field: '',
    row_labels: [],
    col_labels: [],
    cells: [],
    products: [],
    is_enabled: true
  });

  const [newRowLabel, setNewRowLabel] = useState('');
  const [newColLabel, setNewColLabel] = useState('');

  const fetchGrids = async () => {
    try {
      setLoading(true);
      const response = await getGrids();
      setGrids(response.data);
    } catch (error) {
      toast.error('Failed to load grids');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGrids();
  }, []);

  const openCreateDialog = () => {
    setSelectedGrid(null);
    setFormData({
      name: '',
      description: '',
      grid_type: 'bmi',
      row_field: '',
      col_field: '',
      row_labels: [],
      col_labels: [],
      cells: [],
      products: [],
      is_enabled: true
    });
    setDialogOpen(true);
  };

  const openEditDialog = (grid) => {
    setSelectedGrid(grid);
    setFormData({
      name: grid.name,
      description: grid.description || '',
      grid_type: grid.grid_type,
      row_field: grid.row_field,
      col_field: grid.col_field,
      row_labels: grid.row_labels || [],
      col_labels: grid.col_labels || [],
      cells: grid.cells || [],
      products: grid.products || [],
      is_enabled: grid.is_enabled
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
      if (selectedGrid) {
        await updateGrid(selectedGrid.id, formData);
        toast.success('Grid updated');
      } else {
        await createGrid(formData);
        toast.success('Grid created');
      }
      setDialogOpen(false);
      fetchGrids();
    } catch (error) {
      toast.error('Failed to save grid');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedGrid) return;
    try {
      await deleteGrid(selectedGrid.id);
      toast.success('Grid deleted');
      setDeleteDialogOpen(false);
      fetchGrids();
    } catch (error) {
      toast.error('Failed to delete grid');
    }
  };

  const addRowLabel = () => {
    if (newRowLabel.trim()) {
      setFormData({
        ...formData,
        row_labels: [...formData.row_labels, newRowLabel.trim()]
      });
      setNewRowLabel('');
    }
  };

  const addColLabel = () => {
    if (newColLabel.trim()) {
      setFormData({
        ...formData,
        col_labels: [...formData.col_labels, newColLabel.trim()]
      });
      setNewColLabel('');
    }
  };

  const removeRowLabel = (index) => {
    setFormData({
      ...formData,
      row_labels: formData.row_labels.filter((_, i) => i !== index),
      cells: formData.cells.filter(c => c.row_value !== formData.row_labels[index])
    });
  };

  const removeColLabel = (index) => {
    setFormData({
      ...formData,
      col_labels: formData.col_labels.filter((_, i) => i !== index),
      cells: formData.cells.filter(c => c.col_value !== formData.col_labels[index])
    });
  };

  const getCellValue = (rowLabel, colLabel) => {
    const cell = formData.cells.find(c => c.row_value === rowLabel && c.col_value === colLabel);
    return cell || { row_value: rowLabel, col_value: colLabel, result: 'ACCEPT', score_impact: 0 };
  };

  const updateCell = (rowLabel, colLabel, field, value) => {
    const existingIndex = formData.cells.findIndex(c => c.row_value === rowLabel && c.col_value === colLabel);
    const newCell = {
      row_value: rowLabel,
      col_value: colLabel,
      result: field === 'result' ? value : getCellValue(rowLabel, colLabel).result,
      score_impact: field === 'score_impact' ? parseInt(value) || 0 : getCellValue(rowLabel, colLabel).score_impact
    };

    if (existingIndex >= 0) {
      const updated = [...formData.cells];
      updated[existingIndex] = newCell;
      setFormData({ ...formData, cells: updated });
    } else {
      setFormData({ ...formData, cells: [...formData.cells, newCell] });
    }
  };

  const handleProductToggle = (product) => {
    const products = formData.products.includes(product)
      ? formData.products.filter(p => p !== product)
      : [...formData.products, product];
    setFormData({ ...formData, products });
  };

  const getCellClass = (result) => {
    switch (result) {
      case 'ACCEPT': return 'bg-emerald-50 text-emerald-700';
      case 'DECLINE': return 'bg-red-50 text-red-700';
      case 'REFER': return 'bg-amber-50 text-amber-700';
      default: return 'bg-slate-50';
    }
  };

  if (loading) {
    return (
      <div className="p-6">
        <Header title="Grids" subtitle="Configure decision grids" />
        <PageLoader />
      </div>
    );
  }

  return (
    <div className="min-h-screen" data-testid="grids-page">
      <Header title="Grids" subtitle="Configure BMI, Income×SA, and other decision grids" />
      
      <div className="p-6 space-y-6">
        <div className="flex justify-end">
          <Button onClick={openCreateDialog} data-testid="create-grid-btn">
            <Plus className="w-4 h-4 mr-2" />
            Create Grid
          </Button>
        </div>

        {grids.length === 0 ? (
          <EmptyState
            icon={Grid3X3}
            title="No grids found"
            description="Create decision grids for BMI, Income vs Sum Assured, and occupation rules."
            actionLabel="Create Grid"
            onAction={openCreateDialog}
          />
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {grids.map((grid) => (
              <Card 
                key={grid.id} 
                className="border-slate-200"
                data-testid={`grid-card-${grid.id}`}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-lg">{grid.name}</CardTitle>
                      <p className="text-sm text-slate-500 mt-1">{grid.description}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${grid.is_enabled ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
                        {grid.is_enabled ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3 mb-4">
                    <div className="flex items-center gap-2 text-sm">
                      <span className="text-slate-500">Type:</span>
                      <span className="font-medium">
                        {GRID_TYPES.find(t => t.value === grid.grid_type)?.label || grid.grid_type}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <span className="text-slate-500">Dimensions:</span>
                      <span className="font-medium">
                        {grid.row_labels?.length || 0} × {grid.col_labels?.length || 0}
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {grid.products?.map(prod => (
                        <ProductBadge key={prod} product={prod} />
                      ))}
                    </div>
                  </div>

                  {/* Mini Grid Preview */}
                  {grid.row_labels?.length > 0 && grid.col_labels?.length > 0 && (
                    <div className="overflow-x-auto mb-4">
                      <table className="w-full text-xs border-collapse">
                        <thead>
                          <tr>
                            <th className="p-1 border border-slate-200 bg-slate-50"></th>
                            {grid.col_labels.slice(0, 4).map((col, idx) => (
                              <th key={idx} className="p-1 border border-slate-200 bg-slate-50 font-medium">
                                {col}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {grid.row_labels.slice(0, 3).map((row, rowIdx) => (
                            <tr key={rowIdx}>
                              <td className="p-1 border border-slate-200 bg-slate-50 font-medium">{row}</td>
                              {grid.col_labels.slice(0, 4).map((col, colIdx) => {
                                const cell = grid.cells?.find(c => c.row_value === row && c.col_value === col);
                                return (
                                  <td 
                                    key={colIdx} 
                                    className={`p-1 border border-slate-200 text-center ${getCellClass(cell?.result)}`}
                                  >
                                    {cell?.result?.charAt(0) || '-'}
                                  </td>
                                );
                              })}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}

                  <div className="flex gap-2 pt-4 border-t border-slate-100">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="flex-1"
                      onClick={() => openEditDialog(grid)}
                      data-testid={`edit-grid-${grid.id}`}
                    >
                      <Edit className="w-4 h-4 mr-1" />
                      Edit
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm"
                      className="text-red-600 hover:text-red-700"
                      onClick={() => {
                        setSelectedGrid(grid);
                        setDeleteDialogOpen(true);
                      }}
                      data-testid={`delete-grid-${grid.id}`}
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
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {selectedGrid ? 'Edit Grid' : 'Create Grid'}
              </DialogTitle>
            </DialogHeader>
            
            <div className="space-y-6 py-4">
              {/* Basic Info */}
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <Label>Name *</Label>
                  <Input
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Grid name"
                    className="mt-1.5"
                    data-testid="grid-name-input"
                  />
                </div>
                <div className="col-span-2">
                  <Label>Description</Label>
                  <Textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Brief description"
                    className="mt-1.5"
                    rows={2}
                  />
                </div>
                <div>
                  <Label>Grid Type</Label>
                  <Select 
                    value={formData.grid_type} 
                    onValueChange={(v) => setFormData({ ...formData, grid_type: v })}
                  >
                    <SelectTrigger className="mt-1.5" data-testid="grid-type-select">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {GRID_TYPES.map(t => (
                        <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
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

              {/* Field Mapping */}
              <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-200">
                <div>
                  <Label>Row Field</Label>
                  <Input
                    value={formData.row_field}
                    onChange={(e) => setFormData({ ...formData, row_field: e.target.value })}
                    placeholder="e.g., bmi"
                    className="mt-1.5"
                  />
                </div>
                <div>
                  <Label>Column Field</Label>
                  <Input
                    value={formData.col_field}
                    onChange={(e) => setFormData({ ...formData, col_field: e.target.value })}
                    placeholder="e.g., applicant_age"
                    className="mt-1.5"
                  />
                </div>
              </div>

              {/* Products */}
              <div className="pt-4 border-t border-slate-200">
                <Label className="mb-2 block">Applicable Products</Label>
                <div className="flex flex-wrap gap-4">
                  {PRODUCT_TYPES.map(product => (
                    <div key={product.value} className="flex items-center gap-2">
                      <Checkbox
                        id={`grid-product-${product.value}`}
                        checked={formData.products.includes(product.value)}
                        onCheckedChange={() => handleProductToggle(product.value)}
                      />
                      <Label htmlFor={`grid-product-${product.value}`}>{product.label}</Label>
                    </div>
                  ))}
                </div>
              </div>

              {/* Labels Configuration */}
              <div className="grid grid-cols-2 gap-6 pt-4 border-t border-slate-200">
                {/* Row Labels */}
                <div>
                  <Label className="mb-2 block">Row Labels</Label>
                  <div className="flex gap-2 mb-2">
                    <Input
                      value={newRowLabel}
                      onChange={(e) => setNewRowLabel(e.target.value)}
                      placeholder="Add row label"
                      onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addRowLabel())}
                    />
                    <Button type="button" variant="outline" onClick={addRowLabel}>
                      <Plus className="w-4 h-4" />
                    </Button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {formData.row_labels.map((label, idx) => (
                      <span 
                        key={idx} 
                        className="inline-flex items-center gap-1 px-2 py-1 bg-slate-100 rounded text-sm"
                      >
                        {label}
                        <button 
                          onClick={() => removeRowLabel(idx)}
                          className="text-slate-400 hover:text-red-500"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                </div>

                {/* Column Labels */}
                <div>
                  <Label className="mb-2 block">Column Labels</Label>
                  <div className="flex gap-2 mb-2">
                    <Input
                      value={newColLabel}
                      onChange={(e) => setNewColLabel(e.target.value)}
                      placeholder="Add column label"
                      onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addColLabel())}
                    />
                    <Button type="button" variant="outline" onClick={addColLabel}>
                      <Plus className="w-4 h-4" />
                    </Button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {formData.col_labels.map((label, idx) => (
                      <span 
                        key={idx} 
                        className="inline-flex items-center gap-1 px-2 py-1 bg-slate-100 rounded text-sm"
                      >
                        {label}
                        <button 
                          onClick={() => removeColLabel(idx)}
                          className="text-slate-400 hover:text-red-500"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Grid Matrix */}
              {formData.row_labels.length > 0 && formData.col_labels.length > 0 && (
                <div className="pt-4 border-t border-slate-200">
                  <Label className="mb-2 block">Grid Matrix</Label>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm border-collapse">
                      <thead>
                        <tr>
                          <th className="p-2 border border-slate-200 bg-slate-50 font-semibold text-left">
                            {formData.row_field} \ {formData.col_field}
                          </th>
                          {formData.col_labels.map((col, idx) => (
                            <th key={idx} className="p-2 border border-slate-200 bg-slate-50 font-semibold text-center">
                              {col}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {formData.row_labels.map((row, rowIdx) => (
                          <tr key={rowIdx}>
                            <td className="p-2 border border-slate-200 bg-slate-50 font-semibold">
                              {row}
                            </td>
                            {formData.col_labels.map((col, colIdx) => {
                              const cell = getCellValue(row, col);
                              return (
                                <td 
                                  key={colIdx} 
                                  className={`p-1 border border-slate-200 ${getCellClass(cell.result)}`}
                                >
                                  <div className="flex flex-col gap-1">
                                    <Select 
                                      value={cell.result} 
                                      onValueChange={(v) => updateCell(row, col, 'result', v)}
                                    >
                                      <SelectTrigger className="h-7 text-xs">
                                        <SelectValue />
                                      </SelectTrigger>
                                      <SelectContent>
                                        {GRID_RESULTS.map(r => (
                                          <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>
                                        ))}
                                      </SelectContent>
                                    </Select>
                                    <Input
                                      type="number"
                                      placeholder="Score"
                                      value={cell.score_impact || ''}
                                      onChange={(e) => updateCell(row, col, 'score_impact', e.target.value)}
                                      className="h-7 text-xs"
                                    />
                                  </div>
                                </td>
                              );
                            })}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleSave} disabled={saving} data-testid="save-grid-btn">
                <Save className="w-4 h-4 mr-2" />
                {saving ? 'Saving...' : 'Save Grid'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Delete Dialog */}
        <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Grid</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete "{selectedGrid?.name}"? This action cannot be undone.
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

export default Grids;
