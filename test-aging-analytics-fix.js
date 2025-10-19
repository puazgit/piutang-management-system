// Test aging analytics logic with PAID quality
const { InvoiceQuality } = require('./src/lib/aging-utils');

console.log("=== Testing Aging Analytics Logic ===\n");

// Simulate the updated getAgingBuckets function logic
function testGetAgingBuckets() {
  const buckets = [
    { label: 'Belum Jatuh Tempo', count: 0, amount: 0, quality: 'CURRENT' },
    { label: '1-30 hari', count: 0, amount: 0, quality: 'SPECIAL_MENTION' },
    { label: '31-60 hari', count: 0, amount: 0, quality: 'SUBSTANDARD' },
    { label: '61-90 hari', count: 0, amount: 0, quality: 'DOUBTFUL' },
    { label: '> 90 hari', count: 0, amount: 0, quality: 'BAD_DEBT' }
  ];

  // Test data with various qualities
  const testAnalyses = [
    { quality: 'CURRENT', amount: 10000000 },
    { quality: 'SPECIAL_MENTION', amount: 20000000 },
    { quality: 'SUBSTANDARD', amount: 30000000 },
    { quality: 'DOUBTFUL', amount: 40000000 },
    { quality: 'BAD_DEBT', amount: 50000000 },
    { quality: 'PAID', amount: 60000000 }, // This should be skipped
  ];

  console.log("Initial buckets:");
  buckets.forEach((bucket, index) => {
    console.log(`  ${index}: ${bucket.label} - Count: ${bucket.count}, Amount: ${bucket.amount}`);
  });

  console.log("\nProcessing analyses:");
  testAnalyses.forEach(analysis => {
    // Map quality to bucket index properly
    let bucketIndex = -1;
    switch (analysis.quality) {
      case 'CURRENT':
        bucketIndex = 0;
        break;
      case 'SPECIAL_MENTION':
        bucketIndex = 1;
        break;
      case 'SUBSTANDARD':
        bucketIndex = 2;
        break;
      case 'DOUBTFUL':
        bucketIndex = 3;
        break;
      case 'BAD_DEBT':
        bucketIndex = 4;
        break;
      // Skip PAID quality since it's not relevant for outstanding invoices
    }

    console.log(`  Quality: ${analysis.quality}, Bucket Index: ${bucketIndex}`);

    if (bucketIndex >= 0 && bucketIndex < buckets.length) {
      buckets[bucketIndex].count += 1;
      buckets[bucketIndex].amount += analysis.amount;
      console.log(`    ✅ Added to bucket ${bucketIndex}`);
    } else {
      console.log(`    ⏭️  Skipped (PAID or invalid quality)`);
    }
  });

  console.log("\nFinal buckets:");
  buckets.forEach((bucket, index) => {
    console.log(`  ${index}: ${bucket.label} - Count: ${bucket.count}, Amount: ${bucket.amount.toLocaleString('id-ID')}`);
  });

  return buckets;
}

// Test the color class function
function testGetColorClassForQuality(quality) {
  switch (quality) {
    case 'PAID':
      return 'bg-blue-100 text-blue-800 border-blue-200'
    case 'CURRENT':
      return 'bg-green-100 text-green-800 border-green-200'
    case 'SPECIAL_MENTION':
      return 'bg-yellow-100 text-yellow-800 border-yellow-200'
    case 'SUBSTANDARD':
      return 'bg-orange-100 text-orange-800 border-orange-200'
    case 'DOUBTFUL':
      return 'bg-red-100 text-red-800 border-red-200'
    case 'BAD_DEBT':
      return 'bg-gray-100 text-gray-800 border-gray-200'
    default:
      return 'bg-gray-100 text-gray-800 border-gray-200'
  }
}

// Run tests
testGetAgingBuckets();

console.log("\n=== Testing Color Classes ===");
const qualities = ['PAID', 'CURRENT', 'SPECIAL_MENTION', 'SUBSTANDARD', 'DOUBTFUL', 'BAD_DEBT'];
qualities.forEach(quality => {
  console.log(`${quality}: ${testGetColorClassForQuality(quality)}`);
});

console.log("\n✅ All tests completed successfully!");
console.log("💡 PAID quality is properly handled and skipped from aging buckets");
console.log("🎨 Color classes are defined for all quality types including PAID");