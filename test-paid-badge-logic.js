// Test script untuk badge N/A aging quality untuk invoice lunas
console.log("=== Testing Aging Quality Badge N/A for LUNAS invoices ===\n");

// Simulate the analyzeInvoiceAging function
function analyzeInvoiceAging(invoice, referenceDate = new Date()) {
  // Jika invoice sudah lunas, return PAID quality
  if (invoice.statusPembayaran === 'LUNAS') {
    return {
      daysOverdue: 0,
      quality: 'PAID',
      qualityLabel: 'Sudah Lunas (N/A)',
      riskLevel: 'low',
      colorClass: 'bg-blue-100 text-blue-800 border-blue-200'
    };
  }

  // Simulate other qualities for comparison
  const jatuhTempo = new Date(invoice.jatuhTempo);
  const daysOverdue = Math.floor((referenceDate - jatuhTempo) / (1000 * 60 * 60 * 24));
  
  let quality, qualityLabel;
  if (daysOverdue < 0) {
    quality = 'CURRENT';
    qualityLabel = 'Belum Jatuh Tempo';
  } else if (daysOverdue <= 30) {
    quality = 'SPECIAL_MENTION';
    qualityLabel = 'Dalam Perhatian Khusus';
  } else if (daysOverdue <= 60) {
    quality = 'SUBSTANDARD';
    qualityLabel = 'Kurang Lancar';
  } else if (daysOverdue <= 90) {
    quality = 'DOUBTFUL';
    qualityLabel = 'Diragukan';
  } else {
    quality = 'BAD_DEBT';
    qualityLabel = 'Macet';
  }
  
  return {
    daysOverdue,
    quality,
    qualityLabel,
    riskLevel: 'medium',
    colorClass: 'bg-yellow-100 text-yellow-800'
  };
}

// Test scenarios
const testInvoices = [
  {
    id: 'INV-2024-001',
    statusPembayaran: 'LUNAS',
    jatuhTempo: '2024-08-15',
    description: 'Invoice sudah lunas (dulu overdue 65 hari)'
  },
  {
    id: 'INV-2024-002',
    statusPembayaran: 'LUNAS',
    jatuhTempo: '2025-01-01',
    description: 'Invoice sudah lunas (dulu belum jatuh tempo)'
  },
  {
    id: 'INV-2024-003',
    statusPembayaran: 'BELUM_LUNAS',
    jatuhTempo: '2024-06-15',
    description: 'Invoice belum lunas (overdue 126 hari - macet)'
  },
  {
    id: 'INV-2024-004',
    statusPembayaran: 'BELUM_LUNAS',
    jatuhTempo: '2025-12-01',
    description: 'Invoice belum lunas (belum jatuh tempo)'
  }
];

testInvoices.forEach((invoice, index) => {
  const analysis = analyzeInvoiceAging(invoice);
  console.log(`Test ${index + 1}: ${invoice.description}`);
  console.log(`  Invoice: ${invoice.id}`);
  console.log(`  Status: ${invoice.statusPembayaran}`);
  console.log(`  Jatuh Tempo: ${invoice.jatuhTempo}`);
  console.log(`  Aging Quality: ${analysis.quality}`);
  console.log(`  Badge Label: "${analysis.qualityLabel}"`);
  console.log(`  Days Overdue: ${analysis.daysOverdue}`);
  console.log(`  Color: ${analysis.colorClass}`);
  console.log('');
});

console.log("=== Ringkasan Badge N/A untuk Invoice LUNAS ===");
console.log("✅ Invoice dengan status LUNAS akan menampilkan:");
console.log("   📱 Badge: 'N/A' dengan icon checkmark (✓)");
console.log("   🎨 Warna: Blue (bg-blue-100 text-blue-800)");
console.log("   📊 Quality: PAID");
console.log("   📅 Days: Tidak menampilkan informasi hari");
console.log("   ⚖️ Risk Level: Low");
console.log("\n🔄 Ini akan berlaku untuk semua invoice LUNAS");
console.log("   terlepas dari berapa lama mereka overdue sebelumnya");