import { Invoice } from '@prisma/client';

// Extended invoice type untuk aging analysis
interface InvoiceWithPayments extends Invoice {
  payments?: Array<{
    penerimaan: number;
  }>;
}

// Enum untuk kualitas piutang berdasarkan umur
export enum InvoiceQuality {
  PAID = 'PAID',                          // Invoice sudah lunas (N/A)
  CURRENT = 'CURRENT',                    // Belum jatuh tempo
  SPECIAL_MENTION = 'SPECIAL_MENTION',    // 1-30 hari (Dalam Perhatian Khusus)
  SUBSTANDARD = 'SUBSTANDARD',            // 31-60 hari (Kurang Lancar)
  DOUBTFUL = 'DOUBTFUL',                  // 61-90 hari (Diragukan)
  BAD_DEBT = 'BAD_DEBT'                   // > 90 hari (Macet)
}

// Interface untuk hasil analisis aging
export interface AgingAnalysis {
  daysOverdue: number;
  quality: InvoiceQuality;
  qualityLabel: string;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  colorClass: string;
}

// Interface untuk summary aging
export interface AgingSummary {
  current: {
    count: number;
    amount: number;
  };
  specialMention: {
    count: number;
    amount: number;
  };
  substandard: {
    count: number;
    amount: number;
  };
  doubtful: {
    count: number;
    amount: number;
  };
  badDebt: {
    count: number;
    amount: number;
  };
  total: {
    count: number;
    amount: number;
  };
}

// Fungsi untuk menghitung umur piutang
export function calculateDaysOverdue(dueDate: Date, referenceDate: Date = new Date()): number {
  const timeDiff = referenceDate.getTime() - dueDate.getTime();
  return Math.floor(timeDiff / (1000 * 60 * 60 * 24));
}

// Fungsi untuk menentukan kualitas piutang berdasarkan umur
export function determineInvoiceQuality(daysOverdue: number): InvoiceQuality {
  if (daysOverdue < 0) {
    return InvoiceQuality.CURRENT; // Belum jatuh tempo
  } else if (daysOverdue <= 30) {
    return InvoiceQuality.SPECIAL_MENTION; // 1-30 hari
  } else if (daysOverdue <= 60) {
    return InvoiceQuality.SUBSTANDARD; // 31-60 hari
  } else if (daysOverdue <= 90) {
    return InvoiceQuality.DOUBTFUL; // 61-90 hari
  } else {
    return InvoiceQuality.BAD_DEBT; // > 90 hari
  }
}

// Fungsi untuk mendapatkan label kualitas dalam bahasa Indonesia
export function getQualityLabel(quality: InvoiceQuality): string {
  switch (quality) {
    case InvoiceQuality.PAID:
      return 'Sudah Lunas (N/A)';
    case InvoiceQuality.CURRENT:
      return 'Belum Jatuh Tempo';
    case InvoiceQuality.SPECIAL_MENTION:
      return 'Dalam Perhatian Khusus';
    case InvoiceQuality.SUBSTANDARD:
      return 'Kurang Lancar';
    case InvoiceQuality.DOUBTFUL:
      return 'Diragukan';
    case InvoiceQuality.BAD_DEBT:
      return 'Macet';
    default:
      return 'Unknown';
  }
}

// Fungsi untuk mendapatkan level risiko
export function getRiskLevel(quality: InvoiceQuality): 'low' | 'medium' | 'high' | 'critical' {
  switch (quality) {
    case InvoiceQuality.PAID:
      return 'low';
    case InvoiceQuality.CURRENT:
      return 'low';
    case InvoiceQuality.SPECIAL_MENTION:
      return 'medium';
    case InvoiceQuality.SUBSTANDARD:
      return 'high';
    case InvoiceQuality.DOUBTFUL:
    case InvoiceQuality.BAD_DEBT:
      return 'critical';
    default:
      return 'low';
  }
}

// Fungsi untuk mendapatkan CSS class berdasarkan kualitas
export function getQualityColorClass(quality: InvoiceQuality): string {
  switch (quality) {
    case InvoiceQuality.PAID:
      return 'bg-blue-100 text-blue-800 border-blue-200';
    case InvoiceQuality.CURRENT:
      return 'bg-green-100 text-green-800 border-green-200';
    case InvoiceQuality.SPECIAL_MENTION:
      return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    case InvoiceQuality.SUBSTANDARD:
      return 'bg-orange-100 text-orange-800 border-orange-200';
    case InvoiceQuality.DOUBTFUL:
      return 'bg-red-100 text-red-800 border-red-200';
    case InvoiceQuality.BAD_DEBT:
      return 'bg-gray-100 text-gray-800 border-gray-200';
    default:
      return 'bg-gray-100 text-gray-800 border-gray-200';
  }
}

