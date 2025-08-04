import { useEffect } from 'react';

const SEO = ({
  title,
  description,
  image,
  url,
  type = 'website',
  article = null
}) => {
  useEffect(() => {
    const defaultTitle = 'Vikra Hub - Connect, Create, and Inspire';
    const defaultDescription = 'Vikra Hub is a platform for creatives, brands, and businesses in South Sudan to connect, share, and grow. Join a thriving hub of talent and innovation.';
    const defaultImage = `${window.location.origin}/vikrahub-hero.jpg`;
    const defaultUrl = window.location.href;

    const seoTitle = title ? `${title} | Vikra Hub` : defaultTitle;
    const seoDescription = description || defaultDescription;
    const seoImage = image || defaultImage;
    const seoUrl = url || defaultUrl;

    // Update document title
    document.title = seoTitle;

    // Helper function to update or create meta tag
    const updateMetaTag = (property, content, isProperty = false) => {
      if (!content) return;
      
      const selector = isProperty ? `meta[property="${property}"]` : `meta[name="${property}"]`;
      let metaTag = document.querySelector(selector);
      
      if (metaTag) {
        metaTag.setAttribute('content', content);
      } else {
        metaTag = document.createElement('meta');
        if (isProperty) {
          metaTag.setAttribute('property', property);
        } else {
          metaTag.setAttribute('name', property);
        }
        metaTag.setAttribute('content', content);
        document.head.appendChild(metaTag);
      }
    };

    // Helper function to update or create link tag
    const updateLinkTag = (rel, href) => {
      if (!href) return;
      
      let linkTag = document.querySelector(`link[rel="${rel}"]`);
      
      if (linkTag) {
        linkTag.setAttribute('href', href);
      } else {
        linkTag = document.createElement('link');
        linkTag.setAttribute('rel', rel);
        linkTag.setAttribute('href', href);
        document.head.appendChild(linkTag);
      }
    };

    // Update basic meta tags
    updateMetaTag('description', seoDescription);
    
    // Update canonical URL
    updateLinkTag('canonical', seoUrl);
    
    // Update Open Graph meta tags
    updateMetaTag('og:title', seoTitle, true);
    updateMetaTag('og:description', seoDescription, true);
    updateMetaTag('og:image', seoImage, true);
    updateMetaTag('og:image:alt', title || 'VikraHub - Empowering South Sudanese Creatives', true);
    updateMetaTag('og:url', seoUrl, true);
    updateMetaTag('og:type', type, true);
    updateMetaTag('og:site_name', 'Vikra Hub', true);
    updateMetaTag('og:locale', 'en_US', true);
    
    // Update Twitter Card meta tags
    updateMetaTag('twitter:card', 'summary_large_image');
    updateMetaTag('twitter:title', seoTitle);
    updateMetaTag('twitter:description', seoDescription);
    updateMetaTag('twitter:image', seoImage);
    updateMetaTag('twitter:image:alt', title || 'VikraHub - Empowering South Sudanese Creatives');
    updateMetaTag('twitter:site', '@vikrahub');
    updateMetaTag('twitter:creator', '@vikrahub');
    
    // Update article specific meta tags
    if (article) {
      updateMetaTag('article:author', article.author, true);
      updateMetaTag('article:published_time', article.publishedTime, true);
      updateMetaTag('article:modified_time', article.modifiedTime, true);
      updateMetaTag('article:section', article.section, true);
      
      // Add article tags
      if (article.tags && article.tags.length > 0) {
        // Remove existing article:tag meta tags
        const existingTags = document.querySelectorAll('meta[property="article:tag"]');
        existingTags.forEach(tag => tag.remove());
        
        // Add new article:tag meta tags
        article.tags.forEach(tag => {
          updateMetaTag('article:tag', tag, true);
        });
      }
    }
    
    // Update additional meta tags
    updateMetaTag('author', 'Vikra Hub');
    updateMetaTag('robots', 'index, follow');
    updateMetaTag('theme-color', '#ffa000');
    
    // Update or create JSON-LD structured data
    const updateJsonLd = () => {
      // Remove existing JSON-LD script
      const existingScript = document.querySelector('script[type="application/ld+json"]');
      if (existingScript) {
        existingScript.remove();
      }
      
      // Create new JSON-LD script
      const jsonLdData = {
        "@context": "https://schema.org",
        "@type": type === 'article' ? 'Article' : 'WebPage',
        "headline": title,
        "description": seoDescription,
        "image": seoImage,
        "url": seoUrl,
        "publisher": {
          "@type": "Organization",
          "name": "Vikra Hub",
          "logo": {
            "@type": "ImageObject",
            "url": `${window.location.origin}/vikrahub-logo.svg`
          }
        }
      };
      
      if (article) {
        jsonLdData.author = {
          "@type": "Person",
          "name": article.author
        };
        jsonLdData.datePublished = article.publishedTime;
        jsonLdData.dateModified = article.modifiedTime || article.publishedTime;
        jsonLdData.mainEntityOfPage = {
          "@type": "WebPage",
          "@id": seoUrl
        };
      }
      
      const script = document.createElement('script');
      script.type = 'application/ld+json';
      script.textContent = JSON.stringify(jsonLdData);
      document.head.appendChild(script);
    };
    
    updateJsonLd();
    
    // Cleanup function to restore defaults when component unmounts
    return () => {
      // Restore default title
      document.title = defaultTitle;
      
      // Restore default meta tags
      updateMetaTag('description', defaultDescription);
      updateMetaTag('og:title', defaultTitle, true);
      updateMetaTag('og:description', defaultDescription, true);
      updateMetaTag('og:image', defaultImage, true);
      updateMetaTag('og:url', window.location.origin, true);
      updateMetaTag('og:type', 'website', true);
      updateMetaTag('twitter:title', defaultTitle);
      updateMetaTag('twitter:description', defaultDescription);
      updateMetaTag('twitter:image', defaultImage);
      
      // Remove article-specific meta tags
      const articleTags = document.querySelectorAll('meta[property^="article:"]');
      articleTags.forEach(tag => tag.remove());
    };
  }, [title, description, image, url, type, article]);

  // This component doesn't render anything - it only manages document head
  return null;
};

export default SEO;
