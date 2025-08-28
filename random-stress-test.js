// 🎲 RANDOM STRESS TEST - 무작위 스트레스 테스트
const fetch = require('node-fetch');
const fs = require('fs');

const BASE_URL = 'https://sangdon-chatbot.netlify.app/.netlify/functions/chat-ai-driven';

// Question components for random generation
const QUESTION_COMPONENTS = {
  subjects: [
    '세미나', '논문', '가격', '비용', '연락처', '이메일', 
    '학력', '경력', 'AI', 'LLM', '강연', '초청강연',
    '박사', '석사', 'KAIST', '고려대', '경상국립대'
  ],
  
  verbs: [
    '몇 번', '몇 편', '얼마', '어떻게', '언제', '어디',
    '뭐야', '알려줘', '말해줘', '있어', '했어', '맞아',
    '맞죠', '맞지', '맞나요', '확실해', '진짜야'
  ],
  
  numbers: ['13', '25', '50만원', '1-2시간', '7월', '8월 25일', '2022', '2017'],
  
  connectors: ['그리고', '또', '아니면', '그럼', '근데', '그래서', '하고', '랑', '이랑'],
  
  endings: ['?', '??', '???', '!', '.', '...', '~', '요?', '요', '나요?', '가요?', '죠?'],
  
  typos: [
    ['세미나', '쎄미나'],
    ['논문', '논뮨'],
    ['얼마', '엄마'],
    ['연락처', '연락쳐'],
    ['KAIST', 'kaist'],
    ['박상돈', '박상동']
  ],
  
  english: [
    'How much', 'How many', 'When', 'Where', 'Contact',
    'Email', 'Seminar', 'Paper', 'Price', 'PhD'
  ]
};

// Critical information that must be correct
const CRITICAL_INFO = {
  seminar_count: { value: '13', forbidden: ['25'] },
  paper_count: { value: '25', forbidden: ['13'] },
  price: { value: '50만원', alternatives: ['50'] },
  email: { value: 'chaos@sayberrygames.com' },
  university: { value: 'KAIST' },
  korea_date: { value: '7월', forbidden: ['2025', '2024'] },
  gsu_date: { value: '8월 25일', forbidden: ['25편', '논문'] }
};

// Generate random question
function generateRandomQuestion() {
  const strategies = [
    generateSimpleQuestion,
    generateCompoundQuestion,
    generateConfirmationQuestion,
    generateTypoQuestion,
    generateMixedLanguageQuestion,
    generateNumberFocusedQuestion,
    generateUltraShortQuestion,
    generateRepetitiveQuestion
  ];
  
  const strategy = strategies[Math.floor(Math.random() * strategies.length)];
  return strategy();
}

function generateSimpleQuestion() {
  const subject = QUESTION_COMPONENTS.subjects[Math.floor(Math.random() * QUESTION_COMPONENTS.subjects.length)];
  const verb = QUESTION_COMPONENTS.verbs[Math.floor(Math.random() * QUESTION_COMPONENTS.verbs.length)];
  const ending = QUESTION_COMPONENTS.endings[Math.floor(Math.random() * QUESTION_COMPONENTS.endings.length)];
  return `${subject} ${verb}${ending}`;
}

function generateCompoundQuestion() {
  const q1 = generateSimpleQuestion();
  const connector = QUESTION_COMPONENTS.connectors[Math.floor(Math.random() * QUESTION_COMPONENTS.connectors.length)];
  const q2 = generateSimpleQuestion();
  return `${q1.replace(/[?.!]+$/, '')} ${connector} ${q2}`;
}

function generateConfirmationQuestion() {
  const number = QUESTION_COMPONENTS.numbers[Math.floor(Math.random() * QUESTION_COMPONENTS.numbers.length)];
  const confirmations = ['맞아', '맞죠', '맞지', '맞나요', '확실해', '진짜야'];
  const confirmation = confirmations[Math.floor(Math.random() * confirmations.length)];
  return `${number} ${confirmation}?`;
}

function generateTypoQuestion() {
  const question = generateSimpleQuestion();
  let typoQuestion = question;
  
  for (const [correct, typo] of QUESTION_COMPONENTS.typos) {
    if (question.includes(correct)) {
      typoQuestion = typoQuestion.replace(correct, typo);
      break;
    }
  }
  
  return typoQuestion;
}

