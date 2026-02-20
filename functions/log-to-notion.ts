import { getClient } from './_client.ts';

Deno.serve(withSecurity(async (req) => {
  try {
    const base44 = getClient(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { entry_type, data } = await req.json();

    if (!entry_type || !data) {
      return Response.json({ error: 'entry_type and data required' }, { status: 400 });
    }

    // Get Notion access token
    const notionToken = await base44.asServiceRole.connectors.getAccessToken('notion');

    if (!notionToken) {
      return Response.json({ error: 'Notion not connected' }, { status: 400 });
    }

    // Create or find VFX Training database
    const databaseId = await findOrCreateTrainingDatabase(notionToken);

    // Format data based on entry type
    let pageProperties = {};

    if (entry_type === 'ai_feedback') {
      pageProperties = {
        'Name': {
          title: [{ text: { content: `AI Feedback: ${data.song_title || 'Unknown'}` } }]
        },
        'Type': {
          select: { name: 'AI Feedback' }
        },
        'Feedback': {
          select: { name: data.feedback === 'accepted' ? 'Accepted' : 'Rejected' }
        },
        'Urgency': {
          select: { name: data.urgency || 'medium' }
        },
        'Song': {
          rich_text: [{ text: { content: data.song_title || 'N/A' } }]
        },
        'Description': {
          rich_text: [{ text: { content: data.description || 'No description' } }]
        },
        'Energy': {
          number: data.context?.energy || null
        },
        'Reactions': {
          number: data.context?.viewer_reactions || 0
        },
        'Timestamp': {
          date: { start: data.timestamp }
        },
      };
    } else if (entry_type === 'visual_generation') {
      pageProperties = {
        'Name': {
          title: [{ text: { content: `Visual Asset: ${data.song_title || 'Custom'}` } }]
        },
        'Type': {
          select: { name: 'Visual Generation' }
        },
        'Resolution': {
          select: { name: data.resolution || '1080p' }
        },
        'Format': {
          select: { name: data.format || 'image' }
        },
        'Song': {
          rich_text: [{ text: { content: data.song_title || 'Custom Prompt' } }]
        },
        'Styles': {
          multi_select: (data.style_preferences || []).map(s => ({ name: s }))
        },
        'Timestamp': {
          date: { start: data.timestamp }
        },
      };
    } else if (entry_type === 'performance_session') {
      pageProperties = {
        'Name': {
          title: [{ text: { content: `Performance: ${data.session_title || 'Live Session'}` } }]
        },
        'Type': {
          select: { name: 'Performance' }
        },
        'Duration': {
          number: data.duration_minutes || null
        },
        'Viewers': {
          number: data.viewer_count || 0
        },
        'Reactions': {
          number: data.total_reactions || 0
        },
        'Songs Played': {
          number: data.songs_played || 0
        },
        'Timestamp': {
          date: { start: data.timestamp }
        },
      };
    }

    // Create page in Notion
    const notionResponse = await fetch('https://api.notion.com/v1/pages', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${notionToken}`,
        'Content-Type': 'application/json',
        'Notion-Version': '2022-06-28',
      },
      body: JSON.stringify({
        parent: { database_id: databaseId },
        properties: pageProperties,
      }),
    });

    if (!notionResponse.ok) {
      const errorText = await notionResponse.text();
      console.error('Notion API Error:', errorText);
      throw new Error(`Notion API failed: ${notionResponse.status} - ${errorText}`);
    }

    const notionPage = await notionResponse.json();

    return Response.json({
      success: true,
      notion_page_id: notionPage.id,
      notion_url: notionPage.url,
      message: 'Logged to Notion successfully',
    });

  } catch (error) {
    console.error('Notion Logging Error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});

async function findOrCreateTrainingDatabase(notionToken) {
  // Search for existing database
  const searchResponse = await fetch('https://api.notion.com/v1/search', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${notionToken}`,
      'Content-Type': 'application/json',
      'Notion-Version': '2022-06-28',
    },
    body: JSON.stringify({
      query: 'VFX AI Training Data',
      filter: { property: 'object', value: 'database' },
    }),
  });

  const searchData = await searchResponse.json();
  
  if (searchData.results && searchData.results.length > 0) {
    return searchData.results[0].id;
  }

  // If no database exists, create one
  // Note: This requires a parent page ID, which we get from the first available page
  const pagesResponse = await fetch('https://api.notion.com/v1/search', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${notionToken}`,
      'Content-Type': 'application/json',
      'Notion-Version': '2022-06-28',
    },
    body: JSON.stringify({
      filter: { property: 'object', value: 'page' },
      page_size: 1,
    }),
  });

  const pagesData = await pagesResponse.json();
  
  if (!pagesData.results || pagesData.results.length === 0) {
    throw new Error('No Notion pages found. Please create at least one page in your Notion workspace.');
  }

  const parentPageId = pagesData.results[0].id;

  // Create the database
  const createDbResponse = await fetch('https://api.notion.com/v1/databases', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${notionToken}`,
      'Content-Type': 'application/json',
      'Notion-Version': '2022-06-28',
    },
    body: JSON.stringify({
      parent: { page_id: parentPageId },
      title: [{ text: { content: 'VFX AI Training Data' } }],
      properties: {
        'Name': { title: {} },
        'Type': { 
          select: { 
            options: [
              { name: 'AI Feedback', color: 'blue' },
              { name: 'Visual Generation', color: 'purple' },
              { name: 'Performance', color: 'green' },
            ]
          } 
        },
        'Feedback': { 
          select: { 
            options: [
              { name: 'Accepted', color: 'green' },
              { name: 'Rejected', color: 'red' },
            ]
          } 
        },
        'Urgency': { 
          select: { 
            options: [
              { name: 'low', color: 'gray' },
              { name: 'medium', color: 'yellow' },
              { name: 'high', color: 'orange' },
              { name: 'critical', color: 'red' },
            ]
          } 
        },
        'Song': { rich_text: {} },
        'Description': { rich_text: {} },
        'Energy': { number: {} },
        'Reactions': { number: {} },
        'Duration': { number: {} },
        'Viewers': { number: {} },
        'Songs Played': { number: {} },
        'Resolution': { 
          select: { 
            options: [
              { name: '1080p', color: 'blue' },
              { name: '4k', color: 'purple' },
            ]
          } 
        },
        'Format': { 
          select: { 
            options: [
              { name: 'image', color: 'blue' },
              { name: 'animation', color: 'purple' },
            ]
          } 
        },
        'Styles': { multi_select: {} },
        'Timestamp': { date: {} },
      },
    }),
  });

  if (!createDbResponse.ok) {
    const errorText = await createDbResponse.text();
    throw new Error(`Failed to create Notion database: ${errorText}`);
  }

  const newDb = await createDbResponse.json();
  return newDb.id;
}

