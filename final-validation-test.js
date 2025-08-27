// 최종 검증 테스트 - 핵심 기능만 확인
const fetch = require('node-fetch');

const BASE_URL = 'https://sangdon-chatbot.netlify.app/.netlify/functions/chat-ai-driven';

async function chat(message, history = []) {
  try {
    const response1 = await fetch(BASE_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message, history, step: 1 })
    });
    
    if (!response1.ok) return `Error ${response1.status}`;
    const data1 = await response1.json();
    
    if (data1.needsSecondStep) {
      const response2 = await fetch(BASE_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message, history, step: 2,
          action: data1.action, query: data1.query
        })
      });
      
      if (!response2.ok) return `Error ${response2.status}`;
      const data2 = await response2.json();
      return data2.reply || 'No reply';
    }
    
    return data1.initialMessage || 'No reply';
  } catch (error) {
    return `Error: ${error.message}`;
  }
}

async function runTests() {
  console.log('✅ 최종 검증 테스트 - 핵심 기능');
  console.log('==================================================\n');

  const criticalTests = [
    // 절대 틀리면 안되는 핵심 테스트
    { 
      name: "세미나 비용", 
      q: "AI 세미나 얼마야?", 
      must: ["50만원"], 
      mustNot: ["25", "5만원"]
    },
    { 
      name: "세미나 비용2", 
      q: "1회당 얼마죠?", 
      must: ["50만원"], 
      mustNot: ["25"]
    },
    { 
      name: "세미나 개수", 
      q: "세미나 몇 번 했어?", 
      must: ["13"], 
      mustNot: ["25"]
    },
    { 
      name: "논문 개수", 
      q: "논문 몇 편 썼어?", 
      must: ["25"], 
      mustNot: ["13"]
    },
    { 
      name: "세미나 신청", 
      q: "세미나 신청하고 싶은데", 
      must: ["chaos@sayberrygames.com"], 
      mustNot: ["어떤 세미나"]
    },
    { 
      name: "일반 문의", 
      q: "AI 세미나에 대해 궁금합니다", 
      must: ["AI", "50만원", "chaos@sayberrygames.com"], 
      mustNot: []
    },
    { 
      name: "고려대 날짜", 
      q: "고려대 세미나는 언제야?", 
      must: ["7월"], 
      mustNot: ["25", "13"]
    },
    { 
      name: "경상국립대 날짜", 
      q: "경상국립대 세미나 날짜는?", 
      must: ["8월"], 
      mustNot: ["25", "13"]
    },
    { 
      name: "짧은 문맥 - 비용",
      q: "얼마?",
      history: [{role: 'user', content: '세미나 관련해서'}],
      must: ["50만원"],
      mustNot: ["25"]
    },
    { 
      name: "짧은 문맥 - 개수",
      q: "몇개?",
      history: [{role: 'user', content: '논문'}],
      must: ["25"],
      mustNot: ["13"]
    },
    {
      name: "복합 질문",
      q: "세미나 얼마고 몇 번 했어?",
      must: ["50만원", "13"],
      mustNot: ["25"]
    },
    {
      name: "오타 처리",
      q: "쎄미나 얼마야",
      must: ["50만원"],
      mustNot: ["25"]
    }
  ];

  let totalTests = 0;
  let passedTests = 0;
  const results = [];

  for (const test of criticalTests) {
    totalTests++;
    console.log(`🔍 테스트 ${totalTests}: ${test.name}`);
    console.log(`   질문: "${test.q}"`);
    
    const response = await chat(test.q, test.history || []);
    const responseLower = response.toLowerCase();
    
    let passed = true;
    const issues = [];
    
    // Must have check
    if (test.must) {
      for (const keyword of test.must) {
        if (!responseLower.includes(keyword.toString().toLowerCase())) {
          passed = false;
          issues.push(`누락: "${keyword}"`);
        }
      }
    }
    
    // Must not have check
    if (test.mustNot) {
      for (const keyword of test.mustNot) {
        if (responseLower.includes(keyword.toString().toLowerCase())) {
          passed = false;
          issues.push(`금지어: "${keyword}"`);
        }
      }
    }
    
    if (passed) {
      passedTests++;
      console.log(`   ✅ PASS`);
      results.push({name: test.name, status: 'PASS'});
    } else {
      console.log(`   ❌ FAIL`);
      issues.forEach(issue => console.log(`      ${issue}`));
      console.log(`      응답: ${response.substring(0, 100)}...`);
      results.push({name: test.name, status: 'FAIL', issues});
    }
    console.log();
  }

  // 결과 요약
  console.log('==================================================');
  console.log('📊 최종 결과');
  console.log('==================================================');
  console.log(`총 테스트: ${totalTests}`);
  console.log(`통과: ${passedTests}`);
  console.log(`실패: ${totalTests - passedTests}`);
  console.log(`통과율: ${Math.round(passedTests/totalTests*100)}%`);
  console.log();
  
  if (passedTests === totalTests) {
    console.log('🎉🎉🎉 완벽합니다! 모든 핵심 테스트 통과! 🎉🎉🎉');
    console.log('챗봇이 완벽하게 작동하고 있습니다.');
  } else if (passedTests >= totalTests * 0.9) {
    console.log('✨ 우수! 90% 이상 통과');
    console.log('일부 개선이 필요하지만 대부분 잘 작동합니다.');
  } else {
    console.log('⚠️ 개선 필요! 핵심 기능에 문제가 있습니다.');
    console.log('\n실패한 테스트:');
    results.filter(r => r.status === 'FAIL').forEach(r => {
      console.log(`  • ${r.name}: ${r.issues ? r.issues.join(', ') : ''}`);
    });
  }
  
  // 상세 결과 저장
  const fs = require('fs');
  const resultData = {
    timestamp: new Date().toISOString(),
    totalTests,
    passed: passedTests,
    failed: totalTests - passedTests,
    passRate: Math.round(passedTests/totalTests*100),
    details: results
  };
  
  fs.writeFileSync('final-validation-results.json', JSON.stringify(resultData, null, 2));
  console.log('\n상세 결과가 final-validation-results.json에 저장되었습니다.');
}

console.log('🚀 최종 검증 시작...\n');
runTests().catch(console.error);