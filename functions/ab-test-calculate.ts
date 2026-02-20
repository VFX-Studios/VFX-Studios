import { getClient } from './_client.ts';

/**
 * Advanced A/B Test Statistical Analysis
 * Implements Chi-Square test for statistical significance
 */
Deno.serve(withSecurity(async (req) => {
  try {
    const base44 = getClient(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { test_id } = await req.json();

    if (!test_id) {
      return Response.json({ error: 'test_id required' }, { status: 400 });
    }

    // Fetch test data
    const tests = await base44.entities.ABTest.filter({ id: test_id });
    const test = tests[0];

    if (!test) {
      return Response.json({ error: 'Test not found' }, { status: 404 });
    }

    // Calculate conversion rates
    const rateA = test.variant_a_impressions > 0 
      ? test.variant_a_conversions / test.variant_a_impressions 
      : 0;
    
    const rateB = test.variant_b_impressions > 0 
      ? test.variant_b_conversions / test.variant_b_impressions 
      : 0;

    // Check minimum sample size
    const totalImpressions = test.variant_a_impressions + test.variant_b_impressions;
    if (totalImpressions < test.min_sample_size) {
      return Response.json({
        success: true,
        status: 'insufficient_data',
        message: `Need ${test.min_sample_size - totalImpressions} more impressions`,
        test: {
          ...test,
          conversion_rate_a: rateA,
          conversion_rate_b: rateB,
          lift: rateB - rateA
        }
      });
    }

    // Chi-Square Test for Statistical Significance
    const { pValue, chiSquare, confidenceLevel } = calculateChiSquare(
      test.variant_a_conversions,
      test.variant_a_impressions - test.variant_a_conversions,
      test.variant_b_conversions,
      test.variant_b_impressions - test.variant_b_conversions
    );

    // Determine winner (95% confidence threshold)
    let winner = 'inconclusive';
    if (pValue < 0.05) {
      winner = rateB > rateA ? 'B' : 'A';
    }

    // Update test with results
    const updatedTest = await base44.entities.ABTest.update(test_id, {
      p_value: pValue,
      confidence_level: confidenceLevel,
      winner: winner,
      status: winner !== 'inconclusive' ? 'completed' : 'running'
    });

    return Response.json({
      success: true,
      test: updatedTest,
      analysis: {
        conversion_rate_a: rateA,
        conversion_rate_b: rateB,
        lift_percentage: ((rateB - rateA) / rateA) * 100,
        p_value: pValue,
        chi_square: chiSquare,
        confidence_level: confidenceLevel,
        is_significant: pValue < 0.05,
        winner: winner,
        recommendation: winner === 'B' 
          ? `Variant B performs ${(((rateB - rateA) / rateA) * 100).toFixed(1)}% better. Deploy it!`
          : winner === 'A'
          ? 'Keep using Variant A'
          : 'Continue test - no clear winner yet'
      }
    });

  } catch (error) {
    console.error('[A/B Test] Error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});

/**
 * Chi-Square Test Implementation
 * Returns p-value and confidence level
 */
function calculateChiSquare(aSuccess, aFailure, bSuccess, bFailure) {
  const n1 = aSuccess + aFailure;
  const n2 = bSuccess + bFailure;
  const n = n1 + n2;
  
  const p1 = aSuccess / n1;
  const p2 = bSuccess / n2;
  const pPooled = (aSuccess + bSuccess) / n;
  
  // Expected values
  const expected1Success = n1 * pPooled;
  const expected1Failure = n1 * (1 - pPooled);
  const expected2Success = n2 * pPooled;
  const expected2Failure = n2 * (1 - pPooled);
  
  // Chi-square statistic
  const chiSquare = 
    Math.pow(aSuccess - expected1Success, 2) / expected1Success +
    Math.pow(aFailure - expected1Failure, 2) / expected1Failure +
    Math.pow(bSuccess - expected2Success, 2) / expected2Success +
    Math.pow(bFailure - expected2Failure, 2) / expected2Failure;
  
  // Calculate p-value (approximation using chi-square distribution)
  const pValue = chiSquarePValue(chiSquare, 1); // 1 degree of freedom
  
  const confidenceLevel = 1 - pValue;
  
  return { pValue, chiSquare, confidenceLevel };
}

/**
 * Chi-Square p-value approximation
 */
function chiSquarePValue(x, df) {
  // Simplified approximation for df=1
  if (df !== 1) return 0.5;
  
  // Using complementary error function approximation
  const z = Math.sqrt(x);
  return 2 * (1 - normalCDF(z));
}

/**
 * Normal cumulative distribution function
 */
function normalCDF(x) {
  const t = 1 / (1 + 0.2316419 * Math.abs(x));
  const d = 0.3989423 * Math.exp(-x * x / 2);
  const prob = d * t * (0.3193815 + t * (-0.3565638 + t * (1.781478 + t * (-1.821256 + t * 1.330274))));
  return x > 0 ? 1 - prob : prob;
}