function generateMixedLanguageQuestion() {
  const english = QUESTION_COMPONENTS.english[Math.floor(Math.random() * QUESTION_COMPONENTS.english.length)];
  const korean = QUESTION_COMPONENTS.subjects[Math.floor(Math.random() * QUESTION_COMPONENTS.subjects.length)];
  return `${english} ${korean}?`;
}

function generateNumberFocusedQuestion() {
  const numbers = ['13', '25', '50', '1', '2', '7', '8'];
  const number = numbers[Math.floor(Math.random() * numbers.length)];
  const context = ['회', '편', '만원', '시간', '월', '일'];
  const ctx = context[Math.floor(Math.random() * context.length)];
  return `${number}${ctx}?`;
}

function generateUltraShortQuestion() {
  const shorts = ['몇', '언제', '얼마', '어디', '뭐', '?', '13', '25', '50'];
  return shorts[Math.floor(Math.random() * shorts.length)];
}

function generateRepetitiveQuestion() {
  const word = QUESTION_COMPONENTS.subjects[Math.floor(Math.random() * QUESTION_COMPONENTS.subjects.length)];
  const repeat = Math.floor(Math.random() * 3) + 2;
  return Array(repeat).fill(word).join('') + '?';
}

// Validate response based on question context
function validateResponse(question, response) {
  if (!response) {
    return { passed: false, error: 'No response' };
  }
  
  const qLower = question.toLowerCase();
  const rLower = response.toLowerCase();
  
  // Check for critical information accuracy
  const errors = [];
  
  // Seminar count check
  if (qLower.includes('세미나') && (qLower.includes('몇') || qLower.includes('횟수') || qLower.includes('회'))) {
    if (!rLower.includes('13')) {
      errors.push('Missing seminar count 13');
    }
    if (rLower.includes('25')) {
      errors.push('Incorrectly includes 25 for seminar');
    }
  }
  
  // Paper count check
  if (qLower.includes('논문') && (qLower.includes('몇') || qLower.includes('개수') || qLower.includes('편'))) {
    if (!rLower.includes('25')) {
      errors.push('Missing paper count 25');
    }
    if (rLower.includes('13')) {
      errors.push('Incorrectly includes 13 for paper');
    }
  }
  
  // Price check
  if (qLower.includes('얼마') || qLower.includes('비용') || qLower.includes('가격')) {
    if (!rLower.includes('50만원') && !rLower.includes('50')) {
      errors.push('Missing price 50만원');
    }
  }
  
  // Contact check
  if (qLower.includes('연락') || qLower.includes('이메일') || qLower.includes('신청')) {
    if (!rLower.includes('chaos@sayberrygames.com')) {
      errors.push('Missing email');
    }
  }
  
  // Confirmation check
  if (qLower.includes('맞아') || qLower.includes('맞죠') || qLower.includes('맞지')) {
    if (!rLower.startsWith('네') && !rLower.startsWith('맞')) {
      errors.push('Confirmation should start with 네 or 맞');
    }
  }
  
  // Response length check
  if (response.length < 5 && question.length > 2) {
    errors.push('Response too short');
  }
  
  return {
    passed: errors.length === 0,
    errors: errors
  };
}

// Chat function
async function chat(message) {
  try {
    const response1 = await fetch(BASE_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message, step: 1 }),
      timeout: 10000
    });
    
    if (!response1.ok) return null;
    const data1 = await response1.json();
    
    if (data1.needsSecondStep) {
      const response2 = await fetch(BASE_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message, step: 2,
          action: data1.action, query: data1.query
        }),
        timeout: 10000
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

