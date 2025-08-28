# Chatbot Test Suites and Current Status

## Test Suites Created

### 1. `hardcore-test-suite.js` - 🔥 빡센 종합 테스트
- **Categories**: 8 test suites with 50+ test cases
- **Features**:
  - Critical accuracy tests (seminar/paper counts)
  - Compound question handling
  - Confirmation questions ("맞아?" pattern)
  - Context-dependent questions
  - Typos and variations
  - Edge cases
  - Profile/education questions
  - Stress tests
- **Validation**: Strict checking with must/mustNot keywords, patterns, min/max length
- **Retry logic**: Handles timeouts with configurable retries

### 2. `extreme-parallel-test.js` - ⚡ 동시다발 극한 테스트
- **Categories**: 10 extreme test categories with 100+ cases
- **Features**:
  - Parallel execution (3 concurrent requests max)
  - Absolute accuracy requirements
  - Price torture tests (all variations of "얼마")
  - Contact stress tests
  - Confirmation attack patterns
  - Typo hell
  - Ultra-short questions
  - Date confusion prevention
  - Malicious input handling
- **Analysis**: Detailed failure pattern analysis, category performance metrics

### 3. `quick-validation.js` - ⚡ 핵심 기능 빠른 검증
- **10 critical tests only** for rapid validation
- Quick pass/fail assessment
- Suitable for CI/CD pipeline

### 4. `local-quick-test.js` - 로컬 디버깅용
- Detailed step-by-step analysis
- Shows AI decision process (Action, Query)
- Response content analysis

## Current Test Results (Aug 27, 2025)

### Critical Issues Identified:

#### 1. ❌ "연락처?" Returns Empty (CRITICAL)
- Being classified as CHAT but has no initialMessage
- Should be SEARCH with email response
- **Impact**: Contact questions fail completely

#### 2. ❌ Compound Questions Missing Price
- "세미나 얼마고 몇 번?" → Missing "50만원"
- Only returning count (13) but not price
- **Impact**: Multi-part questions incomplete

#### 3. ❌ Confirmation Questions Not Starting with "네"
- "세미나 13회 맞아?" → Should start with "네, 13회..."
- "논문 25편 맞죠?" → Should start with "네, 25편..."
- **Impact**: Confirmation pattern not recognized

#### 4. ✅ Working Well:
- Simple count questions (세미나 몇 번? → 13)
- Simple price questions (얼마? → 50만원)
- Paper/seminar distinction (25 vs 13)
- Some compound questions (비용이랑 연락처)

### Performance Metrics:
- **Quick Validation**: ~50-60% pass rate
- **Critical Failures**: 3-4 per 10 tests
- **Response Time**: 2-5 seconds per query
- **Timeout Rate**: ~10-20% on complex tests

## Test Execution Commands

```bash
# Quick validation (10 tests, ~30 seconds)
node quick-validation.js

# Local debugging (shows details)
node local-quick-test.js

# Full hardcore test (50+ tests, ~3-5 minutes)
node hardcore-test-suite.js

# Extreme parallel test (100+ tests, ~5-10 minutes)
node extreme-parallel-test.js

# Check specific issues
node test-single-quick.js
```

## Key Testing Insights

### Must-Pass Critical Tests:
1. 세미나 몇 번? → Must have "13", not "25"
2. 논문 몇 편? → Must have "25", not "13"
3. 얼마? → Must have "50만원"
4. 연락처? → Must have "chaos@sayberrygames.com"
5. Compound questions → Must answer ALL parts
6. Confirmation questions → Must start with "네"

### Common Failure Patterns:
1. Short questions being misclassified as CHAT
2. Compound questions only answering one part
3. Confirmation questions missing acknowledgment
4. Context not being utilized properly

## Recommendations for Fixes

1. **Fix "연락처?" classification**:
   - Force SEARCH for any question with "연락처", "이메일", "contact"
   - Ensure CHAT always has valid initialMessage

2. **Improve compound question handling**:
   - Detect multiple question markers ("얼마", "몇")
   - Ensure AI template enforces all-part responses

3. **Fix confirmation pattern**:
   - Detect "맞아?", "맞죠?", "맞지?" patterns
   - Force response to start with "네" or "맞습니다"

4. **Strengthen deterministic responses**:
   - Keep count queries deterministic (13/25)
   - Consider deterministic for critical single-word queries