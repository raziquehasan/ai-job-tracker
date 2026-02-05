# AI Job Tracker

An intelligent job tracking platform powered by LangChain and LangGraph that helps users discover, match, and track job applications using AI.

![Architecture](https://via.placeholder.com/800x400/4F46E5/FFFFFF?text=AI+Job+Tracker+Architecture)

## 🎯 Features

- **AI-Powered Job Matching** - LangChain-based resume-to-job scoring (0-100%)
- **Smart Application Tracking** - Track applications with timeline and status updates
- **Natural Language Search** - LangGraph AI assistant for conversational job search
- **Login & Resume Management** - Secure authentication with resume upload
- **Advanced Filtering** - Filter by role, skills, location, work mode, date, and match score
- **Best Matches Section** - Top 6-8 jobs ranked by AI match score

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         FRONTEND (React + Vite)                  │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │  Login Page  │  │  Job Listing │  │ Applications │          │
│  └──────────────┘  └──────────────┘  └──────────────┘          │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │ Chat Bubble  │  │ FiltersPanel │  │ Best Matches │          │
│  └──────────────┘  └──────────────┘  └──────────────┘          │
└─────────────────────────────────────────────────────────────────┘
                              │
                              │ HTTP/REST API
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    BACKEND (Node.js + Fastify)                   │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │ Auth Routes  │  │  Job Routes  │  │ Match Routes │          │
│  └──────────────┘  └──────────────┘  └──────────────┘          │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │Resume Routes │  │  App Routes  │  │Assistant Rts │          │
│  └──────────────┘  └──────────────┘  └──────────────┘          │
└─────────────────────────────────────────────────────────────────┘
           │                    │                    │
           ▼                    ▼                    ▼
┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐
│   LangChain      │  │   LangGraph      │  │    MongoDB       │
│  Job Matching    │  │  AI Assistant    │  │   Database       │
│                  │  │                  │  │                  │
│ ┌──────────────┐ │  │ ┌──────────────┐ │  │ ┌──────────────┐ │
│ │ Gemini 2.0   │ │  │ │ StateGraph   │ │  │ │    Users     │ │
│ │   Flash      │ │  │ │              │ │  │ │     Jobs     │ │
│ └──────────────┘ │  │ │ Intent       │ │  │ │Applications  │ │
│ ┌──────────────┐ │  │ │Classifier    │ │  │ │MatchScores   │ │
│ │Resume Parser │ │  │ │              │ │  │ └──────────────┘ │
│ │ (pdf-parse)  │ │  │ │Filter        │ │  └──────────────────┘
│ └──────────────┘ │  │ │Extractor     │ │
│ ┌──────────────┐ │  │ └──────────────┘ │
│ │ Batch Match  │ │  │ ┌──────────────┐ │
│ │ (p-limit)    │ │  │ │Product Help  │ │
│ └──────────────┘ │  │ └──────────────┘ │
└──────────────────┘  └──────────────────┘
```

### Data Flow

1. **User Login** → Auth validation → Resume check → Job listing
2. **Resume Upload** → PDF/TXT parsing → Text extraction → MongoDB storage
3. **Job Matching** → LangChain scoring → Batch processing → MatchScore DB
4. **AI Assistant** → LangGraph intent classification → Filter extraction → UI update
5. **Apply Flow** → External URL → Window focus → Confirmation modal → Application DB

---

## 🚀 Setup Instructions

### Prerequisites

- **Node.js** 18+ and npm
- **MongoDB** (local or Atlas)
- **Google AI API Key** (or OpenAI API Key)

### Installation

1. **Clone the repository**
```bash
git clone https://github.com/raziquehasan/ai-job-tracker.git
cd ai-job-tracker
```

2. **Backend Setup**
```bash
cd backend
npm install
cp ../.env.example .env
# Edit .env and add your API keys
npm start
```

3. **Frontend Setup**
```bash
cd frontend
npm install
npm run dev
```

4. **Access the application**
- Frontend: http://localhost:5173
- Backend: http://localhost:4000

### Environment Variables

Create a `.env` file in the root directory:

```env
# LLM API Keys (at least one required)
GOOGLE_AI_API_KEY=your_google_ai_api_key_here
# OPENAI_API_KEY=your_openai_api_key_here

# Database
MONGODB_URI=mongodb://localhost:27017/ai-job-tracker

# Server
PORT=4000
FRONTEND_URL=http://localhost:5173
NODE_ENV=development
```

**Get API Keys:**
- Google AI: https://makersuite.google.com/app/apikey
- OpenAI: https://platform.openai.com/api-keys

---

## 🤖 LangChain & LangGraph Usage

### LangChain for Job Matching

**Purpose:** Score resume-to-job compatibility using AI

**Implementation:** `backend/src/services/matching.service.js`

```javascript
// LLM initialization with fallback
const llm = new ChatGoogleGenerativeAI({
    model: 'gemini-2.0-flash',
    temperature: 0.3,
    maxOutputTokens: 500
});

// Match job to resume
const matchResult = await llm.invoke(prompt);
// Returns: { score, matchedSkills, missingSkills, reasoning }
```

**Prompt Design:**
- System: Expert technical recruiter persona
- User: Resume + Job description
- Output: Strict JSON with score (0-100), skills, reasoning

**Scoring Criteria:**
1. Technical skills match (40%)
2. Experience level alignment (30%)
3. Keyword overlap (20%)
4. Role compatibility (10%)

**Performance:**
- Batch processing with `p-limit` (concurrency: 3)
- Resume hash-based caching
- Text truncation (resume: 3000 chars, job: 2000 chars)
- Average: ~2-3 seconds per job

---

### LangGraph AI Assistant

**Purpose:** Conversational job search with filter control

**Implementation:** `backend/src/ai/agents/filterAssistant.graph.js`

**Graph Structure:**
```
START → assistant (processQuery) → END
```

**State Channels:**
```javascript
{
    messages: [],           // Conversation history
    intent: "NONE",         // FILTER | RESET | HELP | NONE
    filters: {},            // Extracted filters
    responseMessage: ""     // AI response
}
```

**Intent Classification:**
- **FILTER**: "Show me remote React jobs" → Apply filters
- **RESET**: "Clear all filters" → Reset UI
- **HELP**: "How do I upload resume?" → Product guidance
- **NONE**: "Hello" → Social response

**Tool/Function Calling:**

```javascript
// apply_filters tool
{
  "title": "React",
  "skills": ["React", "Node.js"],
  "workMode": "remote",
  "location": "Bangalore",
  "postedWithinDays": 7,
  "matchScore": "high"
}
```

**Frontend Integration:**
```javascript
// Direct UI state update
const handleAIUpdate = (newFilters, intent) => {
    if (intent === 'RESET') {
        setFilters(defaultFilters);
    } else if (intent === 'FILTER') {
        setFilters(prev => ({ ...prev, ...newFilters }));
    }
};
```

**State Management:**
- Per-request state (no cross-session persistence)
- Message history in React state
- Filter state synced with UI

---

## 🎯 AI Matching Logic

### Scoring Approach

**Algorithm:**
1. Extract resume skills, experience, keywords
2. Compare with job requirements
3. Calculate weighted score (0-100)
4. Generate explanation

**Why It Works:**
- **Semantic Understanding**: LLM understands context, not just keywords
- **Holistic Evaluation**: Considers skills, experience, role fit
- **Explainable**: Provides reasoning for each score
- **Consistent**: Low temperature (0.3) for deterministic results

**Performance Considerations:**
- **Caching**: Resume hash prevents redundant calculations
- **Batch Processing**: Concurrent API calls (limit: 3)
- **Text Limits**: Truncate to reduce token costs
- **Fallback**: Default score on errors

**Scalability:**
- 100 jobs: ~60 seconds (with caching: ~20 seconds)
- 10,000 users: Horizontal scaling + job queue (Bull/BullMQ)

---

## 💡 Popup Flow Design

### Design Decision: Window Focus Event

**Why This Approach:**
1. **Non-intrusive**: Doesn't block user from applying
2. **Accurate**: Triggers only when user returns
3. **Simple**: No complex polling or timers
4. **Reliable**: Browser-native event

**Flow:**
```
User clicks Apply → Open external URL → Store jobId in localStorage
→ User applies on external site → User returns to tab
→ Window focus event → Check localStorage → Show modal
→ User confirms → Save to DB → Clear localStorage
```

**Edge Cases Handled:**
1. **User doesn't return**: No modal shown (graceful)
2. **Multiple tabs**: localStorage per-tab isolation
3. **Browser refresh**: localStorage persists
4. **Modal dismissed**: localStorage cleared
5. **Duplicate applications**: Unique index on (userId, jobId)

**Alternative Approaches Considered:**

| Approach | Pros | Cons | Verdict |
|----------|------|------|---------|
| Polling | Works without focus | Resource-intensive | ❌ Rejected |
| Referrer tracking | Server-side | Unreliable, privacy issues | ❌ Rejected |
| Timestamp comparison | Simple | Inaccurate | ❌ Rejected |
| Window focus | Accurate, simple | Requires tab return | ✅ **Chosen** |

---

## 🎨 AI Assistant UI Choice

### Decision: Floating Chat Bubble

**Why Bubble Over Sidebar:**

**Pros:**
- ✅ **Non-intrusive**: Doesn't take screen space
- ✅ **Familiar**: Users recognize chat pattern
- ✅ **Mobile-friendly**: Works on small screens
- ✅ **Contextual**: Available everywhere
- ✅ **Expandable**: Opens on demand

**Cons:**
- ❌ Limited screen space when open
- ❌ Can obscure content

**UX Reasoning:**
1. **Discoverability**: Red notification badge attracts attention
2. **Accessibility**: Bottom-right is standard position
3. **Flexibility**: Can be closed when not needed
4. **Consistency**: Matches modern chat UX patterns

**Alternative (Sidebar):**
- Better for extended conversations
- Takes permanent screen space
- Less mobile-friendly
- **Verdict**: Bubble is better for quick interactions

---

## 📈 Scalability

### Handling 100+ Jobs

**Current Performance:**
- Initial load: ~2-3 seconds (with caching)
- Match calculation: ~60 seconds for 100 jobs
- UI rendering: Instant (React virtualization possible)

**Optimizations:**
- ✅ Resume hash caching
- ✅ Batch processing with concurrency
- ✅ Database indexing
- ✅ Pagination (limit: 50 per page)

### Handling 10,000 Users

**Challenges:**
1. **Concurrent match calculations**: CPU/API limits
2. **Database load**: Read/write operations
3. **Session management**: Memory usage

**Solutions:**

**1. Job Queue System (Bull/BullMQ)**
```javascript
// Enqueue match calculation
await matchQueue.add('calculateMatches', {
    userId,
    resumeHash
});

// Worker processes jobs
matchQueue.process('calculateMatches', async (job) => {
    await calculateMatchScores(job.data);
});
```

**2. Horizontal Scaling**
- Load balancer (Nginx)
- Multiple backend instances
- Shared Redis cache
- MongoDB replica set

**3. Caching Strategy**
- Redis for match scores
- CDN for static assets
- Browser caching for jobs

**4. Database Optimization**
- Compound indexes on (userId, jobId)
- Index on (userId, score)
- Sharding by userId

**Architecture for 10K Users:**
```
Load Balancer
    ↓
[Backend 1] [Backend 2] [Backend 3]
    ↓           ↓           ↓
    Redis Cache (Shared)
    ↓
MongoDB Replica Set
    ↓
Bull Queue Workers (Match Calculation)
```

---

## ⚖️ Tradeoffs & Limitations

### Known Limitations

1. **LLM Cost**: Gemini Flash is cheap but scales with users
   - **Mitigation**: Aggressive caching, batch processing

2. **Match Calculation Time**: 60s for 100 jobs
   - **Mitigation**: Background jobs, progressive loading

3. **Single User System**: Hardcoded test@gmail.com
   - **Future**: Multi-user auth with JWT

4. **No Real Job API**: Uses seeded data
   - **Future**: Integrate Indeed/LinkedIn APIs

5. **Client-Side Filtering**: All jobs loaded upfront
   - **Future**: Server-side filtering with pagination

6. **No Resume Versioning**: Single resume per user
   - **Future**: Multiple resume support

### What I'd Improve With More Time

**1. Production Auth System**
- JWT tokens instead of hardcoded user
- Password hashing (bcrypt)
- Session management
- OAuth integration

**2. Real Job Data Integration**
- Indeed API integration
- LinkedIn scraping (with permission)
- Automatic job updates (cron)

**3. Advanced Matching**
- Fine-tuned embedding model
- Vector similarity search
- Personalized ranking

**4. Performance Optimization**
- Server-side rendering (SSR)
- GraphQL for efficient queries
- WebSocket for real-time updates

**5. Testing**
- Unit tests (Jest)
- Integration tests (Supertest)
- E2E tests (Playwright)

**6. Monitoring & Analytics**
- Error tracking (Sentry)
- Performance monitoring (New Relic)
- User analytics (Mixpanel)

---

## 📁 Project Structure

```
ai-job-tracker/
├── backend/
│   ├── src/
│   │   ├── ai/
│   │   │   ├── agents/
│   │   │   │   └── filterAssistant.graph.js  # LangGraph
│   │   │   └── prompts/
│   │   │       ├── assistant.prompt.js
│   │   │       └── jobMatch.prompt.js
│   │   ├── models/
│   │   │   ├── User.js
│   │   │   ├── Job.js
│   │   │   ├── Application.js
│   │   │   └── MatchScore.js
│   │   ├── routes/
│   │   │   ├── auth.routes.js
│   │   │   ├── jobs.routes.js
│   │   │   ├── match.routes.js
│   │   │   ├── resume.routes.js
│   │   │   ├── applications.routes.js
│   │   │   └── assistant.routes.js
│   │   ├── services/
│   │   │   └── matching.service.js  # LangChain
│   │   └── app.js
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── JobCard.jsx
│   │   │   ├── BestMatches.jsx
│   │   │   ├── FiltersPanel.jsx
│   │   │   ├── ChatAssistant.jsx  # AI Assistant UI
│   │   │   ├── ApplyConfirmModal.jsx
│   │   │   └── ApplicationCard.jsx
│   │   ├── pages/
│   │   │   ├── Login.jsx
│   │   │   └── Applications.jsx
│   │   ├── context/
│   │   │   └── AuthContext.jsx
│   │   ├── hooks/
│   │   │   └── useJobs.js
│   │   ├── services/
│   │   │   └── api.js
│   │   └── App.jsx
│   └── package.json
├── .env.example
├── .gitignore
└── README.md
```

---

## 🔐 Security Notes

- ✅ `.env` file in `.gitignore`
- ✅ No secrets in codebase
- ✅ CORS configured
- ✅ Input validation
- ⚠️ Production requires: JWT, HTTPS, rate limiting

---

## 📝 License

MIT License - Feel free to use for learning and projects

---

## 👨‍💻 Author

**Razique Hasan**
- GitHub: [@raziquehasan](https://github.com/raziquehasan)

---

## 🙏 Acknowledgments

- LangChain & LangGraph for AI orchestration
- Google Gemini for cost-effective LLM
- Fastify for high-performance backend
- React for modern frontend
