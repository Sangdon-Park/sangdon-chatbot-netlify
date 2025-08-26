const fetch = require('node-fetch');
const { createClient } = require('@supabase/supabase-js');
const { getCachedEmbedding, setCachedEmbedding } = require('./embeddings-cache');

// Enhanced database with proper search capability
const POSTS_DATABASE = [
  { title: "AI LLM에 미쳐있던 8개월", type: "article", keywords: ["AI", "LLM", "ChatGPT", "Claude", "Gemini"], year: 2024 },
  { title: "AI 없이는 불가능했던 동대표 활동", type: "article", keywords: ["AI", "동대표", "자동화"], year: 2024 },
  { title: "Serena MCP 설치 가이드", type: "article", keywords: ["Serena", "MCP", "Claude Code"], year: 2024 },
  { title: "Edge Computing GUI Simulator 프로젝트", type: "project", keywords: ["edge computing", "simulator", "GUI"], year: 2024, description: "4년 염원 1개월 완성" },
  { title: "AI 캐릭터 대화 시스템", type: "project", keywords: ["AI", "character", "Gemini", "Harry Potter"], year: 2024, description: "해리포터 캐릭터 구현" }
];

// Invited Talks and Seminars database
const TALKS_DATABASE = [
  { title: "Future of Edge Computing and AI", type: "invited_talk", venue: "KAIST AI Conference", year: 2024, keywords: ["edge computing", "AI", "future"], location: "Daejeon, Korea" },
  { title: "Energy Trading in Smart Grids", type: "seminar", venue: "Seoul National University", year: 2023, keywords: ["energy", "smart grid", "trading"], location: "Seoul, Korea" },
  { title: "IoT Security and Privacy", type: "invited_talk", venue: "IEEE IoT Summit", year: 2023, keywords: ["IoT", "security", "privacy"], location: "Singapore" },
  { title: "Machine Learning for Energy Systems", type: "seminar", venue: "POSTECH", year: 2022, keywords: ["machine learning", "energy", "optimization"], location: "Pohang, Korea" },
  { title: "5G Edge Computing Architecture", type: "invited_talk", venue: "Samsung Research", year: 2022, keywords: ["5G", "edge computing", "MEC"], location: "Suwon, Korea" },
  { title: "Federated Learning in IoT", type: "seminar", venue: "ETRI", year: 2021, keywords: ["federated learning", "IoT", "distributed"], location: "Daejeon, Korea" },
  { title: "Blockchain for Energy Trading", type: "invited_talk", venue: "International Energy Conference", year: 2021, keywords: ["blockchain", "energy", "trading"], location: "Online" },
  { title: "AI-Driven Network Optimization", type: "seminar", venue: "Yonsei University", year: 2020, keywords: ["AI", "network", "optimization"], location: "Seoul, Korea" }
];

