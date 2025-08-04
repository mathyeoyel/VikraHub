import React from 'react';
import { Helmet } from 'react-helmet-async';

const SEO = ({
  title,
  description,
  image,
  url,
  type = 'website',
  article = null
}) => {
  const defaultTitle = 'Vikra Hub - Connect, Create, and Inspire';
  const defaultDescription = 'Vikra Hub is a platform for creatives, brands, and businesses in South Sudan to connect, share, and grow. Join a thriving hub of talent and innovation.';
  const defaultImage = `${window.location.origin}/vikrahub-hero.jpg`;
  const defaultUrl = window.location.href;

  const seoTitle = title ? `${title} | Vikra Hub` : defaultTitle;
  const seoDescription = description || defaultDescription;
  const seoImage = image || defaultImage;
  const seoUrl = url || defaultUrl;

  return (
    <Helmet>
      {/* Basic meta tags */}
      <title>{seoTitle}</title>
      <meta name="description" content={seoDescription} />
      
      {/* Canonical URL */}
      <link rel="canonical" href={seoUrl} />
      
      {/* Open Graph meta tags for Facebook, LinkedIn, etc. */}
      <meta property="og:title" content={seoTitle} />
      <meta property="og:description" content={seoDescription} />
      <meta property="og:image" content={seoImage} />
      <meta property="og:image:alt" content={title || 'VikraHub - Empowering South Sudanese Creatives'} />
      <meta property="og:url" content={seoUrl} />
      <meta property="og:type" content={type} />
      <meta property="og:site_name" content="Vikra Hub" />
      <meta property="og:locale" content="en_US" />
      
      {/* Article specific meta tags */}
      {article && (
        <>
          <meta property="article:author" content={article.author} />
          <meta property="article:published_time" content={article.publishedTime} />
          <meta property="article:modified_time" content={article.modifiedTime} />
          <meta property="article:section" content={article.section} />
          {article.tags && article.tags.map((tag, index) => (
            <meta key={index} property="article:tag" content={tag} />
          ))}
        </>
      )}
      
      {/* Twitter Card meta tags */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={seoTitle} />
      <meta name="twitter:description" content={seoDescription} />
      <meta name="twitter:image" content={seoImage} />
      <meta name="twitter:image:alt" content={title || 'VikraHub - Empowering South Sudanese Creatives'} />
      <meta name="twitter:site" content="@vikrahub" />
      <meta name="twitter:creator" content="@vikrahub" />
      
      {/* Additional meta tags for better SEO */}
      <meta name="author" content="Vikra Hub" />
      <meta name="robots" content="index, follow" />
      <meta name="theme-color" content="#ffa000" />
      
      {/* JSON-LD structured data for rich snippets */}
      <script type="application/ld+json">
        {JSON.stringify({
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
        })}
      </script>
    </Helmet>
  );
};

export default SEO;
