import { getClient } from './_client.ts';

/**
 * Health Check Endpoint
 * Monitors system status for uptime monitoring
 */
Deno.serve(withSecurity(async (req) => {
  const startTime = Date.now();

  try {
    const base44 = getClient(req);

    const dbTest = await testDatabase(base44);
    const servicesTest = await testServices();
    const responseTime = Date.now() - startTime;

    const health = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      response_time_ms: responseTime,
      checks: {
        database: dbTest,
        services: servicesTest,
        memory: getMemoryUsage()
      }
    };

    const allHealthy = dbTest.status === 'ok' && servicesTest.status === 'ok';

    return Response.json(health, {
      status: allHealthy ? 200 : 503,
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate'
      }
    });
  } catch (error) {
    return Response.json(
      {
        status: 'unhealthy',
        error: error.message,
        timestamp: new Date().toISOString()
      },
      { status: 503 }
    );
  }
});

async function testDatabase(base44) {
  try {
    await base44.entities.User.list({ limit: 1 });
    return { status: 'ok', latency_ms: 0 };
  } catch (error) {
    return { status: 'error', message: error.message };
  }
}

async function testServices() {
  const tests = {
    paypal: await testPayPal()
  };

  const allOk = Object.values(tests).every((t) => t.status === 'ok');

  return {
    status: allOk ? 'ok' : 'degraded',
    details: tests
  };
}

async function testPayPal() {
  try {
    const hasClientId = !!Deno.env.get('PAYPAL_CLIENT_ID');
    const hasClientSecret = !!Deno.env.get('PAYPAL_CLIENT_SECRET');
    return { status: hasClientId && hasClientSecret ? 'ok' : 'not_configured' };
  } catch {
    return { status: 'error' };
  }
}

function getMemoryUsage() {
  if (typeof Deno.memoryUsage === 'function') {
    const usage = Deno.memoryUsage();
    return {
      rss_mb: Math.round(usage.rss / 1024 / 1024),
      heap_used_mb: Math.round(usage.heapUsed / 1024 / 1024)
    };
  }
  return { status: 'unavailable' };
}


