import { Invoice, Customer, Payment } from '@prisma/client';
import { InvoiceQuality, AgingAnalysis } from '../aging-utils';

// Extended Invoice type dengan data aging
export interface InvoiceWithAging extends Invoice {
  aging: AgingAnalysis;
  customer: Customer;
  payments: Payment[];
  totalPayments: number;
  remainingAmount: number;
}

// Type untuk invoice list response dengan aging
export interface InvoiceWithCustomer extends Invoice {
  customer: Customer;
  payments?: Payment[];
}

// Extended type untuk dashboard analytics
export interface DashboardAnalytics {
  totalInvoices: number;
  totalAmount: number;
  paidAmount: number;
  outstandingAmount: number;
  agingSummary: {
    current: { count: number; amount: number; percentage: number };
    specialMention: { count: number; amount: number; percentage: number };
    substandard: { count: number; amount: number; percentage: number };
    doubtful: { count: number; amount: number; percentage: number };
    badDebt: { count: number; amount: number; percentage: number };
  };
  qualityDistribution: Array<{
    quality: InvoiceQuality;
    label: string;
    count: number;
    amount: number;
    percentage: number;
    colorClass: string;
  }>;
}

// Type untuk aging report
export interface AgingReport {
  reportDate: Date;
  totalOutstanding: number;
  totalCount: number;
  buckets: Array<{
    label: string;
    daysRange: string;
    count: number;
    amount: number;
    percentage: number;
    quality: InvoiceQuality;
    colorClass: string;
  }>;
  riskAnalysis: {
    lowRisk: { count: number; amount: number };
    mediumRisk: { count: number; amount: number };
    highRisk: { count: number; amount: number };
    criticalRisk: { count: number; amount: number };
  };
}

// Type untuk invoice quality badge props
export interface QualityBadgeProps {
  quality: InvoiceQuality;
  daysOverdue: number;
  size?: 'sm' | 'md' | 'lg';
  showDays?: boolean;
}

// Type untuk aging summary card props
export interface AgingSummaryCardProps {
  title: string;
  count: number;
  amount: number;
  percentage: number;
  colorClass: string;
  trend?: {
    value: number;
    isPositive: boolean;
  };
}

export type { InvoiceQuality, AgingAnalysis } from '../aging-utils';