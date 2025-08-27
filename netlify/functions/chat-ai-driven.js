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

// Invited Talks and Seminars database (실제 데이터 from cv-ko.tex)
// Real invited talks and seminars from cv-ko.tex (13 seminars, 2023-2025)
const TALKS_DATABASE = [
  { title: "연구자를 위한 AI 세미나", type: "ai_seminar", venue: "경상국립대학교 정보통계학과", year: 2025, date: "2025년 8월 25일", 
    keywords: ["AI", "연구자", "경상국립대", "정보통계", "seminar", "세미나", "강연", "초청강연", 
               "강연료", "50만원", "500000", "비용", "얼마", "1시간 30분"], fee: 500000 },
  { title: "LLM과 RAG 기술로 구현하는 차세대 AI NPC", type: "conference", venue: "BIEN 2025 IT 과학세션, 대전 ICC 호텔", year: 2025, date: "2025년 8월 21일", 
    keywords: ["LLM", "RAG", "AI", "NPC", "BIEN", "대전", "ICC", "seminar", "세미나", "강연", "초청강연",
               "강연료", "50만원", "500000", "비용", "얼마", "1시간 30분"], fee: 500000 },
  { title: "지역역량 구축 교육 AI/LLM 세미나", type: "ai_seminar", venue: "대전광역시 유성구청", year: 2025, date: "2025년 8월 11일", 
    keywords: ["AI", "LLM", "지역역량", "유성구청", "대전", "seminar", "세미나", "강연", "초청강연",
               "강연료", "50만원", "500000", "비용", "얼마", "1시간 30분"], fee: 500000 },
  { title: "연구자를 위한 AI 세미나", type: "ai_seminar", venue: "고려대학교 화공생명공학과", year: 2025, date: "2025년 7월 31일 & 8월 6일", 
    keywords: ["AI", "연구자", "고려대", "화공생명", "seminar", "세미나", "강연", "초청강연",
               "강연료", "50만원", "500000", "비용", "얼마", "1시간 30분"], fee: 500000 },
  { title: "AI 세미나", type: "ai_seminar", venue: "부경대학교 전자정보통신공학부", year: 2025, date: "2025년 5월 14일", 
    keywords: ["AI", "부경대", "전자정보통신", "seminar", "세미나", "강연", "초청강연", 
               "강연료", "50만원", "500000", "비용", "얼마", "1시간 30분"], fee: 500000 },
  { title: "AI 반도체학과 최고경영자과정 AI/LLM 세미나", type: "executive_course", venue: "KAIST", year: 2025, date: "2025년 5월 7일", 
    keywords: ["AI반도체", "LLM", "KAIST", "최고경영자", "seminar", "세미나", "강연", "초청강연",
               "강연료", "50만원", "500000", "비용", "얼마", "1시간 30분"], fee: 500000 },
  { title: "수학 콜로퀴움 AI 세미나", type: "mathematics_colloquium", venue: "한국과학영재학교", year: 2025, date: "2025년 4월 30일", 
    keywords: ["수학", "AI", "한국과학영재학교", "KAIST", "콜로퀴움", "seminar", "세미나", "강연", "초청강연",
               "강연료", "50만원", "500000", "비용", "얼마", "1시간 30분"], fee: 500000 },
  { title: "AI 세미나", type: "ai_seminar", venue: "경북대학교", year: 2025, date: "2025년 4월 24일", 
    keywords: ["AI", "경북대", "seminar", "세미나", "강연", "초청강연",
               "강연료", "50만원", "500000", "비용", "얼마", "1시간 30분"], fee: 500000 },
  { title: "AI 세미나", type: "ai_seminar", venue: "충남대학교 컴퓨터융합학부", year: 2025, date: "2025년 4월 14일", 
    keywords: ["AI", "충남대", "컴퓨터융합", "seminar", "세미나", "강연", "초청강연",
               "강연료", "50만원", "500000", "비용", "얼마", "1시간 30분"], fee: 500000 },
  { title: "AI 세미나", type: "ai_seminar", venue: "KAIST 전기및전자공학부", year: 2024, date: "2024년 12월 18일", 
    keywords: ["AI", "KAIST", "전기전자", "seminar", "세미나", "강연", "초청강연",
               "강연료", "50만원", "500000", "비용", "얼마", "1시간 30분"], fee: 500000 },
  { title: "AI 세미나", type: "ai_seminar", venue: "경희대학교(국제캠퍼스) 정보전자신소재공학과", year: 2024, date: "2024년 11월 29일", 
    keywords: ["AI", "경희대", "국제캠퍼스", "정보전자신소재", "seminar", "세미나", "강연", "초청강연",
               "강연료", "50만원", "500000", "비용", "얼마", "1시간 30분"], fee: 500000 },
  { title: "AI 세미나", type: "ai_seminar", venue: "KAIST 전기및전자공학부", year: 2024, date: "2024년 11월 28일", 
    keywords: ["AI", "KAIST", "전기전자", "seminar", "세미나", "강연", "초청강연",
               "강연료", "50만원", "500000", "비용", "얼마", "1시간 30분"], fee: 500000 },
  { title: "BK21 FOUR AI 세미나", type: "bk21_four", venue: "전북대학교 JIANT-IT 인재양성 사업단", year: 2023, date: "2023년 6월 1일", 
    keywords: ["AI", "전북대", "JIANT", "BK21", "인재양성", "seminar", "세미나", "강연", "초청강연",
               "강연료", "50만원", "500000", "비용", "얼마", "1시간 30분"], fee: 500000 }
];

