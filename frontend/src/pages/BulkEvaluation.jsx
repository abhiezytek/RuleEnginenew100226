import React, { useState, useRef } from 'react';
import { toast } from 'sonner';
import { 
  Upload, 
  Download, 
  FileSpreadsheet, 
  PlayCircle, 
  CheckCircle2, 
  XCircle,
  Loader2,
  FileDown,
  Trash2,
  AlertTriangle
} from 'lucide-react';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Badge } from '../components/ui/badge';
import { Progress } from '../components/ui/progress';
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../components/ui/table';
import api from '../lib/api';

const BulkEvaluation = () => {
  const [file, setFile] = useState(null);
  const [processing, setProcessing] = useState(false);
  const [results, setResults] = useState(null);
  const fileInputRef = useRef(null);

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      if (!selectedFile.name.endsWith('.csv')) {
        toast.error('Please upload a CSV file');
        return;
      }
      setFile(selectedFile);
      setResults(null);
    }
  };

  const handleDownloadTemplate = async () => {
    try {
      const response = await api.get('/underwriting/csv-template', {
        responseType: 'blob'
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'proposal_template.csv');
      document.body.appendChild(link);
      link.click();
      link.remove();
      toast.success('Template downloaded');
    } catch (error) {
      toast.error('Failed to download template');
    }
  };

  const handleUploadAndEvaluate = async () => {
    if (!file) {
      toast.error('Please select a file first');
      return;
    }

    setProcessing(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await api.post('/underwriting/evaluate-csv', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      setResults(response.data);
      toast.success(`Evaluated ${response.data.total_proposals} proposals`);
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Evaluation failed');
    } finally {
      setProcessing(false);
    }
  };

  const handleExportResults = () => {
    if (!results?.results) return;

    const headers = [
      'Proposal ID',
      'STP Decision',
      'Case Type',
      'Scorecard Value',
      'Base Premium',
      'Loaded Premium',
      'Loading %',
      'Risk Score',
      'Triggered Rules',
      'Reason Messages'
    ];

    const rows = results.results.map(r => [
      r.proposal_id,
      r.stp_decision,
      r.case_type_label,
      r.scorecard_value,
      r.base_premium,
      r.loaded_premium,
      r.loading_percentage,
      r.risk_score,
      (r.triggered_rules || []).join('; '),
      (r.reason_messages || []).join('; ')
    ]);

    const csv = [headers.join(','), ...rows.map(r => r.map(v => `"${v || ''}"`).join(','))].join('\n');
    
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `evaluation_results_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    link.remove();
    toast.success('Results exported');
  };

  const handleClear = () => {
    setFile(null);
    setResults(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const formatCurrency = (value) => {
    if (value == null) return '-';
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(value);
  };

  return (
    <div className="space-y-6" data-testid="bulk-evaluation-page">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Bulk Evaluation</h1>
          <p className="text-slate-600 mt-1">
            Upload CSV file to evaluate multiple proposals at once
          </p>
        </div>
        <Button variant="outline" onClick={handleDownloadTemplate} data-testid="download-template-btn">
          <Download className="h-4 w-4 mr-2" />
          Download Template
        </Button>
      </div>

      {/* Upload Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileSpreadsheet className="h-5 w-5" />
            Upload Proposals
          </CardTitle>
          <CardDescription>
            Upload a CSV file with proposal data. Maximum 1000 rows per file.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <div className="flex-grow">
              <Input
                ref={fileInputRef}
                type="file"
                accept=".csv"
                onChange={handleFileChange}
                className="cursor-pointer"
                data-testid="file-input"
              />
            </div>
            {file && (
              <Badge variant="secondary" className="py-2 px-3">
                <FileSpreadsheet className="h-4 w-4 mr-2" />
                {file.name}
              </Badge>
            )}
            {file && (
              <Button variant="ghost" size="icon" onClick={handleClear}>
                <Trash2 className="h-4 w-4 text-red-500" />
              </Button>
            )}
          </div>
          
          <div className="mt-4 flex gap-3">
            <Button 
              onClick={handleUploadAndEvaluate} 
              disabled={!file || processing}
              data-testid="evaluate-btn"
            >
              {processing ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <PlayCircle className="h-4 w-4 mr-2" />
                  Evaluate All
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Results Section */}
      {results && (
        <>
          {/* Summary */}
          <div className="grid grid-cols-5 gap-4">
            <Card>
              <CardContent className="pt-4">
                <p className="text-sm text-slate-500">Total Proposals</p>
                <p className="text-2xl font-bold">{results.total_proposals}</p>
              </CardContent>
            </Card>
            <Card className="border-emerald-200 bg-emerald-50">
              <CardContent className="pt-4">
                <p className="text-sm text-emerald-600">Passed</p>
                <p className="text-2xl font-bold text-emerald-700">{results.pass_count}</p>
              </CardContent>
            </Card>
            <Card className="border-red-200 bg-red-50">
              <CardContent className="pt-4">
                <p className="text-sm text-red-600">Failed</p>
                <p className="text-2xl font-bold text-red-700">{results.fail_count}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4">
                <p className="text-sm text-slate-500">Pass Rate</p>
                <p className="text-2xl font-bold">{results.pass_rate}%</p>
                <Progress value={results.pass_rate} className="mt-2 h-2" />
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4">
                <p className="text-sm text-slate-500">Processing Time</p>
                <p className="text-2xl font-bold">{results.total_time_ms} ms</p>
              </CardContent>
            </Card>
          </div>

          {/* Parse Errors */}
          {results.parse_errors?.length > 0 && (
            <Card className="border-amber-200 bg-amber-50">
              <CardHeader>
                <CardTitle className="text-amber-800 flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5" />
                  Parse Warnings ({results.parse_errors.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="text-sm text-amber-700 list-disc list-inside">
                  {results.parse_errors.slice(0, 5).map((err, idx) => (
                    <li key={idx}>{err}</li>
                  ))}
                  {results.parse_errors.length > 5 && (
                    <li>...and {results.parse_errors.length - 5} more</li>
                  )}
                </ul>
              </CardContent>
            </Card>
          )}

          {/* Results Table */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Evaluation Results</CardTitle>
                <CardDescription>
                  Showing {results.results?.length || 0} evaluated proposals
                </CardDescription>
              </div>
              <Button onClick={handleExportResults} variant="outline" data-testid="export-results-btn">
                <FileDown className="h-4 w-4 mr-2" />
                Export CSV
              </Button>
            </CardHeader>
            <CardContent>
              <div className="max-h-[500px] overflow-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Proposal ID</TableHead>
                      <TableHead>STP Decision</TableHead>
                      <TableHead>Case Type</TableHead>
                      <TableHead>Base Premium</TableHead>
                      <TableHead>Loaded Premium</TableHead>
                      <TableHead>Loading %</TableHead>
                      <TableHead>Triggered Rules</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {results.results?.map((r, idx) => (
                      <TableRow key={idx} data-testid={`result-row-${idx}`}>
                        <TableCell className="font-medium">{r.proposal_id}</TableCell>
                        <TableCell>
                          {r.stp_decision === 'PASS' ? (
                            <Badge className="bg-emerald-100 text-emerald-700">
                              <CheckCircle2 className="h-3 w-3 mr-1" />
                              PASS
                            </Badge>
                          ) : (
                            <Badge className="bg-red-100 text-red-700">
                              <XCircle className="h-3 w-3 mr-1" />
                              FAIL
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary">{r.case_type_label}</Badge>
                        </TableCell>
                        <TableCell>{formatCurrency(r.base_premium)}</TableCell>
                        <TableCell className="font-semibold">{formatCurrency(r.loaded_premium)}</TableCell>
                        <TableCell>
                          {r.loading_percentage != null && (
                            <span className={r.loading_percentage > 0 ? 'text-red-600' : r.loading_percentage < 0 ? 'text-green-600' : ''}>
                              {r.loading_percentage > 0 ? '+' : ''}{r.loading_percentage}%
                            </span>
                          )}
                        </TableCell>
                        <TableCell className="max-w-[200px]">
                          <div className="flex flex-wrap gap-1">
                            {r.triggered_rules?.slice(0, 2).map((rule, i) => (
                              <Badge key={i} variant="outline" className="text-xs">
                                {rule}
                              </Badge>
                            ))}
                            {r.triggered_rules?.length > 2 && (
                              <Badge variant="outline" className="text-xs">
                                +{r.triggered_rules.length - 2}
                              </Badge>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
};

export default BulkEvaluation;
