/**
 * Dynamic Sitemap Generator for VikraHub
 * This script generates an updated sitemap.xml with the latest content
 */

const fs = require('fs');
const path = require('path');

// Configuration
const config = {
  baseUrl: 'https://www.vikrahub.com',
  staticPages: [
    { path: '/', priority: '1.0', changefreq: 'weekly' },
    { path: '/about', priority: '0.8', changefreq: 'monthly' },
    { path: '/explore', priority: '0.9', changefreq: 'daily' },
    { path: '/inspiration', priority: '0.8', changefreq: 'daily' },
    { path: '/blog', priority: '0.7', changefreq: 'daily' },
    { path: '/marketplace', priority: '0.8', changefreq: 'daily' },
    { path: '/login', priority: '0.6', changefreq: 'monthly' },
    { path: '/register', priority: '0.6', changefreq: 'monthly' },
    { path: '/contact', priority: '0.7', changefreq: 'monthly' },
    { path: '/services', priority: '0.7', changefreq: 'monthly' },
    { path: '/privacy', priority: '0.3', changefreq: 'yearly' },
    { path: '/terms', priority: '0.3', changefreq: 'yearly' }
  ]
};

// Generate XML sitemap content
function generateSitemap() {
  const currentDate = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format
  
  let xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
        xsi:schemaLocation="http://www.sitemaps.org/schemas/sitemap/0.9
        http://www.sitemaps.org/schemas/sitemap/0.9/sitemap.xsd">

`;

  // Add static pages
  config.staticPages.forEach(page => {
    xml += `  <!-- ${page.path === '/' ? 'Homepage' : page.path.replace('/', '').replace(/^\w/, c => c.toUpperCase())} -->
  <url>
    <loc>${config.baseUrl}${page.path}</loc>
    <lastmod>${currentDate}</lastmod>
    <changefreq>${page.changefreq}</changefreq>
    <priority>${page.priority}</priority>
  </url>

`;
  });

  xml += `</urlset>`;
  
  return xml;
}

// Main function
function main() {
  console.log('🗺️ Generating VikraHub sitemap...');
  
  try {
    const sitemapContent = generateSitemap();
    
    // Write to public folder
    const publicPath = path.join(__dirname, 'public', 'sitemap.xml');
    fs.writeFileSync(publicPath, sitemapContent, 'utf8');
    console.log('✅ Sitemap written to public/sitemap.xml');
    
    // Write to build folder if it exists
    const buildPath = path.join(__dirname, 'build', 'sitemap.xml');
    if (fs.existsSync(path.dirname(buildPath))) {
      fs.writeFileSync(buildPath, sitemapContent, 'utf8');
      console.log('✅ Sitemap written to build/sitemap.xml');
    }
    
    console.log('🎉 Sitemap generation complete!');
    console.log(`📋 Generated ${config.staticPages.length} URLs`);
    
  } catch (error) {
    console.error('❌ Error generating sitemap:', error);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = { generateSitemap, main };
