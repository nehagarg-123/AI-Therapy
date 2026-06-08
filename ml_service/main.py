# ml_service/main.py
# FastAPI ML Service for MindEase
# Run: uvicorn main:app --host 0.0.0.0 --port 8000 --reload

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import numpy as np
import joblib
import os
import re
from pathlib import Path
from typing import Optional

app = FastAPI(title="MindEase ML Service", version="1.0.0")

ALLOWED_ORIGINS = os.getenv(
    "ALLOWED_ORIGINS",
    "http://localhost:3000,http://localhost:5000"
).split(",")

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Load models ───────────────────────────────────────────────────────────
MODEL_DIR = Path(__file__).parent / "models"

emotion_model      = None
emotion_vectorizer = None
crisis_model       = None
crisis_vectorizer  = None

def load_models():
    global emotion_model, emotion_vectorizer, crisis_model, crisis_vectorizer
    try:
        emotion_model      = joblib.load(MODEL_DIR / "emotion_model.pkl")
        emotion_vectorizer = joblib.load(MODEL_DIR / "emotion_vectorizer.pkl")
        print("✅ Emotion model loaded")
    except Exception as e:
        print(f"⚠️  Emotion model not found, using fallback: {e}")

    try:
        crisis_model      = joblib.load(MODEL_DIR / "crisis_model.pkl")
        crisis_vectorizer = joblib.load(MODEL_DIR / "crisis_vectorizer.pkl")
        print("✅ Crisis model loaded")
    except Exception as e:
        print(f"⚠️  Crisis model not found, using fallback: {e}")

load_models()

# ── Schemas ───────────────────────────────────────────────────────────────
class TextInput(BaseModel):
    text: str

class PredictionOutput(BaseModel):
    emotion: str
    confidence: float
    sentiment: float
    isCrisis: bool
    crisisScore: float
    emotions_breakdown: dict
    suggestions: list[str]

# ── Keyword maps ──────────────────────────────────────────────────────────
EMOTION_KEYWORDS = {
    "happy":   ["happy","joy","excited","great","wonderful","amazing","love","laugh","smile",
                "fantastic","elated","cheerful","glad","delighted","content","blessed","grateful","thrilled"],
    "sad":     ["sad","cry","depressed","depression","down","hopeless","miserable","lonely",
                "grief","tearful","unhappy","empty","heartbroken","sorrow","devastated","gloomy",
                "melancholy","lost","i am sad","feeling sad","feel sad","very sad","so sad"],
    "anxious": ["anxious","anxiety","worry","scared","fear","panic","nervous","stress","overwhelmed",
                "dread","uneasy","tense","apprehensive","restless","worried","terrified","on edge",
                "racing thoughts","panic attack","can't breathe","heart racing"],
    "angry":   ["angry","anger","rage","furious","mad","annoyed","frustrated","irritated","hate",
                "bitter","resentful","hostile","livid","outraged","infuriated","boiling","seething",
                "i am angry","i am anger","so angry","very angry","pissed"],
    "calm":    ["calm","peaceful","relaxed","serene","tranquil","ease","comfortable","settled",
                "grounded","content","still","centered","balanced","quiet","at peace"],
    "lonely":  ["lonely","alone","isolated","no one","nobody","no friends","left out","abandoned",
                "no one cares","nobody cares","feel alone","all alone","by myself"],
    "neutral": ["okay","fine","alright","normal","so-so","meh","whatever","not sure","idk","nothing","same"],
}

# ── PRIORITY CRISIS PHRASES — checked first, highest confidence ───────────
# These are exact phrases that MUST trigger crisis regardless of ML output
CRISIS_PHRASES_HIGH = [
    "kill myself", "killing myself",
    "end my life", "ending my life",
    "want to die", "wanting to die",
    "going to die", "going to kill",
    "suicide", "suicidal",
    "take my life", "taking my life",
    "hang myself", "hanging myself",
    "hurt myself", "hurting myself",
    "cut myself", "cutting myself",
    "overdose", "jump off",
    "no reason to live", "nothing to live for",
    "better off dead", "rather be dead",
    "end it all", "ending it all",
    "not worth living", "life is worthless",
    "don't want to live", "don't want to be here",
    "can't go on", "cannot go on",
    "give up on life", "given up on life",
    "feel like dying", "planning to die",
    "last message", "goodbye forever",
    "don't want to wake up",
]

# Lower confidence crisis phrases
CRISIS_PHRASES_LOW = [
    "self harm", "self-harm",
    "worthless", "feel worthless",
    "no point in living", "no point anymore",
    "disappear forever", "wish i was dead",
]

