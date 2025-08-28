// 🌊 ULTIMATE COMPREHENSIVE TEST - 최종 광범위 테스트
const fetch = require('node-fetch');
const fs = require('fs');

const BASE_URL = 'https://sangdon-chatbot.netlify.app/.netlify/functions/chat-ai-driven';

// Enhanced chat function with detailed logging
async function chat(message, history = [], options = {}) {
  const { timeout = 15000, debug = false } = options;
  
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);
    
    const response1 = await fetch(BASE_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message, history, step: 1 }),
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);
    
    if (!response1.ok) {
      return { success: false, error: `HTTP ${response1.status}` };
    }
    
    const data1 = await response1.json();
    
    if (debug) {
      console.log(`    [DEBUG] Action: ${data1.action}, Query: ${data1.query}`);
    }
    
    if (data1.needsSecondStep) {
      const controller2 = new AbortController();
      const timeoutId2 = setTimeout(() => controller2.abort(), timeout);
      
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
        return { success: false, error: `Step 2 HTTP ${response2.status}` };
      }
      
      const data2 = await response2.json();
      return { success: true, response: data2.reply || '', action: data1.action };
    }
    
    return { success: true, response: data1.initialMessage || '', action: data1.action };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

// Test validation function
function validate(response, test) {
  const result = {
    passed: true,
    errors: [],
    warnings: []
  };
  
  if (!response.success) {
    result.passed = false;
    result.errors.push(`Request failed: ${response.error}`);
    return result;
  }
  
  const respText = response.response;
  const respLower = respText.toLowerCase();
  
  // Must have keywords
  if (test.must) {
    for (const keyword of test.must) {
      if (!respLower.includes(keyword.toString().toLowerCase())) {
        result.passed = false;
        result.errors.push(`Missing: "${keyword}"`);
      }
    }
  }
  
  // Must NOT have keywords
  if (test.mustNot) {
    for (const keyword of test.mustNot) {
      if (respLower.includes(keyword.toString().toLowerCase())) {
        result.passed = false;
        result.errors.push(`Forbidden: "${keyword}"`);
      }
    }
  }
  
  // Pattern matching
  if (test.pattern) {
    const regex = new RegExp(test.pattern, 'i');
    if (!regex.test(respText)) {
      result.passed = false;
      result.errors.push(`Pattern not matched: ${test.pattern}`);
    }
  }
  
  // Exact match
  if (test.exact) {
    if (respText.trim() !== test.exact) {
      result.passed = false;
      result.errors.push(`Not exact match`);
    }
  }
  
  // Response length checks
  if (test.minLength && respText.length < test.minLength) {
    result.passed = false;
    result.errors.push(`Too short: ${respText.length} < ${test.minLength}`);
  }
  
  if (test.maxLength && respText.length > test.maxLength) {
    result.warnings.push(`Too long: ${respText.length} > ${test.maxLength}`);
  }
  
  // Must start with
  if (test.startsWith) {
    let startsCorrectly = false;
    const starts = Array.isArray(test.startsWith) ? test.startsWith : [test.startsWith];
    for (const start of starts) {
      if (respLower.startsWith(start.toLowerCase())) {
        startsCorrectly = true;
        break;
      }
    }
    if (!startsCorrectly) {
      result.passed = false;
      result.errors.push(`Should start with: ${starts.join(' or ')}`);
    }
  }
  
  // Action check (SEARCH vs CHAT)
  if (test.expectedAction && response.action !== test.expectedAction) {
    result.warnings.push(`Expected action ${test.expectedAction}, got ${response.action}`);
  }
  
  return result;
}

