import React from 'react';
import { Helmet } from 'react-helmet-async';

export default function SEOHead({ 
  title, 
  description, 
  keywords,
  ogImage,
  type = 'website',
  canonicalUrl,
  structuredData
}) {
  const fullTitle = title ? `${title} | VFX Studios` : 'VFX Studios - AI-Powered Visual Effects Platform';
  const defaultDescription = 'Professional VFX platform for live performances. AI-powered visual generation, marketplace, and collaboration tools for VJs and visual artists.';

  return (
    <Helmet>
      {/* Primary Meta Tags */}
      <title>{fullTitle}</title>
      <meta name="title" content={fullTitle} />
      <meta name="description" content={description || defaultDescription} />
      {keywords && <meta name="keywords" content={keywords} />}
      
      {/* Open Graph / Facebook */}
      <meta property="og:type" content={type} />
      <meta property="og:url" content={canonicalUrl || window.location.href} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description || defaultDescription} />
      {ogImage && <meta property="og:image" content={ogImage} />}
      
      {/* Twitter */}
      <meta property="twitter:card" content="summary_large_image" />
      <meta property="twitter:url" content={canonicalUrl || window.location.href} />
      <meta property="twitter:title" content={fullTitle} />
      <meta property="twitter:description" content={description || defaultDescription} />
      {ogImage && <meta property="twitter:image" content={ogImage} />}
      
      {/* Canonical URL */}
      {canonicalUrl && <link rel="canonical" href={canonicalUrl} />}
      
      {/* Structured Data / Schema.org */}
      {structuredData && (
        <script type="application/ld+json">
          {JSON.stringify(structuredData)}
        </script>
      )}
    </Helmet>
  );
}