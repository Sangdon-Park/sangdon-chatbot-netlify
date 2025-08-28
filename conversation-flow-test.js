// 🗣️ CONVERSATION FLOW TEST - 실제 대화 흐름 테스트
const fetch = require('node-fetch');
const fs = require('fs');

const BASE_URL = 'https://sangdon-chatbot.netlify.app/.netlify/functions/chat-ai-driven';

// Chat function with history
async function chat(message, history = []) {
  try {
    const response1 = await fetch(BASE_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message, history, step: 1 }),
      timeout: 12000
    });
    
    if (!response1.ok) return null;
    const data1 = await response1.json();
    
    if (data1.needsSecondStep) {
      const response2 = await fetch(BASE_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message, history, step: 2,
          action: data1.action, query: data1.query
        }),
        timeout: 12000
      });
      
      if (!response2.ok) return null;
      const data2 = await response2.json();
      return data2.reply;
    }
    
    return data1.initialMessage;
  } catch (error) {
    return null;
  }
}

// Conversation scenarios
const CONVERSATION_FLOWS = [
  {
    name: '🏢 기업 담당자의 세미나 문의',
    scenario: 'Corporate seminar inquiry',
    conversations: [
      {
        user: 'AI 세미나 관련해서 문의드립니다.',
        expectedKeywords: ['AI', '세미나'],
        analysis: 'Initial inquiry acknowledgment'
      },
      {
        user: '비용이 어떻게 되나요?',
        expectedKeywords: ['50만원', '시간당'],
        analysis: 'Price inquiry - must include 50만원'
      },
      {
        user: '총 몇 시간 진행되나요?',
        expectedKeywords: ['1', '2', '시간'],
        analysis: 'Duration inquiry'
      },
      {
        user: '그럼 최대 비용이 얼마인가요?',
        expectedKeywords: ['100만원', '2시간'],
        analysis: 'Total cost calculation'
      },
      {
        user: '신청은 어떻게 하나요?',
        expectedKeywords: ['chaos@sayberrygames.com'],
        analysis: 'Application method - must include email'
      },
      {
        user: '이전에 어디서 세미나 하셨나요?',
        expectedKeywords: ['KAIST', '고려대', '경희대'],
        analysis: 'Previous seminar venues'
      },
      {
        user: '총 몇 번 하셨어요?',
        expectedKeywords: ['13'],
        mustNotInclude: ['25'],
        analysis: 'Seminar count - must be 13, not 25'
      }
    ]
  },
  
  {
    name: '👨‍🎓 대학원생의 연구 문의',
    scenario: 'Graduate student research inquiry',
    conversations: [
      {
        user: '박상돈 박사님이신가요?',
        expectedKeywords: ['네', '박상돈'],
        analysis: 'Identity confirmation'
      },
      {
        user: '어디서 박사 받으셨나요?',
        expectedKeywords: ['KAIST', '전기', '전자'],
        analysis: 'PhD information'
      },
      {
        user: '논문 몇 편 쓰셨어요?',
        expectedKeywords: ['25'],
        mustNotInclude: ['13'],
        analysis: 'Paper count - must be 25, not 13'
      },
      {
        user: '주로 어떤 주제로 연구하시나요?',
        expectedKeywords: ['엣지', 'IoT', '에너지'],
        analysis: 'Research topics'
      },
      {
        user: '최준균 교수님과도 같이 연구하셨나요?',
        expectedKeywords: ['최준균', '네', '함께'],
        analysis: 'Collaboration confirmation'
      },
      {
        user: '몇 편 같이 쓰셨어요?',
        expectedKeywords: ['14', '편'],
        analysis: 'Collaboration paper count'
      }
    ]
  },
  
  {
    name: '💼 HR 담당자의 경력 확인',
    scenario: 'HR verification of credentials',
    conversations: [
      {
        user: '현재 어디서 일하고 계신가요?',
        expectedKeywords: ['세이베리', 'AI', '연구'],
        analysis: 'Current position'
      },
      {
        user: '학력을 간단히 말씀해주세요.',
        expectedKeywords: ['KAIST', '박사', '석사', '학사'],
        analysis: 'Education summary'
      },
      {
        user: '세종펠로우십 받으셨다던데 맞나요?',
        expectedKeywords: ['네', '세종', '2022'],
        analysis: 'Fellowship confirmation'
      },
      {
        user: '논문 25편 세미나 13회 맞습니까?',
        expectedKeywords: ['25', '13', '네', '맞'],
        analysis: 'Achievement confirmation - both numbers'
      },
      {
        user: '연락처 알려주세요.',
        expectedKeywords: ['chaos@sayberrygames.com'],
        analysis: 'Contact information'
      }
    ]
  },
  
  {
    name: '🎤 언론사 인터뷰',
    scenario: 'Media interview',
    conversations: [
      {
        user: 'AI 세미나를 시작하게 된 계기가?',
        expectedKeywords: ['AI', '세미나'],
        analysis: 'Motivation inquiry'
      },
      {
        user: '지금까지 몇 곳에서 하셨나요?',
        expectedKeywords: ['13'],
        mustNotInclude: ['25'],
        analysis: 'Venue count'
      },
      {
        user: '고려대에서도 하셨다던데?',
        expectedKeywords: ['고려대', '네', '7월'],
        analysis: 'Specific venue confirmation'
      },
      {
        user: '언제였죠?',
        expectedKeywords: ['7월'],
        mustNotInclude: ['2025', '2024'],
        analysis: 'Date without year'
      },
      {
        user: '세미나 비용은?',
        expectedKeywords: ['50만원', '시간당'],
        analysis: 'Pricing information'
      },
      {
        user: '1-2시간이면 최대 100만원인가요?',
        expectedKeywords: ['네', '100만원', '2시간'],
        analysis: 'Price calculation confirmation'
      }
    ]
  },
  
  {
    name: '🔄 반복 확인형 대화',
    scenario: 'Repetitive confirmation',
    conversations: [
      {
        user: '세미나 13회 맞아?',
        expectedKeywords: ['네', '13', '맞'],
        analysis: 'First confirmation'
      },
      {
        user: '정말 13회?',
        expectedKeywords: ['네', '13'],
        mustNotInclude: ['25'],
        analysis: 'Double check'
      },
      {
        user: '논문은 25편?',
        expectedKeywords: ['네', '25'],
        mustNotInclude: ['13'],
        analysis: 'Paper confirmation'
      },
      {
        user: '25편 확실해?',
        expectedKeywords: ['네', '25', '확실'],
        analysis: 'Certainty check'
      },
      {
        user: '가격 50만원?',
        expectedKeywords: ['네', '50만원'],
        analysis: 'Price confirmation'
      },
      {
        user: '시간당 50만원 맞지?',
        expectedKeywords: ['네', '시간당', '50만원', '맞'],
        analysis: 'Hourly rate confirmation'
      }
    ]
  },
  
  {
    name: '😤 의심 많은 사용자',
    scenario: 'Skeptical user',
    conversations: [
      {
        user: '진짜 박상돈 박사님 맞아요?',
        expectedKeywords: ['네', '박상돈'],
        analysis: 'Identity skepticism'
      },
      {
        user: 'KAIST 진짜 나왔어요?',
        expectedKeywords: ['네', 'KAIST'],
        analysis: 'Education skepticism'
      },
      {
        user: '박사 학위 있어요?',
        expectedKeywords: ['네', '박사', 'KAIST'],
        analysis: 'PhD verification'
      },
      {
        user: '논문 25편이나 썼다고?',
        expectedKeywords: ['네', '25'],
        analysis: 'Paper count skepticism'
      },
      {
        user: '세미나 비용이 진짜 50만원?',
        expectedKeywords: ['네', '50만원'],
        analysis: 'Price skepticism'
      },
      {
        user: '너무 비싼거 아니야?',
        expectedKeywords: ['50만원', '시간당'],
        analysis: 'Price complaint'
      },
      {
        user: '연락처가 진짜 그게 맞아?',
        expectedKeywords: ['chaos@sayberrygames.com'],
        analysis: 'Contact verification'
      }
    ]
  },
  
  {
    name: '🚀 빠른 정보 수집',
    scenario: 'Quick information gathering',
    conversations: [
      {
        user: '세미나?',
        expectedKeywords: ['세미나', '13'],
        analysis: 'Ultra short seminar query'
      },
      {
        user: '논문?',
        expectedKeywords: ['25'],
        mustNotInclude: ['13'],
        analysis: 'Ultra short paper query'
      },
      {
        user: '얼마?',
        expectedKeywords: ['50만원'],
        analysis: 'Ultra short price query'
      },
      {
        user: '언제?',
        expectedKeywords: ['시간', '날짜'],
        analysis: 'Ultra short time query'
      },
      {
        user: '어디로?',
        expectedKeywords: ['chaos@sayberrygames.com'],
        analysis: 'Ultra short contact query'
      },
      {
        user: '몇시간?',
        expectedKeywords: ['1', '2', '시간'],
        analysis: 'Ultra short duration query'
      }
    ]
  },
  
  {
    name: '🎯 구체적 날짜 확인',
    scenario: 'Specific date verification',
    conversations: [
      {
        user: '고려대 세미나 했나요?',
        expectedKeywords: ['고려대', '네'],
        analysis: 'Korea University confirmation'
      },
      {
        user: '언제였어요?',
        expectedKeywords: ['7월'],
        mustNotInclude: ['2025', '2024'],
        analysis: 'Date without year'
      },
      {
        user: '경상국립대는요?',
        expectedKeywords: ['경상', '8월'],
        analysis: 'GSU confirmation'
      },
      {
        user: '며칠이었죠?',
        expectedKeywords: ['25일'],
        mustNotInclude: ['25편', '논문'],
        analysis: 'Specific day - not paper count'
      },
      {
        user: '8월 25일 맞아요?',
        expectedKeywords: ['네', '8월', '25일', '맞'],
        mustNotInclude: ['논문', '25편'],
        analysis: 'Date confirmation - not papers'
      }
    ]
  },
  
  {
    name: '💡 AI 기술 관심자',
    scenario: 'AI technology enthusiast',
    conversations: [
      {
        user: 'LLM 관련 세미나도 하시나요?',
        expectedKeywords: ['LLM', '네', 'AI'],
        analysis: 'LLM seminar inquiry'
      },
      {
        user: '어떤 내용을 다루시나요?',
        expectedKeywords: ['AI', '기초', 'LLM'],
        analysis: 'Content inquiry'
      },
      {
        user: '초보자도 들을 수 있나요?',
        expectedKeywords: ['네', '초급', '기초', '맞춤'],
        analysis: 'Beginner suitability'
      },
      {
        user: '맞춤형이 뭔가요?',
        expectedKeywords: ['청중', '수준', '맞춤'],
        analysis: 'Customization explanation'
      },
      {
        user: '연구자 대상도 가능한가요?',
        expectedKeywords: ['네', '연구자', '심화'],
        analysis: 'Researcher suitability'
      },
      {
        user: '신청하고 싶은데요.',
        expectedKeywords: ['chaos@sayberrygames.com'],
        analysis: 'Application intent'
      }
    ]
  },
  
  {
    name: '🔀 복잡한 복합 질문',
    scenario: 'Complex compound questions',
    conversations: [
      {
        user: '박사님 소개 좀 해주세요.',
        expectedKeywords: ['박상돈', 'AI', 'KAIST'],
        analysis: 'Self introduction'
      },
      {
        user: '세미나 몇 번 논문 몇 편?',
        expectedKeywords: ['13', '25'],
        analysis: 'Both counts in one question'
      },
      {
        user: '비용이랑 시간이랑 연락처?',
        expectedKeywords: ['50만원', '시간', 'chaos@sayberrygames.com'],
        analysis: 'Triple compound question'
      },
      {
        user: '고려대 7월 경상대 8월 25일 맞고 총 13회 맞나?',
        expectedKeywords: ['7월', '8월', '25일', '13', '네', '맞'],
        analysis: 'Multiple confirmations'
      },
      {
        user: '전부 다 정리해서 알려주세요.',
        expectedKeywords: ['13', '25', '50만원', 'chaos@sayberrygames.com'],
        analysis: 'Complete summary request'
      }
    ]
  }
];

