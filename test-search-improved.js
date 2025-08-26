// Test improved search
const talks = [
  { title: "AI Agent와 미래 혁신", type: "ai_seminar", venue: "부경대학교 산학협력단", year: 2025, date: "2025년 2월 3일", 
    keywords: ["AI", "에이전트", "미래", "혁신", "부경대", "seminar", "세미나", "강연", "초청강연", 
               "강연료", "50만원", "500000", "비용", "얼마", "1시간 30분"], fee: 500000 },
];

// Test keyword search
function testKeywordSearch(query, database) {
  const queryLower = query.toLowerCase();
  const results = [];
  
  for (const item of database) {
    // Join ALL fields including keywords array
    const searchText = [
      item.title || '',
      item.venue || '',
      ...(item.keywords || [])  // Spread keywords array
    ].join(' ').toLowerCase();
    
    console.log(`Checking "${query}" in: ${searchText.substring(0, 100)}...`);
    
    if (searchText.includes(queryLower)) {
      results.push(item);
    }
  }
  
  return results;
}

// Test
const queries = ['50만원', '500000', '강연료', '비용'];

queries.forEach(query => {
  const results = testKeywordSearch(query, talks);
  console.log(`\nQuery: "${query}"`);
  console.log(`Found: ${results.length > 0 ? 'YES ✅' : 'NO ❌'}`);
});