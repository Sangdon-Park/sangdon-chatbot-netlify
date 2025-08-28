// 🔥 HARDCORE TEST SUITE - 빡센 테스트
const fetch = require('node-fetch');
const fs = require('fs');

const BASE_URL = 'https://sangdon-chatbot.netlify.app/.netlify/functions/chat-ai-driven';

// Test configuration
const CONFIG = {
  timeout: 15000,
  retryOnTimeout: true,
  maxRetries: 2,
  delayBetweenTests: 1000
};

// Enhanced chat function with retry logic
async function chat(message, history = [], retryCount = 0) {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), CONFIG.timeout);
    
    const response1 = await fetch(BASE_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message, history, step: 1 }),
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);
    
    if (!response1.ok) {
      throw new Error(`Step 1 failed: ${response1.status}`);
    }
    
    const data1 = await response1.json();
    
    if (data1.needsSecondStep) {
      const controller2 = new AbortController();
      const timeoutId2 = setTimeout(() => controller2.abort(), CONFIG.timeout);
      
      const response2 = await fetch(BASE_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message, history, step: 2,
          action: data1.action, query: data1.query
        }),
        signal: controller2.signal
      });
      
      clearTimeout(timeoutId2);
      
      if (!response2.ok) {
        throw new Error(`Step 2 failed: ${response2.status}`);
      }
      
      const data2 = await response2.json();
      return data2.reply || 'NO_REPLY';
    }
    
    return data1.initialMessage || 'NO_REPLY';
  } catch (error) {
    if (error.name === 'AbortError' && retryCount < CONFIG.maxRetries && CONFIG.retryOnTimeout) {
      console.log(`  ⏱️ Timeout, retry ${retryCount + 1}/${CONFIG.maxRetries}...`);
      await new Promise(r => setTimeout(r, 2000));
      return chat(message, history, retryCount + 1);
    }
    console.error(`  ❌ Error: ${error.message}`);
    return null;
  }
}

// Test validator with strict checking
function validateResponse(response, requirements) {
  const results = {
    passed: true,
    errors: [],
    warnings: []
  };
  
  if (!response) {
    results.passed = false;
    results.errors.push('No response received');
    return results;
  }
  
  const respLower = response.toLowerCase();
  
  // Check required keywords
  if (requirements.must) {
    for (const keyword of requirements.must) {
      if (!respLower.includes(keyword.toLowerCase())) {
        results.passed = false;
        results.errors.push(`Missing required: "${keyword}"`);
      }
    }
  }
  
  // Check forbidden keywords
  if (requirements.mustNot) {
    for (const keyword of requirements.mustNot) {
      if (respLower.includes(keyword.toLowerCase())) {
        results.passed = false;
        results.errors.push(`Contains forbidden: "${keyword}"`);
      }
    }
  }
  
  // Check exact match requirements
  if (requirements.exact) {
    if (response.trim() !== requirements.exact) {
      results.passed = false;
      results.errors.push(`Not exact match. Expected: "${requirements.exact}"`);
    }
  }
  
  // Check pattern matching
  if (requirements.pattern) {
    const regex = new RegExp(requirements.pattern, 'i');
    if (!regex.test(response)) {
      results.passed = false;
      results.errors.push(`Pattern not matched: ${requirements.pattern}`);
    }
  }
  
  // Check response length
  if (requirements.maxLength && response.length > requirements.maxLength) {
    results.warnings.push(`Response too long: ${response.length} > ${requirements.maxLength}`);
  }
  
  if (requirements.minLength && response.length < requirements.minLength) {
    results.passed = false;
    results.errors.push(`Response too short: ${response.length} < ${requirements.minLength}`);
  }
  
  return results;
}

