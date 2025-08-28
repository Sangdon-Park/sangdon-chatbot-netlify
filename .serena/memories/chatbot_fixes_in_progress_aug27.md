# Chatbot Fixes in Progress - August 27, 2025

## Current Status
- **Pass Rate**: Still around 40-45% (target: 90%+)
- **User Requirement**: NO HARDCODING - must use AI prompt engineering only

## Fixes Applied Today

### 1. Enhanced Contact Detection
- Added more flexible pattern matching for "연락처", "이메일", "신청"
- Updated prompt examples to force SEARCH classification
- **Issue**: Still being classified as CHAT by Gemini AI (not working)

### 2. Confirmation Question Templates
- Added stronger emphasis on starting with "네"
- Multiple examples and warnings in prompt
- **Issue**: AI not following the instruction (0% success)

### 3. Compound Question Handling
- Added warnings about "~고", "~랑", "~하고" connectors
- Multiple examples for compound responses
- **Issue**: Still missing parts (only 40% success)

## Critical Problems Still Persisting

### Problem 1: Contact Questions → CHAT (Wrong Classification)
- "연락처?" → Being classified as CHAT, returns empty
- "이메일?" → Being classified as CHAT, returns empty
- "신청은?" → Being classified as CHAT, returns empty
- Only works when more words like "어디로 연락?" or "연락처 알려줘"

**Root Cause**: Gemini AI in Step 1 is not following the prompt instructions despite clear examples

### Problem 2: Confirmations Not Starting with "네"
- "13회 맞아?" → Returns "총 13회 진행했습니다" (should start with "네")
- "25편 맞죠?" → Returns "전체 국제저널 기준으로 25편입니다" (should start with "네")

**Root Cause**: Gemini AI in Step 2 ignores the template requirement

### Problem 3: Compound Questions Missing Parts
- "세미나 얼마고 몇 번?" → Only returns count, missing price
- "얼마고 몇번?" → Completely confused response

**Root Cause**: AI not recognizing compound structure properly

## Technical Analysis

The system has 2 steps:
1. **Step 1**: Gemini decides ACTION (SEARCH or CHAT) and QUERY
2. **Step 2**: Gemini generates final response based on search results

Both steps are failing to follow prompt instructions despite:
- Clear examples in prompts
- Multiple template patterns
- Explicit warnings and rules
- Heuristic overrides (partially working)

## Possible Solutions to Try Next

1. **Stronger Heuristic Override**: 
   - Force SEARCH for ANY message containing contact/email/신청
   - Currently only partial override

2. **Deterministic Patterns for Critical Cases**:
   - User doesn't want this, but AI is not reliable enough
   - Could add minimal patterns just for contact/confirmation

3. **Different AI Model**:
   - Try gemini-pro instead of gemini-2.5-flash
   - Might follow instructions better

4. **Prompt Restructuring**:
   - Move templates to beginning of prompt
   - Use stronger language like "CRITICAL" "MUST" "REQUIRED"

5. **Pre-processing Layer**:
   - Detect patterns before AI
   - Modify question to be clearer for AI

## User's Emphasized Requirements
- NO HARDCODING allowed (user was very upset about this)
- Must achieve 90%+ pass rate
- All responses must be AI-generated through prompts
- Test thoroughly before claiming success

## Files Modified
- `/netlify/functions/chat-ai-driven.js` - Main chatbot logic with all prompt enhancements

## Test Results Summary
- Contact questions: 40% success (should be 100%)
- Confirmation questions: 0% success (should be 100%)
- Compound questions: 40% success (should be 100%)
- Simple questions: 80-100% success (working well)

The AI is not reliably following the prompt instructions despite multiple attempts to strengthen them.