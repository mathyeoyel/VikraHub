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

    // Update page title
    document.title = seoTitle;

    // Helper function to update meta tag
    const updateMetaTag = (property, content, isProperty = false) => {
      const attribute = isProperty ? 'property' : 'name';
      let meta = document.querySelector(`meta[${attribute}="${property}"]`);
      
      if (!meta) {
        meta = document.createElement('meta');
        meta.setAttribute(attribute, property);
        document.head.appendChild(meta);
      }
      
      meta.setAttribute('content', content);
    };

    // Helper function to update link tag
    const updateLinkTag = (rel, href) => {
      let link = document.querySelector(`link[rel="${rel}"]`);
      
      if (!link) {
        link = document.createElement('link');
        link.setAttribute('rel', rel);
        document.head.appendChild(link);
      }
      
      link.setAttribute('href', href);
    };

    // Basic meta tags
    updateMetaTag('description', seoDescription);
    
    // Canonical URL
    updateLinkTag('canonical', seoUrl);
    
    // Open Graph meta tags
    updateMetaTag('og:title', seoTitle, true);
    updateMetaTag('og:description', seoDescription, true);
    updateMetaTag('og:image', seoImage, true);
    updateMetaTag('og:image:alt', title || 'VikraHub - Empowering South Sudanese Creatives', true);
    updateMetaTag('og:url', seoUrl, true);
    updateMetaTag('og:type', type, true);
    updateMetaTag('og:site_name', 'Vikra Hub', true);
    updateMetaTag('og:locale', 'en_US', true);
    
    // Article specific meta tags
    if (article) {
      updateMetaTag('article:author', article.author, true);
      updateMetaTag('article:published_time', article.publishedTime, true);
      updateMetaTag('article:modified_time', article.modifiedTime, true);
      updateMetaTag('article:section', article.section, true);
      
      // Remove existing article:tag meta tags
      document.querySelectorAll('meta[property="article:tag"]').forEach(tag => tag.remove());
      
      // Add new article:tag meta tags
      if (article.tags && article.tags.length > 0) {
        article.tags.forEach(tag => {
          const meta = document.createElement('meta');
          meta.setAttribute('property', 'article:tag');
          meta.setAttribute('content', tag);
          document.head.appendChild(meta);
        });
      }
    }
    
    // Twitter Card meta tags
    updateMetaTag('twitter:card', 'summary_large_image');
    updateMetaTag('twitter:title', seoTitle);
    updateMetaTag('twitter:description', seoDescription);
    updateMetaTag('twitter:image', seoImage);
    updateMetaTag('twitter:image:alt', title || 'VikraHub - Empowering South Sudanese Creatives');
    updateMetaTag('twitter:site', '@vikrahub');
    updateMetaTag('twitter:creator', '@vikrahub');
    
    // Additional meta tags
    updateMetaTag('author', 'Vikra Hub');
    updateMetaTag('robots', 'index, follow');
    updateMetaTag('theme-color', '#ffa000');
    
    // JSON-LD structured data
    const removeExistingJsonLd = () => {
      const existingScript = document.querySelector('script[type="application/ld+json"]#seo-json-ld');
      if (existingScript) {
        existingScript.remove();
      }
    };
    
    const addJsonLd = () => {
      const script = document.createElement('script');
      script.type = 'application/ld+json';
      script.id = 'seo-json-ld';
      script.innerHTML = JSON.stringify({
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
        },
        ...(article && {
          "author": {
            "@type": "Person",
            "name": article.author
          },
          "datePublished": article.publishedTime,
          "dateModified": article.modifiedTime || article.publishedTime,
          "mainEntityOfPage": {
            "@type": "WebPage",
            "@id": seoUrl
          }
        })
      });
      document.head.appendChild(script);
    };
    
    removeExistingJsonLd();
    addJsonLd();

    // Cleanup function to reset meta tags when component unmounts
    return () => {
      // Reset to default values when component unmounts
      document.title = defaultTitle;
      updateMetaTag('description', defaultDescription);
      updateMetaTag('og:title', defaultTitle, true);
      updateMetaTag('og:description', defaultDescription, true);
      updateMetaTag('og:image', defaultImage, true);
      updateMetaTag('og:url', window.location.href, true);
      updateMetaTag('og:type', 'website', true);
      
      updateMetaTag('twitter:title', defaultTitle);
      updateMetaTag('twitter:description', defaultDescription);
      updateMetaTag('twitter:image', defaultImage);
      
      updateLinkTag('canonical', window.location.href);
      removeExistingJsonLd();
    };
  }, [title, description, image, url, type, article]);

  // This component doesn't render anything
  return null;
};

export default SEO;
