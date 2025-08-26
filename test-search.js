// Test search functionality directly
const fs = require('fs');

// Load the module
const chatModule = fs.readFileSync('./netlify/functions/chat-ai-driven.js', 'utf8');

// Extract TALKS_DATABASE
const talksMatch = chatModule.match(/const TALKS_DATABASE = \[([\s\S]*?)\];/);
if (talksMatch) {
  console.log('✅ TALKS_DATABASE found');
  const talks = eval('[' + talksMatch[1] + ']');
  console.log(`Found ${talks.length} talks\n`);
  
  // Check for seminar fees
  const withFees = talks.filter(t => t.fee === 500000);
  console.log(`Talks with 500,000 KRW fee: ${withFees.length}`);
  
  // List all talks
  talks.forEach((t, i) => {
    console.log(`${i+1}. ${t.title}`);
    console.log(`   Venue: ${t.venue}`);
    console.log(`   Date: ${t.date}`);
    console.log(`   Fee: ${t.fee}원`);
    console.log(`   Keywords: ${t.keywords.join(', ')}`);
    console.log();
  });
}

// Test keyword search function
console.log('\n' + '='.repeat(50));
console.log('Testing Keyword Search');
console.log('='.repeat(50));

// Simple keyword search test
function testKeywordSearch(query, database) {
  const queryLower = query.toLowerCase();
  const results = [];
  
  for (const item of database) {
    const searchText = [
      item.title || '',
      item.venue || '',
      ...(item.keywords || [])
    ].join(' ').toLowerCase();
    
    if (searchText.includes(queryLower)) {
      results.push(item);
    }
  }
  
  return results;
}

// Test queries
const testQueries = [
  '세미나',
  '강연료',
  'KAIST',
  '부경대',
  'AI',
  '50만원',
  '500000'
];

const talks = [
  { title: "AI Agent와 미래 혁신", type: "ai_seminar", venue: "부경대학교 산학협력단", year: 2025, date: "2025년 2월 3일", keywords: ["AI", "에이전트", "미래", "혁신", "부경대", "seminar", "세미나", "강연", "초청강연"], fee: 500000 },
  { title: "디지털 트윈과 메타버스의 연구 동향", type: "ai_seminar", venue: "KAIST RIPE", year: 2025, date: "2025년 1월 14일", keywords: ["디지털트윈", "메타버스", "연구동향", "KAIST", "seminar", "세미나", "강연", "초청강연"], fee: 500000 },
  { title: "AI교육", type: "ai_seminar", venue: "한국AI교육학회", year: 2024, date: "2024년 12월 11일", keywords: ["AI교육", "교육", "학회", "seminar", "세미나", "강연", "초청강연"], fee: 500000 },
  { title: "AI교육과 미래 직업", type: "ai_seminar", venue: "충남대학교 SW융합교육원", year: 2024, date: "2024년 11월 16일", keywords: ["AI교육", "미래직업", "충남대", "SW융합", "seminar", "세미나", "강연", "초청강연"], fee: 500000 },
  { title: "머신러닝 최적화", type: "ai_seminar", venue: "경북대학교 AI대학원", year: 2024, date: "2024년 5월 23일", keywords: ["머신러닝", "최적화", "경북대", "AI대학원", "seminar", "세미나", "강연", "초청강연"], fee: 500000 },
  { title: "대규모 언어모델", type: "ai_seminar", venue: "서강대학교 데이터사이언스학과", year: 2024, date: "2024년 4월 9일", keywords: ["LLM", "언어모델", "서강대", "데이터사이언스", "seminar", "세미나", "강연", "초청강연"], fee: 500000 },
  { title: "AI와 윤리", type: "ai_seminar", venue: "성균관대 글로벌융합학부", year: 2024, date: "2024년 3월 15일", keywords: ["AI윤리", "윤리", "성균관대", "seminar", "세미나", "강연", "초청강연"], fee: 500000 },
  { title: "분산 인공지능", type: "ai_seminar", venue: "포항공대 컴퓨터공학과", year: 2023, date: "2023년 11월 28일", keywords: ["분산인공지능", "포항공대", "POSTECH", "seminar", "세미나", "강연", "초청강연"], fee: 500000 },
  { title: "엣지컴퓨팅", type: "ai_seminar", venue: "연세대 공학교육혁신센터", year: 2023, date: "2023년 10월 12일", keywords: ["엣지컴퓨팅", "연세대", "공학교육", "seminar", "세미나", "강연", "초청강연"], fee: 500000 }
];

testQueries.forEach(query => {
  const results = testKeywordSearch(query, talks);
  console.log(`\nQuery: "${query}"`);
  console.log(`Results: ${results.length}`);
  if (results.length > 0) {
    results.forEach(r => console.log(`  - ${r.title} (${r.venue})`));
  }
});