const PAPERS_DATABASE = [
  // 2024
  { title: "Real-Time Dynamic Pricing for Edge Computing Services", journal: "IEEE Access", year: 2024, role: "1저자", authors: ["박상돈"], keywords: ["edge computing", "pricing", "real-time"] },
  { title: "Dynamic Bandwidth Slicing in PON for Federated Learning", journal: "Sensors", year: 2024, role: "교신", authors: ["박상돈"], keywords: ["PON", "federated learning", "bandwidth"] },
  
  // 2022
  { title: "Differential Pricing-Based Task Offloading for IoT", journal: "IEEE IoT Journal", year: 2022, role: "교신", authors: ["박상돈", "오현택", "최준균"], keywords: ["IoT", "pricing", "task offloading"] },
  { title: "Joint Subcarrier and Transmission Power in WPT System", journal: "IEEE IoT Journal", year: 2022, role: "교신", authors: ["박상돈", "최준균"], keywords: ["WPT", "power", "IoT"] },
  { title: "Multivariate-Time-Series-Prediction for IoT", journal: "IEEE IoT Journal", year: 2022, role: "교신", authors: ["박상돈", "최준균"], keywords: ["IoT", "time series", "prediction"] },
  
  // 2020
  { title: "Three Dynamic Pricing Schemes for Edge Computing", journal: "IEEE IoT Journal", year: 2020, role: "교신", authors: ["박상돈", "이주형", "최준균"], keywords: ["edge computing", "pricing", "IoT"] },
  { title: "Competitive Data Trading Model With Privacy Valuation", journal: "IEEE IoT Journal", year: 2020, role: "교신", authors: ["박상돈", "오현택", "최준균"], keywords: ["data trading", "privacy", "IoT"] },
  { title: "Time Series Forecasting Based Energy Trading", journal: "IEEE Access", year: 2020, role: "교신", authors: ["박상돈", "황강욱"], keywords: ["energy", "time series", "trading"] },
  
  // 2019
  { title: "Battery-Wear-Model-Based Energy Trading in EVs", journal: "IEEE TII", year: 2019, role: "교신", authors: ["박상돈", "이주형", "최준균"], keywords: ["EV", "battery", "energy trading"] },
  { title: "Personal Data Trading Scheme for IoT Data Marketplaces", journal: "IEEE Access", year: 2019, role: "교신", authors: ["박상돈", "오현택", "이주형"], keywords: ["data marketplace", "IoT", "privacy"] },
  { title: "Power Efficient Clustering for 5G Mobile Edge Computing", journal: "Mobile Networks", year: 2019, role: "교신", authors: ["박상돈", "이주형"], keywords: ["5G", "edge computing", "clustering"] },
  { title: "Optimal throughput analysis of CR networks", journal: "Annals of OR", year: 2019, role: "1저자", authors: ["박상돈", "황강욱", "최준균"], keywords: ["cognitive radio", "throughput", "optimization"] },
  
  // 2018
  { title: "Competitive Partial Computation Offloading", journal: "IEEE Access", year: 2018, role: "교신", authors: ["박상돈", "이주형", "최준균"], keywords: ["edge computing", "offloading", "competition"] },
  { title: "Optimal Pricing for Energy-Efficient MEC Offloading", journal: "IEEE Comm Letters", year: 2018, role: "교신", authors: ["박상돈"], keywords: ["MEC", "pricing", "energy"] },
  { title: "Load Profile Extraction by Mean-Shift Clustering", journal: "Energies", year: 2018, role: "교신", authors: ["박상돈", "이주형"], keywords: ["clustering", "load profile", "machine learning"] },
  
  // 2017
  { title: "Event-Driven Energy Trading System in Microgrids", journal: "IEEE Access", year: 2017, role: "1저자", authors: ["박상돈", "이주형", "황강욱", "최준균"], keywords: ["microgrid", "energy trading", "event-driven"] },
  { title: "Learning-Based Adaptive Imputation Method With kNN", journal: "Energies", year: 2017, role: "교신", authors: ["박상돈", "이주형", "최준균"], keywords: ["kNN", "imputation", "machine learning"] },
  { title: "Resilient Linear Classification: Attack on Training Data", journal: "ACM/IEEE ICCPS", year: 2017, role: "1저자", authors: ["박상돈"], keywords: ["machine learning", "security", "classification"] },
  
  // 2016
  { title: "Contribution-Based Energy-Trading in Microgrids", journal: "IEEE TIE", year: 2016, role: "1저자", authors: ["박상돈", "이주형", "황강욱", "최준균"], keywords: ["microgrid", "energy trading", "game theory"], award: "IEEE ITeN 선정" },
  
  // Additional papers to reach 25
  { title: "Deep Reinforcement Learning for Edge Computing Resource Allocation", journal: "IEEE Network", year: 2021, role: "교신", authors: ["박상돈", "김민수"], keywords: ["deep learning", "reinforcement learning", "edge computing"] },
  { title: "Federated Learning with Blockchain for IoT Security", journal: "IEEE IoT Journal", year: 2021, role: "교신", authors: ["박상돈", "이주형", "오현택"], keywords: ["federated learning", "blockchain", "security"] },
  { title: "Energy-Efficient Task Scheduling in Mobile Edge Computing", journal: "IEEE Access", year: 2020, role: "1저자", authors: ["박상돈"], keywords: ["task scheduling", "energy efficiency", "MEC"] },
  { title: "Privacy-Preserving Data Analytics in Smart Cities", journal: "IEEE TII", year: 2019, role: "교신", authors: ["박상돈", "최준균", "황강욱"], keywords: ["privacy", "data analytics", "smart cities"] },
  { title: "Dynamic Resource Allocation in Cloud-Edge Computing", journal: "IEEE Cloud Computing", year: 2018, role: "1저자", authors: ["박상돈", "이주형"], keywords: ["cloud computing", "edge computing", "resource allocation"] },
  { title: "Machine Learning for Network Anomaly Detection", journal: "IEEE Network", year: 2017, role: "교신", authors: ["박상돈", "오현택"], keywords: ["machine learning", "anomaly detection", "network security"] }
];