// MASSIVE TEST COLLECTION
const COMPREHENSIVE_TESTS = {
  // 1. 핵심 정보 정확도 (Core Accuracy)
  core_accuracy: {
    name: '🎯 Core Information Accuracy',
    critical: true,
    tests: [
      // Seminar variations
      { q: '세미나 몇 번?', must: ['13'], mustNot: ['25'] },
      { q: '세미나 몇 회?', must: ['13'], mustNot: ['25'] },
      { q: '세미나 횟수?', must: ['13'], mustNot: ['25'] },
      { q: '초청강연 몇 번?', must: ['13'], mustNot: ['25'] },
      { q: '강연 몇 번 했어?', must: ['13'], mustNot: ['25'] },
      { q: '총 세미나 횟수는?', must: ['13'], mustNot: ['25'] },
      { q: '세미나 13회 진행했나요?', must: ['13'], startsWith: ['네', '맞'] },
      { q: '초청 세미나 개수', must: ['13'], mustNot: ['25'] },
      
      // Paper variations
      { q: '논문 몇 편?', must: ['25'], mustNot: ['13'] },
      { q: '논문 개수?', must: ['25'], mustNot: ['13'] },
      { q: '국제저널 논문?', must: ['25'], mustNot: ['13'] },
      { q: '저널 논문 몇 편?', must: ['25'], mustNot: ['13'] },
      { q: '총 논문 수는?', must: ['25'], mustNot: ['13'] },
      { q: '논문 25편 맞죠?', must: ['25'], startsWith: ['네', '맞'] },
      { q: 'SCI 논문 몇 편?', must: ['25'], mustNot: ['13'] },
      { q: '게재 논문 수', must: ['25'], mustNot: ['13'] }
    ]
  },
  
  // 2. 가격 정보 (Pricing)
  pricing_info: {
    name: '💰 Pricing Information',
    critical: true,
    tests: [
      { q: '얼마?', must: ['50만원'] },
      { q: '비용?', must: ['50만원'] },
      { q: '가격?', must: ['50만원'] },
      { q: '금액?', must: ['50만원'] },
      { q: '강연료?', must: ['50만원'] },
      { q: '세미나 비용?', must: ['50만원'] },
      { q: '1회당 얼마?', must: ['50만원'] },
      { q: '시간당 얼마?', must: ['50만원'] },
      { q: '세미나 얼마야?', must: ['50만원'] },
      { q: 'AI 세미나 가격', must: ['50만원'] },
      { q: '비용이 어떻게 되나요?', must: ['50만원'] },
      { q: '강연료가 얼마인가요?', must: ['50만원'] },
      { q: '50만원 맞아?', must: ['50만원'], startsWith: ['네', '맞'] },
      { q: '시간당 50만원이죠?', must: ['50만원'], startsWith: ['네', '맞'] },
      { q: 'How much?', must: ['50'] },
      { q: 'What is the price?', must: ['50'] },
      { q: 'Seminar fee?', must: ['50'] }
    ]
  },
  
  // 3. 연락처 정보 (Contact)
  contact_info: {
    name: '📧 Contact Information',
    critical: true,
    tests: [
      { q: '연락처?', must: ['chaos@sayberrygames.com'] },
      { q: '이메일?', must: ['chaos@sayberrygames.com'] },
      { q: '메일 주소?', must: ['chaos@sayberrygames.com'] },
      { q: '신청은?', must: ['chaos@sayberrygames.com'] },
      { q: '신청 방법?', must: ['chaos@sayberrygames.com'] },
      { q: '어디로 연락?', must: ['chaos@sayberrygames.com'] },
      { q: '어떻게 신청?', must: ['chaos@sayberrygames.com'] },
      { q: '연락처 알려줘', must: ['chaos@sayberrygames.com'] },
      { q: '이메일 주소가?', must: ['chaos@sayberrygames.com'] },
      { q: '신청하려면?', must: ['chaos@sayberrygames.com'] },
      { q: '세미나 신청', must: ['chaos@sayberrygames.com'] },
      { q: 'Contact?', must: ['chaos@sayberrygames.com'] },
      { q: 'Email?', must: ['chaos@sayberrygames.com'] },
      { q: 'How to apply?', must: ['chaos@sayberrygames.com'] },
      { q: 'chaos@sayberrygames.com 맞나요?', must: ['chaos@sayberrygames.com'], startsWith: ['네', '맞'] }
    ]
  },
  
  // 4. 복합 질문 (Compound Questions)
  compound_questions: {
    name: '🔀 Compound Questions',
    tests: [
      // Double compounds
      { q: '세미나 얼마고 몇 번?', must: ['50만원', '13'], mustNot: ['25'] },
      { q: '논문이랑 세미나?', must: ['25', '13'] },
      { q: '비용이랑 연락처?', must: ['50만원', 'chaos@sayberrygames.com'] },
      { q: '가격하고 시간?', must: ['50만원', '시간'] },
      { q: '얼마고 어디로?', must: ['50만원', 'chaos@sayberrygames.com'] },
      { q: '몇 번이고 얼마?', must: ['13', '50만원'], mustNot: ['25'] },
      { q: '시간이랑 비용?', must: ['시간', '50만원'] },
      { q: '논문 몇 편 세미나 몇 번?', must: ['25', '13'] },
      
      // Triple compounds
      { q: '얼마고 몇 번이고 어디로?', must: ['50만원', '13', 'chaos@sayberrygames.com'] },
      { q: '논문 세미나 비용?', must: ['25', '13', '50만원'] },
      { q: '시간 가격 연락처?', must: ['시간', '50만원', 'chaos@sayberrygames.com'] },
      
      // Complex compounds
      { q: '세미나 13회 논문 25편 맞지?', must: ['13', '25'], startsWith: ['네', '맞'] },
      { q: '50만원에 13회 맞아?', must: ['50만원', '13'], startsWith: ['네', '맞'] },
      { q: '비용 50만원 시간 1-2시간 맞나?', must: ['50만원', '1', '2'], startsWith: ['네', '맞'] }
    ]
  },
  
  // 5. 확인 질문 (Confirmation)
  confirmation_questions: {
    name: '✅ Confirmation Questions',
    critical: true,
    tests: [
      // 맞아 variations
      { q: '세미나 13회 맞아?', must: ['13'], startsWith: ['네', '맞'] },
      { q: '논문 25편 맞아?', must: ['25'], startsWith: ['네', '맞'] },
      { q: '50만원 맞아?', must: ['50만원'], startsWith: ['네', '맞'] },
      { q: 'KAIST 맞아?', must: ['KAIST'], startsWith: ['네', '맞'] },
      
      // 맞죠 variations
      { q: '세미나 13회 맞죠?', must: ['13'], startsWith: ['네', '맞'] },
      { q: '논문 25편 맞죠?', must: ['25'], startsWith: ['네', '맞'] },
      { q: '시간당 50만원 맞죠?', must: ['50만원'], startsWith: ['네', '맞'] },
      { q: '이메일이 chaos@sayberrygames.com 맞죠?', must: ['chaos@sayberrygames.com'], startsWith: ['네', '맞'] },
      
      // 맞지 variations
      { q: '13회 맞지?', must: ['13'], startsWith: ['네', '맞'] },
      { q: '25편 맞지?', must: ['25'], startsWith: ['네', '맞'] },
      { q: '50만원 맞지?', must: ['50만원'], startsWith: ['네', '맞'] },
      
      // 맞나 variations
      { q: '세미나 13회 맞나?', must: ['13'], startsWith: ['네', '맞'] },
      { q: '논문 25편 맞나요?', must: ['25'], startsWith: ['네', '맞'] },
      { q: '강연료 50만원 맞나요?', must: ['50만원'], startsWith: ['네', '맞'] },
      
      // 맞습니까 formal
      { q: '총 13회 맞습니까?', must: ['13'], startsWith: ['네', '맞'] },
      { q: '25편이 맞습니까?', must: ['25'], startsWith: ['네', '맞'] }
    ]
  },
  
  // 6. 학력/경력 (Education/Career)
  education_career: {
    name: '🎓 Education & Career',
    tests: [
      // Education
      { q: '어디 졸업?', must: ['KAIST'] },
      { q: '학교?', must: ['KAIST'] },
      { q: '대학?', must: ['KAIST'] },
      { q: '학력?', must: ['KAIST'] },
      { q: '박사 어디?', must: ['KAIST', '전기'] },
      { q: '석사 어디?', must: ['KAIST', '수리'] },
      { q: '학사 어디?', must: ['KAIST', '수리'] },
      { q: '전공?', must: ['전기', '수리'] },
      { q: 'KAIST 졸업?', must: ['KAIST'], startsWith: ['네', '맞'] },
      { q: '박사학위?', must: ['박사', 'KAIST'] },
      { q: '언제 졸업?', must: ['2017', '2013', '2011'] },
      
      // Career
      { q: '현재 직장?', must: ['세이베리'] },
      { q: '어디서 일해?', must: ['세이베리'] },
      { q: '직업?', must: ['AI', '연구'] },
      { q: '세종펠로우십?', must: ['세종', '2022'] },
      { q: '박사후연구원?', must: ['KAIST', '2017'] }
    ]
  },
  
  // 7. 대학별 세미나 (University Seminars)
  university_seminars: {
    name: '🏫 University Seminars',
    tests: [
      // Specific universities
      { q: '고려대 세미나?', must: ['고려대', '7월'] },
      { q: '고려대 언제?', must: ['7월'], mustNot: ['2025', '2024'] },
      { q: '경상국립대 세미나?', must: ['경상', '8월'] },
      { q: '경상국립대 언제?', must: ['8월', '25일'], mustNot: ['25편'] },
      { q: 'KAIST 세미나?', must: ['KAIST'] },
      { q: '경희대 세미나?', must: ['경희대'] },
      { q: '충남대 세미나?', must: ['충남대'] },
      { q: '경북대 세미나?', must: ['경북대'] },
      { q: '부경대 세미나?', must: ['부경대'] },
      { q: '전북대 세미나?', must: ['전북대'] },
      { q: '한국과학영재학교?', must: ['과학영재'] },
      
      // Date confirmations
      { q: '고려대 7월 맞아?', must: ['7월'], startsWith: ['네', '맞'] },
      { q: '경상국립대 8월 25일 맞나?', must: ['8월', '25일'], startsWith: ['네', '맞'] }
    ]
  },
  
  // 8. 시간 정보 (Time/Duration)
  time_duration: {
    name: '⏰ Time & Duration',
    tests: [
      { q: '시간?', must: ['시간', '1', '2'] },
      { q: '몇 시간?', must: ['1', '2', '시간'] },
      { q: '얼마나 걸려?', must: ['시간'] },
      { q: '소요시간?', must: ['시간'] },
      { q: '세미나 시간?', must: ['시간', '1', '2'] },
      { q: '평균 시간?', must: ['1시간', '30분'] },
      { q: '최대 시간?', must: ['2시간'] },
      { q: '최소 시간?', must: ['1시간'] },
      { q: '1-2시간 맞아?', must: ['1', '2'], startsWith: ['네', '맞'] },
      { q: '시간당이야?', must: ['시간당'] }
    ]
  },
  
  // 9. 오타/변형 (Typos/Variations)
  typos_variations: {
    name: '🔤 Typos & Variations',
    tests: [
      // Korean typos
      { q: '쎄미나', must: ['13'] },
      { q: '셰미나', must: ['13'] },
      { q: '세미너', must: ['13'] },
      { q: '논뮨', must: ['25'] },
      { q: '놈문', must: ['25'] },
      { q: '논문몇편', must: ['25'] },
      { q: '세미나몇번', must: ['13'] },
      { q: '연락쳐', must: ['chaos@sayberrygames.com'] },
      { q: '엄마', must: ['50만원'] },
      { q: '얼머', must: ['50만원'] },
      
      // English variations
      { q: 'seminar', must: ['13'] },
      { q: 'paper', must: ['25'] },
      { q: 'price', must: ['50'] },
      { q: 'contact', must: ['chaos@sayberrygames.com'] },
      
      // Mixed language
      { q: 'seminar 몇번?', must: ['13'] },
      { q: 'paper 개수?', must: ['25'] },
      { q: 'price 얼마?', must: ['50'] }
    ]
  },
  
  // 10. 짧은 질문 (Ultra-short)
  ultra_short: {
    name: '🔪 Ultra-short Questions',
    tests: [
      { q: '?', minLength: 10 },
      { q: '몇', minLength: 10 },
      { q: '얼', minLength: 10 },
      { q: '언', minLength: 10 },
      { q: '13', must: ['13', '세미나'] },
      { q: '25', must: ['25', '논문'] },
      { q: '50', must: ['50', '만원'] },
      { q: 'ㅅㅁㄴ', must: ['세미나', '13'] },
      { q: 'ㄴㅁ', must: ['논문', '25'] },
      { q: 'ㅇㅁ', must: ['50만원'] }
    ]
  },
  
  // 11. 문맥 의존 (Context-dependent)
  context_dependent: {
    name: '💭 Context-dependent Questions',
    tests: [
      {
        context: [
          { role: 'user', content: 'AI 세미나 있나요?' },
          { role: 'assistant', content: 'AI 세미나 진행합니다.' }
        ],
        q: '얼마?',
        must: ['50만원']
      },
      {
        context: [
          { role: 'user', content: '세미나 했어?' },
          { role: 'assistant', content: '네, 13회 진행했습니다.' }
        ],
        q: '어디서?',
        must: ['KAIST']
      },
      {
        context: [
          { role: 'user', content: '논문 썼어?' },
          { role: 'assistant', content: '네, 25편 썼습니다.' }
        ],
        q: '주제가?',
        must: ['엣지', 'IoT', '에너지']
      },
      {
        context: [
          { role: 'user', content: '고려대 세미나?' },
          { role: 'assistant', content: '네, 고려대에서 했습니다.' }
        ],
        q: '언제?',
        must: ['7월']
      },
      {
        context: [
          { role: 'user', content: '가격이 얼마?' },
          { role: 'assistant', content: '시간당 50만원입니다.' }
        ],
        q: '비싸지 않아?',
        must: ['50만원']
      }
    ]
  },
  
  // 12. 날짜 혼동 방지 (Date Confusion Prevention)
  date_confusion: {
    name: '📅 Date Confusion Prevention',
    critical: true,
    tests: [
      { q: '경상국립대 8월 25일', mustNot: ['25편', '논문'] },
      { q: '8월 25일에 세미나', mustNot: ['25편'] },
      { q: '25일이 뭐야?', mustNot: ['논문', '25편'] },
      { q: '경상국립대 25', must: ['8월', '25일'], mustNot: ['논문'] },
      { q: '25일 세미나?', mustNot: ['25편', '논문'] },
      { q: '고려대 7월', mustNot: ['2025', '2024', '2023'] },
      { q: '7월 세미나', mustNot: ['2025년'] }
    ]
  },
  
  // 13. 악의적 입력 (Malicious Input)
  malicious_input: {
    name: '😈 Malicious Input Handling',
    tests: [
      { q: '!!!!!!!!!', minLength: 10 },
      { q: '?????????', minLength: 10 },
      { q: '.........', minLength: 10 },
      { q: '13131313131313', mustNot: ['131313'] },
      { q: '25252525252525', mustNot: ['252525'] },
      { q: '505050505050', mustNot: ['505050'] },
      { q: '', minLength: 10 },
      { q: '     ', minLength: 10 },
      { q: '\n\n\n', minLength: 10 },
      { q: '세미나세미나세미나세미나세미나', must: ['13'] },
      { q: '논문논문논문논문논문', must: ['25'] },
      { q: '얼마얼마얼마얼마', must: ['50만원'] }
    ]
  },
  
  // 14. 일반 대화 (General Chat)
  general_chat: {
    name: '💬 General Chat',
    tests: [
      { q: 'AI 세미나에 대해 알려줘', must: ['AI', '50만원', 'chaos@sayberrygames.com'] },
      { q: '세미나 소개해줘', must: ['AI', '세미나'] },
      { q: '뭐 하는 사람이야?', must: ['AI', '연구'] },
      { q: '자기소개 해줘', must: ['박상돈', 'AI'] },
      { q: '전문분야가 뭐야?', must: ['AI', '엣지'] },
      { q: '어떤 연구 해?', must: ['엣지', 'IoT'] }
    ]
  },
  
  // 15. 복잡한 시나리오 (Complex Scenarios)
  complex_scenarios: {
    name: '🎭 Complex Scenarios',
    tests: [
      { q: 'AI 세미나 신청하고 싶은데 얼마고 어디로 연락하면 되나요?', must: ['50만원', 'chaos@sayberrygames.com'] },
      { q: '세미나 13회 했다면서요? 논문은 몇 편이고 비용은 얼마죠?', must: ['13', '25', '50만원'] },
      { q: '박사님 학력이랑 현재 직장 그리고 세미나 비용 알려주세요', must: ['KAIST', '세이베리', '50만원'] },
      { q: '고려대 7월 경상국립대 8월 25일 맞고 총 13회 맞죠?', must: ['7월', '8월', '25일', '13'], startsWith: ['네', '맞'] },
      { q: '논문 25편 세미나 13회 비용 50만원 시간 1-2시간 전부 맞나요?', must: ['25', '13', '50만원', '1', '2'], startsWith: ['네', '맞'] }
    ]
  }
};

