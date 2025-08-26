# Sangdon Park Chatbot Complete Setup

## System Overview
Professor Sangdon Park's AI chatbot system with:
- Frontend: Sangdon-Park.github.io (static site)
- Backend: sangdon-chatbot-netlify (Netlify Functions)
- Database: Supabase PostgreSQL for conversation logging
- AI: Google Gemini (2.5 Flash for chat, text-embedding-004 for embeddings)

## Architecture
- **Two-step AI process**: Intent classification (SEARCH/GENERAL/CHAT) → Response generation
- **RAG System**: Embedding-based semantic search with cosine similarity
- **Serverless**: Netlify Functions for backend API
- **Cross-origin**: CORS configured for sangdon-park.github.io

## Database: 25 Real Papers (from publications.html)
```javascript
// 2024 (2 papers)
{ title: "Real-Time Dynamic Pricing for Edge Computing Services: A Market Perspective", journal: "IEEE Access", year: 2024, role: "1저자", authors: ["박상돈", "배소희", "이주형", "성영철"] }
{ title: "Dynamic Bandwidth Slicing in Passive Optical Networks to Empower Federated Learning", journal: "Sensors", year: 2024, role: "교신", authors: ["Alaelddin F. Y. Mohammed", "이주형", "박상돈"] }

// 2022 (5 papers)
{ title: "Differential Pricing-Based Task Offloading...", authors: ["서현석", "오현택", "최준균", "박상돈"] }
{ title: "Joint Subcarrier and Transmission Power...", authors: ["한재섭", "이경호", "박상돈", "최준균"] }
{ title: "A Novel Cooperative Transmission Scheme...", authors: ["Yue Zang", "Yuyang Peng", "박상돈", "Han Hai", "Fawaz Al-Hazemi", "Mohammad Meraj Mirza"] }
{ title: "Power Scheduling Scheme for a Charging Facility...", authors: ["김장겸", "이주형", "박상돈", "최준균"] }
{ title: "A Multivariate-Time-Series-Prediction-Based...", authors: ["한재섭", "이경호", "박상돈", "최준균"] }

// 2021 (2 papers)
{ title: "Lane Detection Aided Online Dead Reckoning...", authors: ["전진환", "황윤진", "정용섭", "박상돈", "권인소", "최세범"] }
{ title: "Deposit Decision Model for Data Brokers...", authors: ["오현택", "박상돈", "최준균", "노성기"] }

// 2020 (3 papers)
{ title: "Three Dynamic Pricing Schemes...", authors: ["백범한", "이주형", "Yuyang Peng", "박상돈"] }
{ title: "Competitive Data Trading Model...", authors: ["오현택", "박상돈", "Gyu Myoung Lee", "최준균", "노성기"] }
{ title: "Time Series Forecasting Based Day-Ahead...", authors: ["정교훈", "박상돈", "황강욱"] }

// 2019 (6 papers)
{ title: "Battery-Wear-Model-Based Energy Trading...", authors: ["김장겸", "이주형", "박상돈", "최준균"] }
{ title: "Optimal throughput analysis...", authors: ["박상돈", "황강욱", "최준균"] }
{ title: "Energy-efficient cooperative transmission...", authors: ["Yuyang Peng", "Jun Li", "박상돈", "Konglin Zhu", "Mohammad Mehedi Hassan", "Ahmed Alsanad"] }
{ title: "Power Efficient Clustering Scheme...", authors: ["안재원", "이주형", "박상돈", "박홍식"] }
{ title: "Personal Data Trading Scheme...", authors: ["오현택", "박상돈", "Gyu Myoung Lee", "허환조", "최준균"] }
{ title: "Comparison Between Seller and Buyer...", authors: ["배소희", "박상돈"] }

// 2018 (4 papers)
{ title: "Load Profile Extraction by Mean-Shift...", authors: ["김나경", "박상돈", "이주형", "최준균"] }
{ title: "An Optimal Pricing Scheme...", authors: ["김성환", "박상돈", "Min Chen", "윤찬현"] }
{ title: "Three Hierarchical Levels of Big-Data...", authors: ["장부식", "박상돈", "이주형", "한상근"] }
{ title: "Competitive Partial Computation...", authors: ["안상홍", "이주형", "박상돈", "S.H. Shah Newaz", "최준균"] }

// 2017 (2 papers)
{ title: "Event-Driven Energy Trading System...", authors: ["박상돈", "이주형", "황강욱", "최준균"] }
{ title: "Learning-Based Adaptive Imputation...", authors: ["김민경", "박상돈", "이주형", "주용재", "최준균"] }

// 2016 (1 paper - IEEE ITeN 선정)
{ title: "Contribution-Based Energy-Trading Mechanism...", journal: "IEEE Transactions on Industrial Electronics", year: 2016, role: "1저자", authors: ["박상돈", "이주형", "배소희", "황강욱", "최준균"], award: "IEEE ITeN 선정" }
```

