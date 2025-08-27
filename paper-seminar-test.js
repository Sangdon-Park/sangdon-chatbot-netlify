// Test to verify papers and seminars don't mix
const fetch = require('node-fetch');

const PROD_URL = 'https://sangdon-chatbot.netlify.app/.netlify/functions/chat-ai-driven';

async function testQuery(query) {
  console.log(`\n📝 Testing: "${query}"`);
  console.log('=' .repeat(50));
  
  // Step 1
  const res1 = await fetch(PROD_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message: query, step: 1 })
  });
  const data1 = await res1.json();
  
  // Step 2
  if (data1.action === 'SEARCH') {
    const res2 = await fetch(PROD_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: query,
        step: 2,
        action: data1.action,
        query: data1.query || query
      })
    });
    const data2 = await res2.json();
    
    // Analyze search results
    const searchResults = data2.searchResults || [];
    const papers = searchResults.filter(r => r.includes('[논문]')).length;
    const seminars = searchResults.filter(r => r.includes('[세미나]') || r.includes('[초청강연]')).length;
    const others = searchResults.length - papers - seminars;
    
    console.log(`📊 Search Results: Total=${searchResults.length}`);
    console.log(`   Papers: ${papers}`);
    console.log(`   Seminars: ${seminars}`);
    console.log(`   Others: ${others}`);
    
    // Show first few results
    console.log('\n📚 First 5 results:');
    searchResults.slice(0, 5).forEach(r => {
      const type = r.includes('[논문]') ? '📄' : r.includes('[세미나]') ? '🎤' : '📌';
      console.log(`   ${type} ${r.substring(0, 80)}...`);
    });
    
    // Check for issues
    const issues = [];
    if (query.includes('논문') && seminars > 0) {
      issues.push(`❌ Paper query returned ${seminars} seminar results`);
    }
    if (query.includes('세미나') && papers > 0) {
      issues.push(`❌ Seminar query returned ${papers} paper results`);
    }
    
    if (issues.length > 0) {
      console.log('\n⚠️ Issues:');
      issues.forEach(i => console.log(`   ${i}`));
    } else {
      console.log('\n✅ Search correctly filtered');
    }
    
    console.log(`\n💬 Reply: ${data2.reply.substring(0, 100)}...`);
    
    return { papers, seminars, others, hasIssues: issues.length > 0 };
  }
  
  return { papers: 0, seminars: 0, others: 0, hasIssues: false };
}

async function runTests() {
  console.log('🎯 논문/세미나 분리 테스트');
  console.log('=' .repeat(50));
  
  const tests = [
    '논문 총 몇 편 썼어?',
    '세미나 몇 번 했어?',
    '최준균 교수님과 쓴 논문 보여줘',
    'AI 세미나에 대해 알려줘',
    '논문 목록 보여줘',
    '세미나 일정 알려줘'
  ];
  
  const results = [];
  
  for (const test of tests) {
    const result = await testQuery(test);
    results.push({ query: test, ...result });
    await new Promise(r => setTimeout(r, 1500));
  }
  
  // Summary
  console.log('\n' + '=' .repeat(50));
  console.log('📊 종합 결과');
  console.log('=' .repeat(50));
  
  const failedTests = results.filter(r => r.hasIssues).length;
  const passedTests = results.length - failedTests;
  
  console.log(`✅ Passed: ${passedTests}/${results.length}`);
  console.log(`❌ Failed: ${failedTests}/${results.length}`);
  
  if (failedTests === 0) {
    console.log('\n🎉 모든 테스트 통과! 논문과 세미나가 올바르게 구분됩니다.');
  } else {
    console.log('\n⚠️ 일부 쿼리에서 논문과 세미나가 섞입니다.');
  }
}

runTests().catch(console.error);