// Run random stress test
async function runRandomStressTest(iterations = 100) {
  console.log('🎲 RANDOM STRESS TEST');
  console.log('=' .repeat(70));
  console.log(`무작위로 ${iterations}개의 질문을 생성하여 테스트합니다.\n`);
  
  const results = {
    total: iterations,
    passed: 0,
    failed: 0,
    errors: {},
    questionTypes: {},
    responseTimes: []
  };
  
  const startTime = Date.now();
  
  for (let i = 0; i < iterations; i++) {
    const question = generateRandomQuestion();
    const questionType = detectQuestionType(question);
    
    process.stdout.write(`[${i + 1}/${iterations}] "${question.substring(0, 30)}${question.length > 30 ? '...' : ''}" `);
    
    const testStart = Date.now();
    const response = await chat(question);
    const responseTime = Date.now() - testStart;
    
    results.responseTimes.push(responseTime);
    
    // Track question types
    if (!results.questionTypes[questionType]) {
      results.questionTypes[questionType] = { total: 0, passed: 0, failed: 0 };
    }
    results.questionTypes[questionType].total++;
    
    // Validate response
    const validation = validateResponse(question, response);
    
    if (validation.passed) {
      console.log(`✅ (${responseTime}ms)`);
      results.passed++;
      results.questionTypes[questionType].passed++;
    } else {
      console.log(`❌ (${responseTime}ms)`);
      results.failed++;
      results.questionTypes[questionType].failed++;
      
      // Track error types
      for (const error of validation.errors) {
        if (!results.errors[error]) {
          results.errors[error] = 0;
        }
        results.errors[error]++;
      }
      
      if (validation.errors.length > 0) {
        console.log(`    Errors: ${validation.errors.join(', ')}`);
      }
    }
    
    // Small delay to avoid rate limiting
    await new Promise(r => setTimeout(r, 1000));
  }
  
  const duration = Math.round((Date.now() - startTime) / 1000);
  
  // Calculate statistics
  const avgResponseTime = Math.round(results.responseTimes.reduce((a, b) => a + b, 0) / results.responseTimes.length);
  const passRate = Math.round((results.passed / results.total) * 100);
  
  // Final report
  console.log('\n' + '='.repeat(70));
  console.log('📊 RANDOM STRESS TEST RESULTS');
  console.log('='.repeat(70));
  
  console.log('\n📈 Overall Statistics:');
  console.log(`  Total Tests: ${results.total}`);
  console.log(`  Passed: ${results.passed} ✅`);
  console.log(`  Failed: ${results.failed} ❌`);
  console.log(`  Pass Rate: ${passRate}%`);
  console.log(`  Average Response Time: ${avgResponseTime}ms`);
  console.log(`  Total Duration: ${duration}s`);
  
  console.log('\n📊 Question Type Performance:');
  for (const [type, stats] of Object.entries(results.questionTypes)) {
    const typePassRate = Math.round((stats.passed / stats.total) * 100);
    console.log(`  ${type}: ${typePassRate}% (${stats.passed}/${stats.total})`);
  }
  
  console.log('\n❌ Top Error Types:');
  const topErrors = Object.entries(results.errors)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);
  for (const [error, count] of topErrors) {
    console.log(`  - ${error}: ${count}x`);
  }
  
  // Performance grade
  console.log('\n' + '='.repeat(70));
  if (passRate >= 90) {
    console.log('🏆 EXCELLENT! Handles random questions very well!');
  } else if (passRate >= 80) {
    console.log('✨ VERY GOOD! Most random questions handled correctly.');
  } else if (passRate >= 70) {
    console.log('⭐ GOOD! But struggles with some random patterns.');
  } else if (passRate >= 60) {
    console.log('⚠️ ACCEPTABLE, but many random questions fail.');
  } else {
    console.log('💀 POOR! Cannot handle random questions well.');
  }
  
  // Save results
  const fullResults = {
    timestamp: new Date().toISOString(),
    summary: {
      total: results.total,
      passed: results.passed,
      failed: results.failed,
      passRate: passRate,
      avgResponseTime: avgResponseTime,
      duration: duration
    },
    questionTypes: results.questionTypes,
    errors: results.errors
  };
  
  fs.writeFileSync('random-stress-results.json', JSON.stringify(fullResults, null, 2));
  console.log('\n📁 Results saved to: random-stress-results.json');
}

// Detect question type for statistics
function detectQuestionType(question) {
  const qLower = question.toLowerCase();
  
  if (qLower.includes('세미나')) return 'seminar';
  if (qLower.includes('논문')) return 'paper';
  if (qLower.includes('얼마') || qLower.includes('비용')) return 'price';
  if (qLower.includes('연락') || qLower.includes('이메일')) return 'contact';
  if (qLower.includes('맞아') || qLower.includes('맞죠')) return 'confirmation';
  if (qLower.includes('kaist') || qLower.includes('학교')) return 'education';
  if (qLower.length < 5) return 'ultra_short';
  if (/[a-z]/i.test(question)) return 'mixed_language';
  if (/(\w)\1{2,}/.test(question)) return 'repetitive';
  
  return 'general';
}

// Run test
const iterations = process.argv[2] ? parseInt(process.argv[2]) : 100;
console.log('🚀 Starting Random Stress Test...\n');
console.log(`📝 Generating ${iterations} random questions...\n`);

runRandomStressTest(iterations).catch(console.error);