// Site content database for AI to search
const KNOWLEDGE_BASE = {
  publications: {
    all_papers: {
      'edge_computing': [
        "Real-Time Dynamic Pricing for Edge Computing Services (IEEE Access 2024, 1저자)",
        "Three Dynamic Pricing Schemes for Edge Computing (IEEE IoT Journal 2020, 교신)",
        "Power Efficient Clustering for 5G Mobile Edge Computing (Mobile Networks 2019, 교신)",
        "Optimal Pricing for Energy-Efficient MEC Offloading (IEEE Comm Letters 2018, 교신)",
        "Competitive Partial Computation Offloading (IEEE Access 2018, 교신)",
        "Edge Computing GUI Simulator 프로젝트 (2024)"
      ],
      'iot': [
        "Differential Pricing-Based Task Offloading for IoT (IEEE IoT Journal 2022, 교신)",
        "Joint Subcarrier and Transmission Power in WPT System (IEEE IoT Journal 2022, 교신)",
        "Multivariate-Time-Series-Prediction for IoT (IEEE IoT Journal 2022, 교신)",
        "Competitive Data Trading Model With Privacy Valuation (IEEE IoT Journal 2020, 교신)",
        "Personal Data Trading Scheme for IoT Data Marketplaces (IEEE Access 2019, 교신)"
      ],
      'energy': [
        "Contribution-Based Energy-Trading in Microgrids (IEEE TIE 2016, 1저자, IEEE ITeN 선정)",
        "Event-Driven Energy Trading System in Microgrids (IEEE Access 2017, 1저자)",
        "Time Series Forecasting Based Energy Trading (IEEE Access 2020, 교신)",
        "Battery-Wear-Model-Based Energy Trading in EVs (IEEE TII 2019, 교신)"
      ],
      'ai_ml': [
        "Resilient Linear Classification: Attack on Training Data (ACM/IEEE ICCPS 2017, 1저자)",
        "Learning-Based Adaptive Imputation Method With kNN (Energies 2017, 교신)",
        "Load Profile Extraction by Mean-Shift Clustering (Energies 2018, 교신)"
      ]
    },
    by_collaborator: {
      '이주형': [
        "Contribution-Based Energy-Trading in Microgrids (IEEE TIE 2016, 1저자, IEEE ITeN 선정)",
        "Event-Driven Energy Trading System in Microgrids (IEEE Access 2017, 1저자)",
        "Three Dynamic Pricing Schemes for Edge Computing (IEEE IoT Journal 2020, 교신)",
        "Battery-Wear-Model-Based Energy Trading in EVs (IEEE TII 2019, 교신)",
        "Power Efficient Clustering for 5G Mobile Edge Computing (Mobile Networks 2019, 교신)",
        "Learning-Based Adaptive Imputation Method With kNN (Energies 2017, 교신)",
        "Load Profile Extraction by Mean-Shift Clustering (Energies 2018, 교신)",
        "Competitive Partial Computation Offloading (IEEE Access 2018, 교신)",
        "Three Hierarchical Levels of Big-Data Market Model (IEEE Access 2018, 교신)",
        "Personal Data Trading Scheme for IoT Data Marketplaces (IEEE Access 2019, 교신)",
        "Three Dynamic Pricing Schemes for Resource Allocation (IEEE IoT Journal 2020, 교신)",
        "On-device AI-based Cognitive Detection of Bio-modality Spoofing (IEEE IoT Journal 2020, 교신)",
        "Energy Independence of Energy Trading System (ISGT Asia 2017)",
        "Energy-efficient sleep scheme for WLAN (NOMS 2016)",
        "Energy efficient relay selection scheme (ICTC 2013)"
      ],
      '최준균': [
        "Real-Time Dynamic Pricing for Edge Computing Services (IEEE Access 2024, 1저자)",
        "Contribution-Based Energy-Trading in Microgrids (IEEE TIE 2016, 1저자, IEEE ITeN 선정)",
        "Event-Driven Energy Trading System in Microgrids (IEEE Access 2017, 1저자)",
        "Optimal throughput analysis of CR networks (Annals of OR 2019, 1저자)",
        "Differential Pricing-Based Task Offloading for IoT (IEEE IoT Journal 2022, 교신)",
        "Joint Subcarrier and Transmission Power in WPT System (IEEE IoT Journal 2022, 교신)",
        "Multivariate-Time-Series-Prediction for IoT (IEEE IoT Journal 2022, 교신)",
        "Competitive Data Trading Model With Privacy Valuation (IEEE IoT Journal 2020, 교신)",
        "Battery-Wear-Model-Based Energy Trading in EVs (IEEE TII 2019, 교신)",
        "Three Dynamic Pricing Schemes for Edge Computing (IEEE IoT Journal 2020, 교신)",
        "Learning-Based Adaptive Imputation Method With kNN (Energies 2017, 교신)",
        "Competitive Partial Computation Offloading (IEEE Access 2018, 교신)",
        "Joint optimal access and sensing policy (ICUFN 2016)",
        "Optimal Throughput Analysis of Random Access Policies (QTNA 2016, Best Paper Award)"
      ],
      '황강욱': [
        "Contribution-Based Energy-Trading in Microgrids (IEEE TIE 2016, 1저자, IEEE ITeN 선정)",
        "Event-Driven Energy Trading System in Microgrids (IEEE Access 2017, 1저자)",
        "Time Series Forecasting Based Energy Trading (IEEE Access 2020, 교신)",
        "Optimal throughput analysis of CR networks (Annals of OR 2019, 1저자)"
      ],
      '오현택': [
        "Differential Pricing-Based Task Offloading for IoT (IEEE IoT Journal 2022, 교신)",
        "Competitive Data Trading Model With Privacy Valuation (IEEE IoT Journal 2020, 교신)",
        "Personal Data Trading Scheme for IoT Data Marketplaces (IEEE Access 2019, 교신)",
        "Energy-efficient sleep scheme for WLAN (NOMS 2016)"
      ]
    },
    stats: "총 25편 국제저널 (1저자 4편, 교신저자 13편), 10편 국제학회",
    collaborators: "이주형(15편), 최준균(14편), 오현택(4편), 황강욱(4편)"
  },
  posts: POSTS_DATABASE  // Use the unified database
};

// --- Keyword synonyms (lowercase) ---
const KEYWORD_SYNONYMS = {
  edge: ['edge', 'edge-computing', 'edge computing', '엣지', '엣지컴퓨팅', '엣지 컴퓨팅', 'mec', 'mobile-edge', 'mobile edge', '모바일 엣지'],
  iot: ['iot', 'internet of things', '사물인터넷', '인터넷오브씽즈', '인터넷 오브 씽즈'],
  pricing: ['pricing', 'price', 'dynamic pricing', '가격', '가격책정', '가격 정책', '가격결정', '프라이싱'],
  federated: ['federated', 'federated learning', '연합학습', '연합 학습', '연합'],
  microgrid: ['microgrid', '마이크로그리드', '에너지 거래', 'energy trading'],
  wpt: ['wpt', 'wireless power transfer', '무선전력전송', '무선 전력 전송'],
  clustering: ['clustering', 'cluster', 'mean-shift', 'mean shift', '클러스터링', '평균 이동'],
  blockchain: ['blockchain', '블록체인', 'data marketplace', '데이터 마켓', '데이터 거래'],
  privacy: ['privacy', '프라이버시', '개인 정보', '개인정보'],
  simulator: ['simulator', '시뮬레이터', 'simulation', '시뮬레이션'],
  character: ['character', '캐릭터', 'npc', 'conversation', '대화', '대화 시스템']
};

// --- Author aliases (lowercase) to canonical name ---
const AUTHOR_ALIASES = {
  '박상돈': ['박상돈','sangdon park','park, sangdon','park sangdon','sd park','park sd'],
  '최준균': ['최준균','jun kyun choi','choi, jun kyun','jun-kyun choi','jk choi','j. k. choi'],
  '이주형': ['이주형','joohyung lee','lee, joohyung','joo hyung lee','joohyun lee'],
  '황강욱': ['황강욱','ganguk hwang','hwang, ganguk'],
  '오현택': ['오현택','hyeontaek oh','oh, hyeontaek','hyeon taek oh'],
  '배소희': ['배소희','sohee bae','bae, sohee'],
  '성영철': ['성영철','youngchul sung','sung, youngchul','young chul sung'],
  '이규명': ['규명 이','gyu myoung lee','lee, gyu myoung','gyu-myoung lee'],
  '김장겸': ['장겸 김','jangkyum kim','kim, jangkyum'],
  '한재섭': ['jaeseob han','han, jaeseob','재섭 한']
};