// Fungsi utama untuk menganalisis aging invoice
export function analyzeInvoiceAging(invoice: Invoice, referenceDate: Date = new Date()): AgingAnalysis {
  // Jika invoice sudah lunas, return PAID quality
  if (invoice.statusPembayaran === 'LUNAS') {
    return {
      daysOverdue: 0,
      quality: InvoiceQuality.PAID,
      qualityLabel: getQualityLabel(InvoiceQuality.PAID),
      riskLevel: getRiskLevel(InvoiceQuality.PAID),
      colorClass: getQualityColorClass(InvoiceQuality.PAID)
    };
  }

  const daysOverdue = calculateDaysOverdue(invoice.jatuhTempo, referenceDate);
  const quality = determineInvoiceQuality(daysOverdue);
  
  return {
    daysOverdue,
    quality,
    qualityLabel: getQualityLabel(quality),
    riskLevel: getRiskLevel(quality),
    colorClass: getQualityColorClass(quality)
  };
}

// Fungsi untuk menganalisis aging dari array invoices
export function generateAgingSummary(invoices: InvoiceWithPayments[], referenceDate: Date = new Date()): AgingSummary {
  const summary: AgingSummary = {
    current: { count: 0, amount: 0 },
    specialMention: { count: 0, amount: 0 },
    substandard: { count: 0, amount: 0 },
    doubtful: { count: 0, amount: 0 },
    badDebt: { count: 0, amount: 0 },
    total: { count: 0, amount: 0 }
  };

  // Filter hanya invoice yang belum lunas
  const outstandingInvoices = invoices.filter(invoice => 
    invoice.statusPembayaran === 'BELUM_LUNAS'
  );

  outstandingInvoices.forEach(invoice => {
    // Calculate remaining balance first
    const totalPayments = invoice.payments?.reduce((sum: number, payment) => sum + payment.penerimaan, 0) || 0;
    const remainingBalance = parseFloat(invoice.nilaiInvoice.toString()) - totalPayments;
    
    // Only process if there's still outstanding balance
    if (remainingBalance <= 0) return;
    
    const analysis = analyzeInvoiceAging(invoice, referenceDate);
    const amount = remainingBalance;

    // Update total
    summary.total.count += 1;
    summary.total.amount += amount;

    // Update berdasarkan kualitas
    switch (analysis.quality) {
      case InvoiceQuality.CURRENT:
        summary.current.count += 1;
        summary.current.amount += amount;
        break;
      case InvoiceQuality.SPECIAL_MENTION:
        summary.specialMention.count += 1;
        summary.specialMention.amount += amount;
        break;
      case InvoiceQuality.SUBSTANDARD:
        summary.substandard.count += 1;
        summary.substandard.amount += amount;
        break;
      case InvoiceQuality.DOUBTFUL:
        summary.doubtful.count += 1;
        summary.doubtful.amount += amount;
        break;
      case InvoiceQuality.BAD_DEBT:
        summary.badDebt.count += 1;
        summary.badDebt.amount += amount;
        break;
    }
  });

  return summary;
}

// Fungsi untuk mendapatkan aging buckets (untuk chart/visualization)
export function getAgingBuckets(invoices: InvoiceWithPayments[], referenceDate: Date = new Date()) {
  const buckets = [
    { label: 'Belum Jatuh Tempo', count: 0, amount: 0, quality: InvoiceQuality.CURRENT },
    { label: '1-30 hari', count: 0, amount: 0, quality: InvoiceQuality.SPECIAL_MENTION },
    { label: '31-60 hari', count: 0, amount: 0, quality: InvoiceQuality.SUBSTANDARD },
    { label: '61-90 hari', count: 0, amount: 0, quality: InvoiceQuality.DOUBTFUL },
    { label: '> 90 hari', count: 0, amount: 0, quality: InvoiceQuality.BAD_DEBT }
  ];

  const outstandingInvoices = invoices.filter(invoice => 
    invoice.statusPembayaran === 'BELUM_LUNAS'
  );

  outstandingInvoices.forEach(invoice => {
    // Calculate remaining balance for invoices with payments
    const totalPayments = invoice.payments?.reduce((sum: number, payment) => sum + payment.penerimaan, 0) || 0;
    const remainingBalance = parseFloat(invoice.nilaiInvoice.toString()) - totalPayments;
    
    // Only process if there's still outstanding balance
    if (remainingBalance <= 0) return;
    
    const analysis = analyzeInvoiceAging(invoice, referenceDate);
    const amount = remainingBalance;

    // Map quality to bucket index properly
    let bucketIndex = -1;
    switch (analysis.quality) {
      case InvoiceQuality.CURRENT:
        bucketIndex = 0;
        break;
      case InvoiceQuality.SPECIAL_MENTION:
        bucketIndex = 1;
        break;
      case InvoiceQuality.SUBSTANDARD:
        bucketIndex = 2;
        break;
      case InvoiceQuality.DOUBTFUL:
        bucketIndex = 3;
        break;
      case InvoiceQuality.BAD_DEBT:
        bucketIndex = 4;
        break;
      // Skip PAID quality since it's not relevant for outstanding invoices
    }

    if (bucketIndex >= 0 && bucketIndex < buckets.length) {
      buckets[bucketIndex].count += 1;
      buckets[bucketIndex].amount += amount;
    }
  });

  return buckets;
}

// Fungsi untuk format currency
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

// Fungsi untuk format persentase
export function formatPercentage(value: number, total: number): string {
  if (total === 0) return '0%';
  const percentage = (value / total) * 100;
  return `${percentage.toFixed(1)}%`;
}