// Analyze conversation response
function analyzeResponse(response, expected) {
  const result = {
    passed: true,
    issues: []
  };
  
  if (!response) {
    result.passed = false;
    result.issues.push('No response received');
    return result;
  }
  
  const respLower = response.toLowerCase();
  
  // Check expected keywords
  if (expected.expectedKeywords) {
    for (const keyword of expected.expectedKeywords) {
      if (!respLower.includes(keyword.toString().toLowerCase())) {
        result.passed = false;
        result.issues.push(`Missing: "${keyword}"`);
      }
    }
  }
  
  // Check forbidden keywords
  if (expected.mustNotInclude) {
    for (const keyword of expected.mustNotInclude) {
      if (respLower.includes(keyword.toString().toLowerCase())) {
        result.passed = false;
        result.issues.push(`Should not include: "${keyword}"`);
      }
    }
  }
  
  return result;
}

// Run conversation flow test
async function runConversationTest() {
  console.log('🗣️ CONVERSATION FLOW TEST');
  console.log('=' .repeat(70));
  console.log('실제 대화 흐름을 시뮬레이션합니다.\n');
  
  const results = {
    total: 0,
    passed: 0,
    failed: 0,
    flows: []
  };
  
  const startTime = Date.now();
  
  for (const flow of CONVERSATION_FLOWS) {
    console.log(`\n📌 ${flow.name}`);
    console.log(`   Scenario: ${flow.scenario}`);
    console.log('-'.repeat(60));
    
    const history = [];
    const flowResults = {
      name: flow.name,
      scenario: flow.scenario,
      conversations: [],
      passed: 0,
      failed: 0
    };
    
    for (let i = 0; i < flow.conversations.length; i++) {
      const conv = flow.conversations[i];
      results.total++;
      
      console.log(`\n  Step ${i + 1}: User: "${conv.user}"`);
      console.log(`  Analysis: ${conv.analysis}`);
      
      // Send message with conversation history
      const response = await chat(conv.user, history);
      
      // Update history
      history.push({ role: 'user', content: conv.user });
      history.push({ role: 'assistant', content: response || '' });
      
      // Analyze response
      const analysis = analyzeResponse(response, conv);
      
      if (analysis.passed) {
        console.log(`  Bot: ✅ ${response?.substring(0, 100)}${response?.length > 100 ? '...' : ''}`);
        results.passed++;
        flowResults.passed++;
      } else {
        console.log(`  Bot: ❌ ${response?.substring(0, 100)}${response?.length > 100 ? '...' : ''}`);
        for (const issue of analysis.issues) {
          console.log(`       Issue: ${issue}`);
        }
        results.failed++;
        flowResults.failed++;
      }
      
      flowResults.conversations.push({
        user: conv.user,
        bot: response,
        analysis: conv.analysis,
        result: analysis
      });
      
      // Delay between messages
      await new Promise(r => setTimeout(r, 1500));
    }
    
    const flowPassRate = Math.round((flowResults.passed / flow.conversations.length) * 100);
    console.log(`\n  📊 Flow Result: ${flowResults.passed}/${flow.conversations.length} (${flowPassRate}%)`);
    
    results.flows.push(flowResults);
    
    // Pause between flows
    await new Promise(r => setTimeout(r, 3000));
  }
  
  const duration = Math.round((Date.now() - startTime) / 1000);
  
  // Final report
  console.log('\n' + '='.repeat(70));
  console.log('📊 CONVERSATION FLOW TEST RESULTS');
  console.log('='.repeat(70));
  
  const passRate = Math.round((results.passed / results.total) * 100);
  
  console.log(`\nOverall Statistics:`);
  console.log(`  Total Conversations: ${results.total}`);
  console.log(`  Passed: ${results.passed} ✅`);
  console.log(`  Failed: ${results.failed} ❌`);
  console.log(`  Pass Rate: ${passRate}%`);
  console.log(`  Test Duration: ${duration}s`);
  
  console.log(`\nFlow Performance:`);
  for (const flow of results.flows) {
    const flowRate = Math.round((flow.passed / flow.conversations.length) * 100);
    const emoji = flowRate >= 90 ? '🏆' : flowRate >= 70 ? '✨' : flowRate >= 50 ? '⚠️' : '💀';
    console.log(`  ${emoji} ${flow.name}: ${flowRate}%`);
  }
  
  // Grade
  console.log('\n' + '='.repeat(70));
  if (passRate >= 95) {
    console.log('🏆 EXCELLENT! Natural conversations work perfectly!');
  } else if (passRate >= 85) {
    console.log('✨ VERY GOOD! Most conversations flow naturally.');
  } else if (passRate >= 75) {
    console.log('⭐ GOOD! But some conversation issues remain.');
  } else if (passRate >= 65) {
    console.log('⚠️ ACCEPTABLE, but conversation flow needs work.');
  } else {
    console.log('💀 POOR! Conversations are not natural.');
  }
  
  // Save results
  fs.writeFileSync('conversation-flow-results.json', JSON.stringify(results, null, 2));
  console.log('\n📁 Results saved to: conversation-flow-results.json');
}

// Run test
console.log('🚀 Starting Conversation Flow Test...\n');
runConversationTest().catch(console.error);