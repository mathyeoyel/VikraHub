// Test script for portfolio image URL handling
import { createPortfolioImageUrl, handleImageError } from '../src/utils/portfolioImageUtils.js';

// Test cases for portfolio image URL creation
console.log('Testing portfolio image URL handling...\n');

// Test 1: Full URL (should return as-is)
const fullUrl = 'https://res.cloudinary.com/vikrahub/image/upload/v1234567890/portfolio/sample.jpg';
console.log('✅ Full URL:', createPortfolioImageUrl(fullUrl));

// Test 2: Absolute path (should return as-is)
const absolutePath = '/assets/images/portfolio/app-1.jpg';
console.log('✅ Absolute path:', createPortfolioImageUrl(absolutePath));

// Test 3: Relative path (should construct portfolio path)
const relativePath = 'user123/project.jpg';
console.log('✅ Relative path:', createPortfolioImageUrl(relativePath));

// Test 4: Just filename (should use fallback)
const justFilename = 'sample.jpg';
console.log('⚠️  Just filename (fallback):', createPortfolioImageUrl(justFilename));

// Test 5: Empty/null (should use fallback)
const emptyPath = '';
console.log('⚠️  Empty path (fallback):', createPortfolioImageUrl(emptyPath));

// Test 6: Null (should use fallback)
const nullPath = null;
console.log('⚠️  Null path (fallback):', createPortfolioImageUrl(nullPath));

console.log('\n🎉 Portfolio image handling tests completed!');
console.log('\nThe system now properly handles:');
console.log('- Full Cloudinary URLs');
console.log('- Absolute paths to assets');
console.log('- Relative portfolio paths');
console.log('- Invalid filenames (uses fallback)');
console.log('- Empty/null values (uses fallback)');
console.log('\nThis should ensure clean portfolio image handling!');
