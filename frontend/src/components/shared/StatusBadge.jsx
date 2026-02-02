import React from 'react';
import { Badge } from '../ui/badge';
import { cn } from '../../lib/utils';

export const StatusBadge = ({ status, className }) => {
  const variants = {
    PASS: { label: 'PASS', className: 'bg-emerald-100 text-emerald-700 border-emerald-200 hover:bg-emerald-100' },
    FAIL: { label: 'FAIL', className: 'bg-red-100 text-red-700 border-red-200 hover:bg-red-100' },
    REFER: { label: 'REFER', className: 'bg-amber-100 text-amber-700 border-amber-200 hover:bg-amber-100' },
  };

  const variant = variants[status] || variants.REFER;

  return (
    <Badge 
      variant="outline" 
      className={cn(variant.className, className)}
      data-testid={`status-badge-${status?.toLowerCase()}`}
    >
      {variant.label}
    </Badge>
  );
};

export const CaseTypeBadge = ({ caseType, label }) => {
  const variants = {
    0: { label: 'Normal', className: 'bg-slate-100 text-slate-700 border-slate-200' },
    1: { label: 'Direct Accept', className: 'bg-emerald-100 text-emerald-700 border-emerald-200' },
    '-1': { label: 'Direct Fail', className: 'bg-red-100 text-red-700 border-red-200' },
    3: { label: 'GCRP', className: 'bg-purple-100 text-purple-700 border-purple-200' },
  };

  const variant = variants[String(caseType)] || variants[0];

  return (
    <Badge 
      variant="outline" 
      className={cn(variant.className, 'hover:bg-opacity-100')}
      data-testid={`case-type-badge-${caseType}`}
    >
      {label || variant.label}
    </Badge>
  );
};

export const CategoryBadge = ({ category }) => {
  const categoryClasses = {
    stp_decision: 'bg-blue-100 text-blue-700',
    case_type: 'bg-purple-100 text-purple-700',
    validation: 'bg-amber-100 text-amber-700',
    scorecard: 'bg-emerald-100 text-emerald-700',
    income_sa_grid: 'bg-cyan-100 text-cyan-700',
    bmi_grid: 'bg-rose-100 text-rose-700',
    occupation: 'bg-indigo-100 text-indigo-700',
    agent_channel: 'bg-orange-100 text-orange-700',
    address_pincode: 'bg-teal-100 text-teal-700',
    reason_flag: 'bg-slate-100 text-slate-700',
  };

  const labels = {
    stp_decision: 'STP Decision',
    case_type: 'Case Type',
    validation: 'Validation',
    scorecard: 'Scorecard',
    income_sa_grid: 'Income×SA',
    bmi_grid: 'BMI Grid',
    occupation: 'Occupation',
    agent_channel: 'Agent/Channel',
    address_pincode: 'Address',
    reason_flag: 'Reason Flag',
  };

  return (
    <span 
      className={cn(
        "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium",
        categoryClasses[category] || 'bg-slate-100 text-slate-700'
      )}
      data-testid={`category-badge-${category}`}
    >
      {labels[category] || category}
    </span>
  );
};

export const ProductBadge = ({ product }) => {
  const productClasses = {
    term_life: 'bg-blue-50 text-blue-600 border-blue-200',
    endowment: 'bg-emerald-50 text-emerald-600 border-emerald-200',
    ulip: 'bg-purple-50 text-purple-600 border-purple-200',
  };

  const labels = {
    term_life: 'Term Life',
    endowment: 'Endowment',
    ulip: 'ULIP',
  };

  return (
    <Badge 
      variant="outline"
      className={cn(productClasses[product] || 'bg-slate-50 text-slate-600 border-slate-200', 'text-xs')}
      data-testid={`product-badge-${product}`}
    >
      {labels[product] || product}
    </Badge>
  );
};

export const EnabledBadge = ({ enabled }) => {
  return (
    <Badge 
      variant="outline"
      className={cn(
        enabled 
          ? 'bg-emerald-50 text-emerald-600 border-emerald-200' 
          : 'bg-slate-50 text-slate-500 border-slate-200'
      )}
      data-testid={`enabled-badge-${enabled}`}
    >
      {enabled ? 'Active' : 'Inactive'}
    </Badge>
  );
};
