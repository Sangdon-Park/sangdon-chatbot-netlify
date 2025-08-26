// Complete PAPERS_DATABASE with all 25 journal papers parsed from publications.html
// Each paper contains: title, journal, year, authors, role (1저자 or 교신), keywords

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

module.exports = PAPERS_DATABASE;