#!/bin/bash

# Script to disable NextAuth temporarily for testing
echo "🔧 Disabling NextAuth for all API routes..."

# Find all API route files that use getServerSession
find src/app/api -name "*.ts" -type f | while read file; do
  if grep -q "getServerSession" "$file"; then
    echo "Processing: $file"
    
    # Comment out getServerSession import
    sed -i '' 's/import { getServerSession }/\/\/ import { getServerSession }/g' "$file"
    
    # Comment out authOptions import  
    sed -i '' 's/import { authOptions }/\/\/ import { authOptions }/g' "$file"
    
    # Comment out session check blocks
    sed -i '' 's/const session = await getServerSession(authOptions)/\/\/ const session = await getServerSession(authOptions)/g' "$file"
    
    # Comment out unauthorized returns
    sed -i '' '/if (!session) {/,/}/ s/^/\/\/ /' "$file"
  fi
done

echo "✅ NextAuth disabled temporarily"
echo "⚠️  Remember to re-enable auth after testing!"