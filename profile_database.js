// 박상돈 박사 프로필 정보 데이터베이스
// 홈페이지와 이력서에서 추출한 전체 정보

const PROFILE_DATABASE = {
  // 기본 정보
  name: "박상돈",
  name_en: "Sangdon Park", 
  title: "AI 연구 엔지니어",
  company: "세이베리 게임즈 (Sayberry Games Inc.)",
  email: "chaos@sayberrygames.com",
  phone: "+82-10-2523-3824",
  website: "https://sangdon-park.github.io/",
  linkedin: "https://www.linkedin.com/in/sangdon/",
  googleScholar: "https://scholar.google.com/citations?user=JZFDtsgAAAAJ",
  
  // 학력 (Education)
  education: [
    {
      degree: "박사",
      field: "전기 및 전자공학",
      school: "KAIST (한국과학기술원)",
      department: "전기및전자공학부",
      period: "2013-2017",
      advisor: "최준균 교수",
      lab: "미디어네트워크 연구실",
      thesis: "미래 스마트 그리드를 위한 동적 에너지 거래 방안",
      research: "무선통신, 스마트 그리드, 최적화, 게임이론, 에너지 빅데이터"
    },
    {
      degree: "석사",
      field: "수리과학",
      school: "KAIST (한국과학기술원)",
      department: "수리과학과",
      period: "2011-2013",
      advisor: "황강욱 교수",
      lab: "차세대 통신네트워크 연구실",
      thesis: "인지 무선 네트워크를 위한 최적 랜덤 액세스 정책의 처리량 성능 분석"
    },
    {
      degree: "학사",
      field: "수리과학",
      school: "KAIST (한국과학기술원)",
      department: "수리과학과",
      period: "2006-2011",
      note: "조기졸업"
    }
  ],
  
  // 경력 (Experience)
  experience: [
    {
      position: "AI 연구 엔지니어",
      company: "세이베리 게임즈",
      period: "2025년 5월 - 현재",
      description: [
        "LLM 기반 AI 캐릭터 및 인터랙티브 게임 시스템 연구 개발",
        "AI 기술을 활용한 게임 콘텐츠 제작 프로세스 혁신",
        "3억원 규모 AI 게임 개발 프로젝트 참여"
      ]
    },
    {
      position: "박사후 연구원",
      company: "KAIST 정보전자연구소",
      period: "2017년 8월 - 2025년 4월",
      advisor: "최준균 교수",
      description: [
        "엣지 컴퓨팅, 에너지 거래, 데이터 마켓 최적화 연구",
        "AI/LLM 기술 탐구 및 응용",
        "세종과학펠로우십 주관연구자 (2022-2025)"
      ]
    }
  ],
  
  // 주요 성과
  achievements: [
    {
      title: "세종과학펠로우십",
      organization: "한국연구재단",
      year: 2022,
      amount: "연간 약 1억 2천만원 (최대 5년)",
      role: "주관연구자",
      description: "권위 있는 국가 연구 펠로우십 수상"
    },
    {
      title: "AI 초청 세미나",
      count: 13,
      period: "2023-2025",
      description: "KAIST, 경희대, 충남대 등 국내 주요 대학에서 AI 세미나 진행"
    },
    {
      title: "국제저널 논문",
      count: 25,
      description: "IEEE, Sensors, Electronics 등 국제저널 논문 게재"
    }
  ],
  
  // 핵심 역량
  skills: {
    ai_development: [
      "LLM 응용 (ChatGPT, Claude, Gemini)",
      "AI 캐릭터 대화 시스템",
      "바이브 코딩 (Vibe Coding)",
      "프롬프트 엔지니어링",
      "RAG (Retrieval-Augmented Generation)"
    ],
    technical: [
      "엣지 컴퓨팅",
      "에너지 거래 시스템",
      "최적화 이론",
      "게임 이론",
      "무선통신 네트워크"
    ],
    programming: [
      "Python",
      "JavaScript/TypeScript",
      "Node.js",
      "React"
    ]
  },
  
  // 프로젝트 성과
  projects: [
    {
      title: "엣지 컴퓨팅 GUI 시뮬레이터",
      period: "1개월",
      originalEstimate: "4년",
      description: "AI 도구를 활용하여 예상 개발 기간을 1/48로 단축",
      achievement: "바이브 코딩으로 초고속 개발"
    },
    {
      title: "AI 캐릭터 대화 시스템",
      description: "자연스러운 캐릭터 상호작용을 생성하는 LLM 기반 시스템",
      technology: ["LLM", "프롬프트 엔지니어링", "RAG"]
    }
  ],
  
  // 세미나 정보
  seminar: {
    title: "AI/LLM 초청 세미나",
    topics: [
      "AI 기초",
      "LLM (Large Language Model) 활용법", 
      "프롬프트 엔지니어링",
      "연구자를 위한 AI 활용",
      "LLM과 RAG 기술"
    ],
    fee: "시간당 50만원",
    duration: "1-2시간 (평균 1시간 30분)",
    customization: "청중 수준별 맞춤형 가능 (초급자부터 연구자까지)",
    contact: "chaos@sayberrygames.com",
    totalCount: 13,
    universities: [
      "KAIST",
      "경희대학교",
      "충남대학교",
      "경북대학교",
      "경상국립대학교",
      "고려대학교",
      "부경대학교",
      "전북대학교",
      "한국과학영재학교"
    ]
  },
  
  // 연구 관심사
  research_interests: [
    "LLM 기반 시스템 설계",
    "AI 캐릭터 개발",
    "상호작용형 AI 시스템",
    "바이브 코딩 방법론",
    "엣지 컴퓨팅 최적화",
    "에너지 거래 시스템"
  ]
};

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { PROFILE_DATABASE };
}