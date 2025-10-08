# Chatbot Testing Guide

This guide will help you test the ChatGPT-powered chatbot functionality in your home buying platform.

## 🚀 Quick Start Testing

### 1. **Access the Application**
- Open your browser and go to: `http://localhost:8082`
- The development server should be running (you should see the home page)

### 2. **Authentication**
- Log in to your account using the existing authentication system
- Make sure you're authenticated before testing the chatbot

### 3. **Navigate to Chat**
- Look for the "Chat" tab in the main navigation
- Click on it to access the chatbot interface

## 🧪 Testing Scenarios

### **Test 1: Basic Chatbot Interface**
**Goal**: Verify the chatbot UI loads correctly

**Steps**:
1. Navigate to the Chat tab
2. Verify you see:
   - ✅ "Dom AI Assistant" header
   - ✅ Welcome message with bot icon
   - ✅ "Start a conversation" button
   - ✅ Input field at the bottom
   - ✅ Sidebar with conversation list (on desktop)

**Expected Result**: Clean, professional chat interface loads without errors

### **Test 2: Knowledge Base Integration**
**Goal**: Verify the chatbot uses your knowledge base

**Test Questions** (try these in order):
1. `"What is a mortgage pre-approval?"`
2. `"How long does the home buying process take?"`
3. `"What is escrow?"`
4. `"What are closing costs?"`

**Expected Results**:
- ✅ Bot responds with relevant information
- ✅ Responses include source citations (if using OpenAI)
- ✅ Information comes from your knowledge base
- ✅ Responses are helpful and educational

### **Test 3: Conversation Management**
**Goal**: Verify conversation history and management features

**Steps**:
1. Start a new conversation
2. Ask 2-3 questions
3. Check sidebar for conversation list
4. Try switching between conversations
5. Test conversation title editing
6. Test archiving/deleting conversations

**Expected Results**:
- ✅ Conversations are saved and listed
- ✅ Can switch between conversations
- ✅ Can edit conversation titles
- ✅ Can archive/delete conversations
- ✅ Conversation history persists

### **Test 4: Notion MCP Integration**
**Goal**: Verify Notion content is being loaded

**Steps**:
1. Open browser developer tools (F12)
2. Go to Console tab
3. Look for messages like:
   - `[MCP] Injected home buying knowledge`
   - `[KB] Injected (runtime) doc:`
4. Check if `window.homeBuyingKnowledgeDocs` exists

**Expected Results**:
- ✅ Notion content is being fetched and injected
- ✅ Knowledge base includes fresh Notion content
- ✅ Fallback to local backups if MCP fails

### **Test 5: OpenAI Integration**
**Goal**: Verify ChatGPT responses (if API key configured)

**Prerequisites**:
- Add `VITE_OPENAI_API_KEY` to your `.env` file
- Get API key from [OpenAI Platform](https://platform.openai.com/)

**Test Questions**:
- `"Can you explain the difference between pre-approval and pre-qualification?"`
- `"What should I look for in a home inspection?"`

**Expected Results**:
- ✅ Natural, conversational responses
- ✅ Source citations from knowledge base
- ✅ Helpful, detailed answers
- ✅ Professional tone

### **Test 6: Fallback System**
**Goal**: Verify fallback to local QA system

**Steps**:
1. Temporarily remove OpenAI API key
2. Ask a question
3. Verify bot still responds using local knowledge

**Expected Results**:
- ✅ Bot responds even without OpenAI
- ✅ Uses local knowledge base
- ✅ Graceful degradation

## 🔧 Troubleshooting

### **Common Issues**

#### **1. Chat Tab Not Visible**
- **Cause**: Component not properly integrated
- **Solution**: Check `MainAppContent.tsx` for ChatbotInterface import

#### **2. "Failed to load conversations" Error**
- **Cause**: Database migration not applied
- **Solution**: Run the SQL in `docs/MANUAL_MIGRATION_SQL.md`

#### **3. "OpenAI API key not configured" Warning**
- **Cause**: Missing API key
- **Solution**: Add `VITE_OPENAI_API_KEY` to `.env` file

#### **4. No Knowledge Base Responses**
- **Cause**: Knowledge files missing or corrupted
- **Solution**: Check `src/knowledge/docs.ts` exists and has content

#### **5. Notion Content Not Loading**
- **Cause**: MCP integration issues
- **Solution**: Check browser console for MCP errors, fallback should work

### **Debug Commands**

Open browser console and run these commands:

```javascript
// Check if knowledge base is loaded
console.log('Knowledge docs:', window.homeBuyingKnowledgeDocs);

// Check if Notion integration is working
console.log('Notion integration:', window.injectHomeBuyingKnowledge);

// Check current user
console.log('Current user:', window.supabase?.auth?.user());
```

## 📊 Performance Testing

### **Response Time**
- **Target**: < 3 seconds for OpenAI responses
- **Target**: < 1 second for local QA responses

### **Token Usage**
- Monitor OpenAI token usage in database
- Check `messages.tokens_used` field

### **Memory Usage**
- Monitor browser memory usage during long conversations
- Check for memory leaks with conversation switching

## 🎯 Success Criteria

The chatbot is working correctly if:

1. ✅ **Interface loads** without errors
2. ✅ **Knowledge base** provides relevant responses
3. ✅ **Conversations** are saved and retrievable
4. ✅ **Notion integration** loads fresh content
5. ✅ **OpenAI integration** provides natural responses
6. ✅ **Fallback system** works when APIs fail
7. ✅ **User isolation** prevents cross-user data access
8. ✅ **Performance** is acceptable (< 3s response time)

## 🚀 Next Steps After Testing

1. **Configure OpenAI API** for full functionality
2. **Run database migration** for conversation storage
3. **Test with real users** and gather feedback
4. **Monitor usage** and optimize performance
5. **Expand knowledge base** with more content

## 📞 Support

If you encounter issues:
1. Check browser console for errors
2. Verify all setup steps are completed
3. Test with simple questions first
4. Check the troubleshooting section above
