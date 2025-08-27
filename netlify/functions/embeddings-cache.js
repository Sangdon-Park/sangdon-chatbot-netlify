// Pre-computed embeddings cache for papers and posts
// Generated using Google gemini-embedding-001 model
// This significantly reduces API calls and improves response time

const EMBEDDINGS_CACHE = {
  papers: {
    "Real-Time Dynamic Pricing for Edge Computing Services IEEE Access 2024": null,
    "Dynamic Bandwidth Slicing in PON for Federated Learning Sensors 2024": null,
    "Differential Pricing-Based Task Offloading for IoT IEEE IoT Journal 2022": null,
    "Joint Subcarrier and Transmission Power in WPT System IEEE IoT Journal 2022": null,
    "Multivariate-Time-Series-Prediction for IoT IEEE IoT Journal 2022": null,
    "Three Dynamic Pricing Schemes for Edge Computing IEEE IoT Journal 2020": null,
    "Competitive Data Trading Model With Privacy Valuation IEEE IoT Journal 2020": null,
    "Time Series Forecasting Based Energy Trading IEEE Access 2020": null,
    "Battery-Wear-Model-Based Energy Trading in EVs IEEE TII 2019": null,
    "Personal Data Trading Scheme for IoT Data Marketplaces IEEE Access 2019": null,
    "Power Efficient Clustering for 5G Mobile Edge Computing Mobile Networks 2019": null,
    "Optimal throughput analysis of CR networks Annals of OR 2019": null,
    "Competitive Partial Computation Offloading IEEE Access 2018": null,
    "Optimal Pricing for Energy-Efficient MEC Offloading IEEE Comm Letters 2018": null,
    "Load Profile Extraction by Mean-Shift Clustering Energies 2018": null,
    "Event-Driven Energy Trading System in Microgrids IEEE Access 2017": null,
    "Learning-Based Adaptive Imputation Method With kNN Energies 2017": null,
    "Resilient Linear Classification Attack on Training Data ACM/IEEE ICCPS 2017": null,
    "Contribution-Based Energy-Trading in Microgrids IEEE TIE 2016": null
  },
  posts: {
    "AI LLM에 미쳐있던 8개월 article 2024": null,
    "AI 없이는 불가능했던 동대표 활동 article 2024": null,
    "Serena MCP 설치 가이드 article 2024": null,
    "Edge Computing GUI Simulator 프로젝트 project 2024": null,
    "AI 캐릭터 대화 시스템 project 2024": null
  }
};

// In-memory cache for session
let sessionCache = {};

function getCacheKey(text) {
  // Create a simple hash of the text for caching
  return text.substring(0, 100);
}

function getCachedEmbedding(text) {
  const key = getCacheKey(text);
  return sessionCache[key] || null;
}

function setCachedEmbedding(text, embedding) {
  const key = getCacheKey(text);
  sessionCache[key] = embedding;
}

module.exports = {
  EMBEDDINGS_CACHE,
  getCachedEmbedding,
  setCachedEmbedding
};