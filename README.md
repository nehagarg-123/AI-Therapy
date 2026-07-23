#  MindEase — AI Mental Health Therapist
### Full-Stack 4th Year Project | Node.js + React + Python ML + MongoDB

---

##  Project Structure

```
mindease/
├── backend/                     # Node.js + Express API
│   ├── server.js                # Entry point
│   ├── config/
│   │   └── db.js                # MongoDB connection
│   ├── controllers/
│   │   ├── auth.controller.js   # Register, Login, Refresh, Logout
│   │   ├── chat.controller.js   # Gemini AI + ML integration
│   │   └── mood.controller.js   # Mood logging & analytics
│   ├── middleware/
│   │   ├── auth.middleware.js   # JWT protect + role restrict
│   │   └── error.middleware.js  # Global error handler
│   ├── models/
│   │   ├── User.model.js        # User schema (bcrypt, streak, settings)
│   │   ├── Session.model.js     # Chat session + messages
│   │   └── MoodEntry.model.js   # Mood log entries
│   ├── routes/
│   │   ├── auth.routes.js
│   │   ├── chat.routes.js
│   │   ├── mood.routes.js
│   │   ├── user.routes.js
│   │   └── ml.routes.js         # Proxy to Python ML service
│   └── .env.example
│
├── frontend/                    # React 18 SPA
│   ├── public/index.html
│   └── src/
│       ├── App.js               # Router + providers
│       ├── index.js
│       ├── index.css            # Global CSS variables (dark/light)
│       ├── context/
│       │   ├── AuthContext.js   # Global auth state
│       │   └── ThemeContext.js  # Dark/light toggle
│       ├── utils/
│       │   └── api.js           # Axios + auto token refresh
│       ├── pages/
│       │   ├── AuthPage.js      # Login + Register
│       │   └── Dashboard.js     # Main app (sidebar layout)
│       └── components/
│           ├── chat/Chat.js          # AI chat UI
│           ├── dashboard/MoodTracker.js  # Charts (Recharts)
│           └── activities/index.js   # Breathing + CBT activities
│
└── ml_service/                  # Python FastAPI ML microservice
    ├── main.py                  # FastAPI app + prediction endpoint
    ├── train_model.py           # scikit-learn training script
    └── requirements.txt
```

---

##  Setup Guide

### Prerequisites
- Node.js 18+
- Python 3.9+
- MongoDB (local or Atlas)
- Gemini API key (free at aistudio.google.com)

---

### Step 1 — Clone & Install

```bash
git clone <your-repo>
cd mindease

# Install root concurrently
npm install

# Install backend
cd backend && npm install && cd ..

# Install frontend
cd frontend && npm install && cd ..

# Install ML service
cd ml_service
pip install -r requirements.txt
cd ..
```

---

### Step 2 — Environment Variables

```bash
cd backend
cp .env.example .env
```

Edit `.env`:
```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/mindease
JWT_SECRET=replace_with_random_64char_string
JWT_REFRESH_SECRET=replace_with_another_random_string
GROQ_API_KEY=go to the groq site and copy the groq api key

EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=
EMAIL_USER=
EMAIL_PASS=



ML_SERVICE_URL=http://localhost:8000
CLIENT_URL=http://localhost:3000
```

---

### Step 3 — Train the ML Models

```bash
cd ml_service
python train_model.py
# Creates: models/emotion_model.pkl + crisis_model.pkl
```

---

### Step 4 — Start All Services

**Terminal 1 — ML Service (Python)**
```bash
cd ml_service
uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

**Terminal 2 — Backend (Node.js)**
```bash
cd backend
npm run dev
```

**Terminal 3 — Frontend (React)**
```bash
cd frontend
npm start
```

Open: **http://localhost:3000**

---

## 🔌 API Endpoints

### Auth (`/api/auth`)
| Method | Route              | Description       | Auth |
|--------|--------------------|-------------------|------|
| POST   | `/register`        | Create account    | X  |
| POST   | `/login`           | Login             | X  |
| POST   | `/refresh-token`   | Refresh JWT       | X  |
| POST   | `/logout`          | Logout            | ✅ |
| GET    | `/me`              | Get current user  | ✅ |
| PATCH  | `/change-password` | Change password   | ✅ |

### Chat (`/api/chat`)
| Method | Route                  | Description            |
|--------|------------------------|------------------------|
| GET    | `/session`             | Get/create active session |
| POST   | `/message`             | Send message (AI + ML) |
| GET    | `/sessions`            | Get session history    |
| PATCH  | `/session/:id/end`     | End session            |

### Mood (`/api/mood`)
| Method | Route        | Description         |
|--------|--------------|---------------------|
| POST   | `/`          | Log mood manually   |
| GET    | `/history`   | Get mood history    |
| GET    | `/analytics` | Get mood analytics  |

### ML Service (`http://localhost:8000`)
| Method | Route      | Description                      |
|--------|------------|----------------------------------|
| POST   | `/predict` | Emotion + crisis detection       |
| GET    | `/health`  | Check if models are loaded       |

---

## ML Architecture

```
User message → TF-IDF Vectorizer → Logistic Regression (Emotion)
                                 → SVM Classifier (Crisis)
             → Keyword Fallback (if models not loaded)
             → Sentiment Analysis (rule-based valence)
```

**Emotion classes**: happy, sad, anxious, angry, calm, neutral, fear, disgust, surprise

**Crisis detection**: Binary SVM (crisis / non-crisis) with keyword fallback

**To upgrade to BERT** (for better accuracy):
```python
# In ml_service/main.py — replace vectorizer with:
from transformers import pipeline
emotion_pipe = pipeline("text-classification", model="j-hartmann/emotion-english-distilroberta-base")
```

---

##  Security Features
- **bcrypt** password hashing (12 rounds)
- **JWT** access tokens (7d) + refresh tokens (30d)
- **httpOnly cookies** for token storage
- **Rate limiting**: 200 req/15min global, 20 auth req/15min
- **Helmet** security headers
- **CORS** restricted to frontend origin
- Token auto-refresh on 401 responses

---

##  Features Summary
| Feature | Stack |
|---------|-------|
| AI Chat | Google Gemini Pro API |
| Emotion Detection | scikit-learn Logistic Regression + TF-IDF |
| Crisis Detection | SVM + keyword fallback |
| Mood Tracking | MongoDB + Recharts |
| Smart Suggestions | ML output-driven |
| Breathing Exercise | Pure React animation |
| Anxiety Activities | CBT/EMDR-based content |
| Authentication | JWT + Refresh tokens + bcrypt |
| Dark/Light Mode | CSS variables + React context |

---

##  Crisis Resources (built into app)
- 🇮🇳 iCall: **9152987821**
*
