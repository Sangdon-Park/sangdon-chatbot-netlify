// Conversation Context Test - 대화 연속성 테스트
const fetch = require('node-fetch');

const PROD_URL = 'https://sangdon-chatbot.netlify.app/.netlify/functions/chat-ai-driven';

// 대화 세션 테스트 케이스들
const CONVERSATION_TESTS = [
  {
    name: "세미나 문맥 이어지기",
    messages: [
      { query: "AI 세미나에 대해 물어볼 게 있습니다.", expectKeyword: "세미나" },
      { query: "1회당 얼마죠?", expectKeyword: "50만원", contextDependent: true },
      { query: "시간은?", expectKeyword: "1시간 30분", contextDependent: true }
    ]
  },
  {
    name: "고려대 세미나 문맥",
    messages: [
      { query: "고려대에서 뭐 발표했어?", expectKeyword: "고려대" },
      { query: "언제였어?", expectKeyword: ["7월", "8월"], contextDependent: true },
      { query: "몇 번 갔어?", expectKeyword: ["2", "두"], contextDependent: true }
    ]
  },
  {
    name: "논문 문맥 이어지기",
    messages: [
      { query: "황강욱 교수님과 쓴 논문 있어?", expectKeyword: "황강욱" },
      { query: "몇 편이야?", expectKeyword: ["편"], contextDependent: true },
      { query: "최근 거는 뭐야?", expectKeyword: ["2"], contextDependent: true }
    ]
  },
  {
    name: "개수 질문 문맥 구분",
    messages: [
      { query: "세미나 몇 번 했어?", expectKeyword: "13", shouldNotHave: "25" },
      { query: "논문은?", expectKeyword: "25", shouldNotHave: "13", contextDependent: true },
      { query: "더 많은 건 뭐야?", expectKeyword: ["논문", "25"], contextDependent: true }
    ]
  },
  {
    name: "비용 문맥",
    messages: [
      { query: "KAIST 세미나 했어?", expectKeyword: "KAIST" },
      { query: "얼마 받았어?", expectKeyword: "50만원", contextDependent: true },
      { query: "다른 곳도 같아?", expectKeyword: ["같", "동일", "50만원"], contextDependent: true }
    ]
  }
];

async function sendMessage(message, history = [], previousResponse = null) {
  try {
    // Step 1: Intent classification
    const step1Res = await fetch(PROD_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        message, 
        step: 1,
        history 
      })
    });
    const step1Data = await step1Res.json();
    
    // Step 2: Search and response (if needed)
    if (step1Data.action === 'SEARCH') {
      const step2Res = await fetch(PROD_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message,
          step: 2,
          action: step1Data.action,
          query: step1Data.query || message,
          history
        })
      });
      const step2Data = await step2Res.json();
      return {
        reply: step2Data.reply || '',
        searchResults: step2Data.searchResults || []
      };
    } else {
      return {
        reply: step1Data.initialMessage || '',
        searchResults: []
      };
    }
  } catch (error) {
    console.error('Error:', error);
    return { reply: '', searchResults: [], error: error.message };
  }
}