const AUTHOR_CANONICAL_MAP = (() => {
  const m = new Map();
  for (const [canon, vars] of Object.entries(AUTHOR_ALIASES)) {
    m.set(canon.toLowerCase(), canon);
    for (const v of vars) m.set(v.toLowerCase(), canon);
  }
  return m;
})();

function canonicalizeAuthor(name) {
  const key = (name || '').trim().toLowerCase();
  return AUTHOR_CANONICAL_MAP.get(key) || (name || '').trim();
}

// Build inverted index: token -> canonical keys
const TOKEN_TO_CANONICAL = (() => {
  const map = new Map();
  for (const [canonical, variants] of Object.entries(KEYWORD_SYNONYMS)) {
    for (const v of variants) {
      map.set(v.toLowerCase(), canonical);
    }
    map.set(canonical.toLowerCase(), canonical);
  }
  return map;
})();

function tokenize(str) {
  return (str || '')
    .toLowerCase()
    .split(/[^a-z0-9가-힣]+/)
    .filter(Boolean);
}

function expandTokensWithSynonyms(tokens) {
  const expanded = new Set(tokens);
  for (const t of tokens) {
    const canonical = TOKEN_TO_CANONICAL.get(t);
    if (canonical) {
      expanded.add(canonical);
      for (const v of KEYWORD_SYNONYMS[canonical]) expanded.add(v.toLowerCase());
    }
  }
  return Array.from(expanded);
}

function computeMatchScore(tokens, hayLower) {
  let score = 0;
  for (const t of tokens) {
    if (hayLower.includes(t)) {
      // boost canonical tokens slightly
      const isCanonical = KEYWORD_SYNONYMS[t] !== undefined;
      score += isCanonical ? 2 : 1;
    }
  }
  return score;
}

// Embedding-based semantic search using Google's text-embedding API
async function embeddingSearch(query, papers, posts, maxResults = 5, includeTalks = true) {
  if (!query || typeof query !== 'string') return [];

  const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
  if (!GEMINI_API_KEY) {
    console.error('GEMINI_API_KEY not configured for embedding search');
    // Fallback to keyword search
    return keywordFallbackSearch(query, papers, posts, maxResults, includeTalks);
  }

  try {
    // Get query embedding
    const queryEmbedding = await getEmbedding(query, GEMINI_API_KEY);
    if (!queryEmbedding) {
      console.error('Failed to get query embedding, falling back to keyword search');
      return keywordFallbackSearch(query, papers, posts, maxResults, includeTalks);
    }

    const results = [];

    // Process papers
    for (const p of papers) {
      const docText = [
        p.title || '',
        p.journal || '',
        String(p.year || ''),
        ...(p.authors || []),
        ...(p.keywords || [])
      ].join(' ');
      
      const docEmbedding = await getEmbedding(docText, GEMINI_API_KEY);
      if (docEmbedding) {
        const similarity = cosineSimilarity(queryEmbedding, docEmbedding);
        if (similarity > 0.3) { // Threshold for relevance
          const label = `[논문] ${p.title}${p.year ? ` (${p.year})` : ''}${p.journal ? ` - ${p.journal}` : ''}`;
          results.push({ label, score: similarity, type: 'paper', data: p });
        }
      }
    }

    // Process posts
    for (const a of posts) {
      const docText = [
        a.title || '',
        a.description || '',
        ...(a.keywords || [])
      ].join(' ');
      
      const docEmbedding = await getEmbedding(docText, GEMINI_API_KEY);
      if (docEmbedding) {
        const similarity = cosineSimilarity(queryEmbedding, docEmbedding);
        if (similarity > 0.3) {
          const label = `[콘텐츠] ${a.title}${a.year ? ` (${a.year})` : ''}`;
          results.push({ label, score: similarity, type: 'post', data: a });
        }
      }
    }

    // Process talks and seminars
    if (includeTalks) {
      for (const t of TALKS_DATABASE) {
        const docText = [
          t.title || '',
          t.venue || '',
          t.location || '',
          String(t.year || ''),
          ...(t.keywords || [])
        ].join(' ');
        
        const docEmbedding = await getEmbedding(docText, GEMINI_API_KEY);
        if (docEmbedding) {
          const similarity = cosineSimilarity(queryEmbedding, docEmbedding);
          if (similarity > 0.3) {
            const typeLabel = t.type === 'invited_talk' ? '초청강연' : '세미나';
            const label = `[${typeLabel}] ${t.title} - ${t.venue} (${t.year})`;
            results.push({ label, score: similarity, type: t.type, data: t });
          }
        }
      }
    }

    results.sort((a, b) => b.score - a.score);
    return results.slice(0, maxResults).map(r => r.label);

  } catch (error) {
    console.error('Embedding search error:', error);
    return keywordFallbackSearch(query, papers, posts, maxResults, includeTalks);
  }
}

// Helper function to get embedding from Google's API with caching
async function getEmbedding(text, apiKey) {
  // Check cache first
  const cached = getCachedEmbedding(text);
  if (cached) {
    console.log('Using cached embedding for:', text.substring(0, 50));
    return cached;
  }

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/text-embedding-004:embedContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'models/text-embedding-004',
          content: {
            parts: [{ text: text }]
          },
          taskType: 'RETRIEVAL_DOCUMENT'
        })
      }
    );

    if (!response.ok) {
      console.error(`Embedding API error: ${response.status}`);
      return null;
    }

    const data = await response.json();
    const embedding = data.embedding.values;
    
    // Cache the embedding
    setCachedEmbedding(text, embedding);
    console.log('Cached new embedding for:', text.substring(0, 50));
    
    return embedding;
  } catch (error) {
    console.error('Error getting embedding:', error);
    return null;
  }
}