# ── PRIORITY EMOTION OVERRIDE RULES ──────────────────────────────────────
# Ordered by priority — first match wins
# Each entry: (pattern_list, emotion, min_confidence)
EMOTION_OVERRIDE_RULES = [
    # Depression — very specific phrases
    (["i am depressed", "i'm depressed", "feeling depressed", "feel depressed",
      "i have depression", "suffering from depression", "deep depression",
      "feel empty", "feel nothing", "feel numb", "feeling numb",
      "burned out", "burnt out", "mentally exhausted", "emotionally exhausted",
      "no hope", "lost all hope", "feel hopeless", "feeling hopeless",
      "don't see a point", "no point in anything",
      "can't stop crying", "been crying", "cried all day",
      "feel broken", "feel shattered", "feel worthless",
      "feel useless", "i am useless", "i am worthless",
      "nothing matters", "nothing makes me happy",
      "can't get out of bed", "don't want to get up"], "sad", 0.92),

    # Sadness — general
    (["i am sad", "i'm sad", "feeling sad", "feel sad", "very sad", "so sad",
      "really sad", "extremely sad", "deeply sad",
      "heartbroken", "heart is broken", "devastated",
      "grief", "grieving", "mourning",
      "miss them", "miss him", "miss her",
      "feel down", "feeling down", "really down",
      "feeling low", "feel low", "really low"], "sad", 0.88),

    # Anxiety — specific
    (["i am anxious", "i'm anxious", "feeling anxious", "feel anxious",
      "having anxiety", "anxiety attack", "panic attack", "having a panic",
      "can't breathe", "heart is racing", "heart racing", "shaking",
      "overthinking everything", "can't stop thinking",
      "so stressed", "very stressed", "extremely stressed",
      "feel overwhelmed", "feeling overwhelmed", "totally overwhelmed",
      "too much to handle", "can't cope"], "anxious", 0.88),

    # Anger — specific
    (["i am angry", "i'm angry", "i am anger", "feeling angry", "feel angry",
      "so angry", "very angry", "really angry", "extremely angry",
      "full of rage", "feel rage", "feeling rage",
      "want to scream", "feel like screaming",
      "so frustrated", "very frustrated", "really frustrated",
      "so fed up", "totally fed up", "had enough",
      "pissed off", "i am pissed"], "angry", 0.88),

    # Lonely — specific
    (["i am lonely", "i'm lonely", "feeling lonely", "feel lonely",
      "so alone", "very alone", "feel so alone", "completely alone",
      "no one cares", "nobody cares", "no one understands",
      "nobody understands", "feel invisible", "feel like a burden",
      "no friends", "lost all my friends", "have nobody"], "lonely", 0.88),
]

# ── Suggestions per emotion ───────────────────────────────────────────────
EMOTION_SUGGESTIONS = {
    "happy":   [
        "Channel this energy into journaling your wins 📓",
        "Share your joy — connect with someone you love",
        "Set a meaningful goal while motivation is high",
    ],
    "sad": [
        "Try the 5-4-3-2-1 grounding technique",
        "A 10-minute walk outside can shift your mood",
        "Write a letter to your future self about what you're feeling",
    ],
    "anxious": [
        "Box breathing: 4 sec in → 4 hold → 6 out",
        "Name 5 things you can see right now to ground yourself",
        "Progressive muscle relaxation starting from your toes",
    ],
    "angry": [
        "Step away for 5 minutes before responding",
        "Splash cold water on your face to reset",
        "Write uncensored in a journal, then close it",
    ],
    "calm": [
        "Use this peaceful state to set intentions",
        "Try a body scan meditation to deepen the calm",
        "Reflect on 3 things you're grateful for today",
    ],
    "lonely": [
        "Text one person you trust right now",
        "Join an online community around something you love",
        "Write down what kind of connection you're craving",
    ],
    "neutral": [
        "Check in with your body — what do you actually need?",
        "A mindful tea break, phone-free",
        "Try a 5-minute meditation to reconnect with yourself",
    ],
}


# ── Core override function ────────────────────────────────────────────────
def apply_keyword_override(text: str, emotion: str, confidence: float,
                            is_crisis: bool, crisis_score: float):
    """
    Runs AFTER the ML model.
    Returns corrected (emotion, confidence, is_crisis, crisis_score).

    Priority order:
      1. Crisis phrases (highest — overrides everything)
      2. Emotion override rules (exact phrase matching)
      3. ML result kept if no override matched
    """
    t = text.lower().strip()

    # ── Priority 1: Crisis detection ─────────────────────────────────────
    # Check high-confidence crisis phrases first
    for phrase in CRISIS_PHRASES_HIGH:
        if phrase in t:
            print(f"🚨 Crisis override triggered by: '{phrase}'")
            return "sad", max(confidence, 0.95), True, 1.0

    # Check lower-confidence crisis phrases
    low_hits = [p for p in CRISIS_PHRASES_LOW if p in t]
    if low_hits:
        score = min(0.5 + len(low_hits) * 0.2, 1.0)
        print(f"⚠️  Low crisis override triggered by: {low_hits}")
        return "sad", max(confidence, 0.85), score > 0.5, round(score, 3)

    # ── Priority 2: Emotion override rules ───────────────────────────────
    for (phrases, target_emotion, min_conf) in EMOTION_OVERRIDE_RULES:
        for phrase in phrases:
            if phrase in t:
                print(f"🎯 Emotion override: '{emotion}' → '{target_emotion}' (matched: '{phrase}')")
                return target_emotion, max(confidence, min_conf), is_crisis, crisis_score

    # ── Priority 3: No override — return ML result as-is ─────────────────
    return emotion, confidence, is_crisis, crisis_score


