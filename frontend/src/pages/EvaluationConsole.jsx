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
  AlertTriangle,
  TrendingUp
} from 'lucide-react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '../components/ui/collapsible';

const EvaluationConsole = () => {
  const [evaluating, setEvaluating] = useState(false);
  const [result, setResult] = useState(null);
  const [products, setProducts] = useState([]);
  const [traceExpanded, setTraceExpanded] = useState({});

  // Initial proposal state with empty/default values - users must fill in actual values
  const getEmptyProposal = () => ({
    proposal_id: `PROP-${Date.now()}`,
    product_code: '',
    product_type: '',
    applicant_age: '',
    applicant_gender: '',
    applicant_income: '',
    sum_assured: '',
    premium: '',
    bmi: '',
    occupation_code: '',
    occupation_risk: '',
    agent_code: '',
    agent_tier: '',
    pincode: '',
    is_smoker: false,
    has_medical_history: false,
    existing_coverage: '',
    // Conditional fields
    cigarettes_per_day: null,
    smoking_years: null,
    ailment_type: null,
    ailment_details: null,
    ailment_duration_years: null,
    is_ailment_ongoing: false
  });

  const [proposal, setProposal] = useState(getEmptyProposal());

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

  // Validate required fields before submission
  const validateProposal = () => {
    const errors = [];
    if (!proposal.product_type) errors.push('Product Type is required');
    if (!proposal.applicant_age) errors.push('Applicant Age is required');
    if (!proposal.applicant_gender) errors.push('Gender is required');
    if (!proposal.applicant_income) errors.push('Annual Income is required');
    if (!proposal.sum_assured) errors.push('Sum Assured is required');
    if (!proposal.premium) errors.push('Premium is required');
    if (!proposal.bmi) errors.push('BMI is required');
    if (!proposal.occupation_risk) errors.push('Occupation Risk is required');
    if (!proposal.agent_tier) errors.push('Agent Tier is required');
    
    if (proposal.is_smoker) {
      if (!proposal.cigarettes_per_day) errors.push('Cigarettes per day is required for smokers');
      if (!proposal.smoking_years) errors.push('Smoking years is required for smokers');
    }
    
    if (proposal.has_medical_history) {
      if (!proposal.ailment_type) errors.push('Ailment type is required for medical history');
      if (!proposal.ailment_duration_years) errors.push('Ailment duration is required for medical history');
    }
    
    return errors;
  };

  const handleEvaluate = async () => {
    // Validate before submission
    const validationErrors = validateProposal();
    if (validationErrors.length > 0) {
      validationErrors.forEach(err => toast.error(err));
      return;
    }
    
    try {
      setEvaluating(true);
      setResult(null);
      
      // Build the proposal data with properly typed values from form inputs
      const proposalData = {
        proposal_id: proposal.proposal_id,
        product_code: proposal.product_code || proposal.product_type?.toUpperCase().replace('_', '_'),
        product_type: proposal.product_type,
        applicant_age: parseInt(proposal.applicant_age) || 0,
        applicant_gender: proposal.applicant_gender,
        applicant_income: parseInt(proposal.applicant_income) || 0,
        sum_assured: parseInt(proposal.sum_assured) || 0,
        premium: parseInt(proposal.premium) || 0,
        bmi: parseFloat(proposal.bmi) || 0,
        occupation_code: proposal.occupation_code || 'DEFAULT',
        occupation_risk: proposal.occupation_risk,
        agent_code: proposal.agent_code || 'DEFAULT',
        agent_tier: proposal.agent_tier,
        pincode: proposal.pincode || '000000',
        is_smoker: proposal.is_smoker,
        has_medical_history: proposal.has_medical_history,
        existing_coverage: parseInt(proposal.existing_coverage) || 0,
        cigarettes_per_day: proposal.is_smoker ? (parseInt(proposal.cigarettes_per_day) || null) : null,
        smoking_years: proposal.is_smoker ? (parseInt(proposal.smoking_years) || null) : null,
        ailment_type: proposal.has_medical_history ? proposal.ailment_type : null,
        ailment_details: proposal.has_medical_history ? proposal.ailment_details : null,
        ailment_duration_years: proposal.has_medical_history ? (parseInt(proposal.ailment_duration_years) || null) : null,
        is_ailment_ongoing: proposal.has_medical_history ? proposal.is_ailment_ongoing : false
      };
      
      const response = await evaluateProposal(proposalData);
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
    setProposal(getEmptyProposal());
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
                    <Label>Product Type <span className="text-red-500">*</span></Label>
                    <Select 
                      value={proposal.product_type} 
                      onValueChange={(v) => {
                        const product = PRODUCT_TYPES.find(p => p.value === v);
                        setProposal({ 
                          ...proposal, 
                          product_type: v,
                          product_code: v.toUpperCase().replace('_', '_')
                        });
                      }}
                    >
                      <SelectTrigger className="mt-1.5" data-testid="product-type-select">
                        <SelectValue placeholder="Select product type" />
                      </SelectTrigger>
                      <SelectContent>
                        {PRODUCT_TYPES.filter(p => !p.isParent).map(p => (
                          <SelectItem key={p.value} value={p.value}>
                            {p.parent ? `↳ ${p.label}` : p.label}
                          </SelectItem>
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
                      <Label>Age <span className="text-red-500">*</span></Label>
                      <Input
                        type="number"
                        value={proposal.applicant_age}
                        onChange={(e) => setProposal({ ...proposal, applicant_age: e.target.value })}
                        className="mt-1.5"
                        placeholder="e.g., 35"
                        data-testid="applicant-age-input"
                      />
                    </div>
                    <div>
                      <Label>Gender <span className="text-red-500">*</span></Label>
                      <Select 
                        value={proposal.applicant_gender} 
                        onValueChange={(v) => setProposal({ ...proposal, applicant_gender: v })}
                      >
                        <SelectTrigger className="mt-1.5" data-testid="gender-select">
                          <SelectValue placeholder="Select gender" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="M">Male</SelectItem>
                          <SelectItem value="F">Female</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>BMI <span className="text-red-500">*</span></Label>
                      <Input
                        type="number"
                        step="0.1"
                        value={proposal.bmi}
                        onChange={(e) => setProposal({ ...proposal, bmi: e.target.value })}
                        className="mt-1.5"
                        placeholder="e.g., 24.5"
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
                      <Label>Annual Income (₹) <span className="text-red-500">*</span></Label>
                      <Input
                        type="number"
                        value={proposal.applicant_income}
                        onChange={(e) => setProposal({ ...proposal, applicant_income: e.target.value })}
                        className="mt-1.5"
                        placeholder="e.g., 1200000"
                        data-testid="income-input"
                      />
                    </div>
                    <div>
                      <Label>Sum Assured (₹) <span className="text-red-500">*</span></Label>
                      <Input
                        type="number"
                        value={proposal.sum_assured}
                        onChange={(e) => setProposal({ ...proposal, sum_assured: e.target.value })}
                        className="mt-1.5"
                        placeholder="e.g., 5000000"
                        data-testid="sum-assured-input"
                      />
                    </div>
                    <div>
                      <Label>Premium (₹) <span className="text-red-500">*</span></Label>
                      <Input
                        type="number"
                        value={proposal.premium}
                        onChange={(e) => setProposal({ ...proposal, premium: e.target.value })}
                        className="mt-1.5"
                        placeholder="e.g., 25000"
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
                      <Label>Occupation Risk <span className="text-red-500">*</span></Label>
                      <Select 
                        value={proposal.occupation_risk} 
                        onValueChange={(v) => setProposal({ ...proposal, occupation_risk: v })}
                      >
                        <SelectTrigger className="mt-1.5" data-testid="occupation-risk-select">
                          <SelectValue placeholder="Select risk level" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="low">Low</SelectItem>
                          <SelectItem value="medium">Medium</SelectItem>
                          <SelectItem value="high">High</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Agent Tier <span className="text-red-500">*</span></Label>
                      <Select 
                        value={proposal.agent_tier} 
                        onValueChange={(v) => setProposal({ ...proposal, agent_tier: v })}
                      >
                        <SelectTrigger className="mt-1.5" data-testid="agent-tier-select">
                          <SelectValue placeholder="Select tier" />
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
                        onCheckedChange={(checked) => setProposal({ 
                          ...proposal, 
                          is_smoker: checked,
                          cigarettes_per_day: checked ? '' : null,
                          smoking_years: checked ? '' : null
                        })}
                        data-testid="is-smoker-switch"
                      />
                      <Label>Smoker</Label>
                    </div>
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={proposal.has_medical_history}
                        onCheckedChange={(checked) => setProposal({ 
                          ...proposal, 
                          has_medical_history: checked,
                          ailment_type: checked ? '' : null,
                          ailment_duration_years: checked ? '' : null,
                          is_ailment_ongoing: checked ? false : false
                        })}
                        data-testid="has-medical-history-switch"
                      />
                      <Label>Medical History</Label>
                    </div>
                  </div>

                  {/* Conditional: Smoker Details */}
                  {proposal.is_smoker && (
                    <div className="mt-4 p-4 bg-amber-50 border border-amber-200 rounded-lg animate-in slide-in-from-top-2 duration-200">
                      <h5 className="text-sm font-semibold text-amber-800 mb-3 flex items-center gap-2">
                        <AlertTriangle className="w-4 h-4" />
                        Smoking Details (Required)
                      </h5>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label>Cigarettes per Day <span className="text-red-500">*</span></Label>
                          <Input
                            type="number"
                            min="1"
                            value={proposal.cigarettes_per_day || ''}
                            onChange={(e) => setProposal({ ...proposal, cigarettes_per_day: e.target.value })}
                            className="mt-1.5 bg-white"
                            placeholder="e.g., 10"
                            data-testid="cigarettes-input"
                          />
                        </div>
                        <div>
                          <Label>Years of Smoking <span className="text-red-500">*</span></Label>
                          <Input
                            type="number"
                            min="1"
                            value={proposal.smoking_years || ''}
                            onChange={(e) => setProposal({ ...proposal, smoking_years: e.target.value })}
                            className="mt-1.5 bg-white"
                            placeholder="e.g., 5"
                            data-testid="smoking-years-input"
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Conditional: Medical History Details */}
                  {proposal.has_medical_history && (
                    <div className="mt-4 p-4 bg-rose-50 border border-rose-200 rounded-lg animate-in slide-in-from-top-2 duration-200">
                      <h5 className="text-sm font-semibold text-rose-800 mb-3 flex items-center gap-2">
                        <AlertTriangle className="w-4 h-4" />
                        Medical History Details (Required)
                      </h5>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label>Ailment Type</Label>
                          <Select 
                            value={proposal.ailment_type || ''} 
                            onValueChange={(v) => setProposal({ ...proposal, ailment_type: v })}
                          >
                            <SelectTrigger className="mt-1.5 bg-white" data-testid="ailment-type-select">
                              <SelectValue placeholder="Select ailment" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="diabetes">Diabetes</SelectItem>
                              <SelectItem value="hypertension">Hypertension</SelectItem>
                              <SelectItem value="heart_disease">Heart Disease</SelectItem>
                              <SelectItem value="cancer">Cancer</SelectItem>
                              <SelectItem value="kidney_failure">Kidney Failure</SelectItem>
                              <SelectItem value="asthma">Asthma</SelectItem>
                              <SelectItem value="thyroid">Thyroid</SelectItem>
                              <SelectItem value="other">Other</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label>Duration (Years)</Label>
                          <Input
                            type="number"
                            min="0"
                            value={proposal.ailment_duration_years || ''}
                            onChange={(e) => setProposal({ ...proposal, ailment_duration_years: parseInt(e.target.value) || null })}
                            className="mt-1.5 bg-white"
                            placeholder="Years since diagnosis"
                            data-testid="ailment-duration-input"
                          />
                        </div>
                      </div>
                      <div className="mt-3 flex items-center gap-2">
                        <Switch
                          checked={proposal.is_ailment_ongoing}
                          onCheckedChange={(checked) => setProposal({ ...proposal, is_ailment_ongoing: checked })}
                          data-testid="is-ailment-ongoing-switch"
                        />
                        <Label>Is the condition ongoing/current?</Label>
                      </div>
                      {proposal.ailment_type === 'other' && (
                        <div className="mt-3">
                          <Label>Ailment Details</Label>
                          <Input
                            value={proposal.ailment_details || ''}
                            onChange={(e) => setProposal({ ...proposal, ailment_details: e.target.value })}
                            className="mt-1.5 bg-white"
                            placeholder="Please specify the ailment"
                            data-testid="ailment-details-input"
                          />
                        </div>
                      )}
                    </div>
                  )}
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

                    {/* Risk Loading / Premium Adjustment */}
                    {result.risk_loading && (
                      <Card className="border-purple-200 bg-purple-50/50" data-testid="risk-loading-card">
                        <CardHeader className="pb-2">
                          <CardTitle className="text-base flex items-center gap-2 text-purple-800">
                            <TrendingUp className="w-5 h-5" />
                            Premium Loading Calculation
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="grid grid-cols-2 gap-4 mb-4">
                            <div className="p-3 bg-white rounded-lg border border-purple-200">
                              <p className="text-xs text-purple-600">Base Premium</p>
                              <p className="text-lg font-bold text-slate-900">
                                {formatCurrency(result.risk_loading.base_premium)}
                              </p>
                            </div>
                            <div className="p-3 bg-white rounded-lg border border-purple-200">
                              <p className="text-xs text-purple-600">Loaded Premium</p>
                              <p className="text-lg font-bold text-purple-700">
                                {formatCurrency(result.risk_loading.loaded_premium)}
                                {result.risk_loading.total_loading_percentage !== 0 && (
                                  <span className={`ml-2 text-sm font-normal ${
                                    result.risk_loading.total_loading_percentage > 0 ? 'text-red-600' : 'text-green-600'
                                  }`}>
                                    ({result.risk_loading.total_loading_percentage > 0 ? '+' : ''}{result.risk_loading.total_loading_percentage}%)
                                  </span>
                                )}
                              </p>
                            </div>
                          </div>
                          
                          <div className="flex items-center justify-between text-sm mb-3">
                            <span className="text-purple-700">Total Risk Score</span>
                            <span className="font-semibold">{result.risk_loading.total_risk_score} pts</span>
                          </div>
                          
                          {result.risk_loading.applied_bands?.length > 0 && (
                            <div className="space-y-2">
                              <p className="text-xs font-medium text-purple-700 uppercase tracking-wide">Applied Risk Bands</p>
                              <div className="max-h-40 overflow-y-auto space-y-1">
                                {result.risk_loading.applied_bands.map((band, idx) => (
                                  <div 
                                    key={idx} 
                                    className="flex items-center justify-between py-1.5 px-2 bg-white rounded border border-purple-100 text-sm"
                                  >
                                    <div className="flex items-center gap-2">
                                      <span className={`px-1.5 py-0.5 rounded text-xs font-medium ${
                                        band.category === 'age' ? 'bg-blue-100 text-blue-700' :
                                        band.category === 'smoking' ? 'bg-amber-100 text-amber-700' :
                                        band.category === 'medical' ? 'bg-rose-100 text-rose-700' :
                                        band.category === 'bmi' ? 'bg-green-100 text-green-700' :
                                        'bg-slate-100 text-slate-700'
                                      }`}>
                                        {band.category}
                                      </span>
                                      <span className="text-slate-700">{band.band_name}</span>
                                    </div>
                                    <span className={`font-medium ${
                                      band.loading_percentage > 0 ? 'text-red-600' : 
                                      band.loading_percentage < 0 ? 'text-green-600' : 'text-slate-600'
                                    }`}>
                                      {band.loading_percentage > 0 ? '+' : ''}{band.loading_percentage}%
                                    </span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    )}

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