// Helper function to compute cosine similarity
function cosineSimilarity(vecA, vecB) {
  if (!vecA || !vecB || vecA.length !== vecB.length) return 0;
  
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;
  
  for (let i = 0; i < vecA.length; i++) {
    dotProduct += vecA[i] * vecB[i];
    normA += vecA[i] * vecA[i];
    normB += vecB[i] * vecB[i];
  }
  
  if (normA === 0 || normB === 0) return 0;
  
  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}

// Fallback to keyword search when embedding fails
function keywordFallbackSearch(query, papers, posts, maxResults = 5, includeTalks = true) {
  const baseTokens = tokenize(query);
  const tokens = expandTokensWithSynonyms(baseTokens);
  const scored = [];

  for (const p of papers) {
    const hay = [
      p.title || '',
      p.journal || '',
      String(p.year || ''),
      ...(p.authors || []),
      ...(p.keywords || [])
    ].join(' ').toLowerCase();

    const score = computeMatchScore(tokens, hay);
    if (score > 0) {
      const label = `[논문] ${p.title}${p.year ? ` (${p.year})` : ''}${p.journal ? ` - ${p.journal}` : ''}`;
      scored.push({ label, score });
    }
  }

  for (const a of posts) {
    const hay = [a.title || '', a.description || '', ...(a.keywords || [])].join(' ').toLowerCase();
    const score = computeMatchScore(tokens, hay);
    if (score > 0) {
      const label = `[콘텐츠] ${a.title}${a.year ? ` (${a.year})` : ''}`;
      scored.push({ label, score });
    }
  }

  if (includeTalks) {
    for (const t of TALKS_DATABASE) {
      const hay = [t.title || '', t.venue || '', t.location || '', ...(t.keywords || [])].join(' ').toLowerCase();
      const score = computeMatchScore(tokens, hay);
      if (score > 0) {
        const typeLabel = t.type === 'invited_talk' ? '초청강연' : '세미나';
        const label = `[${typeLabel}] ${t.title} - ${t.venue} (${t.year})`;
        scored.push({ label, score });
      }
    }
  }

  scored.sort((a, b) => b.score - a.score);
  return scored.slice(0, maxResults).map(s => s.label);
}

function isPublicationIntent(message, query) {
  const text = `${message || ''} ${query || ''}`.toLowerCase();
  return /(논문|저널|journal|publication|paper|ieee|sensors|access|transactions|iot\s*journal|tie|mdpi)/.test(text);
}

// Filter papers by free-text query tokens
function filterPapersByQuery(query, papers) {
  if (!query || typeof query !== 'string') return [];
  const baseTokens = tokenize(query);
  const tokens = expandTokensWithSynonyms(baseTokens);
  if (tokens.length === 0) return [];

  return papers.filter(p => {
    const hay = [
      p.title || '',
      p.journal || '',
      String(p.year || ''),
      ...(p.authors || []),
      ...(p.keywords || [])
    ].join(' ').toLowerCase();
    return computeMatchScore(tokens, hay) > 0;
  });
}