// Test categories with rigorous cases
const TEST_SUITES = {
  // 1. 핵심 정보 정확성
  critical_accuracy: {
    name: '🎯 핵심 정보 정확성',
    tests: [
      {
        q: '세미나 몇 번?',
        must: ['13'],
        mustNot: ['25'],
        critical: true
      },
      {
        q: '논문 몇 편?',
        must: ['25'],
        mustNot: ['13'],
        critical: true
      },
      {
        q: '세미나 비용?',
        must: ['50만원'],
        critical: true
      },
      {
        q: '연락처?',
        must: ['chaos@sayberrygames.com'],
        critical: true
      },
      {
        q: '세미나 총 몇 회 진행?',
        must: ['13'],
        mustNot: ['25'],
        critical: true
      },
      {
        q: '국제저널 논문 개수?',
        must: ['25'],
        mustNot: ['13'],
        critical: true
      }
    ]
  },
  
  // 2. 복합 질문 처리
  compound_questions: {
    name: '🔀 복합 질문 처리',
    tests: [
      {
        q: '세미나 얼마고 몇 번 했어?',
        must: ['50만원', '13'],
        mustNot: ['25']
      },
      {
        q: '논문은 몇 편이고 세미나는 몇 번?',
        must: ['25', '13']
      },
      {
        q: '비용이랑 연락처 알려줘',
        must: ['50만원', 'chaos@sayberrygames.com']
      },
      {
        q: '가격하고 시간은?',
        must: ['50만원', '시간']
      },
      {
        q: '세미나 13회 논문 25편 맞지?',
        must: ['13', '25', '맞'],
        pattern: '(네|예|맞)'
      },
      {
        q: '얼마고 어디로 연락하고 몇시간이야?',
        must: ['50만원', 'chaos@sayberrygames.com', '시간']
      }
    ]
  },
  
  // 3. 확인 질문
  confirmation_questions: {
    name: '✅ 확인 질문 처리',
    tests: [
      {
        q: '세미나 13회 맞아?',
        must: ['13'],
        pattern: '^(네|예|맞)',
        critical: true
      },
      {
        q: '논문 25편 맞죠?',
        must: ['25'],
        pattern: '^(네|예|맞)',
        critical: true
      },
      {
        q: '시간당 50만원 맞지?',
        must: ['50만원'],
        pattern: '^(네|예|맞)'
      },
      {
        q: '고려대 7월 맞나?',
        must: ['7월'],
        pattern: '(네|예|맞)'
      },
      {
        q: 'chaos@sayberrygames.com 맞습니까?',
        must: ['chaos@sayberrygames.com'],
        pattern: '(네|예|맞)'
      }
    ]
  },
  
  // 4. 짧은 문맥 의존 질문
  context_dependent: {
    name: '💭 문맥 의존 질문',
    tests: [
      {
        context: [
          { role: 'user', content: 'AI 세미나에 대해 알려줘' },
          { role: 'assistant', content: 'AI 기초부터 LLM까지 다룹니다.' }
        ],
        q: '얼마야?',
        must: ['50만원']
      },
      {
        context: [
          { role: 'user', content: '세미나 했어?' },
          { role: 'assistant', content: '네, 13회 진행했습니다.' }
        ],
        q: '비용은?',
        must: ['50만원']
      },
      {
        context: [
          { role: 'user', content: '고려대 세미나?' },
          { role: 'assistant', content: '네, 고려대에서 세미나했습니다.' }
        ],
        q: '언제?',
        must: ['7월'],
        mustNot: ['2025', '2024']
      }
    ]
  },
  
  // 5. 오타 및 변형
  typos_variations: {
    name: '🔤 오타/변형 처리',
    tests: [
      {
        q: '쎄미나 비용',
        must: ['50만원']
      },
      {
        q: '논문몇편',
        must: ['25']
      },
      {
        q: '연락처좀',
        must: ['chaos@sayberrygames.com']
      },
      {
        q: 'seminar how many?',
        must: ['13']
      },
      {
        q: 'contact email?',
        must: ['chaos@sayberrygames.com']
      }
    ]
  },
  
  // 6. 엣지 케이스
  edge_cases: {
    name: '⚡ 엣지 케이스',
    tests: [
      {
        q: '?',
        minLength: 5
      },
      {
        q: '얼마',
        must: ['50만원']
      },
      {
        q: '몇',
        minLength: 5
      },
      {
        q: '경상국립대 8월 25일인데 25편 아니야?',
        must: ['8월', '25일'],
        mustNot: ['네', '맞']
      },
      {
        q: '13 25',
        minLength: 10
      }
    ]
  },
  
  // 7. 학력/프로필
  profile_questions: {
    name: '👨‍🎓 학력/프로필',
    tests: [
      {
        q: '어디 졸업?',
        must: ['KAIST']
      },
      {
        q: '학력이 어떻게 되나요?',
        must: ['KAIST', '박사']
      },
      {
        q: '박사 어디서?',
        must: ['KAIST']
      },
      {
        q: '전공?',
        must: ['전기', '전자', '수리']
      }
    ]
  },
  
  // 8. 스트레스 테스트
  stress_test: {
    name: '🔥 스트레스 테스트',
    tests: [
      {
        q: '세미나 13회 맞고 논문 25편 맞고 비용 50만원 맞고 시간 1-2시간 맞아?',
        must: ['13', '25', '50만원', '1-2시간'],
        pattern: '(네|예|맞)'
      },
      {
        q: '!!!!!!',
        minLength: 5
      },
      {
        q: '세미나세미나세미나세미나',
        must: ['세미나', '13']
      },
      {
        q: '25 25 25 25',
        must: ['25', '논문']
      }
    ]
  }
};