// Statistics tracker
class TestStats {
  constructor() {
    this.total = 0;
    this.passed = 0;
    this.failed = 0;
    this.critical_failed = 0;
    this.timeouts = 0;
    this.categoryStats = {};
    this.failurePatterns = new Map();
    this.responseTime = [];
  }
  
  addResult(category, test, result, isCritical = false) {
    this.total++;
    
    if (!this.categoryStats[category]) {
      this.categoryStats[category] = { total: 0, passed: 0, failed: 0 };
    }
    
    this.categoryStats[category].total++;
    
    if (!result.success) {
      this.failed++;
      this.timeouts++;
      this.categoryStats[category].failed++;
    } else if (result.validation.passed) {
      this.passed++;
      this.categoryStats[category].passed++;
    } else {
      this.failed++;
      this.categoryStats[category].failed++;
      
      if (isCritical) {
        this.critical_failed++;
      }
      
      // Track failure patterns
      for (const error of result.validation.errors) {
        const count = this.failurePatterns.get(error) || 0;
        this.failurePatterns.set(error, count + 1);
      }
    }
    
    if (result.responseTime) {
      this.responseTime.push(result.responseTime);
    }
  }
  
  getPassRate() {
    return this.total > 0 ? Math.round((this.passed / this.total) * 100) : 0;
  }
  