async function testConversation(test) {
  console.log(`\n${'='.repeat(60)}`);
  console.log(`🗣️ 테스트: ${test.name}`);
  console.log(`${'='.repeat(60)}`);
  
  const history = [];
  const results = [];
  let allPassed = true;
  
  for (let i = 0; i < test.messages.length; i++) {
    const msg = test.messages[i];
    console.log(`\n📤 메시지 ${i+1}: "${msg.query}"`);
    
    // Send message with history
    const response = await sendMessage(msg.query, history);
    
    // Check response
    const issues = [];
    
    if (response.error) {
      issues.push(`❌ Error: ${response.error}`);
    } else {
      // Check for expected keywords
      if (msg.expectKeyword) {
        const keywords = Array.isArray(msg.expectKeyword) ? msg.expectKeyword : [msg.expectKeyword];
        let foundAny = false;
        for (const keyword of keywords) {
          if (response.reply.toLowerCase().includes(keyword.toString().toLowerCase())) {
            foundAny = true;
            break;
          }
        }
        if (!foundAny) {
          issues.push(`❌ Expected keyword missing: ${keywords.join(' or ')}`);
        }
      }
      
      // Check for unexpected keywords
      if (msg.shouldNotHave) {
        const badKeywords = Array.isArray(msg.shouldNotHave) ? msg.shouldNotHave : [msg.shouldNotHave];
        for (const keyword of badKeywords) {
          if (response.reply.toLowerCase().includes(keyword.toString().toLowerCase())) {
            issues.push(`❌ Unexpected keyword found: ${keyword}`);
          }
        }
      }
      
      // Check if context-dependent message works without context
      if (msg.contextDependent && history.length === 0) {
        issues.push(`⚠️ Warning: Context-dependent message but no history`);
      }
    }
    
    // Display response
    console.log(`📥 응답: ${response.reply.substring(0, 150)}${response.reply.length > 150 ? '...' : ''}`);
    
    // Show issues
    if (issues.length > 0) {
      console.log(`❌ Issues:`);
      issues.forEach(issue => console.log(`   ${issue}`));
      allPassed = false;
    } else {
      console.log(`✅ Pass`);
    }
    
    // Update history for next message
    history.push({ role: 'user', content: msg.query });
    history.push({ role: 'assistant', content: response.reply });
    
    // Store result
    results.push({
      message: msg.query,
      reply: response.reply,
      passed: issues.length === 0,
      issues
    });
    
    // Wait between messages
    await new Promise(r => setTimeout(r, 1500));
  }
  
  return {
    name: test.name,
    passed: allPassed,
    results
  };
}

async function runAllTests() {
  console.log('🔄 대화 연속성 테스트 시작');
  console.log('Testing conversation context preservation...\n');
  
  const allResults = [];
  
  for (const test of CONVERSATION_TESTS) {
    const result = await testConversation(test);
    allResults.push(result);
    await new Promise(r => setTimeout(r, 2000)); // Wait between test sessions
  }
  
  // Summary
  console.log(`\n${'='.repeat(60)}`);
  console.log('📊 테스트 결과 요약');
  console.log(`${'='.repeat(60)}`);
  
  const passed = allResults.filter(r => r.passed).length;
  const total = allResults.length;
  
  console.log(`\n✅ 통과: ${passed}/${total} 세션`);
  
  if (passed < total) {
    console.log('\n실패한 세션:');
    allResults.filter(r => !r.passed).forEach(r => {
      console.log(`  ❌ ${r.name}`);
      r.results.filter(m => !m.passed).forEach(m => {
        console.log(`     - "${m.message}": ${m.issues.join(', ')}`);
      });
    });
  }
  
  // Check specific context preservation
  console.log('\n📝 문맥 보존 분석:');
  let contextTests = 0;
  let contextPassed = 0;
  
  allResults.forEach(session => {
    session.results.forEach((result, idx) => {
      const testMsg = CONVERSATION_TESTS.find(t => t.name === session.name).messages[idx];
      if (testMsg.contextDependent) {
        contextTests++;
        if (result.passed) contextPassed++;
      }
    });
  });
  
  console.log(`문맥 의존 메시지: ${contextPassed}/${contextTests} 통과`);
  
  if (contextPassed === contextTests) {
    console.log('✅ 모든 문맥 의존 메시지가 정상 작동합니다!');
  } else {
    console.log('❌ 일부 문맥 의존 메시지가 실패했습니다. 대화 기록이 제대로 전달되지 않을 수 있습니다.');
  }
  
  return {
    sessions: allResults,
    summary: {
      passed,
      total,
      contextPassed,
      contextTotal: contextTests,
      successRate: (passed / total * 100).toFixed(1)
    }
  };
}

// Run the tests
runAllTests()
  .then(results => {
    console.log(`\n🎯 전체 성공률: ${results.summary.successRate}%`);
    console.log(`📝 문맥 보존율: ${(results.summary.contextPassed / results.summary.contextTotal * 100).toFixed(1)}%`);
    
    if (results.summary.contextPassed < results.summary.contextTotal) {
      console.log('\n⚠️ 경고: 대화 문맥이 제대로 유지되지 않고 있습니다!');
      process.exit(1);
    }
  })
  .catch(console.error);