# ── Helper: simple keyword fallback ──────────────────────────────────────
def keyword_emotion(text: str) -> dict:
    t = text.lower()
    scores = {}
    for emotion, words in EMOTION_KEYWORDS.items():
        count = sum(1 for w in words if re.search(r'\b' + re.escape(w) + r'\b', t))
        scores[emotion] = count

    total = sum(scores.values()) or 1
    probs = {e: round(s / total, 3) for e, s in scores.items()}
    best  = max(scores, key=scores.get)
    if scores[best] == 0:
        best = "neutral"
        probs["neutral"] = 1.0

    return {"emotion": best, "confidence": probs.get(best, 0.5), "breakdown": probs}

def keyword_crisis(text: str) -> dict:
    t    = text.lower()
    hits = [p for p in CRISIS_PHRASES_HIGH + CRISIS_PHRASES_LOW if p in t]
    score = min(len(hits) * 0.35, 1.0)
    return {"isCrisis": score > 0.25, "crisisScore": round(score, 3)}

def compute_sentiment(text: str) -> float:
    pos = ["good","great","happy","love","amazing","wonderful","fantastic",
           "excellent","better","hope","joy","excited","glad"]
    neg = ["bad","terrible","awful","hate","horrible","disgusting","sad",
           "depressed","worst","never","can't","impossible","alone"]
    t = text.lower().split()
    p = sum(1 for w in t if w in pos)
    n = sum(1 for w in t if w in neg)
    if p + n == 0:
        return 0.0
    return round((p - n) / (p + n), 3)


# ── Predict endpoint ──────────────────────────────────────────────────────
@app.post("/predict", response_model=PredictionOutput)
async def predict(body: TextInput):
    text = body.text.strip()
    if not text:
        raise HTTPException(status_code=400, detail="Text cannot be empty")

    # ── Step 1: Emotion detection (ML model or keyword fallback) ──────────
    if emotion_model and emotion_vectorizer:
        try:
            vec        = emotion_vectorizer.transform([text])
            pred       = emotion_model.predict(vec)[0]
            proba      = emotion_model.predict_proba(vec)[0]
            classes    = emotion_model.classes_
            breakdown  = {c: round(float(p), 3) for c, p in zip(classes, proba)}
            confidence = float(max(proba))
            emotion    = pred
        except Exception:
            result     = keyword_emotion(text)
            emotion, confidence, breakdown = result["emotion"], result["confidence"], result["breakdown"]
    else:
        result     = keyword_emotion(text)
        emotion, confidence, breakdown = result["emotion"], result["confidence"], result["breakdown"]

    # ── Step 2: Crisis detection (ML model or keyword fallback) ───────────
    if crisis_model and crisis_vectorizer:
        try:
            vec          = crisis_vectorizer.transform([text])
            crisis_proba = crisis_model.predict_proba(vec)[0]
            crisis_score = float(crisis_proba[1]) if len(crisis_proba) > 1 else 0.0
            is_crisis    = crisis_score > 0.5
        except Exception:
            cr           = keyword_crisis(text)
            is_crisis, crisis_score = cr["isCrisis"], cr["crisisScore"]
    else:
        cr           = keyword_crisis(text)
        is_crisis, crisis_score = cr["isCrisis"], cr["crisisScore"]

    # ── Step 3: KEYWORD OVERRIDE — fixes ML misclassification ────────────
    # This runs after the ML model and corrects wrong predictions.
    # "i am depressed" → sad, "going to kill myself" → sad + crisis:True
    emotion, confidence, is_crisis, crisis_score = apply_keyword_override(
        text, emotion, confidence, is_crisis, crisis_score
    )

    # ── Step 4: Sentiment score ───────────────────────────────────────────
    sentiment = compute_sentiment(text)

    # ── Step 5: Suggestions based on final emotion ────────────────────────
    suggestions = EMOTION_SUGGESTIONS.get(emotion, EMOTION_SUGGESTIONS["neutral"])

    print(f"📊 Final → emotion={emotion} ({confidence:.0%}) | crisis={is_crisis} ({crisis_score:.2f})")

    return PredictionOutput(
        emotion=emotion,
        confidence=round(confidence, 3),
        sentiment=sentiment,
        isCrisis=is_crisis,
        crisisScore=round(crisis_score, 3),
        emotions_breakdown=breakdown,
        suggestions=suggestions,
    )


@app.get("/health")
def health():
    return {
        "status": "ok",
        "emotion_model": "loaded" if emotion_model else "fallback (keyword)",
        "crisis_model":  "loaded" if crisis_model  else "fallback (keyword)",
    }

# Run: python -m uvicorn main:app --host 0.0.0.0 --port 8000 --reload