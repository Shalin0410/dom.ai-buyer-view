# AI Chatbot Implementation Guide

## Overview

The AI chatbot has been implemented to answer questions strictly from the buyer journey project's documentation and schema information. It uses a retrieval-based system that searches through project docs and provides scoped, accurate responses.

## How It Works

### Knowledge Base
The chatbot draws information from:
- **Local Documentation**: Architecture, FUB integration, Supabase setup guides
- **Database Schema**: Enhanced multi-tenant schema with FUB integration
- **Notion Integration**: "Make home buying transparent" content (when available)

### Question Categories
The chatbot provides pre-built question categories:

1. **Database Schema**
   - Main tables and relationships
   - Timeline and stage functionality
   - Action item generation
   - Multi-tenant architecture

2. **FUB Integration**
   - Integration workflow
   - Stage mapping system
   - Data synchronization
   - Detection priority system

3. **Architecture & Setup**
   - Service layer design
   - Supabase configuration
   - Migration procedures
   - Authentication system

### Features
- **Scoped Responses**: Only answers from project documentation
- **Source Citations**: Shows which documents were used for each answer
- **Fallback Handling**: Graceful responses when information isn't available
- **Real-time Knowledge Injection**: Supports external content from Notion MCP

## Usage

### Basic Questions
Ask about any aspect of the project:
- "How do timelines work?"
- "What are the FUB stages?"
- "How is the database schema structured?"
- "What migration files are needed?"

### Advanced Queries
The system can handle complex questions:
- "How does FUB stage detection work with the priority system?"
- "What tables are involved in the action item generation process?"
- "How does the service layer architecture support multiple backends?"

## Integration with Notion MCP

The chatbot can be enhanced with external Notion content:

### Global Function
When the chat interface loads, it exposes a global function:
```javascript
window.injectProjectKnowledge(title, content)
```

### Usage Example
```javascript
// From Notion MCP or external integration
window.injectProjectKnowledge(
  "Make home buying transparent - Timeline Process", 
  notionPageMarkdownContent
);
```

### Content Filtering
Only content related to the project is accepted:
- Titles containing "make home buying transparent"
- Titles containing "buyer journey"
- Titles containing "home buying"

## Technical Implementation

### Files Structure
```
src/
├── knowledge/
│   └── docs.ts              # Local documentation loader
├── services/
│   └── chatbot/
│       ├── index.ts         # Main export
│       └── qa.ts            # Question-answering logic
├── hooks/
│   └── useNotionIntegration.ts  # External content injection
└── components/
    └── EnhancedChatInterface.tsx # Updated UI component
```

### QA System
The question-answering system:
1. **Normalizes** user queries
2. **Scores** documents based on keyword overlap
3. **Extracts** relevant snippets
4. **Synthesizes** answers from multiple sources
5. **Provides** source citations

### Scope Guards
Multiple layers ensure responses stay within project scope:
- Document filtering by title and content
- Response templates for out-of-scope queries
- Source validation and citation

## Customization

### Adding New Documentation
To add new docs to the knowledge base:

1. Update `src/knowledge/docs.ts`:
```typescript
export const localDocs: Doc[] = [
  // ... existing docs
  {
    title: 'New Documentation',
    content: `Your documentation content here...`
  }
];
```

2. The chatbot will automatically include the new content in its responses.

### Modifying Question Categories
Update the `questionCategories` object in `EnhancedChatInterface.tsx`:
```typescript
const questionCategories = {
  newCategory: {
    icon: YourIcon,
    title: "New Category",
    questions: [
      "Sample question 1",
      "Sample question 2"
    ]
  }
};
```

## Benefits

### For Development
- **Project-focused**: Answers only about the buyer journey application
- **Always accurate**: Responses based on actual project documentation
- **Source transparency**: Clear citations for all information
- **Maintenance-friendly**: Easy to update with new documentation

### for Users
- **Instant answers**: No need to search through multiple docs
- **Contextual help**: Understands project-specific terminology
- **Reliable information**: No hallucinated or incorrect responses
- **Progressive disclosure**: Suggested questions to explore deeper

## Limitations

1. **No external knowledge**: Cannot answer questions outside project scope
2. **No real-time data**: Uses static documentation, not live database queries
3. **Simple retrieval**: Basic keyword matching, not semantic understanding
4. **English only**: Currently supports English language queries

## Future Enhancements

Potential improvements:
- **Semantic search**: Use embeddings for better document retrieval
- **Live data integration**: Connect to Supabase for real-time information
- **Multi-language support**: Expand beyond English
- **Voice interface**: Add speech-to-text capabilities
- **Context memory**: Remember conversation history for better responses
