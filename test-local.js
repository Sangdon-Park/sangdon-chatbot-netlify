// Local test without external APIs
const { handler } = require('./netlify/functions/chat-ai-driven');

// Mock event for testing
function createMockEvent(body) {
  return {
    httpMethod: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-forwarded-for': '127.0.0.1',
      'user-agent': 'test-suite'
    },
    body: JSON.stringify(body)
  };
}

// Test cases
const TESTS = [
  { message: 'AI 세미나 얼마야?', expectAction: 'SEARCH', expectKeyword: '세미나' },
  { message: '강연료 얼마 받아?', expectAction: 'SEARCH', expectKeyword: '강연료' },
  { message: '세미나 몇 번 했어?', expectAction: 'SEARCH', expectKeyword: '세미나' },
  { message: '논문 몇 편이야?', expectAction: 'SEARCH', expectKeyword: '논문' },
  { message: 'KAIST에서 세미나 했어?', expectAction: 'SEARCH', expectKeyword: 'KAIST' },
  { message: '황강욱 교수님과 쓴 논문?', expectAction: 'SEARCH', expectKeyword: '황강욱' },
  { message: '안녕하세요', expectAction: 'CHAT', expectKeyword: null },
  { message: '감사합니다', expectAction: 'CHAT', expectKeyword: null }
];

async function runTests() {
  console.log('🧪 Running Local Tests (without API)\n');
  
  // Set mock API key
  process.env.GEMINI_API_KEY = 'test-key-12345';
  
  for (const test of TESTS) {
    console.log(`\nTest: "${test.message}"`);
    console.log('-'.repeat(40));
    
    try {
      // Test Step 1
      const event = createMockEvent({ message: test.message, step: 1 });
      const response = await handler(event);
      
      if (response.statusCode === 200) {
        const data = JSON.parse(response.body);
        
        // Check action
        const actionMatch = data.action === test.expectAction;
        console.log(`Action: ${data.action} (expected: ${test.expectAction}) ${actionMatch ? '✅' : '❌'}`);
        
        // Check query contains keyword
        if (test.expectKeyword && data.query) {
          const hasKeyword = data.query.toLowerCase().includes(test.expectKeyword.toLowerCase());
          console.log(`Query contains "${test.expectKeyword}": ${hasKeyword ? '✅' : '❌'}`);
        }
        
        // Show initial message
        if (data.initialMessage) {
          console.log(`Initial: ${data.initialMessage.substring(0, 50)}...`);
        }
      } else {
        console.log(`❌ Error: ${response.statusCode}`);
      }
    } catch (error) {
      console.log(`❌ Error: ${error.message}`);
    }
  }
}

runTests();