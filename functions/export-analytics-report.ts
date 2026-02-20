import { getClient } from './_client.ts';
import jsPDF from 'npm:jspdf@2.5.2';

/**
 * Export analytics data as PDF or CSV
 * Professional reporting for stakeholders
 */
Deno.serve(withSecurity(async (req) => {
  try {
    const base44 = getClient(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { format, time_range } = await req.json();

    // Fetch analytics data
    const now = new Date();
    const daysAgo = time_range === '7d' ? 7 : time_range === '30d' ? 30 : 90;
    const startDate = new Date(now.getTime() - daysAgo * 24 * 60 * 60 * 1000);

    const events = await base44.entities.AnalyticsEvent.filter({
      user_id: user.id,
      created_date: { $gte: startDate.toISOString() }
    }, '-created_date', 1000);

    const projects = await base44.entities.VideoProject.filter({
      user_id: user.id
    }, '-created_date', 100);

    // Calculate metrics
    const metrics = {
      totalViews: events.filter(e => e.event_type === 'video_view').length,
      totalWatchTime: events
        .filter(e => e.event_type === 'video_watch_time')
        .reduce((sum, e) => sum + (e.value || 0), 0),
      thumbnailClicks: events.filter(e => e.event_type === 'thumbnail_click').length,
      thumbnailImpressions: events.filter(e => e.event_type === 'thumbnail_impression').length,
      totalProjects: projects.length
    };

    metrics.avgCTR = metrics.thumbnailImpressions > 0 
      ? (metrics.thumbnailClicks / metrics.thumbnailImpressions * 100).toFixed(2)
      : 0;

    if (format === 'csv') {
      // Generate CSV
      const csv = generateCSV(events, metrics);
      
      return new Response(csv, {
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="analytics-report-${now.toISOString().split('T')[0]}.csv"`
        }
      });
    } else if (format === 'pdf') {
      // Generate PDF
      const pdfBytes = await generatePDF(user, metrics, events, startDate, now);
      
      return new Response(pdfBytes, {
        headers: {
          'Content-Type': 'application/pdf',
          'Content-Disposition': `attachment; filename="analytics-report-${now.toISOString().split('T')[0]}.pdf"`
        }
      });
    }

    return Response.json({ error: 'Invalid format' }, { status: 400 });

  } catch (error) {
    console.error('[Export] Error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});

function generateCSV(events, metrics) {
  let csv = 'Metric,Value\n';
  csv += `Total Views,${metrics.totalViews}\n`;
  csv += `Total Watch Time (seconds),${metrics.totalWatchTime}\n`;
  csv += `Thumbnail CTR,%${metrics.avgCTR}\n`;
  csv += `Total Projects,${metrics.totalProjects}\n`;
  csv += '\n\nEvent Type,Count\n';
  
  const eventCounts = {};
  events.forEach(e => {
    eventCounts[e.event_type] = (eventCounts[e.event_type] || 0) + 1;
  });
  
  Object.entries(eventCounts).forEach(([type, count]) => {
    csv += `${type},${count}\n`;
  });
  
  return csv;
}

async function generatePDF(user, metrics, events, startDate, endDate) {
  const doc = new jsPDF();
  
  // Header
  doc.setFontSize(24);
  doc.setTextColor(245, 166, 35);
  doc.text('VFX Studios Analytics Report', 20, 20);
  
  doc.setFontSize(10);
  doc.setTextColor(100);
  doc.text(`Generated: ${endDate.toLocaleDateString()}`, 20, 30);
  doc.text(`Period: ${startDate.toLocaleDateString()} - ${endDate.toLocaleDateString()}`, 20, 36);
  doc.text(`Creator: ${user.full_name || user.email}`, 20, 42);
  
  // Metrics Section
  doc.setFontSize(16);
  doc.setTextColor(0);
  doc.text('Key Metrics', 20, 55);
  
  doc.setFontSize(12);
  let y = 65;
  doc.text(`Total Views: ${metrics.totalViews.toLocaleString()}`, 20, y);
  y += 8;
  doc.text(`Total Watch Time: ${Math.floor(metrics.totalWatchTime / 60)} minutes`, 20, y);
  y += 8;
  doc.text(`Average CTR: ${metrics.avgCTR}%`, 20, y);
  y += 8;
  doc.text(`Total Projects: ${metrics.totalProjects}`, 20, y);
  
  // Event Breakdown
  y += 15;
  doc.setFontSize(16);
  doc.text('Event Breakdown', 20, y);
  
  const eventCounts = {};
  events.forEach(e => {
    eventCounts[e.event_type] = (eventCounts[e.event_type] || 0) + 1;
  });
  
  y += 10;
  doc.setFontSize(10);
  Object.entries(eventCounts).forEach(([type, count]) => {
    doc.text(`${type}: ${count}`, 20, y);
    y += 6;
  });
  
  // Footer
  doc.setFontSize(8);
  doc.setTextColor(150);
  doc.text('VFX Studios - AI-Powered Visual Effects Platform', 20, 280);
  doc.text('https://vfxstudios.com', 20, 285);
  
  return doc.output('arraybuffer');
}