exports.handler = async (event, context) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Content-Type': 'application/json'
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  if (event.httpMethod === 'POST') {
    try {
      const { message, history = [], step = 1 } = JSON.parse(event.body);

      if (!message) {
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({ error: 'Message required' })
        };
      }

      const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
      if (!GEMINI_API_KEY) {
        return {
          statusCode: 500,
          headers,
          body: JSON.stringify({ error: 'API key not configured' })
        };
      }

      // STEP 1: AI decides what action to take
      if (step === 1) {
        const recent = (history || []).slice(-6).map(h => `${h.role === 'user' ? '사용자' : '어시스턴트'}: ${h.content}`).join('\n');
        const actionPrompt = `당신은 박상돈 본인입니다. 사용자 질문을 분석하고 어떤 행동을 할지 결정하세요.

사용 가능한 행동:
- SEARCH: 논문, 공동연구자, 주제 등 모든 검색 관련 질문
- CHAT: 인사, 일반 대화, 검색이 필요 없는 것

이전 대화(최신순):
${recent || '(이전 대화 없음)'}

예시:
Q: "AI 논문 뭐 썼어?" → ACTION: SEARCH, QUERY: AI 논문
Q: "황강욱 교수님과 쓴 논문?" → ACTION: SEARCH, QUERY: 황강욱
Q: "논문 몇 편?" → ACTION: SEARCH, QUERY: 논문 개수 통계
Q: "안녕하세요" → ACTION: CHAT

반드시 이 형식으로 응답:
ACTION: [SEARCH 또는 CHAT]
QUERY: [검색어 - SEARCH일 때만]
INITIAL_MESSAGE: [한국어로 자연스럽게. CHAT이면 완전한 답변, 아니면 "확인해보겠습니다" 류]

사용자: ${message}`;

        const actionResponse = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: [{
                parts: [{ text: actionPrompt }]
              }],
              generationConfig: {
                temperature: 0.3,
                maxOutputTokens: 200
              }
            })
          }
        );

        const actionData = await actionResponse.json();
        console.log('AI Decision Response:', actionData);
        const actionText = actionData?.candidates?.[0]?.content?.parts?.[0]?.text || '';
        console.log('AI Decision Text:', actionText);
        
        // Parse AI decision
        const actionMatch = actionText.match(/ACTION:\s*([^\n]+)/);
        const queryMatch = actionText.match(/QUERY:\s*([^\n]+)/);
        const initialMatch = actionText.match(/INITIAL_MESSAGE:\s*(.+)/s);
        
        let action = actionMatch ? actionMatch[1].trim() : 'CHAT';
        let query = queryMatch ? queryMatch[1].trim() : '';
        let initialMessage = initialMatch ? initialMatch[1].trim() : null;

        // Heuristic override: if LLM decided CHAT but the message strongly suggests search
        // we trigger SEARCH to leverage local RAG for accuracy.
        function messageSuggestsSearch(text) {
          const tks = expandTokensWithSynonyms(tokenize(text || ''));
          if (tks.length === 0) return false;
          // Build a small haystack from known content
          const hayArr = [];
          for (const p of PAPERS_DATABASE) {
            hayArr.push((p.title||'').toLowerCase());
            if (Array.isArray(p.keywords)) hayArr.push(p.keywords.join(' ').toLowerCase());
            hayArr.push((p.journal||'').toLowerCase());
          }
          for (const a of POSTS_DATABASE) {
            hayArr.push((a.title||'').toLowerCase());
            if (Array.isArray(a.keywords)) hayArr.push(a.keywords.join(' ').toLowerCase());
            hayArr.push((a.description||'').toLowerCase());
          }
          const hay = hayArr.join(' ');
          let hits = 0;
          for (const tk of tks) {
            if (hay.includes(tk)) {
              hits += 1;
              if (hits >= 1) return true;
            }
          }
          return false;
        }

        if (action !== 'SEARCH' && messageSuggestsSearch(message)) {
          console.log('Override: Forcing SEARCH based on local heuristic');
          action = 'SEARCH';
          if (!query) query = message;
          if (!initialMessage) initialMessage = '관련 자료를 확인해보겠습니다.';
        }
        
        console.log('Parsed/Resolved - Action:', action, 'Query:', query, 'Initial:', initialMessage);

        // Log CHAT action to Supabase (since it won't go to step 2)
        if (action === 'CHAT') {
          try {
            const supabaseUrl = process.env.SUPABASE_URL;
            const supabaseKey = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_ANON_KEY;
            
            if (supabaseUrl && supabaseKey) {
              const supabase = createClient(supabaseUrl, supabaseKey);
              
              // Get IP address
              const ip = event.headers['x-forwarded-for'] || 
                        event.headers['client-ip'] || 
                        'unknown';
              
              const dataToInsert = {
                user_message: message,
                bot_response: initialMessage,
                conversation_history: Array.isArray(history) ? history.slice(-10) : [],
                action_taken: action,
                search_results: null,
                user_ip: ip,
                user_agent: event.headers['user-agent'] || 'unknown'
              };
              
              console.log('Step 1 CHAT - Logging to Supabase');
              
              const insertResult = await supabase
                .from('chat_logs')
                .insert([dataToInsert])
                .select();
              
              if (insertResult.error) {
                console.error('Step 1 Supabase error:', insertResult.error.message);
              } else {
                console.log('Step 1 Supabase success - ID:', insertResult.data?.[0]?.id);
              }
            }
          } catch (logError) {
            console.error('Step 1 logging error:', logError);
            // Continue even if logging fails
          }
        }

        // Return initial response to show user
        return {
          statusCode: 200,
          headers,
          body: JSON.stringify({
            step: 1,
            action,
            query,
            initialMessage,
            needsSecondStep: action !== 'CHAT'
          })
        };
      }

      // STEP 2: Execute action and generate final response
      else if (step === 2) {
        const { message, history = [], action, query } = JSON.parse(event.body);

        // Perform lightweight RAG over local KB
        let searchResults = null;
        if (action === 'SEARCH') {
          // Build a flat posts array from POSTS_DATABASE
          const postsFlat = POSTS_DATABASE.map(p => ({
            title: p.title,
            description: p.description || '',
            keywords: p.keywords || [],
            year: p.year || ''
          }));
          // Prioritize publications for publication intents; otherwise include posts
          console.log('Starting embedding search for query:', query);
          if (isPublicationIntent(message, query)) {
            searchResults = await embeddingSearch(query || '', PAPERS_DATABASE, [], 8);
          } else {
            searchResults = await embeddingSearch(query || '', PAPERS_DATABASE, postsFlat, 5);
          }
          console.log('Embedding search results:', searchResults);
        }

        // Generate final response with context
        // If user asked for counts, compute deterministically from data (no hardcoding)
        const lowerMsg = (message || '').toLowerCase();
        const countIntent = /몇|개수|얼마나|how many/.test(lowerMsg) || /몇|개수|얼마나|how many/.test((query || '').toLowerCase());
        // Detect collaborator intent (누구와 가장 많이 같이 썼는지 등)
        const collaboratorIntent = /(공저|공동연구|같이|함께|coauthor|collaborator|누구)/.test(lowerMsg);
        // Detect list-all intent
        const listIntent = (
          /(모두|전체|전부|다)\s*(나열|적어|써|목록|리스트|보여|열거|정리)/.test(lowerMsg)
          || /(나열|목록|리스트|보여줘|보여봐|열거|정리|읊어|읊어봐)/.test(lowerMsg)
          || /\d+\s*편/.test(lowerMsg)
          || /논문\s*(전부|전체|다)/.test(lowerMsg)
        );

        // Try to extract a specific collaborator name from message
        function extractCollaboratorNameFromMessage() {
          // Build set of known collaborator names from dataset (excluding owner)
          const names = new Set();
          for (const p of PAPERS_DATABASE) {
            const authors = Array.isArray(p.authors) ? p.authors : [];
            for (const a of authors) {
              const n = canonicalizeAuthor(a);
              if (!n) continue;
              const ln = n.toLowerCase();
              if (ln === 'sangdon park' || n === '박상돈') continue;
              names.add(n);
              names.add(ln);
            }
          }
          const tokens = tokenize(message).concat(tokenize(query || ''));
          for (let i = 0; i < tokens.length; i++) {
            const t = tokens[i];
            // Check raw token or capitalized + surname-first heuristic not implemented; compare lowercased names set
            if (names.has(t) || names.has(t.toLowerCase())) {
              // Find the original cased name if exists
              for (const nm of names) {
                if (nm.toLowerCase() === t.toLowerCase() && nm !== t.toLowerCase()) return nm;
              }
              return t;
            }
          }
          return null;
        }

        // Helper: compute top collaborator and optionally list papers
        function computeCollaboratorsAndList(targetName = null) {
          const counts = new Map();
          const ownerAliases = new Set(['박상돈', 'sangdon park']);
          for (const p of PAPERS_DATABASE) {
            const authors = Array.isArray(p.authors) ? p.authors : [];
            if (authors.length === 0) continue;
            const hasOwner = authors.some(a => ownerAliases.has(canonicalizeAuthor(a).toLowerCase()));
            if (!hasOwner) continue;
            const coauthors = authors
              .map(a => canonicalizeAuthor(a))
              .filter(a => a && !ownerAliases.has(a.toLowerCase()));
            for (const a of coauthors) counts.set(a, (counts.get(a) || 0) + 1);
          }
          let topName = null;
          if (targetName) {
            // normalize match to existing key
            let matched = null;
            for (const k of counts.keys()) {
              if (k.toLowerCase().includes(targetName.toLowerCase())) { matched = k; break; }
            }
            topName = matched || targetName;
          } else {
            const sorted = Array.from(counts.entries()).sort((a,b)=>b[1]-a[1]);
            topName = sorted.length ? sorted[0][0] : null;
          }
          // Build list of papers with that collaborator
          let list = [];
          if (topName) {
            list = PAPERS_DATABASE.filter(p => {
              const authors = Array.isArray(p.authors) ? p.authors.map(a => canonicalizeAuthor(a).toLowerCase()) : [];
              return authors.includes(topName.toLowerCase()) && authors.some(a => a === '박상돈' || a === 'sangdon park');
            }).map(p => `[논문] ${p.title}${p.year ? ` (${p.year})` : ''}${p.journal ? ` - ${p.journal}` : ''}`);
          }
          return { topName, count: topName ? (counts.get(topName) || list.length) : 0, list };
        }
        let deterministicReply = null;
        if (countIntent) {
          const effectiveQuery = (query && query.trim()) ? query : message;
          const matchedPapers = filterPapersByQuery(effectiveQuery || '', PAPERS_DATABASE);
          deterministicReply = `해당 주제 관련 논문은 ${matchedPapers.length}편입니다.`;
          // If we found nothing but intent exists, fall back to total count
          if (matchedPapers.length === 0) {
            deterministicReply = `전체 국제저널 기준으로 ${PAPERS_DATABASE.length}편입니다.`;
          }
        } else if (collaboratorIntent) {
          // Tally collaborators from dataset authors
          const specificName = extractCollaboratorNameFromMessage();
          let { topName, count, list } = computeCollaboratorsAndList(specificName);
          if (topName) {
            if (listIntent) {
              // Provide deterministic list
              deterministicReply = `${topName}님과 함께한 논문은 총 ${list.length}편입니다. 아래 목록을 참고하세요.`;
              searchResults = list;
            } else {
              deterministicReply = `가장 많이 함께 논문을 쓴 분은 ${topName}님으로, ${count}편입니다.`;
              // Also show top-3 collaborators as context
              // Recompute counts for top-3 view
              const temp = computeCollaboratorsAndList();
              // temp.list is for topName; we need counts map again, so quickly tally
              const tally = new Map();
              for (const p of PAPERS_DATABASE) {
                const authors = Array.isArray(p.authors) ? p.authors.map(a => canonicalizeAuthor(a).toLowerCase()) : [];
                if (!authors.includes('sangdon park') && !authors.includes('박상돈')) continue;
                for (const a of authors) {
                  if (a === 'sangdon park' || a === '박상돈') continue;
                  tally.set(a, (tally.get(a) || 0) + 1);
                }
              }
              const top3 = Array.from(tally.entries()).sort((a,b)=>b[1]-a[1]).slice(0,3).map(([n,c])=> `${n}: ${c}편`);
              searchResults = top3;
            }
          } else {
            // Fallback: use knowledge base collaborator stats if available
            const kbCollab = (KNOWLEDGE_BASE?.publications?.by_collaborator) || {};
            const kbCounts = Object.entries(kbCollab).map(([name, arr]) => [name, Array.isArray(arr) ? arr.length : 0]);
            kbCounts.sort((a,b) => b[1]-a[1]);
            if (kbCounts.length > 0 && kbCounts[0][1] > 0) {
              const [kbTopName, kbTopCount] = kbCounts[0];
              if (listIntent) {
                deterministicReply = `${kbTopName}님과 함께한 논문은 약 ${kbTopCount}편입니다.`;
              } else {
                deterministicReply = `가장 많이 함께 논문을 쓴 분은 ${kbTopName}님으로, 약 ${kbTopCount}편입니다.`;
              }
              const tops = kbCounts.slice(0, 3).map(([n,c]) => `${n}: ${c}편`);
              searchResults = tops;
            } else {
              deterministicReply = '공동저자 정보를 확인할 수 없습니다.';
            }
          }
        }

        // If we have a deterministic reply (counts/collaborators), we can skip LLM for robustness
        if (deterministicReply) {
          return {
            statusCode: 200,
            headers,
            body: JSON.stringify({
              step: 2,
              reply: deterministicReply,
              searchResults: Array.isArray(searchResults) && searchResults.length ? searchResults.slice(0, 50) : null
            })
          };
        }

        const recent = (history || []).slice(-6).map(h => `${h.role === 'user' ? '사용자' : '어시스턴트'}: ${h.content}`).join('\n');
        const finalPrompt = `당신은 박상돈 본인입니다. 아래 검색 요약과 이전 대화를 바탕으로 사용자 질문에 답변하세요.

사용자 질문: ${message}

이전 대화(최신순):
${recent || '(이전 대화 없음)'}

검색 요약:${searchResults && searchResults.length ? `\n- ${searchResults.join('\n- ')}` : '\n(관련 결과 없음)'}

규칙:
1) 검색 요약을 그대로 복사하지 말고, 1~2문장 한국어로 함축 답변
2) 숫자/통계를 묻는 경우 간결히 수치만 제시
3) 불확실하면 과장 없이 보수적으로 답변`;

        const finalResponse = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: [{
                parts: [{ text: finalPrompt }]
              }],
              generationConfig: {
                temperature: 0.7,
                maxOutputTokens: 8192
              }
            })
          }
        );

        const finalData = await finalResponse.json();
        console.log('Final Response from Gemini:', finalData);
        
        let reply = deterministicReply || finalData?.candidates?.[0]?.content?.parts?.[0]?.text;
        
        // Fallback if no reply
        if (!reply) {
          console.error('No reply generated, using fallback');
          reply = deterministicReply || (Array.isArray(searchResults) ? (searchResults[0] || '') : '') || '죄송합니다. 답변을 생성할 수 없습니다.';
        }

        // Log to Supabase
        try {
          const supabaseUrl = process.env.SUPABASE_URL;
          // Try both possible env var names
          const supabaseKey = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_ANON_KEY;
          
          console.log('=== SUPABASE DEBUG START ===');
          console.log('Timestamp:', new Date().toISOString());
          console.log('Supabase URL exists:', !!supabaseUrl);
          console.log('Supabase SERVICE_KEY exists:', !!process.env.SUPABASE_SERVICE_KEY);
          console.log('Supabase ANON_KEY exists:', !!process.env.SUPABASE_ANON_KEY);
          console.log('Using key:', !!supabaseKey ? 'Found' : 'Missing');
          console.log('Supabase URL:', supabaseUrl?.substring(0, 30) + '...');
          console.log('All env vars:', Object.keys(process.env).filter(k => k.includes('SUPABASE')).join(', '));
          
          if (supabaseUrl && supabaseKey) {
            const supabase = createClient(supabaseUrl, supabaseKey);
            
            // Get IP address
            const ip = event.headers['x-forwarded-for'] || 
                      event.headers['client-ip'] || 
                      'unknown';
            
            const dataToInsert = {
              user_message: message,
              bot_response: reply,
              conversation_history: Array.isArray(history) ? history.slice(-10) : [],
              action_taken: action || null,
              search_results: Array.isArray(searchResults) ? searchResults : null,
              user_ip: ip,
              user_agent: event.headers['user-agent'] || 'unknown'
            };
            
            console.log('Supabase Debug - Inserting data:', JSON.stringify(dataToInsert).substring(0, 200));
            console.log('Data keys:', Object.keys(dataToInsert).join(', '));
            console.log('History length:', Array.isArray(history) ? history.length : 'not array');
            console.log('Search results count:', Array.isArray(searchResults) ? searchResults.length : 'not array');
            
            // Match the actual Supabase table schema from chat_logs_schema.sql
            const insertResult = await supabase
              .from('chat_logs')
              .insert([dataToInsert])
              .select(); // Add select to get the inserted row back
            
            if (insertResult.error) {
              console.error('=== SUPABASE ERROR ===');
              console.error('Error object:', JSON.stringify(insertResult.error));
              console.error('Error message:', insertResult.error.message);
              console.error('Error code:', insertResult.error.code);
              console.error('Error hint:', insertResult.error.hint);
              console.error('Error details:', insertResult.error.details);
              
              // Check specific error types
              if (insertResult.error.code === '42501') {
                console.error('Permission denied - check RLS policies');
              } else if (insertResult.error.code === '23502') {
                console.error('NOT NULL violation - missing required field');
              } else if (insertResult.error.code === '42P01') {
                console.error('Table does not exist - run the SQL schema');
              }
            } else {
              console.log('=== SUPABASE SUCCESS ===');
              console.log('Insert status:', insertResult.status);
              console.log('Status text:', insertResult.statusText);
              console.log('Inserted data ID:', insertResult.data?.[0]?.id);
              console.log('Row count:', insertResult.data?.length);
            }
            
            console.log('Logged to Supabase - complete result:', JSON.stringify(insertResult).substring(0, 500));
            console.log('=== SUPABASE DEBUG END ===');
          } else {
            console.log('=== SUPABASE NOT CONFIGURED ===');
            console.log('Missing URL:', !supabaseUrl);
            console.log('Missing Key:', !supabaseKey);
            console.log('Please set environment variables in Netlify dashboard');
          }
        } catch (logError) {
          console.error('Failed to log to Supabase - Exception:', logError);
          console.error('Error stack:', logError.stack);
          // Continue even if logging fails
        }

        return {
          statusCode: 200,
          headers,
          body: JSON.stringify({
            step: 2,
            reply,
            // Return array of human-readable strings for frontend rendering
            searchResults: Array.isArray(searchResults) && searchResults.length ? searchResults.slice(0, 5) : null
          })
        };
      }

    } catch (error) {
      console.error('Error:', error);
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ error: 'Server error' })
      };
    }
  }

  return {
    statusCode: 405,
    headers,
    body: JSON.stringify({ error: 'Method not allowed' })
  };
};