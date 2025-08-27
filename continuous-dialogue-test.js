// 연속 대화 테스트 - 실제 대화처럼 이어지는 질문들
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
  console.log('🔄 연속 대화 테스트 - 실제 사용자처럼');
  console.log('==================================================\n');

  const dialogues = [
    {
      name: '💼 세미나 문의 대화',
      intent: '세미나에 관심있는 사용자와의 실제 대화',
      conversation: [
        { q: "AI 세미나에 대해 궁금합니다", must: ["AI", "50만원", "chaos@sayberrygames.com"] },
        { q: "비싸지 않아?", must: ["50만원"], intent: "가격 반응" },
        { q: "시간은?", must: ["시간"], intent: "시간 확인" },
        { q: "맞춤형이 뭔데?", must: ["청중", "수준"], intent: "맞춤형 설명" },
        { q: "신청은?", must: ["chaos@sayberrygames.com"], intent: "신청 방법" },
        { q: "총 몇 번 했어?", must: ["13"], mustNot: ["25"], intent: "경험 확인" }
      ]
    },
    {
      name: '📚 논문/세미나 구분 대화',
      intent: '논문과 세미나를 구분해서 묻는 대화',
      conversation: [
        { q: "논문 몇 편 썼어?", must: ["25"], mustNot: ["13"] },
        { q: "세미나는?", must: ["13"], mustNot: ["25"], intent: "세미나로 전환" },
        { q: "더 많네", must: [], intent: "비교 반응" },
        { q: "둘다 합치면?", must: ["25", "13"], intent: "복합 정보" },
        { q: "최근 논문은?", must: ["2024"], intent: "최근 정보" },
        { q: "어디서 세미나했어?", must: ["KAIST"], intent: "장소 확인" }
      ]
    },
    {
      name: '🎓 대학 세미나 문의',
      intent: '특정 대학 세미나에 대한 연속 질문',
      conversation: [
        { q: "고려대에서 세미나 했어?", must: ["고려대"], mustNot: ["25", "13"] },
        { q: "언제?", must: ["7월"], mustNot: ["2025"], intent: "날짜 확인" },
        { q: "무슨 내용?", must: ["AI"], intent: "내용 확인" },
        { q: "경상국립대는?", must: ["8월"], mustNot: ["2025"], intent: "다른 대학" },
        { q: "몇일?", must: ["25일"], intent: "구체적 날짜" },
        { q: "KAIST도 했나?", must: ["KAIST"], intent: "또 다른 대학" }
      ]
    },
    {
      name: '💰 비용 협상 대화',
      intent: '비용에 민감한 사용자와의 대화',
      conversation: [
        { q: "세미나 얼마야?", must: ["50만원"] },
        { q: "너무 비싼데", must: ["50만원"], intent: "비싸다는 반응" },
        { q: "할인은?", must: [], intent: "할인 문의" },
        { q: "시간당이야?", must: ["시간당"], intent: "시간당 확인" },
        { q: "보통 몇시간?", must: ["1", "2"], intent: "총 시간" },
        { q: "그럼 최대 얼마?", must: ["100만원"], intent: "최대 비용" }
      ]
    },
    {
      name: '🔍 정보 확인 대화',
      intent: '정보를 하나씩 확인하는 대화',
      conversation: [
        { q: "세미나 13회 맞아?", must: ["13", "맞"], mustNot: ["25"] },
        { q: "논문은?", must: ["25"], mustNot: ["13"], intent: "논문 전환" },
        { q: "25편?", must: ["25", "맞"], intent: "확인" },
        { q: "시간당 50만원?", must: ["50만원", "맞"], intent: "가격 확인" },
        { q: "이메일이 뭐였지?", must: ["chaos@sayberrygames.com"], intent: "이메일 재확인" },
        { q: "고려대 7월 맞지?", must: ["7월", "맞"], intent: "날짜 확인" }
      ]
    },
    {
      name: '🤔 애매한 질문 연속',
      intent: '짧고 애매한 질문들의 연속',
      conversation: [
        { q: "세미나", must: [], intent: "단순 언급" },
        { q: "뭐야?", must: ["AI"], intent: "내용 묻기" },
        { q: "얼마?", must: ["50만원"], intent: "가격" },
        { q: "언제?", must: [], intent: "일정" },
        { q: "어디서?", must: [], intent: "장소" },
        { q: "몇번?", must: ["13"], intent: "횟수" }
      ]
    },
    {
      name: '🔄 주제 전환 대화',
      intent: '주제를 계속 바꾸는 대화',
      conversation: [
        { q: "논문 얘기 좀", must: ["25"], intent: "논문 시작" },
        { q: "아니 세미나로", must: ["13"], intent: "세미나 전환" },
        { q: "비용은?", must: ["50만원"], intent: "비용 질문" },
        { q: "다시 논문", must: ["25"], intent: "논문 복귀" },
        { q: "고려대 언제?", must: ["7월"], intent: "대학 전환" },
        { q: "연락처", must: ["chaos@sayberrygames.com"], intent: "연락처" }
      ]
    }
  ];

  let totalTests = 0;
  let passedTests = 0;
  const failedDialogues = [];

  for (const dialogue of dialogues) {
    console.log(`\n${dialogue.name}`);
    console.log(`의도: ${dialogue.intent}`);
    console.log('='.repeat(60));
    
    const history = [];
    let dialoguePassed = true;
    let stepNum = 0;
    
    for (const step of dialogue.conversation) {
      stepNum++;
      totalTests++;
      
      console.log(`\n  Step ${stepNum}: "${step.q}"`);
      if (step.intent) console.log(`  의도: ${step.intent}`);
      
      const response = await chat(step.q, history);
      const responseLower = response.toLowerCase();
      
      // 대화 기록에 추가
      history.push({ role: 'user', content: step.q });
      history.push({ role: 'assistant', content: response });
      
      let passed = true;
      const issues = [];
      
      // Must have check
      if (step.must) {
        for (const keyword of step.must) {
          if (!responseLower.includes(keyword.toString().toLowerCase())) {
            passed = false;
            issues.push(`누락: "${keyword}"`);
          }
        }
      }
      
      // Must not have check
      if (step.mustNot) {
        for (const keyword of step.mustNot) {
          if (responseLower.includes(keyword.toString().toLowerCase())) {
            passed = false;
            issues.push(`금지어: "${keyword}"`);
          }
        }
      }
      
      if (passed) {
        passedTests++;
        console.log(`  ✅ PASS`);
        console.log(`  응답: ${response.substring(0, 100)}...`);
      } else {
        dialoguePassed = false;
        console.log(`  ❌ FAIL`);
        issues.forEach(issue => console.log(`     ${issue}`));
        console.log(`  응답: ${response.substring(0, 100)}...`);
        
        if (!failedDialogues.find(d => d.name === dialogue.name)) {
          failedDialogues.push({
            name: dialogue.name,
            failedSteps: []
          });
        }
        const dialogueEntry = failedDialogues.find(d => d.name === dialogue.name);
        dialogueEntry.failedSteps.push({
          step: stepNum,
          question: step.q,
          issues: issues
        });
      }
    }
    
    const dialogueRate = dialoguePassed ? 100 : 
      Math.round((dialogue.conversation.length - failedDialogues.find(d => d.name === dialogue.name)?.failedSteps.length || 0) / dialogue.conversation.length * 100);
    
    console.log(`\n  📊 대화 성공률: ${dialogueRate}%`);
  }

  // 최종 결과
  console.log('\n' + '='.repeat(70));
  console.log('📈 최종 결과');
  console.log('='.repeat(70));
  
  const passRate = Math.round(passedTests/totalTests*100);
  console.log(`총 질문: ${totalTests}`);
  console.log(`통과: ${passedTests}`);
  console.log(`실패: ${totalTests - passedTests}`);
  console.log(`통과율: ${passRate}%`);
  
  if (passRate >= 90) {
    console.log('\n🎉🎉🎉 목표 달성! 90% 이상 통과! 🎉🎉🎉');
    console.log('연속 대화에서도 안정적으로 작동합니다!');
  } else if (passRate >= 80) {
    console.log('\n✨ 양호! 대부분의 대화가 자연스럽게 진행됩니다.');
  } else {
    console.log('\n⚠️ 개선 필요. 연속 대화에서 문맥 유지가 필요합니다.');
  }
  
  // 실패한 대화 요약
  if (failedDialogues.length > 0) {
    console.log('\n실패한 대화:');
    failedDialogues.forEach(d => {
      console.log(`\n  ${d.name}: ${d.failedSteps.length}개 스텝 실패`);
      d.failedSteps.slice(0, 2).forEach(s => {
        console.log(`    Step ${s.step}: "${s.question}"`);
        console.log(`    문제: ${s.issues.join(', ')}`);
      });
    });
  }
  
  // JSON 결과 저장
  const fs = require('fs');
  fs.writeFileSync('continuous-dialogue-results.json', JSON.stringify({
    timestamp: new Date().toISOString(),
    passRate,
    total: totalTests,
    passed: passedTests,
    failed: totalTests - passedTests,
    failedDialogues: failedDialogues
  }, null, 2));
  
  console.log('\n상세 결과: continuous-dialogue-results.json');
}

console.log('⏱️ 연속 대화 테스트 시작... (약 3-4분 소요)\n');
runTests().catch(console.error);