// Main test runner
async function runTestSuite() {
  console.log('🔥🔥🔥 HARDCORE TEST SUITE 🔥🔥🔥');
  console.log('=' .repeat(70));
  console.log('빡센 테스트 시작... 모든 케이스를 엄격하게 검증합니다.\n');
  
  const results = {
    total: 0,
    passed: 0,
    failed: 0,
    critical_failed: 0,
    suites: {}
  };
  
  const startTime = Date.now();
  
  for (const [suiteKey, suite] of Object.entries(TEST_SUITES)) {
    console.log(`\n${suite.name}`);
    console.log('-'.repeat(60));
    
    const suiteResults = {
      total: 0,
      passed: 0,
      failed: 0,
      details: []
    };
    
    for (const test of suite.tests) {
      results.total++;
      suiteResults.total++;
      
      // Handle context-dependent tests
      const history = test.context || [];
      const question = test.q;
      
      process.stdout.write(`  Q: "${question.substring(0, 40)}${question.length > 40 ? '...' : ''}" `);
      
      const response = await chat(question, history);
      const validation = validateResponse(response, test);
      
      if (validation.passed) {
        console.log('✅');
        results.passed++;
        suiteResults.passed++;
      } else {
        console.log('❌');
        results.failed++;
        suiteResults.failed++;
        
        if (test.critical) {
          results.critical_failed++;
          console.log(`     🚨 CRITICAL FAILURE!`);
        }
        
        for (const error of validation.errors) {
          console.log(`     └─ ${error}`);
        }
        
        if (response) {
          console.log(`     Response: "${response.substring(0, 100)}..."`);
        }
      }
      
      for (const warning of validation.warnings) {
        console.log(`     ⚠️ ${warning}`);
      }
      
      suiteResults.details.push({
        question,
        response,
        validation,
        critical: test.critical
      });
      
      // Delay between tests to avoid rate limiting
      await new Promise(r => setTimeout(r, CONFIG.delayBetweenTests));
    }
    
    const suitePassRate = Math.round((suiteResults.passed / suiteResults.total) * 100);
    console.log(`  📊 Suite Result: ${suiteResults.passed}/${suiteResults.total} (${suitePassRate}%)`);
    
    results.suites[suiteKey] = suiteResults;
  }
  
  const duration = Math.round((Date.now() - startTime) / 1000);
  
  // Final report
  console.log('\n' + '='.repeat(70));
  console.log('📈 FINAL HARDCORE TEST RESULTS');
  console.log('='.repeat(70));
  
  const passRate = Math.round((results.passed / results.total) * 100);
  
  console.log(`Total Tests: ${results.total}`);
  console.log(`Passed: ${results.passed} ✅`);
  console.log(`Failed: ${results.failed} ❌`);
  console.log(`Critical Failures: ${results.critical_failed} 🚨`);
  console.log(`Overall Pass Rate: ${passRate}%`);
  console.log(`Test Duration: ${duration}s`);
  
  console.log('\nSuite Performance:');
  for (const [key, suite] of Object.entries(results.suites)) {
    const rate = Math.round((suite.passed / suite.total) * 100);
    const emoji = rate >= 90 ? '🏆' : rate >= 70 ? '✨' : rate >= 50 ? '⚠️' : '💀';
    console.log(`  ${emoji} ${TEST_SUITES[key].name}: ${rate}%`);
  }
  
  // Performance assessment
  console.log('\n' + '='.repeat(70));
  if (passRate >= 95 && results.critical_failed === 0) {
    console.log('🏆🏆🏆 EXCELLENT! Production Ready! 🏆🏆🏆');
  } else if (passRate >= 90 && results.critical_failed === 0) {
    console.log('🎉 GREAT! Almost there!');
  } else if (passRate >= 80) {
    console.log('✨ Good progress, but needs improvement');
  } else if (passRate >= 70) {
    console.log('⚠️ Significant issues remain');
  } else {
    console.log('💀 Major problems detected - needs serious work');
  }
  
  if (results.critical_failed > 0) {
    console.log(`\n🚨🚨🚨 WARNING: ${results.critical_failed} CRITICAL TESTS FAILED! 🚨🚨🚨`);
    console.log('These MUST be fixed before deployment!');
  }
  
  // Save detailed results
  const detailedResults = {
    timestamp: new Date().toISOString(),
    summary: {
      total: results.total,
      passed: results.passed,
      failed: results.failed,
      critical_failed: results.critical_failed,
      pass_rate: passRate,
      duration_seconds: duration
    },
    suites: results.suites,
    config: CONFIG
  };
  
  fs.writeFileSync('hardcore-test-results.json', JSON.stringify(detailedResults, null, 2));
  console.log('\n📁 Detailed results saved to: hardcore-test-results.json');
  
  // Return exit code based on results
  if (passRate < 70 || results.critical_failed > 0) {
    process.exit(1);
  }
}

// Run tests
console.log('🚀 Starting Hardcore Test Suite...\n');
runTestSuite().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});