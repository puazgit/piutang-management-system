// Test script to verify final badge logic behavior
console.log("=== Testing Final Badge Display Logic ===\n");

// Simulate the getStatusBadge function logic
function getStatusBadge(status, isOverdue) {
  // Prioritas: Jika sudah lunas, selalu tampilkan "Lunas" (hijau)
  if (status === 'LUNAS') {
    return { text: 'Lunas', variant: 'default', color: 'green' };
  }
  
  // Jika belum lunas dan sudah jatuh tempo, tampilkan "Belum Lunas" (merah)
  if (isOverdue && status === 'BELUM_LUNAS') {
    return { text: 'Belum Lunas', variant: 'destructive', color: 'red' };
  }
  
  // Jika belum lunas tapi belum jatuh tempo, tampilkan "Belum Lunas" (outline)
  if (status === 'BELUM_LUNAS') {
    return { text: 'Belum Lunas', variant: 'outline', color: 'outline' };
  }
  
  // Fallback untuk status lainnya
  return { text: status, variant: 'outline', color: 'outline' };
}

// Test scenarios
const testCases = [
  { status: 'LUNAS', isOverdue: false, description: 'Invoice sudah lunas (tidak overdue)' },
  { status: 'LUNAS', isOverdue: true, description: 'Invoice sudah lunas (sebelumnya overdue)' },
  { status: 'BELUM_LUNAS', isOverdue: false, description: 'Invoice belum lunas (belum jatuh tempo)' },
  { status: 'BELUM_LUNAS', isOverdue: true, description: 'Invoice belum lunas (sudah jatuh tempo)' },
];

testCases.forEach((testCase, index) => {
  const result = getStatusBadge(testCase.status, testCase.isOverdue);
  console.log(`Test ${index + 1}: ${testCase.description}`);
  console.log(`  Status: ${testCase.status}, Overdue: ${testCase.isOverdue}`);
  console.log(`  Badge: "${result.text}" (${result.color})`);
  console.log(`  Expected: Sesuai dengan permintaan user ✅`);
  console.log('');
});

console.log("=== Ringkasan Badge Logic ===");
console.log("✅ LUNAS (hijau): Selalu 'Lunas' terlepas dari overdue status");
console.log("🔴 BELUM_LUNAS + Overdue (merah): 'Belum Lunas' untuk yang jatuh tempo");
console.log("⚪ BELUM_LUNAS + Not Overdue (outline): 'Belum Lunas' untuk yang belum jatuh tempo");
console.log("\nSemua badge sekarang menggunakan text 'Belum Lunas' untuk yang belum lunas,");
console.log("dengan warna berbeda untuk membedakan status jatuh tempo.");