## Database: 9 Real Seminars (from ko.html, 2023-2025)
```javascript
{ name: "부경대학교 산학협력단", date: "2025년 2월 3일", topic: "AI Agent와 미래 혁신", time: "10:00-11:30", fee: 500000 }
{ name: "KAIST RIPE", date: "2025년 1월 14일", topic: "디지털 트윈과 메타버스의 연구 동향", time: "14:00-15:30", fee: 500000 }
{ name: "한국AI교육학회", date: "2024년 12월 11일", topic: "AI교육", time: "10:00-11:30", fee: 500000 }
{ name: "충남대학교 SW융합교육원", date: "2024년 11월 16일", topic: "AI교육과 미래 직업", time: "16:00-17:30", fee: 500000 }
{ name: "경북대학교 AI대학원", date: "2024년 5월 23일", topic: "머신러닝 최적화", time: "14:00-15:30", fee: 500000 }
{ name: "서강대학교 데이터사이언스학과", date: "2024년 4월 9일", topic: "대규모 언어모델", time: "16:00-17:30", fee: 500000 }
{ name: "성균관대 글로벌융합학부", date: "2024년 3월 15일", topic: "AI와 윤리", time: "10:00-11:30", fee: 500000 }
{ name: "포항공대 컴퓨터공학과", date: "2023년 11월 28일", topic: "분산 인공지능", time: "14:00-15:30", fee: 500000 }
{ name: "연세대 공학교육혁신센터", date: "2023년 10월 12일", topic: "엣지컴퓨팅", time: "15:00-16:30", fee: 500000 }
```

## Technical Implementation

### Embedding Search (chat-ai-driven.js)
```javascript
async function embeddingSearch(query, papers, posts, maxResults = 5, includeTalks = true) {
  const queryEmbedding = await getEmbedding(query, GEMINI_API_KEY);
  
  // Search papers
  for (const paper of papers) {
    const embedding = await getEmbedding(label, GEMINI_API_KEY);
    const similarity = cosineSimilarity(queryEmbedding, embedding);
    if (similarity > 0.3) results.push({ label, score: similarity });
  }
  
  // Search talks
  if (includeTalks && talks) {
    // Similar process for talks...
  }
  
  // Sort by similarity and return top results
  return results.sort((a, b) => b.score - a.score).slice(0, maxResults);
}
```

### Two-Step AI Process
1. **Step 1**: Intent Classification → SEARCH/GENERAL/CHAT
2. **Step 2**: Response Generation with retrieved context

### Supabase Logging Fix
- Added support for both SUPABASE_SERVICE_KEY and SUPABASE_ANON_KEY
- Fixed missing Step 1 CHAT response logging
- Environment variables: SUPABASE_URL, SUPABASE_SERVICE_KEY/SUPABASE_ANON_KEY

## Deployment
- **Backend**: Deployed to Netlify (sangdon-chatbot.netlify.app)
- **Frontend**: GitHub Pages (sangdon-park.github.io)
- **Environment Variables**: Set in Netlify dashboard
- **CORS**: Configured for sangdon-park.github.io

## Testing
```bash
# Local development
npm run dev  # Runs on localhost:8888

# Test endpoints
curl http://localhost:8888/.netlify/functions/chat-ai-driven
curl http://localhost:8888/.netlify/functions/search-ai-driven
```

## Known Issues
1. **Search accuracy**: Talks/seminars not being found well in search
2. **Intent classification**: Often misclassifies as CHAT instead of SEARCH
3. **Hallucination**: AI sometimes generates incorrect information
4. **Search integration**: Retrieved results not always reflected in responses

## Git Configuration
- Name: Sangdon-Park
- Email: chaos@sayberrygames.com

## Important Notes
- Seminar fee: 500,000원 per seminar (NOT 50,000원)
- Duration: 1.5 hours per seminar
- All 25 papers are real from publications.html
- All 9 seminars are real from ko.html
- NO papers with "김민수" (that was hallucination)