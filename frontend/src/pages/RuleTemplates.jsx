import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Header } from '../components/layout/Header';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Badge } from '../components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../components/ui/dialog';
import { PageLoader } from '../components/shared/LoadingSpinner';
import { getRuleTemplates, createRuleFromTemplate, getStages } from '../lib/api';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'sonner';
import { RULE_CATEGORIES, getCategoryColor } from '../lib/constants';
import {
  FileText,
  Search,
  Plus,
  ArrowRight,
  CheckCircle,
  AlertTriangle,
  FileCode,
  Layers
} from 'lucide-react';

const RuleTemplates = () => {
  const navigate = useNavigate();
  const { hasPermission } = useAuth();
  const [templates, setTemplates] = useState([]);
  const [stages, setStages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  
  // Dialog states
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [selectedStageId, setSelectedStageId] = useState('');
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [templatesRes, stagesRes] = await Promise.all([
        getRuleTemplates(),
        getStages()
      ]);
      setTemplates(templatesRes.data);
      setStages(stagesRes.data);
    } catch (error) {
      console.error('Failed to fetch data:', error);
      toast.error('Failed to load templates');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateRule = async () => {
    if (!selectedTemplate) return;

    try {
      setCreating(true);
      const response = await createRuleFromTemplate(
        selectedTemplate.template_id, 
        selectedStageId || null
      );
      toast.success(`Rule "${response.data.name}" created successfully`);
      setCreateDialogOpen(false);
      navigate(`/rules/${response.data.id}/edit`);
    } catch (error) {
      console.error('Failed to create rule:', error);
      toast.error(error.response?.data?.detail || 'Failed to create rule from template');
    } finally {
      setCreating(false);
    }
  };

  const openCreateDialog = (template) => {
    setSelectedTemplate(template);
    setSelectedStageId('');
    setCreateDialogOpen(true);
  };

  const filteredTemplates = templates.filter(t => {
    const matchesSearch = 
      t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.template_id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (t.description && t.description.toLowerCase().includes(searchQuery.toLowerCase()));
    
    const matchesCategory = categoryFilter === 'all' || t.category === categoryFilter;
    
    return matchesSearch && matchesCategory;
  });

  // Group templates by category
  const groupedTemplates = filteredTemplates.reduce((acc, template) => {
    const category = template.category || 'other';
    if (!acc[category]) acc[category] = [];
    acc[category].push(template);
    return acc;
  }, {});

  if (loading) {
    return (
      <div className="p-6">
        <Header title="Rule Templates" subtitle="Loading templates..." />
        <PageLoader />
      </div>
    );
  }

  return (
    <div className="min-h-screen" data-testid="rule-templates-page">
      <Header 
        title="STP Rule Templates" 
        subtitle={`${templates.length} pre-configured rules based on STP specifications`}
      />

      <div className="p-6 space-y-6">
        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input
              placeholder="Search templates (e.g., STP001, BMI, Age)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="All Categories" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {RULE_CATEGORIES.map(cat => (
                <SelectItem key={cat.value} value={cat.value}>{cat.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Info Banner */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-start gap-3">
          <FileCode className="w-5 h-5 text-blue-600 mt-0.5" />
          <div>
            <h4 className="font-medium text-blue-900">STP Rule Templates</h4>
            <p className="text-sm text-blue-700 mt-1">
              These templates are based on the STP Rule Engine specification document. 
              Click "Create Rule" to add a template as an active rule in your system.
              You can then customize the rule conditions and actions.
            </p>
          </div>
        </div>

        {/* Templates by Category */}
        {Object.entries(groupedTemplates).map(([category, categoryTemplates]) => {
          const categoryInfo = RULE_CATEGORIES.find(c => c.value === category) || { label: category };
          const colorClass = getCategoryColor(category);
          
          return (
            <div key={category} className="space-y-3">
              <h3 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
                <Layers className={`w-5 h-5 text-${colorClass}-600`} />
                {categoryInfo.label}
                <Badge variant="outline" className="ml-2">{categoryTemplates.length}</Badge>
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {categoryTemplates.map((template) => (
                  <Card key={template.id} className="border-slate-200 hover:shadow-md transition-shadow">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between mb-2">
                        <Badge className={`bg-${colorClass}-100 text-${colorClass}-700 border-${colorClass}-200`}>
                          {template.template_id}
                        </Badge>
                        {template.letter_flag && (
                          <Badge variant="outline" className="text-xs">
                            Flag: {template.letter_flag}
                          </Badge>
                        )}
                      </div>
                      
                      <h4 className="font-medium text-slate-900 mb-1">{template.name}</h4>
                      <p className="text-sm text-slate-600 line-clamp-2 mb-3">
                        {template.description || 'No description'}
                      </p>
                      
                      <div className="flex items-center gap-2 text-xs text-slate-500 mb-3">
                        {template.action?.decision === 'FAIL' && (
                          <span className="flex items-center text-red-600">
                            <AlertTriangle className="w-3 h-3 mr-1" />
                            STP Fail
                          </span>
                        )}
                        {template.action?.is_hard_stop && (
                          <Badge variant="destructive" className="text-xs">Hard Stop</Badge>
                        )}
                        {template.follow_up_code && (
                          <span className="bg-amber-50 text-amber-700 px-2 py-0.5 rounded">
                            {template.follow_up_code}
                          </span>
                        )}
                      </div>
                      
                      {template.products && template.products.length > 0 && (
                        <div className="flex flex-wrap gap-1 mb-3">
                          {template.products.slice(0, 3).map(p => (
                            <Badge key={p} variant="outline" className="text-xs">
                              {p.replace(/_/g, ' ')}
                            </Badge>
                          ))}
                          {template.products.length > 3 && (
                            <Badge variant="outline" className="text-xs">
                              +{template.products.length - 3}
                            </Badge>
                          )}
                        </div>
                      )}
                      
                      {hasPermission('can_create_rules') && (
                        <Button
                          size="sm"
                          className="w-full mt-2"
                          onClick={() => openCreateDialog(template)}
                        >
                          <Plus className="w-3 h-3 mr-1" />
                          Create Rule
                        </Button>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          );
        })}

        {filteredTemplates.length === 0 && (
          <div className="text-center py-12">
            <FileText className="w-12 h-12 mx-auto text-slate-300 mb-4" />
            <p className="text-slate-500">No templates found matching your criteria</p>
          </div>
        )}
      </div>

      {/* Create Rule Dialog */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Rule from Template</DialogTitle>
            <DialogDescription>
              Create a new rule based on <strong>{selectedTemplate?.template_id}: {selectedTemplate?.name}</strong>
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-slate-700">Assign to Stage (Optional)</label>
              <Select value={selectedStageId} onValueChange={setSelectedStageId}>
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Select a stage (optional)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">No stage (process last)</SelectItem>
                  {stages.map(stage => (
                    <SelectItem key={stage.id} value={stage.id}>
                      {stage.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-slate-500 mt-1">
                Rules assigned to stages are executed in stage order. Unassigned rules run last.
              </p>
            </div>
            
            {selectedTemplate && (
              <div className="bg-slate-50 rounded-lg p-3 space-y-2">
                <p className="text-sm"><strong>Template:</strong> {selectedTemplate.template_id}</p>
                <p className="text-sm"><strong>Decision:</strong> {selectedTemplate.action?.decision || 'N/A'}</p>
                <p className="text-sm"><strong>Priority:</strong> {selectedTemplate.priority}</p>
                {selectedTemplate.action?.reason_message && (
                  <p className="text-sm"><strong>Reason:</strong> {selectedTemplate.action.reason_message}</p>
                )}
              </div>
            )}
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleCreateRule} disabled={creating}>
              {creating ? 'Creating...' : 'Create Rule'}
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default RuleTemplates;
