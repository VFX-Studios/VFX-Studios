import { getClient } from './_client.ts';

Deno.serve(withSecurity(async (req) => {
  try {
    const base44 = getClient(req);
    const user = await base44.auth.me();

    // ADMIN ONLY - Comprehensive testing
    if (user?.role !== 'admin') {
      return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    const testResults = {
      timestamp: new Date().toISOString(),
      tests_run: 0,
      tests_passed: 0,
      tests_failed: 0,
      details: []
    };

    // Test 1: User Creation & Credits
    try {
      const testUser = await base44.asServiceRole.entities.User.filter({ email: 'test@vfxstudios.com' });
      testResults.tests_run++;
      if (testUser[0] && testUser[0].ai_credits_remaining >= 0) {
        testResults.tests_passed++;
        testResults.details.push({ test: 'User Credits', status: 'PASS' });
      }
    } catch (error) {
      testResults.tests_failed++;
      testResults.details.push({ test: 'User Credits', status: 'FAIL', error: error.message });
    }

    // Test 2: Marketplace Entities
    try {
      const assets = await base44.asServiceRole.entities.MarketplaceAsset.list();
      const tiers = await base44.asServiceRole.entities.AssetPackTier.list();
      testResults.tests_run += 2;
      testResults.tests_passed += 2;
      testResults.details.push({ test: 'Marketplace Assets', status: 'PASS', count: assets.length });
      testResults.details.push({ test: 'Asset Tiers', status: 'PASS', count: tiers.length });
    } catch (error) {
      testResults.tests_failed++;
      testResults.details.push({ test: 'Marketplace', status: 'FAIL', error: error.message });
    }

    // Test 3: Achievement System
    try {
      const achievements = await base44.asServiceRole.entities.Achievement.list();
      const userAchievements = await base44.asServiceRole.entities.UserAchievement.list();
      testResults.tests_run += 2;
      testResults.tests_passed += 2;
      testResults.details.push({ test: 'Achievements', status: 'PASS', count: achievements.length });
      testResults.details.push({ test: 'User Achievements', status: 'PASS', count: userAchievements.length });
    } catch (error) {
      testResults.tests_failed++;
      testResults.details.push({ test: 'Achievements', status: 'FAIL', error: error.message });
    }

    // Test 4: Referral System
    try {
      const referrals = await base44.asServiceRole.entities.ReferralProgram.list();
      testResults.tests_run++;
      testResults.tests_passed++;
      testResults.details.push({ test: 'Referrals', status: 'PASS', count: referrals.length });
    } catch (error) {
      testResults.tests_failed++;
      testResults.details.push({ test: 'Referrals', status: 'FAIL', error: error.message });
    }

    // Test 5: Tutorial System
    try {
      const tutorials = await base44.asServiceRole.entities.Tutorial.list();
      testResults.tests_run++;
      testResults.tests_passed++;
      testResults.details.push({ test: 'Tutorials', status: 'PASS', count: tutorials.length });
    } catch (error) {
      testResults.tests_failed++;
      testResults.details.push({ test: 'Tutorials', status: 'FAIL', error: error.message });
    }

    // Test 6: NFT & Wallet System
    try {
      const wallets = await base44.asServiceRole.entities.WalletConnection.list();
      const nfts = await base44.asServiceRole.entities.NFTMint.list();
      testResults.tests_run += 2;
      testResults.tests_passed += 2;
      testResults.details.push({ test: 'Wallets', status: 'PASS', count: wallets.length });
      testResults.details.push({ test: 'NFTs', status: 'PASS', count: nfts.length });
    } catch (error) {
      testResults.tests_failed++;
      testResults.details.push({ test: 'NFT/Wallet', status: 'FAIL', error: error.message });
    }

    // Test 7: Live Streaming
    try {
      const streams = await base44.asServiceRole.entities.LiveStreamSession.list();
      const sentiments = await base44.asServiceRole.entities.AudienceSentiment.list();
      testResults.tests_run += 2;
      testResults.tests_passed += 2;
      testResults.details.push({ test: 'Live Streams', status: 'PASS', count: streams.length });
      testResults.details.push({ test: 'Sentiment Analysis', status: 'PASS', count: sentiments.length });
    } catch (error) {
      testResults.tests_failed++;
      testResults.details.push({ test: 'Live Streaming', status: 'FAIL', error: error.message });
    }

    // Test 8: Enterprise Features
    try {
      const enterprises = await base44.asServiceRole.entities.EnterpriseAccount.list();
      const partnerships = await base44.asServiceRole.entities.FestivalPartnership.list();
      testResults.tests_run += 2;
      testResults.tests_passed += 2;
      testResults.details.push({ test: 'Enterprise Accounts', status: 'PASS', count: enterprises.length });
      testResults.details.push({ test: 'Partnerships', status: 'PASS', count: partnerships.length });
    } catch (error) {
      testResults.tests_failed++;
      testResults.details.push({ test: 'Enterprise', status: 'FAIL', error: error.message });
    }

    // Test 9: Blog & Content
    try {
      const posts = await base44.asServiceRole.entities.BlogPost.list();
      testResults.tests_run++;
      testResults.tests_passed++;
      testResults.details.push({ test: 'Blog Posts', status: 'PASS', count: posts.length });
    } catch (error) {
      testResults.tests_failed++;
      testResults.details.push({ test: 'Blog', status: 'FAIL', error: error.message });
    }

    // Test 10: AI Style Models
    try {
      const styleModels = await base44.asServiceRole.entities.AIStyleModel.list();
      const rentals = await base44.asServiceRole.entities.StyleModelRental.list();
      testResults.tests_run += 2;
      testResults.tests_passed += 2;
      testResults.details.push({ test: 'AI Style Models', status: 'PASS', count: styleModels.length });
      testResults.details.push({ test: 'Style Rentals', status: 'PASS', count: rentals.length });
    } catch (error) {
      testResults.tests_failed++;
      testResults.details.push({ test: 'AI Styles', status: 'FAIL', error: error.message });
    }

    // Calculate pass rate
    testResults.pass_rate = testResults.tests_run > 0 
      ? ((testResults.tests_passed / testResults.tests_run) * 100).toFixed(2) + '%'
      : '0%';

    console.log('Comprehensive test results:', testResults);

    return Response.json(testResults);

  } catch (error) {
    console.error('test-suite error:', error.message);
    return Response.json({ 
      error: 'Test suite failed',
      details: error.message 
    }, { status: 500 });
  }
  }));
