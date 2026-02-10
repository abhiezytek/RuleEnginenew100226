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
import { StatusBadge, CaseTypeBadge, CategoryBadge } from '../components/shared/StatusBadge';
import { PageLoader } from '../components/shared/LoadingSpinner';
import { evaluateProposal, getProducts } from '../lib/api';
import { PRODUCT_TYPES } from '../lib/constants';
import { toast } from 'sonner';
import { 
  Play, 
  RotateCcw, 
  ChevronDown, 
  ChevronRight,
  Clock,
  CheckCircle2,
  XCircle,
  AlertTriangle
} from 'lucide-react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '../components/ui/collapsible';

const EvaluationConsole = () => {
  const [evaluating, setEvaluating] = useState(false);
  const [result, setResult] = useState(null);
  const [products, setProducts] = useState([]);
  const [traceExpanded, setTraceExpanded] = useState({});

  const [proposal, setProposal] = useState({
    proposal_id: `PROP-${Date.now()}`,
    product_code: 'TERM001',
    product_type: 'term_life',
    applicant_age: 35,
    applicant_gender: 'M',
    applicant_income: 1200000,
    sum_assured: 5000000,
    premium: 25000,
    bmi: 24.5,
    occupation_code: 'IT001',
    occupation_risk: 'low',
    agent_code: 'AGT001',
    agent_tier: 'gold',
    pincode: '560001',
    is_smoker: false,
    has_medical_history: false,
    existing_coverage: 0
  });

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      const response = await getProducts();
      setProducts(response.data);
    } catch (error) {
      console.error('Failed to fetch products:', error);
    }
  };

  const handleEvaluate = async () => {
    try {
      setEvaluating(true);
      setResult(null);
      
      const response = await evaluateProposal(proposal);
      setResult(response.data);
      
      if (response.data.stp_decision === 'PASS') {
        toast.success('Proposal passed STP');
      } else {
        toast.error('Proposal failed STP');
      }
    } catch (error) {
      console.error('Evaluation failed:', error);
      toast.error('Failed to evaluate proposal');
    } finally {
      setEvaluating(false);
    }
  };

  const handleReset = () => {
    setProposal({
      proposal_id: `PROP-${Date.now()}`,
      product_code: 'TERM001',
      product_type: 'term_life',
      applicant_age: 35,
      applicant_gender: 'M',
      applicant_income: 1200000,
      sum_assured: 5000000,
      premium: 25000,
      bmi: 24.5,
      occupation_code: 'IT001',
      occupation_risk: 'low',
      agent_code: 'AGT001',
      agent_tier: 'gold',
      pincode: '560001',
      is_smoker: false,
      has_medical_history: false,
      existing_coverage: 0
    });
    setResult(null);
  };

  const toggleTrace = (ruleId) => {
    setTraceExpanded(prev => ({ ...prev, [ruleId]: !prev[ruleId] }));
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('en-IN', { 
      style: 'currency', 
      currency: 'INR',
      maximumFractionDigits: 0 
    }).format(value);
  };

  return (
    <div className="min-h-screen" data-testid="evaluation-console-page">
      <Header title="Evaluation Console" subtitle="Test proposals against the rule engine" />
      
      <div className="p-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Input Form */}
          <div className="space-y-6">
            <Card className="border-slate-200">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Proposal Data</CardTitle>
                <Button variant="ghost" size="sm" onClick={handleReset} data-testid="reset-btn">
                  <RotateCcw className="w-4 h-4 mr-2" />
                  Reset
                </Button>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Basic Info */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Proposal ID</Label>
                    <Input
                      value={proposal.proposal_id}
                      onChange={(e) => setProposal({ ...proposal, proposal_id: e.target.value })}
                      className="mt-1.5 font-mono text-sm"
                      data-testid="proposal-id-input"
                    />
                  </div>
                  <div>
                    <Label>Product Type</Label>
                    <Select 
                      value={proposal.product_type} 
                      onValueChange={(v) => setProposal({ ...proposal, product_type: v })}
                    >
                      <SelectTrigger className="mt-1.5" data-testid="product-type-select">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {PRODUCT_TYPES.map(p => (
                          <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Applicant Info */}
                <div className="pt-4 border-t border-slate-200">
                  <h4 className="text-sm font-semibold text-slate-700 mb-3">Applicant Details</h4>
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <Label>Age</Label>
                      <Input
                        type="number"
                        value={proposal.applicant_age}
                        onChange={(e) => setProposal({ ...proposal, applicant_age: parseInt(e.target.value) || 0 })}
                        className="mt-1.5"
                        data-testid="applicant-age-input"
                      />
                    </div>
                    <div>
                      <Label>Gender</Label>
                      <Select 
                        value={proposal.applicant_gender} 
                        onValueChange={(v) => setProposal({ ...proposal, applicant_gender: v })}
                      >
                        <SelectTrigger className="mt-1.5" data-testid="gender-select">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="M">Male</SelectItem>
                          <SelectItem value="F">Female</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>BMI</Label>
                      <Input
                        type="number"
                        step="0.1"
                        value={proposal.bmi}
                        onChange={(e) => setProposal({ ...proposal, bmi: parseFloat(e.target.value) || 0 })}
                        className="mt-1.5"
                        data-testid="bmi-input"
                      />
                    </div>
                  </div>
                </div>

                {/* Financial Info */}
                <div className="pt-4 border-t border-slate-200">
                  <h4 className="text-sm font-semibold text-slate-700 mb-3">Financial Details</h4>
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <Label>Annual Income (₹)</Label>
                      <Input
                        type="number"
                        value={proposal.applicant_income}
                        onChange={(e) => setProposal({ ...proposal, applicant_income: parseInt(e.target.value) || 0 })}
                        className="mt-1.5"
                        data-testid="income-input"
                      />
                    </div>
                    <div>
                      <Label>Sum Assured (₹)</Label>
                      <Input
                        type="number"
                        value={proposal.sum_assured}
                        onChange={(e) => setProposal({ ...proposal, sum_assured: parseInt(e.target.value) || 0 })}
                        className="mt-1.5"
                        data-testid="sum-assured-input"
                      />
                    </div>
                    <div>
                      <Label>Premium (₹)</Label>
                      <Input
                        type="number"
                        value={proposal.premium}
                        onChange={(e) => setProposal({ ...proposal, premium: parseInt(e.target.value) || 0 })}
                        className="mt-1.5"
                        data-testid="premium-input"
                      />
                    </div>
                  </div>
                </div>

                {/* Risk Factors */}
                <div className="pt-4 border-t border-slate-200">
                  <h4 className="text-sm font-semibold text-slate-700 mb-3">Risk Factors</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Occupation Risk</Label>
                      <Select 
                        value={proposal.occupation_risk} 
                        onValueChange={(v) => setProposal({ ...proposal, occupation_risk: v })}
                      >
                        <SelectTrigger className="mt-1.5" data-testid="occupation-risk-select">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="low">Low</SelectItem>
                          <SelectItem value="medium">Medium</SelectItem>
                          <SelectItem value="high">High</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Agent Tier</Label>
                      <Select 
                        value={proposal.agent_tier} 
                        onValueChange={(v) => setProposal({ ...proposal, agent_tier: v })}
                      >
                        <SelectTrigger className="mt-1.5" data-testid="agent-tier-select">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="standard">Standard</SelectItem>
                          <SelectItem value="gold">Gold</SelectItem>
                          <SelectItem value="platinum">Platinum</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-6 mt-4">
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={proposal.is_smoker}
                        onCheckedChange={(checked) => setProposal({ ...proposal, is_smoker: checked })}
                        data-testid="is-smoker-switch"
                      />
                      <Label>Smoker</Label>
                    </div>
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={proposal.has_medical_history}
                        onCheckedChange={(checked) => setProposal({ ...proposal, has_medical_history: checked })}
                        data-testid="has-medical-history-switch"
                      />
                      <Label>Medical History</Label>
                    </div>
                  </div>
                </div>

                {/* Submit */}
                <Button 
                  className="w-full mt-4" 
                  onClick={handleEvaluate}
                  disabled={evaluating}
                  data-testid="evaluate-btn"
                >
                  <Play className="w-4 h-4 mr-2" />
                  {evaluating ? 'Evaluating...' : 'Evaluate Proposal'}
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Results */}
          <div className="space-y-6">
            {result ? (
              <>
                {/* Decision Summary */}
                <Card className={`border-2 ${result.stp_decision === 'PASS' ? 'border-emerald-200 bg-emerald-50' : 'border-red-200 bg-red-50'}`}>
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-slate-500 uppercase">STP Decision</p>
                        <div className="flex items-center gap-3 mt-2">
                          {result.stp_decision === 'PASS' ? (
                            <CheckCircle2 className="w-10 h-10 text-emerald-600" />
                          ) : (
                            <XCircle className="w-10 h-10 text-red-600" />
                          )}
                          <span className={`text-4xl font-bold ${result.stp_decision === 'PASS' ? 'text-emerald-700' : 'text-red-700'}`}>
                            {result.stp_decision}
                          </span>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-slate-500 flex items-center gap-1">
                          <Clock className="w-4 h-4" />
                          {result.evaluation_time_ms?.toFixed(2)} ms
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Details */}
                <Card className="border-slate-200" data-testid="result-details-card">
                  <CardHeader>
                    <CardTitle>Evaluation Details</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="p-4 bg-slate-50 rounded-lg">
                        <p className="text-sm text-slate-500">Case Type</p>
                        <div className="mt-1">
                          <CaseTypeBadge caseType={result.case_type} label={result.case_type_label} />
                        </div>
                      </div>
                      <div className="p-4 bg-slate-50 rounded-lg">
                        <p className="text-sm text-slate-500">Scorecard Value</p>
                        <p className="text-2xl font-bold text-slate-900 mt-1">{result.scorecard_value}</p>
                      </div>
                    </div>

                    {/* Triggered Rules */}
                    <div>
                      <h4 className="text-sm font-semibold text-slate-700 mb-2">
                        Triggered Rules ({result.triggered_rules?.length || 0})
                      </h4>
                      {result.triggered_rules?.length > 0 ? (
                        <div className="flex flex-wrap gap-2">
                          {result.triggered_rules.map((rule, idx) => (
                            <span 
                              key={idx} 
                              className="px-2 py-1 bg-amber-100 text-amber-700 text-xs rounded-full"
                            >
                              {rule}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <p className="text-sm text-slate-500">No rules triggered</p>
                      )}
                    </div>

                    {/* Validation Errors */}
                    {result.validation_errors?.length > 0 && (
                      <div className="p-3 bg-red-50 rounded-lg border border-red-200">
                        <h4 className="text-sm font-semibold text-red-700 mb-2 flex items-center gap-2">
                          <AlertTriangle className="w-4 h-4" />
                          Validation Errors
                        </h4>
                        <ul className="text-sm text-red-600 list-disc list-inside">
                          {result.validation_errors.map((err, idx) => (
                            <li key={idx}>{err}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Reason Messages */}
                    {result.reason_messages?.length > 0 && (
                      <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                        <h4 className="text-sm font-semibold text-slate-700 mb-2">Reason Messages</h4>
                        <ul className="text-sm text-slate-600 list-disc list-inside">
                          {result.reason_messages.map((msg, idx) => (
                            <li key={idx}>{msg}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Stage Execution Trace */}
                {result.stage_trace?.length > 0 && (
                  <Card className="border-slate-200" data-testid="stage-trace-card">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        Stage Execution Flow
                        <span className="text-sm font-normal text-slate-500">
                          ({result.stage_trace.length} stages)
                        </span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {result.stage_trace.map((stage, idx) => (
                          <div 
                            key={stage.stage_id} 
                            className={`relative p-4 rounded-lg border ${
                              stage.status === 'passed' ? 'bg-emerald-50 border-emerald-200' :
                              stage.status === 'failed' ? 'bg-red-50 border-red-200' :
                              'bg-slate-50 border-slate-200 opacity-50'
                            }`}
                            data-testid={`stage-trace-${idx}`}
                          >
                            {/* Stage connector line */}
                            {idx < result.stage_trace.length - 1 && (
                              <div className="absolute left-8 top-full h-3 w-0.5 bg-slate-300 z-10" />
                            )}
                            
                            <div className="flex items-start justify-between">
                              <div className="flex items-start gap-3">
                                {/* Status icon */}
                                <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 ${
                                  stage.status === 'passed' ? 'bg-emerald-600' :
                                  stage.status === 'failed' ? 'bg-red-600' :
                                  'bg-slate-400'
                                }`}>
                                  {stage.status === 'passed' && <CheckCircle2 className="w-4 h-4 text-white" />}
                                  {stage.status === 'failed' && <XCircle className="w-4 h-4 text-white" />}
                                  {stage.status === 'skipped' && <span className="text-white text-xs font-bold">-</span>}
                                </div>
                                
                                <div>
                                  <h4 className="font-semibold text-slate-900">{stage.stage_name}</h4>
                                  <p className="text-sm text-slate-600 mt-0.5">
                                    {stage.rules_executed?.length || 0} rules evaluated
                                    {stage.triggered_rules_count > 0 && (
                                      <span className="text-amber-600 ml-2">
                                        ({stage.triggered_rules_count} triggered)
                                      </span>
                                    )}
                                  </p>
                                </div>
                              </div>
                              
                              <div className="text-right">
                                <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium uppercase ${
                                  stage.status === 'passed' ? 'bg-emerald-200 text-emerald-800' :
                                  stage.status === 'failed' ? 'bg-red-200 text-red-800' :
                                  'bg-slate-200 text-slate-600'
                                }`}>
                                  {stage.status}
                                </span>
                                <p className="text-xs text-slate-500 mt-1">
                                  {stage.execution_time_ms?.toFixed(2)} ms
                                </p>
                              </div>
                            </div>
                            
                            {/* Show triggered rules in stage */}
                            {stage.triggered_rules_count > 0 && stage.rules_executed && (
                              <div className="mt-3 pl-9 border-l-2 border-slate-200">
                                {stage.rules_executed.filter(r => r.triggered).map((rule, rIdx) => (
                                  <div key={rIdx} className="flex items-center gap-2 py-1 text-sm">
                                    <CheckCircle2 className="w-3 h-3 text-amber-500" />
                                    <span className="font-medium text-slate-700">{rule.rule_name}</span>
                                    <CategoryBadge category={rule.category} />
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Rule Trace */}
                <Card className="border-slate-200" data-testid="rule-trace-card">
                  <CardHeader>
                    <CardTitle>Rule Execution Trace</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {result.rule_trace?.map((trace, idx) => (
                        <Collapsible key={idx} open={traceExpanded[trace.rule_id]}>
                          <CollapsibleTrigger 
                            onClick={() => toggleTrace(trace.rule_id)}
                            className={`w-full p-3 rounded-lg border text-left transition-colors ${
                              trace.triggered 
                                ? 'bg-emerald-50 border-emerald-200 hover:bg-emerald-100' 
                                : 'bg-slate-50 border-slate-200 hover:bg-slate-100'
                            }`}
                            data-testid={`trace-item-${idx}`}
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                {traceExpanded[trace.rule_id] ? (
                                  <ChevronDown className="w-4 h-4 text-slate-400" />
                                ) : (
                                  <ChevronRight className="w-4 h-4 text-slate-400" />
                                )}
                                <span className="font-medium text-slate-900">{trace.rule_name}</span>
                                <CategoryBadge category={trace.category} />
                              </div>
                              <div className="flex items-center gap-2">
                                <span className="text-xs text-slate-500">
                                  {trace.execution_time_ms?.toFixed(2)} ms
                                </span>
                                {trace.triggered ? (
                                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                                ) : (
                                  <span className="w-4 h-4 rounded-full border-2 border-slate-300" />
                                )}
                              </div>
                            </div>
                          </CollapsibleTrigger>
                          <CollapsibleContent>
                            <div className="mt-2 p-3 bg-white rounded-lg border border-slate-200 text-sm">
                              <div className="grid grid-cols-2 gap-4">
                                <div>
                                  <p className="text-xs text-slate-500 uppercase">Input Values</p>
                                  <pre className="mt-1 text-xs font-mono bg-slate-50 p-2 rounded overflow-x-auto">
                                    {JSON.stringify(trace.input_values, null, 2)}
                                  </pre>
                                </div>
                                {trace.action_applied && (
                                  <div>
                                    <p className="text-xs text-slate-500 uppercase">Action Applied</p>
                                    <pre className="mt-1 text-xs font-mono bg-slate-50 p-2 rounded overflow-x-auto">
                                      {JSON.stringify(trace.action_applied, null, 2)}
                                    </pre>
                                  </div>
                                )}
                              </div>
                            </div>
                          </CollapsibleContent>
                        </Collapsible>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </>
            ) : (
              <Card className="border-slate-200 border-dashed">
                <CardContent className="py-16 text-center">
                  <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-4">
                    <Play className="w-8 h-8 text-slate-400" />
                  </div>
                  <h3 className="text-lg font-semibold text-slate-700 mb-2">No Evaluation Yet</h3>
                  <p className="text-sm text-slate-500">
                    Fill in the proposal data and click "Evaluate Proposal" to see results
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default EvaluationConsole;