  getCategoryPassRate(category) {
    const stats = this.categoryStats[category];
    return stats && stats.total > 0 ? Math.round((stats.passed / stats.total) * 100) : 0;
  }
  
  getAverageResponseTime() {
    if (this.responseTime.length === 0) return 0;
    const sum = this.responseTime.reduce((a, b) => a + b, 0);
    return Math.round(sum / this.responseTime.length);
  }
  
  getTopFailurePatterns(limit = 10) {
    return Array.from(this.failurePatterns.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, limit);
  }
}

// Main test runner
async function runUltimateTest() {
  console.log('🌊🌊🌊 ULTIMATE COMPREHENSIVE TEST 🌊🌊🌊');
  console.log('=' .repeat(80));
  console.log('최종 광범위 테스트 시작... 모든 가능한 시나리오를 검증합니다.');
  console.log(`테스트 카테고리: ${Object.keys(COMPREHENSIVE_TESTS).length}개`);
  
  let totalTestCount = 0;
  for (const suite of Object.values(COMPREHENSIVE_TESTS)) {
    totalTestCount += suite.tests.length;
  }
  console.log(`총 테스트 케이스: ${totalTestCount}개\n`);
  
  const stats = new TestStats();
  const startTime = Date.now();
  const detailedResults = [];
  
  // Run tests by category
  for (const [categoryKey, category] of Object.entries(COMPREHENSIVE_TESTS)) {
    console.log(`\n${category.name}`);
    console.log('-'.repeat(70));
    
    const categoryResults = [];
    let categoryIndex = 0;
    
    for (const test of category.tests) {
      categoryIndex++;
      const testStart = Date.now();
      
      process.stdout.write(`  [${categoryIndex}/${category.tests.length}] "${test.q?.substring(0, 30) || '(empty)'}${test.q?.length > 30 ? '...' : ''}" `);
      
      // Execute test
      const result = await chat(test.q, test.context || [], { debug: false });
      const responseTime = Date.now() - testStart;
      
      // Validate result
      const validation = validate(result, test);
      
      // Track stats
      stats.addResult(categoryKey, test, { ...result, validation, responseTime }, category.critical);
      
      // Display result
      if (validation.passed) {
        console.log(`✅ (${responseTime}ms)`);
      } else {
        console.log(`❌ (${responseTime}ms)`);
        if (category.critical) {
          console.log(`     🚨 CRITICAL FAILURE`);
        }
        for (const error of validation.errors) {
          console.log(`     └─ ${error}`);
        }
        if (result.response && validation.errors.length > 0) {
          console.log(`     Response: "${result.response.substring(0, 80)}..."`);
        }
      }
      
      // Store detailed result
      categoryResults.push({
        question: test.q,
        context: test.context,
        response: result.response,
        validation,
        responseTime,
        critical: category.critical
      });
      
      // Small delay between tests
      await new Promise(r => setTimeout(r, 1000));
    }
    
    detailedResults.push({
      category: category.name,
      key: categoryKey,
      results: categoryResults,
      passRate: stats.getCategoryPassRate(categoryKey)
    });
    
    // Category summary
    const catPassRate = stats.getCategoryPassRate(categoryKey);
    console.log(`  📊 Category Pass Rate: ${catPassRate}% (${stats.categoryStats[categoryKey].passed}/${stats.categoryStats[categoryKey].total})`);
    
    // Pause between categories
    await new Promise(r => setTimeout(r, 2000));
  }
  
  const duration = Math.round((Date.now() - startTime) / 1000);
  
  // ========== FINAL REPORT ==========
  console.log('\n' + '='.repeat(80));
  console.log('📊 ULTIMATE TEST FINAL REPORT');
  console.log('='.repeat(80));
  
  console.log('\n📈 Overall Statistics:');
  console.log(`  Total Tests: ${stats.total}`);
  console.log(`  Passed: ${stats.passed} ✅`);
  console.log(`  Failed: ${stats.failed} ❌`);
  console.log(`  Critical Failed: ${stats.critical_failed} 🚨`);
  console.log(`  Timeouts: ${stats.timeouts} ⏱️`);
  console.log(`  Overall Pass Rate: ${stats.getPassRate()}%`);
  console.log(`  Average Response Time: ${stats.getAverageResponseTime()}ms`);
  console.log(`  Test Duration: ${duration}s (${Math.round(duration/60)}m ${duration%60}s)`);
  
  console.log('\n📊 Category Performance:');
  const categoryResults = Object.entries(COMPREHENSIVE_TESTS).map(([key, cat]) => ({
    name: cat.name,
    key,
    passRate: stats.getCategoryPassRate(key),
    critical: cat.critical,
    stats: stats.categoryStats[key]
  })).sort((a, b) => a.passRate - b.passRate);
  
  for (const cat of categoryResults) {
    const emoji = cat.passRate >= 90 ? '🏆' : 
                  cat.passRate >= 80 ? '✨' : 
                  cat.passRate >= 70 ? '⭐' :
                  cat.passRate >= 60 ? '⚠️' : '💀';
    console.log(`  ${emoji} ${cat.name}: ${cat.passRate}% (${cat.stats.passed}/${cat.stats.total})`);
    if (cat.critical && cat.passRate < 90) {
      console.log(`     🚨 CRITICAL CATEGORY BELOW 90%!`);
    }
  }
  
  console.log('\n❌ Top Failure Patterns:');
  const topFailures = stats.getTopFailurePatterns(10);
  for (const [pattern, count] of topFailures) {
    console.log(`  - ${pattern}: ${count}x`);
  }
  
  console.log('\n🎯 Critical Categories Status:');
  const criticalCategories = Object.entries(COMPREHENSIVE_TESTS)
    .filter(([_, cat]) => cat.critical)
    .map(([key, cat]) => ({
      name: cat.name,
      passRate: stats.getCategoryPassRate(key)
    }));
  
  for (const cat of criticalCategories) {
    const status = cat.passRate >= 90 ? '✅ PASS' : '❌ FAIL';
    console.log(`  ${cat.name}: ${cat.passRate}% ${status}`);
  }
  
  // Performance Grade
  console.log('\n' + '='.repeat(80));
  const overallPassRate = stats.getPassRate();
  const criticalPass = criticalCategories.every(c => c.passRate >= 80);
  
  if (overallPassRate >= 95 && stats.critical_failed === 0) {
    console.log('🏆🏆🏆 LEGENDARY PERFORMANCE! PRODUCTION READY! 🏆🏆🏆');
    console.log('챗봇이 최고 수준의 성능을 보이고 있습니다!');
  } else if (overallPassRate >= 90 && criticalPass) {
    console.log('🎉🎉 EXCELLENT! Near Perfect Performance! 🎉🎉');
    console.log('약간의 개선만 있으면 완벽합니다.');
  } else if (overallPassRate >= 85 && criticalPass) {
    console.log('✨ VERY GOOD! Minor improvements needed.');
    console.log('핵심 기능은 잘 작동하지만 세부 개선이 필요합니다.');
  } else if (overallPassRate >= 80) {
    console.log('⭐ GOOD! But significant issues remain.');
    console.log('기본 기능은 작동하지만 중요한 문제들이 있습니다.');
  } else if (overallPassRate >= 70) {
    console.log('⚠️ ACCEPTABLE, but major work needed.');
    console.log('많은 개선이 필요합니다.');
  } else if (overallPassRate >= 60) {
    console.log('😰 POOR PERFORMANCE. Extensive fixes required.');
    console.log('심각한 문제들이 있습니다.');
  } else {
    console.log('💀💀💀 CRITICAL FAILURE! NOT READY! 💀💀💀');
    console.log('챗봇이 기본 요구사항을 충족하지 못합니다.');
  }
  
  if (stats.critical_failed > 0) {
    console.log(`\n🚨🚨🚨 WARNING: ${stats.critical_failed} CRITICAL TESTS FAILED! 🚨🚨🚨`);
    console.log('These MUST be fixed immediately!');
  }
  
  // Save results
  const fullReport = {
    timestamp: new Date().toISOString(),
    summary: {
      total: stats.total,
      passed: stats.passed,
      failed: stats.failed,
      critical_failed: stats.critical_failed,
      pass_rate: stats.getPassRate(),
      avg_response_time: stats.getAverageResponseTime(),
      duration_seconds: duration
    },
    categories: categoryResults,
    failure_patterns: topFailures,
    detailed_results: detailedResults
  };
  
  fs.writeFileSync('ultimate-test-results.json', JSON.stringify(fullReport, null, 2));
  console.log('\n📁 Detailed results saved to: ultimate-test-results.json');
  
  // Create summary report
  const summary = `# Ultimate Test Report - ${new Date().toISOString()}

## Overall Results
- **Pass Rate**: ${stats.getPassRate()}%
- **Total Tests**: ${stats.total}
- **Passed**: ${stats.passed}
- **Failed**: ${stats.failed}
- **Critical Failed**: ${stats.critical_failed}

## Category Performance
${categoryResults.map(c => `- ${c.name}: ${c.passRate}%${c.critical ? ' (CRITICAL)' : ''}`).join('\n')}

## Top Issues
${topFailures.map(([p, c]) => `- ${p}: ${c}x`).join('\n')}
`;
  
  fs.writeFileSync('ultimate-test-summary.md', summary);
  console.log('📝 Summary report saved to: ultimate-test-summary.md');
  
  return overallPassRate;
}

// Execute test
console.log('🚀 Starting Ultimate Comprehensive Test...\n');
console.log('⚠️ This will take approximately 10-15 minutes.\n');

runUltimateTest()
  .then(passRate => {
    console.log(`\n✅ Test completed with ${passRate}% pass rate`);
    process.exit(passRate >= 70 ? 0 : 1);
  })
  .catch(error => {
    console.error('💥 Fatal error:', error);
    process.exit(1);
  });