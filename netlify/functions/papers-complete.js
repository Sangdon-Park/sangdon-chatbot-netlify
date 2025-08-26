// Complete 25 papers from publications.html
const PAPERS_DATABASE = [
  // 2024
  { title: "Real-Time Dynamic Pricing for Edge Computing Services: A Market Perspective", journal: "IEEE Access", year: 2024, role: "1저자", authors: ["박상돈", "배소희", "이주형", "성영철"], keywords: ["edge computing", "pricing", "real-time", "market"] },
  { title: "Dynamic Bandwidth Slicing in Passive Optical Networks to Empower Federated Learning", journal: "Sensors", year: 2024, role: "교신", authors: ["Alaelddin F. Y. Mohammed", "이주형", "박상돈"], keywords: ["PON", "federated learning", "bandwidth", "optical networks"] },
  
  // 2022
  { title: "Differential Pricing-Based Task Offloading for Delay-Sensitive IoT Applications in Mobile Edge Computing System", journal: "IEEE Internet of Things Journal", year: 2022, role: "교신", authors: ["서현석", "오현택", "최준균", "박상돈"], keywords: ["IoT", "pricing", "task offloading", "MEC"] },
  { title: "Joint Subcarrier and Transmission Power Allocation in OFDMA-Based WPT System for Mobile-Edge Computing in IoT Environment", journal: "IEEE Internet of Things Journal", year: 2022, role: "공저자", authors: ["한재섭", "이경호", "박상돈", "최준균"], keywords: ["WPT", "power", "IoT", "OFDMA", "MEC"] },
  { title: "A Novel Cooperative Transmission Scheme in UAV-Assisted Wireless Sensor Networks", journal: "Electronics", year: 2022, role: "공저자", authors: ["Yue Zang", "Yuyang Peng", "박상돈", "Han Hai", "Fawaz Al-Hazemi", "Mohammad Meraj Mirza"], keywords: ["UAV", "wireless sensor networks", "cooperative transmission"] },
  { title: "Power Scheduling Scheme for a Charging Facility Considering the Satisfaction of Electric Vehicle Users", journal: "IEEE Access", year: 2022, role: "공저자", authors: ["김장겸", "이주형", "박상돈", "최준균"], keywords: ["EV", "charging", "power scheduling", "user satisfaction"] },
  { title: "A Multivariate-Time-Series-Prediction-Based Adaptive Data Transmission Period Control Algorithm for IoT Networks", journal: "IEEE Internet of Things Journal", year: 2022, role: "교신", authors: ["한재섭", "이경호", "박상돈", "최준균"], keywords: ["IoT", "time series", "prediction", "adaptive transmission"] },
  
  // 2021
  { title: "Lane Detection Aided Online Dead Reckoning for GNSS Denied Environments", journal: "Sensors", year: 2021, role: "공저자", authors: ["전진환", "황윤진", "정용섭", "박상돈", "권인소", "최세범"], keywords: ["lane detection", "GNSS", "dead reckoning", "navigation"] },
  { title: "Deposit Decision Model for Data Brokers in Distributed Personal Data Markets Using Blockchain", journal: "IEEE Access", year: 2021, role: "공저자", authors: ["오현택", "박상돈", "최준균", "노성기"], keywords: ["blockchain", "data market", "privacy", "distributed systems"] },
  
  // 2020
  { title: "Three Dynamic Pricing Schemes for Resource Allocation of Edge Computing for IoT Environment", journal: "IEEE Internet of Things Journal", year: 2020, role: "교신", authors: ["백범한", "이주형", "Yuyang Peng", "박상돈"], keywords: ["edge computing", "pricing", "IoT", "resource allocation"] },
  { title: "Competitive Data Trading Model With Privacy Valuation for Multiple Stakeholders in IoT Data Markets", journal: "IEEE Internet of Things Journal", year: 2020, role: "교신", authors: ["오현택", "박상돈", "Gyu Myoung Lee", "최준균", "노성기"], keywords: ["data trading", "privacy", "IoT", "data markets"] },
  { title: "Time Series Forecasting Based Day-Ahead Energy Trading in Microgrids: Mathematical Analysis and Simulation", journal: "IEEE Access", year: 2020, role: "교신", authors: ["정교훈", "박상돈", "황강욱"], keywords: ["energy", "time series", "trading", "microgrids"] },
  
  // 2019
  { title: "Battery-Wear-Model-Based Energy Trading in Electric Vehicles: A Naive Auction Model and a Market Analysis", journal: "IEEE Transactions on Industrial Informatics", year: 2019, role: "교신", authors: ["김장겸", "이주형", "박상돈", "최준균"], keywords: ["EV", "battery", "energy trading", "auction"] },
  { title: "Optimal throughput analysis of multiple channel access in cognitive radio networks", journal: "Annals of Operations Research", year: 2019, role: "1저자", authors: ["박상돈", "황강욱", "최준균"], keywords: ["cognitive radio", "throughput", "optimization", "channel access"] },
  { title: "Energy-efficient cooperative transmission for intelligent transportation systems", journal: "Future Generation Computer Systems", year: 2019, role: "공저자", authors: ["Yuyang Peng", "Jun Li", "박상돈", "Konglin Zhu", "Mohammad Mehedi Hassan", "Ahmed Alsanad"], keywords: ["ITS", "energy efficiency", "cooperative transmission"] },
  { title: "Power Efficient Clustering Scheme for 5G Mobile Edge Computing Environment", journal: "Mobile Networks & Applications", year: 2019, role: "교신", authors: ["안재원", "이주형", "박상돈", "박홍식"], keywords: ["5G", "edge computing", "clustering", "MEC"] },
  { title: "Personal Data Trading Scheme for Data Brokers in IoT Data Marketplaces", journal: "IEEE Access", year: 2019, role: "교신", authors: ["오현택", "박상돈", "Gyu Myoung Lee", "허환조", "최준균"], keywords: ["data marketplace", "IoT", "privacy", "data brokers"] },
  { title: "Comparison Between Seller and Buyer Pricing Systems for Energy Trading in Microgrids", journal: "IEEE Access", year: 2019, role: "교신", authors: ["배소희", "박상돈"], keywords: ["energy trading", "microgrids", "pricing systems"] },
  
  // 2018
  { title: "Load Profile Extraction by Mean-Shift Clustering with Sample Pearson Correlation Coefficient Distance", journal: "Energies", year: 2018, role: "교신", authors: ["김나경", "박상돈", "이주형", "최준균"], keywords: ["clustering", "load profile", "machine learning", "mean-shift"] },
  { title: "An Optimal Pricing Scheme for the Energy-Efficient Mobile Edge Computation Offloading With OFDMA", journal: "IEEE Communications Letters", year: 2018, role: "교신", authors: ["김성환", "박상돈", "Min Chen", "윤찬현"], keywords: ["MEC", "pricing", "energy", "OFDMA", "offloading"] },
  { title: "Three Hierarchical Levels of Big-Data Market Model Over Multiple Data Sources for Internet of Things", journal: "IEEE Access", year: 2018, role: "교신", authors: ["장부식", "박상돈", "이주형", "한상근"], keywords: ["big data", "IoT", "data market", "hierarchical model"] },
  { title: "Competitive Partial Computation Offloading for Maximizing Energy Efficiency in Mobile Cloud Computing", journal: "IEEE Access", year: 2018, role: "교신", authors: ["안상홍", "이주형", "박상돈", "S.H. Shah Newaz", "최준균"], keywords: ["edge computing", "offloading", "competition", "mobile cloud"] },
  
  // 2017
  { title: "Event-Driven Energy Trading System in Microgrids: Aperiodic Market Model Analysis with a Game Theoretic Approach", journal: "IEEE Access", year: 2017, role: "1저자", authors: ["박상돈", "이주형", "황강욱", "최준균"], keywords: ["microgrid", "energy trading", "event-driven", "game theory"] },
  { title: "Learning-Based Adaptive Imputation Method With kNN Algorithm for Missing Power Data", journal: "Energies", year: 2017, role: "교신", authors: ["김민경", "박상돈", "이주형", "주용재", "최준균"], keywords: ["kNN", "imputation", "machine learning", "missing data"] },
  
  // 2016
  { title: "Contribution-Based Energy-Trading Mechanism in Microgrids for Future Smart Grid: A Game Theoretic Approach", journal: "IEEE Transactions on Industrial Electronics", year: 2016, role: "1저자", authors: ["박상돈", "이주형", "배소희", "황강욱", "최준균"], keywords: ["microgrid", "energy trading", "game theory", "smart grid"], award: "IEEE ITeN 선정" }
];

module.exports = { PAPERS_DATABASE };