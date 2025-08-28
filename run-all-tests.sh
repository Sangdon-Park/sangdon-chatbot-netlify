#!/bin/bash

# 🚀 RUN ALL TESTS - 모든 테스트 실행 스크립트

echo "=================================="
echo "🚀 CHATBOT COMPREHENSIVE TEST SUITE"
echo "=================================="
echo ""
echo "This will run all test suites. It may take 20-30 minutes."
echo ""

# Create results directory
mkdir -p test-results
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
RESULT_DIR="test-results/run_${TIMESTAMP}"
mkdir -p $RESULT_DIR

echo "📁 Results will be saved to: $RESULT_DIR"
echo ""

# Function to run test and save results
run_test() {
    local test_name=$1
    local test_file=$2
    local timeout_duration=${3:-300}  # Default 5 minutes
    
    echo "=================================="
    echo "🔥 Running: $test_name"
    echo "=================================="
    
    timeout $timeout_duration node $test_file > "$RESULT_DIR/${test_name}.log" 2>&1
    
    if [ $? -eq 0 ]; then
        echo "✅ $test_name completed successfully"
    elif [ $? -eq 124 ]; then
        echo "⏱️ $test_name timed out after ${timeout_duration}s"
    else
        echo "❌ $test_name failed with error"
    fi
    
    # Copy JSON results if exists
    if [ -f "${test_name}-results.json" ]; then
        cp "${test_name}-results.json" "$RESULT_DIR/"
    fi
    
    echo ""
}

# Run all tests
echo "Starting comprehensive test suite..."
echo ""

# 1. Quick validation (1 minute)
run_test "quick-validation" "quick-validation.js" 60

# 2. Critical fixes test (2 minutes)
run_test "critical-fixes" "critical-fixes-test.js" 120

# 3. Hardcore test suite (5 minutes)
run_test "hardcore-suite" "hardcore-test-suite.js" 300

# 4. Extreme parallel test (5 minutes)
run_test "extreme-parallel" "extreme-parallel-test.js" 300

# 5. Ultimate comprehensive test (10 minutes)
run_test "ultimate-comprehensive" "ultimate-comprehensive-test.js" 600

# 6. Conversation flow test (5 minutes)
run_test "conversation-flow" "conversation-flow-test.js" 300

# 7. Random stress test with 50 iterations (3 minutes)
run_test "random-stress" "random-stress-test.js 50" 180

# Generate summary report
echo "=================================="
echo "📊 GENERATING SUMMARY REPORT"
echo "=================================="

cat > "$RESULT_DIR/summary.txt" << EOF
CHATBOT TEST SUITE SUMMARY
Generated: $(date)
================================

Test Results:
EOF

# Check each log file for pass rates
for log_file in $RESULT_DIR/*.log; do
    if [ -f "$log_file" ]; then
        test_name=$(basename "$log_file" .log)
        pass_rate=$(grep -oP "Pass Rate: \K\d+%" "$log_file" | tail -1)
        if [ -z "$pass_rate" ]; then
            pass_rate=$(grep -oP "\K\d+% pass" "$log_file" | tail -1)
        fi
        if [ -z "$pass_rate" ]; then
            pass_rate="N/A"
        fi
        echo "- $test_name: $pass_rate" >> "$RESULT_DIR/summary.txt"
    fi
done

echo "" >> "$RESULT_DIR/summary.txt"
echo "Full logs available in: $RESULT_DIR" >> "$RESULT_DIR/summary.txt"

# Display summary
cat "$RESULT_DIR/summary.txt"

echo ""
echo "=================================="
echo "✅ ALL TESTS COMPLETED"
echo "=================================="
echo ""
echo "📁 Full results saved to: $RESULT_DIR"
echo "📊 View summary: cat $RESULT_DIR/summary.txt"
echo ""

# Check if critical tests passed
CRITICAL_PASS=$(grep -l "pass rate.*[89][0-9]%" "$RESULT_DIR/quick-validation.log" 2>/dev/null)
if [ ! -z "$CRITICAL_PASS" ]; then
    echo "🎉 Critical tests show good performance!"
else
    echo "⚠️ Critical tests show issues that need attention"
fi