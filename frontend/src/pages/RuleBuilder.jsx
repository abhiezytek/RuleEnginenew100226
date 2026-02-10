import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Header } from '../components/layout/Header';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Textarea } from '../components/ui/textarea';
import { Label } from '../components/ui/label';
import { Switch } from '../components/ui/switch';
import { Checkbox } from '../components/ui/checkbox';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '../components/ui/select';
import { PageLoader } from '../components/shared/LoadingSpinner';
import { createRule, getRule, updateRule, getStages } from '../lib/api';
import { 
  RULE_CATEGORIES, 
  OPERATORS, 
  LOGICAL_OPERATORS, 
  CASE_TYPES, 
  PRODUCT_TYPES,
  AVAILABLE_FIELDS 
} from '../lib/constants';
import { toast } from 'sonner';
import { 
  Save, 
  ArrowLeft, 
  Plus, 
  Trash2, 
  GripVertical,
  AlertCircle
} from 'lucide-react';

const ConditionBuilder = ({ conditions, onChange, logicalOperator, onLogicalChange }) => {
  const addCondition = () => {
    onChange([...conditions, { field: '', operator: 'equals', value: '' }]);
  };

  const removeCondition = (index) => {
    onChange(conditions.filter((_, i) => i !== index));
  };

  const updateCondition = (index, field, value) => {
    const updated = [...conditions];
    updated[index] = { ...updated[index], [field]: value };
    onChange(updated);
  };

  return (
    <div className="space-y-4" data-testid="condition-builder">
      <div className="flex items-center gap-4">
        <Label>Logical Operator:</Label>
        <Select value={logicalOperator} onValueChange={onLogicalChange}>
          <SelectTrigger className="w-[120px]" data-testid="logical-operator-select">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {LOGICAL_OPERATORS.map(op => (
              <SelectItem key={op.value} value={op.value}>{op.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <span className="text-sm text-slate-500">
          {logicalOperator === 'AND' ? 'All conditions must match' : 'At least one condition must match'}
        </span>
      </div>

      <div className="space-y-3">
        {conditions.map((condition, index) => (
          <div 
            key={index} 
            className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg border border-slate-200"
            data-testid={`condition-${index}`}
          >
            <GripVertical className="w-4 h-4 text-slate-400 cursor-move" />
            
            <Select 
              value={condition.field} 
              onValueChange={(v) => updateCondition(index, 'field', v)}
            >
              <SelectTrigger className="w-[180px]" data-testid={`condition-field-${index}`}>
                <SelectValue placeholder="Select field" />
              </SelectTrigger>
              <SelectContent>
                {AVAILABLE_FIELDS.map(field => (
                  <SelectItem key={field.value} value={field.value}>
                    {field.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select 
              value={condition.operator} 
              onValueChange={(v) => updateCondition(index, 'operator', v)}
            >
              <SelectTrigger className="w-[180px]" data-testid={`condition-operator-${index}`}>
                <SelectValue placeholder="Operator" />
              </SelectTrigger>
              <SelectContent>
                {OPERATORS.map(op => (
                  <SelectItem key={op.value} value={op.value}>
                    <span className="flex items-center gap-2">
                      <span className="font-mono text-xs bg-slate-100 px-1.5 py-0.5 rounded">
                        {op.symbol}
                      </span>
                      {op.label}
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {!['is_empty', 'is_not_empty'].includes(condition.operator) && (
              <Input
                placeholder="Value"
                value={condition.value}
                onChange={(e) => updateCondition(index, 'value', e.target.value)}
                className="w-[150px]"
                data-testid={`condition-value-${index}`}
              />
            )}

            {condition.operator === 'between' && (
              <Input
                placeholder="Value 2"
                value={condition.value2 || ''}
                onChange={(e) => updateCondition(index, 'value2', e.target.value)}
                className="w-[150px]"
                data-testid={`condition-value2-${index}`}
              />
            )}

            <Button
              variant="ghost"
              size="icon"
              onClick={() => removeCondition(index)}
              className="text-slate-400 hover:text-red-500"
              data-testid={`condition-remove-${index}`}
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        ))}
      </div>

      <Button
        type="button"
        variant="outline"
        onClick={addCondition}
        className="w-full border-dashed"
        data-testid="add-condition-btn"
      >
        <Plus className="w-4 h-4 mr-2" />
        Add Condition
      </Button>
    </div>
  );
};

const RuleBuilder = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = Boolean(id);

  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [stages, setStages] = useState([]);

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: 'stp_decision',
    stage_id: null,
    priority: 100,
    is_enabled: true,
    effective_from: '',
    effective_to: '',
    products: [],
    case_types: [],
    condition_group: {
      logical_operator: 'AND',
      conditions: [],
      is_negated: false
    },
    action: {
      decision: '',
      score_impact: null,
      case_type: null,
      reason_code: '',
      reason_message: '',
      is_hard_stop: false
    }
  });

  useEffect(() => {
    fetchStages();
    if (isEdit) {
      fetchRule();
    }
  }, [id]);

  const fetchStages = async () => {
    try {
      const response = await getStages();
      setStages(response.data);
    } catch (error) {
      console.error('Failed to fetch stages:', error);
    }
  };

  const fetchRule = async () => {
    try {
      const response = await getRule(id);
      setFormData(response.data);
    } catch (error) {
      toast.error('Failed to load rule');
      navigate('/rules');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      toast.error('Rule name is required');
      return;
    }

    if (formData.condition_group.conditions.length === 0) {
      toast.error('At least one condition is required');
      return;
    }

    try {
      setSaving(true);
      
      // Parse numeric values in conditions
      const processedData = {
        ...formData,
        condition_group: {
          ...formData.condition_group,
          conditions: formData.condition_group.conditions.map(cond => ({
            ...cond,
            value: parseConditionValue(cond.value),
            value2: cond.value2 ? parseConditionValue(cond.value2) : null
          }))
        },
        action: {
          ...formData.action,
          score_impact: formData.action.score_impact ? parseInt(formData.action.score_impact) : null,
          case_type: formData.action.case_type !== null && formData.action.case_type !== '' 
            ? parseInt(formData.action.case_type) 
            : null
        }
      };

      if (isEdit) {
        await updateRule(id, processedData);
        toast.success('Rule updated successfully');
      } else {
        await createRule(processedData);
        toast.success('Rule created successfully');
      }
      
      navigate('/rules');
    } catch (error) {
      console.error('Failed to save rule:', error);
      toast.error('Failed to save rule');
    } finally {
      setSaving(false);
    }
  };

  const parseConditionValue = (value) => {
    if (value === 'true') return true;
    if (value === 'false') return false;
    const num = Number(value);
    if (!isNaN(num) && value !== '') return num;
    return value;
  };

  const handleProductToggle = (product) => {
    const products = formData.products.includes(product)
      ? formData.products.filter(p => p !== product)
      : [...formData.products, product];
    setFormData({ ...formData, products });
  };

  if (loading) {
    return (
      <div className="p-6">
        <Header title="Rule Builder" subtitle="Loading rule..." />
        <PageLoader />
      </div>
    );
  }

  return (
    <div className="min-h-screen" data-testid="rule-builder-page">
      <Header 
        title={isEdit ? 'Edit Rule' : 'Create Rule'} 
        subtitle="Define underwriting rule conditions and actions" 
      />
      
      <form onSubmit={handleSubmit} className="p-6 space-y-6">
        {/* Back Button */}
        <Button
          type="button"
          variant="ghost"
          onClick={() => navigate('/rules')}
          className="mb-4"
          data-testid="back-btn"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Rules
        </Button>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Form */}
          <div className="lg:col-span-2 space-y-6">
            {/* Basic Info */}
            <Card className="border-slate-200">
              <CardHeader>
                <CardTitle>Basic Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2">
                    <Label htmlFor="name">Rule Name *</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="e.g., High Sum Assured Check"
                      className="mt-1.5"
                      data-testid="rule-name-input"
                    />
                  </div>
                  
                  <div className="col-span-2">
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      placeholder="Describe what this rule does..."
                      className="mt-1.5"
                      rows={2}
                      data-testid="rule-description-input"
                    />
                  </div>

                  <div>
                    <Label htmlFor="category">Category *</Label>
                    <Select 
                      value={formData.category} 
                      onValueChange={(v) => setFormData({ ...formData, category: v })}
                    >
                      <SelectTrigger className="mt-1.5" data-testid="rule-category-select">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {RULE_CATEGORIES.map(cat => (
                          <SelectItem key={cat.value} value={cat.value}>
                            {cat.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="priority">Priority</Label>
                    <Input
                      id="priority"
                      type="number"
                      min="1"
                      max="1000"
                      value={formData.priority}
                      onChange={(e) => setFormData({ ...formData, priority: parseInt(e.target.value) || 100 })}
                      className="mt-1.5"
                      data-testid="rule-priority-input"
                    />
                    <p className="text-xs text-slate-500 mt-1">Lower = Higher priority</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Conditions */}
            <Card className="border-slate-200">
              <CardHeader>
                <CardTitle>Conditions</CardTitle>
              </CardHeader>
              <CardContent>
                <ConditionBuilder
                  conditions={formData.condition_group.conditions}
                  onChange={(conditions) => setFormData({
                    ...formData,
                    condition_group: { ...formData.condition_group, conditions }
                  })}
                  logicalOperator={formData.condition_group.logical_operator}
                  onLogicalChange={(op) => setFormData({
                    ...formData,
                    condition_group: { ...formData.condition_group, logical_operator: op }
                  })}
                />

                <div className="flex items-center gap-2 mt-4 p-3 bg-amber-50 rounded-lg border border-amber-200">
                  <Checkbox
                    id="is_negated"
                    checked={formData.condition_group.is_negated}
                    onCheckedChange={(checked) => setFormData({
                      ...formData,
                      condition_group: { ...formData.condition_group, is_negated: checked }
                    })}
                    data-testid="is-negated-checkbox"
                  />
                  <Label htmlFor="is_negated" className="text-amber-700">
                    Negate this condition group (NOT)
                  </Label>
                </div>
              </CardContent>
            </Card>

            {/* Actions */}
            <Card className="border-slate-200">
              <CardHeader>
                <CardTitle>Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="decision">Decision</Label>
                    <Select 
                      value={formData.action.decision || ''} 
                      onValueChange={(v) => setFormData({
                        ...formData,
                        action: { ...formData.action, decision: v }
                      })}
                    >
                      <SelectTrigger className="mt-1.5" data-testid="action-decision-select">
                        <SelectValue placeholder="Select decision" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="PASS">PASS</SelectItem>
                        <SelectItem value="FAIL">FAIL</SelectItem>
                        <SelectItem value="REFER">REFER</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="score_impact">Score Impact</Label>
                    <Input
                      id="score_impact"
                      type="number"
                      value={formData.action.score_impact || ''}
                      onChange={(e) => setFormData({
                        ...formData,
                        action: { ...formData.action, score_impact: e.target.value }
                      })}
                      placeholder="e.g., -10 or +15"
                      className="mt-1.5"
                      data-testid="action-score-input"
                    />
                  </div>

                  <div>
                    <Label htmlFor="case_type">Case Type</Label>
                    <Select 
                      value={formData.action.case_type?.toString() || ''} 
                      onValueChange={(v) => setFormData({
                        ...formData,
                        action: { ...formData.action, case_type: v }
                      })}
                    >
                      <SelectTrigger className="mt-1.5" data-testid="action-case-type-select">
                        <SelectValue placeholder="Select case type" />
                      </SelectTrigger>
                      <SelectContent>
                        {CASE_TYPES.map(ct => (
                          <SelectItem key={ct.value} value={ct.value.toString()}>
                            {ct.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="reason_code">Reason Code</Label>
                    <Input
                      id="reason_code"
                      value={formData.action.reason_code}
                      onChange={(e) => setFormData({
                        ...formData,
                        action: { ...formData.action, reason_code: e.target.value }
                      })}
                      placeholder="e.g., STP001"
                      className="mt-1.5"
                      data-testid="action-reason-code-input"
                    />
                  </div>

                  <div className="col-span-2">
                    <Label htmlFor="reason_message">Reason Message</Label>
                    <Textarea
                      id="reason_message"
                      value={formData.action.reason_message}
                      onChange={(e) => setFormData({
                        ...formData,
                        action: { ...formData.action, reason_message: e.target.value }
                      })}
                      placeholder="Describe the reason for this action..."
                      className="mt-1.5"
                      rows={2}
                      data-testid="action-reason-message-input"
                    />
                  </div>
                </div>

                <div className="flex items-center gap-2 p-3 bg-red-50 rounded-lg border border-red-200">
                  <Checkbox
                    id="is_hard_stop"
                    checked={formData.action.is_hard_stop}
                    onCheckedChange={(checked) => setFormData({
                      ...formData,
                      action: { ...formData.action, is_hard_stop: checked }
                    })}
                    data-testid="is-hard-stop-checkbox"
                  />
                  <Label htmlFor="is_hard_stop" className="text-red-700">
                    <AlertCircle className="w-4 h-4 inline mr-1" />
                    Hard Stop Rule (Immediately fail STP)
                  </Label>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Status */}
            <Card className="border-slate-200">
              <CardHeader>
                <CardTitle>Status</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label>Enabled</Label>
                  <Switch
                    checked={formData.is_enabled}
                    onCheckedChange={(checked) => setFormData({ ...formData, is_enabled: checked })}
                    data-testid="is-enabled-switch"
                  />
                </div>

                <div>
                  <Label htmlFor="effective_from">Effective From</Label>
                  <Input
                    id="effective_from"
                    type="datetime-local"
                    value={formData.effective_from}
                    onChange={(e) => setFormData({ ...formData, effective_from: e.target.value })}
                    className="mt-1.5"
                    data-testid="effective-from-input"
                  />
                </div>

                <div>
                  <Label htmlFor="effective_to">Effective To</Label>
                  <Input
                    id="effective_to"
                    type="datetime-local"
                    value={formData.effective_to}
                    onChange={(e) => setFormData({ ...formData, effective_to: e.target.value })}
                    className="mt-1.5"
                    data-testid="effective-to-input"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Products */}
            <Card className="border-slate-200">
              <CardHeader>
                <CardTitle>Applicable Products</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {PRODUCT_TYPES.map(product => (
                  <div key={product.value} className="flex items-center gap-2">
                    <Checkbox
                      id={`product-${product.value}`}
                      checked={formData.products.includes(product.value)}
                      onCheckedChange={() => handleProductToggle(product.value)}
                      data-testid={`product-checkbox-${product.value}`}
                    />
                    <Label htmlFor={`product-${product.value}`}>{product.label}</Label>
                  </div>
                ))}
                <p className="text-xs text-slate-500 mt-2">
                  Leave empty to apply to all products
                </p>
              </CardContent>
            </Card>

            {/* Save Button */}
            <Button 
              type="submit" 
              className="w-full" 
              disabled={saving}
              data-testid="save-rule-btn"
            >
              <Save className="w-4 h-4 mr-2" />
              {saving ? 'Saving...' : (isEdit ? 'Update Rule' : 'Create Rule')}
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
};

export default RuleBuilder;