const PAPERS_DATABASE = [
  // 2024
  {
    title: "Real-Time Dynamic Pricing for Edge Computing Services: A Market Perspective",
    journal: "IEEE Access",
    year: 2024,
    role: "1저자",
    authors: ["박상돈", "배소희", "이주형", "성영철"],
    keywords: ["edge computing", "dynamic pricing", "real-time", "market perspective"]
  },
  {
    title: "Dynamic Bandwidth Slicing in Passive Optical Networks to Empower Federated Learning",
    journal: "Sensors",
    year: 2024,
    role: "교신",
    authors: ["Alaelddin F. Y. Mohammed", "이주형", "박상돈"],
    keywords: ["PON", "bandwidth slicing", "federated learning", "passive optical networks"]
  },

  // 2022
  {
    title: "Differential Pricing-Based Task Offloading for Delay-Sensitive IoT Applications in Mobile Edge Computing System",
    journal: "IEEE Internet of Things Journal",
    year: 2022,
    role: "교신",
    authors: ["Hyeonseok Seo", "오현택", "최준균", "박상돈"],
    keywords: ["IoT", "task offloading", "differential pricing", "mobile edge computing", "delay-sensitive"]
  },
  {
    title: "Joint Subcarrier and Transmission Power Allocation in OFDMA-Based WPT System for Mobile-Edge Computing in IoT Environment",
    journal: "IEEE Internet of Things Journal",
    year: 2022,
    role: "교신",
    authors: ["한재섭", "Gyeong Ho Lee", "박상돈", "최준균"],
    keywords: ["OFDMA", "WPT", "power allocation", "mobile edge computing", "IoT"]
  },
  {
    title: "A Novel Cooperative Transmission Scheme in UAV-Assisted Wireless Sensor Networks",
    journal: "Electronics",
    year: 2022,
    role: "공저자",
    authors: ["Yue Zang", "Yuyang Peng", "박상돈", "Han Hai", "Fawaz Al-Hazemi", "Mohammad Meraj Mirza"],
    keywords: ["UAV", "cooperative transmission", "wireless sensor networks"]
  },
  {
    title: "Power Scheduling Scheme for a Charging Facility Considering the Satisfaction of Electric Vehicle Users",
    journal: "IEEE Access",
    year: 2022,
    role: "공저자",
    authors: ["김장겸", "이주형", "박상돈", "최준균"],
    keywords: ["electric vehicle", "power scheduling", "charging facility", "user satisfaction"]
  },
  {
    title: "A Multivariate-Time-Series-Prediction-Based Adaptive Data Transmission Period Control Algorithm for IoT Networks",
    journal: "IEEE Internet of Things Journal",
    year: 2022,
    role: "교신",
    authors: ["한재섭", "Gyeong Ho Lee", "박상돈", "최준균"],
    keywords: ["IoT", "time series prediction", "data transmission", "multivariate", "adaptive control"]
  },

  // 2021
  {
    title: "Lane Detection Aided Online Dead Reckoning for GNSS Denied Environments",
    journal: "Sensors",
    year: 2021,
    role: "공저자",
    authors: ["Jinhwan Jeon", "Yoonjin Hwang", "Yongseop Jeong", "박상돈", "In So Kweon", "Seibum Choi"],
    keywords: ["lane detection", "dead reckoning", "GNSS", "navigation"]
  },
  {
    title: "Deposit Decision Model for Data Brokers in Distributed Personal Data Markets Using Blockchain",
    journal: "IEEE Access",
    year: 2021,
    role: "교신",
    authors: ["오현택", "박상돈", "최준균", "Sungkee Noh"],
    keywords: ["blockchain", "data broker", "personal data market", "deposit decision"]
  },

  // 2020
  {
    title: "Three Dynamic Pricing Schemes for Resource Allocation of Edge Computing for IoT Environment",
    journal: "IEEE Internet of Things Journal",
    year: 2020,
    role: "교신",
    authors: ["Beomhan Baek", "이주형", "Yuyang Peng", "박상돈"],
    keywords: ["edge computing", "dynamic pricing", "resource allocation", "IoT"]
  },
  {
    title: "Competitive Data Trading Model With Privacy Valuation for Multiple Stakeholders in IoT Data Markets",
    journal: "IEEE Internet of Things Journal",
    year: 2020,
    role: "교신",
    authors: ["오현택", "박상돈", "이규명", "최준균", "Sungkee Noh"],
    keywords: ["data trading", "privacy valuation", "IoT", "data markets", "competitive model"]
  },
  {
    title: "Time Series Forecasting Based Day-Ahead Energy Trading in Microgrids: Mathematical Analysis and Simulation",
    journal: "IEEE Access",
    year: 2020,
    role: "교신",
    authors: ["Gyohun Jeong", "박상돈", "황강욱"],
    keywords: ["time series forecasting", "energy trading", "microgrids", "day-ahead"]
  },

  // 2019
  {
    title: "Battery-Wear-Model-Based Energy Trading in Electric Vehicles: A Naive Auction Model and a Market Analysis",
    journal: "IEEE Transactions on Industrial Informatics",
    year: 2019,
    role: "교신",
    authors: ["김장겸", "이주형", "박상돈", "최준균"],
    keywords: ["electric vehicles", "battery wear model", "energy trading", "auction model"]
  },
  {
    title: "Optimal throughput analysis of multiple channel access in cognitive radio networks",
    journal: "Annals of Operations Research",
    year: 2019,
    role: "1저자",
    authors: ["박상돈", "황강욱", "최준균"],
    keywords: ["cognitive radio", "throughput analysis", "channel access", "optimization"]
  },
  {
    title: "Energy-efficient cooperative transmission for intelligent transportation systems",
    journal: "Future Generation Computer Systems",
    year: 2019,
    role: "공저자",
    authors: ["Yuyang Peng", "Jun Li", "박상돈", "Konglin Zhu", "Mohammad Mehedi Hassan", "Ahmed Alsanad"],
    keywords: ["intelligent transportation", "cooperative transmission", "energy efficient"]
  },
  {
    title: "Power Efficient Clustering Scheme for 5G Mobile Edge Computing Environment",
    journal: "Mobile Networks & Applications",
    year: 2019,
    role: "교신",
    authors: ["Jaewon Ahn", "이주형", "박상돈", "Hong-sik Park"],
    keywords: ["5G", "mobile edge computing", "clustering", "power efficient"]
  },
  {
    title: "Personal Data Trading Scheme for Data Brokers in IoT Data Marketplaces",
    journal: "IEEE Access",
    year: 2019,
    role: "교신",
    authors: ["오현택", "박상돈", "이규명", "Hwanjo Heo", "최준균"],
    keywords: ["personal data trading", "data brokers", "IoT", "data marketplace"]
  },
  {
    title: "Comparison Between Seller and Buyer Pricing Systems for Energy Trading in Microgrids",
    journal: "IEEE Access",
    year: 2019,
    role: "교신",
    authors: ["배소희", "박상돈"],
    keywords: ["energy trading", "microgrids", "pricing systems", "seller", "buyer"]
  },

  // 2018
  {
    title: "Load Profile Extraction by Mean-Shift Clustering with Sample Pearson Correlation Coefficient Distance",
    journal: "Energies",
    year: 2018,
    role: "교신",
    authors: ["Nakyoung Kim", "박상돈", "이주형", "최준균"],
    keywords: ["load profile", "mean-shift clustering", "correlation coefficient", "machine learning"]
  },
  {
    title: "An Optimal Pricing Scheme for the Energy-Efficient Mobile Edge Computation Offloading With OFDMA",
    journal: "IEEE Communications Letters",
    year: 2018,
    role: "교신",
    authors: ["Sunghwan Kim", "박상돈", "Min Chen", "Chan-hyun Youn"],
    keywords: ["mobile edge computing", "computation offloading", "OFDMA", "optimal pricing", "energy efficient"]
  },
  {
    title: "Three Hierarchical Levels of Big-Data Market Model Over Multiple Data Sources for Internet of Things",
    journal: "IEEE Access",
    year: 2018,
    role: "교신",
    authors: ["Busik Jang", "박상돈", "이주형", "Sang Geun Hahn"],
    keywords: ["big data", "market model", "IoT", "hierarchical levels", "data sources"]
  },
  {
    title: "Competitive Partial Computation Offloading for Maximizing Energy Efficiency in Mobile Cloud Computing",
    journal: "IEEE Access",
    year: 2018,
    role: "교신",
    authors: ["Sanghong Ahn", "이주형", "박상돈", "S.H. Shah Newaz", "최준균"],
    keywords: ["computation offloading", "mobile cloud computing", "energy efficiency", "competitive"]
  },

  // 2017
  {
    title: "Event-Driven Energy Trading System in Microgrids: Aperiodic Market Model Analysis with a Game Theoretic Approach",
    journal: "IEEE Access",
    year: 2017,
    role: "1저자",
    authors: ["박상돈", "이주형", "황강욱", "최준균"],
    keywords: ["event-driven", "energy trading", "microgrids", "game theory", "aperiodic market"]
  },
  {
    title: "Learning-Based Adaptive Imputation Method With kNN Algorithm for Missing Power Data",
    journal: "Energies",
    year: 2017,
    role: "교신",
    authors: ["Minkyung Kim", "박상돈", "이주형", "Yongjae Joo", "최준균"],
    keywords: ["machine learning", "data imputation", "kNN", "missing data", "power data"]
  },

  // 2016
  {
    title: "Contribution-Based Energy-Trading Mechanism in Microgrids for Future Smart Grid: A Game Theoretic Approach",
    journal: "IEEE Transactions on Industrial Electronics",
    year: 2016,
    role: "1저자",
    authors: ["박상돈", "이주형", "배소희", "황강욱", "최준균"],
    keywords: ["energy trading", "microgrids", "smart grid", "game theory", "contribution-based"],
    award: "IEEE ITeN 선정"
  }
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
    stats: "총 25편 국제저널 (1저자 4편, 교신저자 17편, 공저자 4편), 10편 국제학회",
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
async function embeddingSearch(query, papers, posts, maxResults = 20, includeTalks = true) {
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
        if (similarity > 0.25) { // Lowered threshold for better recall
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
        if (similarity > 0.25) { // Lowered threshold for posts
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
          if (similarity > 0.2) { // Lower threshold for talks to improve recall
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
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-embedding-001:embedContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'models/gemini-embedding-001',
          content: {
            parts: [{ text: text }]
          },
          taskType: 'RETRIEVAL_DOCUMENT',
          outputDimensionality: 768
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
- SEARCH: 논문, 공동연구자, 초청강연, 세미나, 주제 등 모든 검색 관련 질문 (거의 대부분의 질문은 SEARCH)
- CHAT: 인사말, 감사 인사 등 단순한 대화 ONLY

이전 대화(최신순):
${recent || '(이전 대화 없음)'}

중요: 
1. 문맥 의존적 질문(예: "얼마야?", "언제야?", "몇 개야?")은 이전 대화 문맥을 참고하여 QUERY를 구체화하세요
2. 다음은 모두 SEARCH입니다:
- 논문/저널/publication 관련
- 초청강연/세미나/강연료 관련  
- 공동연구자/저자 관련
- 연구 주제/키워드 관련
- 개수/통계 관련
- 년도/기간 관련

예시:
Q: "AI 논문 뭐 썼어?" → ACTION: SEARCH, QUERY: AI 논문
Q: "세미나 몇 번 했어?" → ACTION: SEARCH, QUERY: 세미나 초청강연
Q: "강연료 얼마?" → ACTION: SEARCH, QUERY: 세미나 강연료
Q: "황강욱 교수님과 쓴 논문?" → ACTION: SEARCH, QUERY: 황강욱
Q: "논문 몇 편?" → ACTION: SEARCH, QUERY: 논문 개수 통계
Q: "안녕하세요" → ACTION: CHAT
Q: "감사합니다" → ACTION: CHAT

문맥 의존적 예시 (이전 대화를 참고):
이전: "고려대 세미나?" → 현재: "언제였어?" → ACTION: SEARCH, QUERY: 고려대 세미나 날짜
이전: "AI 세미나에 대해" → 현재: "얼마야?" → ACTION: SEARCH, QUERY: AI 세미나 강연료
이전: "세미나 했어?" → 현재: "시간은?" → ACTION: SEARCH, QUERY: 세미나 시간

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
                temperature: 0.1,
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

        // Enhanced heuristic: More aggressive SEARCH detection
        function messageSuggestsSearch(text) {
          const lower = (text || '').toLowerCase();
          
          // Direct keywords that always trigger SEARCH
          const searchKeywords = [
            '논문', '저널', 'paper', 'publication', 'journal',
            '세미나', '강연', '초청', 'seminar', 'talk', 'lecture',
            '강연료', '비용', 'fee',
            '몇', '개수', '통계', 'count', 'how many',
            '연구', 'research', '주제', 'topic',
            '공저', '공동', '같이', '함께', 'coauthor', 'collaborat',
            'ieee', 'sensors', 'access', 'mdpi',
            '년', '연도', 'year', '언제', 'when',
            '누구', 'who', '어떤', 'what', '뭐', '무엇',
            '얼마', '돈', '50만원', '500000',
            '횟수', '회', '번', '개'
          ];
          
          for (const keyword of searchKeywords) {
            if (lower.includes(keyword)) return true;
          }
          
          // Check if message contains author names (more comprehensive list)
          const authorNames = [
            '황강욱', '최준균', '이주형', '배소희', '오현택',
            '한재섭', '김장겸', '안재원', '김나경', '김민경',
            '백범한', '정교훈', '서현석', '전진환', 'Yuyang Peng',
            'Alaelddin', 'Mohammed', 'Gyeong Ho Lee', 'Min Chen'
          ];
          for (const name of authorNames) {
            if (lower.includes(name.toLowerCase())) return true;
          }
          
          // Check if message contains university names  
          const unis = ['kaist', '카이스트', '경북대', '충남대', '부경대', '경희대', '전북대', '한국과학영재학교', '경상국립대', '고려대', '유성구청'];
          for (const uni of unis) {
            if (lower.includes(uni)) return true;
          }
          
          // Fallback to original logic
          const tks = expandTokensWithSynonyms(tokenize(text || ''));
          if (tks.length === 0) return false;
          const hayArr = [];
          for (const p of PAPERS_DATABASE) {
            hayArr.push((p.title||'').toLowerCase());
            if (Array.isArray(p.keywords)) hayArr.push(p.keywords.join(' ').toLowerCase());
          }
          for (const t of TALKS_DATABASE) {
            hayArr.push((t.title||'').toLowerCase());
            if (Array.isArray(t.keywords)) hayArr.push(t.keywords.join(' ').toLowerCase());
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
          // Check if it's a seminar-specific query
          const isSeminarQuery = /(세미나|강연|초청|talk|seminar|lecture|강의)/.test((message + ' ' + query).toLowerCase());
          
          if (isSeminarQuery) {
            // Search primarily in talks/seminars
            searchResults = await embeddingSearch(query || message, [], [], 15, true);
          } else if (isPublicationIntent(message, query)) {
            searchResults = await embeddingSearch(query || '', PAPERS_DATABASE, [], 25, false); // Don't include talks for paper queries
          } else if (/논문/.test(message.toLowerCase()) || /논문/.test((query || '').toLowerCase())) {
            // If message contains "논문", search only papers
            searchResults = await embeddingSearch(query || message, PAPERS_DATABASE, [], 25, false);
          } else {
            searchResults = await embeddingSearch(query || message, PAPERS_DATABASE, postsFlat, 20, true); // Include talks for general queries
          }
          console.log('Embedding search results:', searchResults);
        }

        // Generate final response with context
        // If user asked for counts, compute deterministically from data (no hardcoding)
        const lowerMsg = (message || '').toLowerCase();
        const countIntent = /몇|개수|얼마나|how many/.test(lowerMsg) || /몇|개수|얼마나|how many/.test((query || '').toLowerCase());
        // Detect collaborator intent (누구와 가장 많이 같이 썼는지 등)
        const collaboratorIntent = /(공저|공동연구|같이|함께|coauthor|collaborator|누구)/.test(lowerMsg);
        // Detect list-all intent - removed to let AI handle naturally
        const listIntent = false;
        
        // Detect seminar/talk specific queries
        const seminarQuery = /(세미나|강연|초청|talk|seminar|lecture|강의)/.test(lowerMsg);
        const seminarCountQuery = seminarQuery && (countIntent || /(횟수|회|번|개수|몇|총)/.test(lowerMsg));

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
        
        // Remove hardcoded responses - let AI handle context-dependent queries naturally
        
        // Keep only essential deterministic responses for accuracy
        // Count queries need deterministic answers to avoid hallucination
        if (seminarCountQuery) {
          deterministicReply = `총 13회의 초청 세미나를 진행했습니다. 경상국립대, BIEN 컨퍼런스, 유성구청, 고려대, 부경대, KAIST, 한국과학영재학교, 경북대, 충남대, 경희대, 전북대 등에서 강연했습니다.`;
          searchResults = TALKS_DATABASE.slice(0, 5).map(t => 
            `[세미나] ${t.title} - ${t.venue}`
          );
          return {
            statusCode: 200,
            headers,
            body: JSON.stringify({
              step: 2,
              reply: deterministicReply,
              searchResults: searchResults
            })
          };
        } else if (countIntent && !seminarQuery) {
          // Paper count queries
          const effectiveQuery = (query && query.trim()) ? query : message;
          const matchedPapers = filterPapersByQuery(effectiveQuery || '', PAPERS_DATABASE);
          deterministicReply = `해당 주제 관련 논문은 ${matchedPapers.length}편입니다.`;
          // If we found nothing but intent exists, fall back to total count
          if (matchedPapers.length === 0) {
            deterministicReply = `전체 국제저널 기준으로 ${PAPERS_DATABASE.length}편입니다.`;
          }
        } else if (collaboratorIntent && /가장\s*많이/.test(lowerMsg)) {
          // Only handle "who did you write the most papers with" deterministically
          const specificName = extractCollaboratorNameFromMessage();
          let { topName, count, list } = computeCollaboratorsAndList(specificName);
          
          if (topName) {
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

        // Additional check for seminar-specific queries that might have been missed
        if (!deterministicReply && seminarQuery && (
          /(몇|개수|통계|횟수|회|번)/.test(lowerMsg) ||
          /(목록|리스트|전체|전부|보여)/.test(lowerMsg)
        )) {
          // Force seminar count response without years to avoid "25" confusion
          deterministicReply = `총 13회의 초청 세미나를 진행했습니다. 경상국립대, BIEN 컨퍼런스, 유성구청, 고려대, 부경대, KAIST, 한국과학영재학교, 경북대, 충남대, 경희대, 전북대 등에서 강연했습니다.`;
          searchResults = TALKS_DATABASE.map(t => 
            `[세미나] ${t.title} - ${t.venue}`
          );
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
        
        // 짧은 질문이면서 문맥이 있는 경우 처리
        const isShortQuery = message.length < 15;
        const contextClue = isShortQuery && recent ? `
이것은 짧은 질문입니다. 이전 대화 문맥을 참고하여 답변하세요:
- "얼마?" "비용은?" → 세미나 비용 (시간당 50만원)
- "시간은?" "몇시간?" → 세미나 시간 (1-2시간, 평균 1시간 30분)
- "언제?" → 구체적 세미나 날짜
- "몇개?" "몇편?" → 논문 25편 또는 세미나 13회
- "연락처?" "Contact?" → chaos@sayberrygames.com
` : '';
        
        const finalPrompt = `당신은 박상돈입니다. 

${recent ? `이전 대화:\n${recent}\n` : ''}
사용자: ${message}

검색 결과:
${searchResults && searchResults.length ? searchResults.join('\n') : '(관련 결과 없음)'}

핵심 정보 (항상 정확히 기억):
- 세미나: 총 13회 진행 (절대 25회 아님!)
- 논문: 총 25편 국제저널 (절대 13편 아님!)
- 강연료: 시간당 50만원 (1-2시간, 평균 1시간 30분)
- 신청/연락: chaos@sayberrygames.com
- 내용: AI 기초, LLM 활용법, 맞춤형 세미나
${contextClue}

특별 처리 규칙:

0. 오타/비속어 대응:
   "쎄미나", "세미나", "쎄미나" → 세미나로 이해
   "시발", "씨발" 등 비속어 → 무시하고 정상 답변
   "얼마야", "얼마임", "얼마죠" → 비용 문의로 이해

1. 짧은 질문 처리:
   "얼마?" → "시간당 50만원입니다. 보통 1-2시간 진행됩니다."
   "언제?" → 이전 대화의 세미나 날짜 답변
   "연락처?" "Contact?" → "chaos@sayberrygames.com"
   "시간은?" → "보통 1-2시간, 평균 1시간 30분입니다"
   
2. 애매한/평가 질문:
   "비싸지 않아?" → "시간당 50만원입니다. 청중 맞춤형 진행이 가능합니다."
   "괜찮은가?" → 긍정적 답변 + 세미나 정보
   "많이 했네" → "네, 총 13회 진행했습니다" (세미나) 또는 "네, 25편입니다" (논문)

3. 복합 질문 (반드시 모두 답변):
   "세미나 얼마고 몇 번?" → 반드시 둘 다: "시간당 50만원, 총 13회"
   "논문 몇 편이고 세미나 몇 번?" → "논문 25편, 세미나 13회"

4. 영어 질문:
   "How much?" → "시간당 50만원 (500,000 KRW per hour)"
   "How many papers?" → "25 papers (국제저널 25편)"
   "Contact?" → "chaos@sayberrygames.com"

5. 일반 세미나 문의:
   "AI 세미나에 대해" → 반드시 3가지: 내용(AI/LLM) + 비용(50만원) + 신청(이메일)
   
6. 개수 질문 (절대 헷갈리지 말 것):
   "세미나" 관련 → 항상 "13회"
   "논문" 관련 → 항상 "25편"
   절대 13과 25를 바꾸지 말 것!

7. 특정 대학 날짜:
   고려대 → 2025년 7월
   경상국립대 → 2025년 8월 25일
   KAIST → 2024년과 2025년

반드시 짧고 명확하게 답변. 불필요한 설명 금지.
한국어로 답변 (영어 질문도 한국어 답변 가능).`;

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
                temperature: 0.2,
                maxOutputTokens: 2000
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