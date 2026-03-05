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
  AlertCircle,
  Layers,
  ChevronDown,
  ChevronRight
} from 'lucide-react';

// Single condition row component
const ConditionRow = ({ condition, onChange, onRemove, index }) => {
  return (
    <div 
      className="flex items-center gap-2 p-2 bg-white rounded border border-slate-200"
      data-testid={`condition-${index}`}
    >
      <GripVertical className="w-4 h-4 text-slate-400 cursor-move flex-shrink-0" />
      
      <Select 
        value={condition.field || ''} 
        onValueChange={(v) => onChange({ ...condition, field: v })}
      >
        <SelectTrigger className="w-[160px]" data-testid={`condition-field-${index}`}>
          <SelectValue placeholder="Field" />
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
        value={condition.operator || 'equals'} 
        onValueChange={(v) => onChange({ ...condition, operator: v })}
      >
        <SelectTrigger className="w-[160px]" data-testid={`condition-operator-${index}`}>
          <SelectValue placeholder="Operator" />
        </SelectTrigger>
        <SelectContent>
          {OPERATORS.map(op => (
            <SelectItem key={op.value} value={op.value}>
              <span className="flex items-center gap-1">
                <span className="font-mono text-xs">{op.symbol}</span>
                {op.label}
              </span>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {!['is_empty', 'is_not_empty'].includes(condition.operator) && (
        <Input
          placeholder="Value"
          value={condition.value !== undefined ? String(condition.value) : ''}
          onChange={(e) => onChange({ ...condition, value: e.target.value })}
          className="w-[120px]"
          data-testid={`condition-value-${index}`}
        />
      )}

      {condition.operator === 'between' && (
        <Input
          placeholder="Value 2"
          value={condition.value2 || ''}
          onChange={(e) => onChange({ ...condition, value2: e.target.value })}
          className="w-[120px]"
          data-testid={`condition-value2-${index}`}
        />
      )}

      <Button
        type="button"
        variant="ghost"
        size="icon"
        onClick={onRemove}
        className="text-slate-400 hover:text-red-500 flex-shrink-0"
        data-testid={`condition-remove-${index}`}
      >
        <Trash2 className="w-4 h-4" />
      </Button>
    </div>
  );
};

// Nested condition group component - supports (A OR B) AND (C OR D) structure
const NestedConditionGroup = ({ 
  group, 
  onChange, 
  onRemove, 
  depth = 0,
  path = ''
}) => {
  const [isExpanded, setIsExpanded] = useState(true);
  
  const isConditionGroup = (item) => {
    return item && (item.conditions !== undefined || item.logical_operator !== undefined);
  };

  const addCondition = () => {
    const newCondition = { field: '', operator: 'equals', value: '' };
    onChange({
      ...group,
      conditions: [...(group.conditions || []), newCondition]
    });
  };

  const addNestedGroup = () => {
    const newGroup = {
      logical_operator: group.logical_operator === 'AND' ? 'OR' : 'AND',
      conditions: [{ field: '', operator: 'equals', value: '' }],
      is_negated: false
    };
    onChange({
      ...group,
      conditions: [...(group.conditions || []), newGroup]
    });
  };

  const updateItem = (index, newItem) => {
    const updated = [...(group.conditions || [])];
    updated[index] = newItem;
    onChange({ ...group, conditions: updated });
  };

  const removeItem = (index) => {
    const updated = (group.conditions || []).filter((_, i) => i !== index);
    onChange({ ...group, conditions: updated });
  };

  const updateLogicalOperator = (op) => {
    onChange({ ...group, logical_operator: op });
  };

  const bgColors = [
    'bg-blue-50 border-blue-200',
    'bg-purple-50 border-purple-200',
    'bg-emerald-50 border-emerald-200',
    'bg-amber-50 border-amber-200'
  ];
  
  const bgColor = bgColors[depth % bgColors.length];

  return (
    <div className={`rounded-lg border-2 ${bgColor} p-3 ${depth > 0 ? 'ml-4' : ''}`}>
      {/* Group Header */}
      <div className="flex items-center gap-3 mb-3">
        <button 
          type="button"
          onClick={() => setIsExpanded(!isExpanded)}
          className="text-slate-500 hover:text-slate-700"
        >
          {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
        </button>
        
        <div className="flex items-center gap-2 bg-white rounded-md px-2 py-1 border border-slate-200">
          <Layers className="w-4 h-4 text-slate-400" />
          <span className="text-sm font-medium text-slate-600">
            {depth === 0 ? 'Root Group' : `Nested Group ${depth}`}
          </span>
        </div>
        
        <Select value={group.logical_operator || 'AND'} onValueChange={updateLogicalOperator}>
          <SelectTrigger className="w-[100px] h-8">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="AND">AND</SelectItem>
            <SelectItem value="OR">OR</SelectItem>
          </SelectContent>
        </Select>
        
        <span className="text-xs text-slate-500">
          {group.logical_operator === 'AND' ? '(all must match)' : '(any must match)'}
        </span>
        
        {depth > 0 && (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={onRemove}
            className="ml-auto text-slate-400 hover:text-red-500"
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        )}
      </div>

      {/* Conditions */}
      {isExpanded && (
        <div className="space-y-2">
          {(group.conditions || []).map((item, index) => (
            <div key={index}>
              {isConditionGroup(item) ? (
                <NestedConditionGroup
                  group={item}
                  onChange={(newGroup) => updateItem(index, newGroup)}
                  onRemove={() => removeItem(index)}
                  depth={depth + 1}
                  path={`${path}[${index}]`}
                />
              ) : (
                <ConditionRow
                  condition={item}
                  onChange={(newCond) => updateItem(index, newCond)}
                  onRemove={() => removeItem(index)}
                  index={index}
                />
              )}
              
              {/* Show logical operator between conditions */}
              {index < (group.conditions || []).length - 1 && (
                <div className="flex items-center justify-center py-1">
                  <span className={`text-xs font-bold px-2 py-0.5 rounded ${
                    group.logical_operator === 'AND' 
                      ? 'bg-blue-100 text-blue-700' 
                      : 'bg-orange-100 text-orange-700'
                  }`}>
                    {group.logical_operator || 'AND'}
                  </span>
                </div>
              )}
            </div>
          ))}

          {/* Add buttons */}
          <div className="flex gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={addCondition}
              className="flex-1 border-dashed"
            >
              <Plus className="w-3 h-3 mr-1" />
              Add Condition
            </Button>
            {depth < 3 && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addNestedGroup}
                className="flex-1 border-dashed bg-gradient-to-r from-purple-50 to-blue-50 hover:from-purple-100 hover:to-blue-100"
              >
                <Layers className="w-3 h-3 mr-1" />
                Add Nested Group
              </Button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

// Main Condition Builder with nested support
const ConditionBuilder = ({ conditionGroup, onChange }) => {
  return (
    <div className="space-y-4" data-testid="condition-builder">
      {/* Help text */}
      <div className="bg-slate-100 rounded-lg p-3 text-sm text-slate-600">
        <p className="font-medium mb-1">💡 Building Complex Conditions</p>
        <p>Create nested conditions like: <code className="bg-slate-200 px-1 rounded">(A OR B) AND (C OR D)</code></p>
        <ul className="list-disc list-inside mt-1 text-xs">
          <li><strong>AND</strong> = All conditions in the group must be true</li>
          <li><strong>OR</strong> = At least one condition must be true</li>
          <li>Use "Add Nested Group" to create sub-groups with different logic</li>
        </ul>
      </div>

      <NestedConditionGroup
        group={conditionGroup}
        onChange={onChange}
        depth={0}
      />

      {/* Negate option */}
      <div className="flex items-center gap-2 p-3 bg-amber-50 rounded-lg border border-amber-200">
        <Checkbox
          id="is_negated"
          checked={conditionGroup.is_negated || false}
          onCheckedChange={(checked) => onChange({ ...conditionGroup, is_negated: checked })}
          data-testid="is-negated-checkbox"
        />
        <Label htmlFor="is_negated" className="text-amber-700">
          Negate entire condition group (NOT) - Trigger when conditions are FALSE
        </Label>
      </div>
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

  // Recursively process conditions to parse values
  const processConditions = (items) => {
    return items.map(item => {
      // Check if it's a nested condition group
      if (item.conditions !== undefined || item.logical_operator !== undefined) {
        return {
          ...item,
          conditions: processConditions(item.conditions || [])
        };
      }
      // It's a simple condition
      return {
        ...item,
        value: parseConditionValue(item.value),
        value2: item.value2 ? parseConditionValue(item.value2) : null
      };
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      toast.error('Rule name is required');
      return;
    }

    if (!formData.condition_group.conditions || formData.condition_group.conditions.length === 0) {
      toast.error('At least one condition is required');
      return;
    }

    try {
      setSaving(true);
      
      // Parse numeric values in conditions (including nested)
      const processedData = {
        ...formData,
        condition_group: {
          ...formData.condition_group,
          conditions: processConditions(formData.condition_group.conditions || [])
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
                    <Label htmlFor="stage">Execution Stage</Label>
                    <Select 
                      value={formData.stage_id || 'none'} 
                      onValueChange={(v) => setFormData({ ...formData, stage_id: v === 'none' ? null : v })}
                    >
                      <SelectTrigger className="mt-1.5" data-testid="rule-stage-select">
                        <SelectValue placeholder="Select stage" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">
                          <span className="text-slate-500">No stage (processed last)</span>
                        </SelectItem>
                        {stages.map(stage => (
                          <SelectItem key={stage.id} value={stage.id}>
                            <span className="flex items-center gap-2">
                              <span className={`w-2 h-2 rounded-full bg-${stage.color}-500`} />
                              {stage.name}
                            </span>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-slate-500 mt-1">Rules in earlier stages run first</p>
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
                  conditionGroup={formData.condition_group}
                  onChange={(newConditionGroup) => setFormData({
                    ...formData,
                    condition_group: newConditionGroup
                  })}
                />
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
