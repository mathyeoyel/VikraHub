const fs = require('fs');
const path = require('path');

console.log('📋 Copying sitemap and robots.txt to build folder...');

try {
  // Copy sitemap.xml
  const sitemapSource = path.join(__dirname, 'public', 'sitemap.xml');
  const sitemapDest = path.join(__dirname, 'build', 'sitemap.xml');
  
  if (fs.existsSync(sitemapSource)) {
    fs.copyFileSync(sitemapSource, sitemapDest);
    console.log('✅ sitemap.xml copied to build folder');
  } else {
    console.warn('⚠️ sitemap.xml not found in public folder');
  }

  // Copy robots.txt
  const robotsSource = path.join(__dirname, 'public', 'robots.txt');
  const robotsDest = path.join(__dirname, 'build', 'robots.txt');
  
  if (fs.existsSync(robotsSource)) {
    fs.copyFileSync(robotsSource, robotsDest);
    console.log('✅ robots.txt copied to build folder');
  } else {
    console.warn('⚠️ robots.txt not found in public folder');
  }

  console.log('🎉 SEO files setup complete!');
} catch (error) {
  console.error('❌ Error copying SEO files:', error);
  process.exit(1);
}
