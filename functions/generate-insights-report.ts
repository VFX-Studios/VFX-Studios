import { getClient } from './_client.ts';

Deno.serve(withSecurity(async (req) => {
  try {
    const base44 = getClient(req);
    const user = await base44.auth.me();

    // ADMIN ONLY - Industry insights generation
    if (user?.role !== 'admin') {
      return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    const { report_type, quarter, year } = await req.json();

    // Aggregate anonymized platform data
    const analytics = await base44.asServiceRole.entities.AnalyticsEvent.filter({}, '-created_date', 10000);
    const generatedArt = await base44.asServiceRole.entities.GeneratedArt.list();
    const marketplaceAssets = await base44.asServiceRole.entities.MarketplaceAsset.list();
    const tutorials = await base44.asServiceRole.entities.Tutorial.list();

    // Analyze trends
    const topStyles = {};
    generatedArt.forEach(art => {
      if (art.style) {
        topStyles[art.style] = (topStyles[art.style] || 0) + 1;
      }
    });

    const topCategories = {};
    marketplaceAssets.forEach(asset => {
      topCategories[asset.category] = (topCategories[asset.category] || 0) + 1;
    });

    // Calculate genre distribution
    const genreData = {};
    analytics.filter(e => e.event_type === 'song_analyzed').forEach(event => {
      const genre = event.event_data?.genre;
      if (genre) {
        genreData[genre] = (genreData[genre] || 0) + 1;
      }
    });

    // Generate report using AI
    const reportContent = await base44.asServiceRole.integrations.Core.InvokeLLM({
      prompt: `Generate a professional industry insights report titled "Top VFX Trends in Electronic Music - Q${quarter} ${year}".

Data:
- Top Visual Styles: ${JSON.stringify(Object.entries(topStyles).sort((a, b) => b[1] - a[1]).slice(0, 10))}
- Popular Asset Categories: ${JSON.stringify(topCategories)}
- Genre Distribution: ${JSON.stringify(genreData)}
- Total Creations: ${generatedArt.length}
- Marketplace Assets: ${marketplaceAssets.length}
- Community Tutorials: ${tutorials.length}

Create a comprehensive report with:
1. Executive Summary
2. Key Trends & Insights
3. Visual Style Analysis
4. Genre Breakdown
5. Market Opportunities
6. Future Predictions
7. Recommendations for Industry Stakeholders

Format as professional markdown suitable for PDF export.`,
      add_context_from_internet: true
    });

    // Store report
    const reportDoc = await base44.asServiceRole.entities.BlogPost.create({
      title: `VFX Industry Insights Report - Q${quarter} ${year}`,
      slug: `industry-insights-q${quarter}-${year}`,
      content: reportContent,
      category: 'industry_news',
      published: false, // Admin reviews before publishing
      tags: ['industry-report', 'insights', 'data-analysis']
    });

    console.log('Industry report generated:', reportDoc.id);

    return Response.json({
      success: true,
      report_id: reportDoc.id,
      content: reportContent
    });

  } catch (error) {
    console.error('generate-insights-report error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
  }));
