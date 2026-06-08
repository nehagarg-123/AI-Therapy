# ml_service/train_model.py
# Run this ONCE to train and save models: python train_model.py

import numpy as np
import joblib
import os
from pathlib import Path
from sklearn.pipeline import Pipeline
from sklearn.svm import SVC
from sklearn.linear_model import LogisticRegression
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.model_selection import train_test_split, cross_val_score
from sklearn.metrics import classification_report, accuracy_score

MODEL_DIR = Path(__file__).parent / "models"
MODEL_DIR.mkdir(exist_ok=True)

# ── Training Data ─────────────────────────────────────────────────────────
# Expand this dataset significantly for production.
# Recommended: use GoEmotions, ISEAR, or CARER datasets from Hugging Face.

EMOTION_DATA = [
    # happy
    ("I feel so happy today, everything is going great!", "happy"),
    ("This is the best day of my life, I'm so excited!", "happy"),
    ("I just got promoted! I'm over the moon!", "happy"),
    ("My family surprised me with a birthday party, I'm so grateful", "happy"),
    ("I feel amazing after working out, so much energy", "happy"),
    ("Just finished my project and it went perfectly, I'm elated", "happy"),
    ("I love spending time with my friends, they make me smile", "happy"),
    ("Got wonderful news today, feeling blessed and content", "happy"),
    ("My wedding was perfect, I cried happy tears all day", "happy"),
    ("Feeling cheerful and light, today was a great day", "happy"),

    # sad
    ("I feel so sad and empty inside, nothing matters", "sad"),
    ("I've been crying all day, I don't know why", "sad"),
    ("I lost my job and I don't know what to do anymore", "sad"),
    ("My relationship ended and I feel heartbroken", "sad"),
    ("I feel so lonely, no one understands me", "sad"),
    ("Everything feels hopeless, I can't see a way forward", "sad"),
    ("I'm grieving the loss of my parent, it hurts so much", "sad"),
    ("I feel depressed and unmotivated, can't get out of bed", "sad"),
    ("Nothing brings me joy anymore, I feel empty", "sad"),
    ("I feel miserable, like the whole world is against me", "sad"),

    # anxious
    ("I'm so anxious about my exam tomorrow, can't sleep", "anxious"),
    ("My heart is racing and I feel like something bad will happen", "anxious"),
    ("I keep worrying about everything, I can't stop the thoughts", "anxious"),
    ("I had a panic attack at work, I'm so scared it'll happen again", "anxious"),
    ("I feel nervous and overwhelmed by everything on my plate", "anxious"),
    ("My mind won't stop, constant stress about the future", "anxious"),
    ("I'm terrified of failing, the pressure is unbearable", "anxious"),
    ("I feel tense all the time, like disaster is around every corner", "anxious"),
    ("Social situations make me extremely anxious and uncomfortable", "anxious"),
    ("I've been stressed for weeks, my body feels tight and exhausted", "anxious"),

    # angry
    ("I'm so angry at my boss, this is completely unfair", "angry"),
    ("I feel like rage is taking over, I can't control it", "angry"),
    ("My roommate keeps disrespecting me and I'm furious", "angry"),
    ("I'm so frustrated with this situation, nothing is working", "angry"),
    ("I hate how people treat me, I'm done being patient", "angry"),
    ("I feel bitter and resentful, I've been wronged so many times", "angry"),
    ("I'm livid right now, this crosses every line", "angry"),
    ("My anger is building up and I don't know how to release it", "angry"),
    ("I feel irritated and on edge, small things set me off", "angry"),
    ("I'm annoyed at everything today, nothing is going right", "angry"),

    # calm
    ("I feel at peace today, everything is balanced", "calm"),
    ("I had a great meditation session, feeling centered and calm", "calm"),
    ("Life feels manageable today, I'm grounded and present", "calm"),
    ("I feel tranquil after my yoga class this morning", "calm"),
    ("Everything is quiet and still, I feel content inside", "calm"),
    ("I'm relaxed and comfortable, no worries on my mind", "calm"),
    ("I feel settled and at ease, like I'm exactly where I need to be", "calm"),
    ("A peaceful morning walk cleared my head completely", "calm"),
    ("I feel serene and connected to myself today", "calm"),
    ("Gratitude practice this morning left me feeling light and balanced", "calm"),

    # neutral
    ("Today was okay, nothing special happened", "neutral"),
    ("I'm fine, just going through the motions", "neutral"),
    ("Not much to say, it was a normal day", "neutral"),
    ("Things are alright, same as usual", "neutral"),
    ("I feel neither good nor bad, just existing", "neutral"),
    ("Meh, it was an average day", "neutral"),
    ("I don't really feel anything in particular", "neutral"),
    ("Just another day, nothing to report", "neutral"),
    ("I guess I'm okay, not sure how to describe it", "neutral"),
    ("Things are so-so, could be better could be worse", "neutral"),

    # fear
    ("I am terrified of what will happen next, it keeps me up at night", "fear"),
    ("I feel a deep dread that I cannot shake, something bad is coming", "fear"),
    ("I'm afraid to leave my house, everything feels dangerous", "fear"),
    ("The nightmare felt so real, I'm still scared hours later", "fear"),
    ("I feel threatened and unsafe, like I'm being watched", "fear"),

    # disgust
    ("I feel disgusted by what happened, it's making me sick", "disgust"),
    ("That situation was revolting, I can't get it out of my head", "disgust"),
    ("I feel repulsed by my own behavior, I'm ashamed", "disgust"),
    ("What they did was vile and I feel sick thinking about it", "disgust"),

    # surprise
    ("I was completely shocked by the news, didn't see it coming", "surprise"),
    ("I am stunned, I had no idea this would happen", "surprise"),
    ("The announcement left me speechless and astonished", "surprise"),
    ("I cannot believe what just happened, I'm in disbelief", "surprise"),
]

# ── Crisis Data ───────────────────────────────────────────────────────────
CRISIS_DATA = [
    # Crisis (label=1)
    ("I want to kill myself, I can't take this anymore", 1),
    ("I'm thinking about ending my life tonight", 1),
    ("I don't want to live anymore, what's the point", 1),
    ("I've been thinking about suicide every day", 1),
    ("I want to hurt myself, the pain is too much", 1),
    ("I'm going to take all my pills and end this", 1),
    ("Nobody would miss me if I was gone", 1),
    ("I've written my goodbye letter, I'm ready to go", 1),
    ("I have a plan to end my life this week", 1),
    ("The only way out is to stop existing", 1),
    ("I've been cutting myself to cope with the pain", 1),
    ("I don't want to wake up tomorrow morning", 1),
    ("Better off dead than living like this", 1),
    ("I'm saying goodbye, I can't do this anymore", 1),
    ("Nothing to live for, I'm ending it all tonight", 1),

    # Non-crisis (label=0)
    ("I feel sad today, things are hard", 0),
    ("I'm struggling with anxiety and stress at work", 0),
    ("I've been depressed but I'm seeing a therapist", 0),
    ("Life feels pointless sometimes but I keep going", 0),
    ("I'm really upset and need to talk to someone", 0),
    ("I feel overwhelmed by everything happening", 0),
    ("I had a terrible week, feeling very low", 0),
    ("I'm exhausted from carrying all this weight", 0),
    ("Things are difficult but I'm trying to manage", 0),
    ("I feel like giving up on this project", 0),
    ("I'm so tired of feeling this way every day", 0),
    ("I need help dealing with my emotions", 0),
    ("My mental health has been declining lately", 0),
    ("I feel disconnected from everyone around me", 0),
    ("Crying a lot lately, I think I need support", 0),
]

def train_emotion_model():
    print("\n🧠 Training Emotion Detection Model...")
    texts, labels = zip(*EMOTION_DATA)

    vectorizer = TfidfVectorizer(
        ngram_range=(1, 2),
        max_features=5000,
        sublinear_tf=True,
        min_df=1,
    )
    X = vectorizer.fit_transform(texts)

    model = LogisticRegression(
        C=1.0, max_iter=1000,
        multi_class='multinomial',
        solver='lbfgs',
        class_weight='balanced',
        random_state=42,
    )

    # Cross-validation
    scores = cross_val_score(model, X, labels, cv=3, scoring='accuracy')
    print(f"   Cross-val accuracy: {scores.mean():.2f} ± {scores.std():.2f}")

    model.fit(X, labels)
    X_train, X_test, y_train, y_test = train_test_split(X, labels, test_size=0.2, random_state=42, stratify=labels)
    model.fit(X_train, y_train)
    y_pred = model.predict(X_test)
    print(f"   Test accuracy: {accuracy_score(y_test, y_pred):.2f}")
    print(classification_report(y_test, y_pred, zero_division=0))

    # Retrain on all data
    model.fit(X, labels)

    joblib.dump(model, MODEL_DIR / "emotion_model.pkl")
    joblib.dump(vectorizer, MODEL_DIR / "emotion_vectorizer.pkl")
    print("   ✅ Emotion model saved!")

def train_crisis_model():
    print("\n🚨 Training Crisis Detection Model...")
    texts, labels = zip(*CRISIS_DATA)

    vectorizer = TfidfVectorizer(
        ngram_range=(1, 3),
        max_features=3000,
        sublinear_tf=True,
    )
    X = vectorizer.fit_transform(texts)

    model = SVC(
        kernel='linear', probability=True,
        C=1.0, class_weight='balanced', random_state=42,
    )

    X_train, X_test, y_train, y_test = train_test_split(X, labels, test_size=0.25, random_state=42)
    model.fit(X_train, y_train)
    y_pred = model.predict(X_test)
    print(f"   Test accuracy: {accuracy_score(y_test, y_pred):.2f}")
    print(classification_report(y_test, y_pred))

    model.fit(X, labels)

    joblib.dump(model, MODEL_DIR / "crisis_model.pkl")
    joblib.dump(vectorizer, MODEL_DIR / "crisis_vectorizer.pkl")
    print("   ✅ Crisis model saved!")

if __name__ == "__main__":
    print("=" * 50)
    print("  MindEase ML Model Training")
    print("=" * 50)
    train_emotion_model()
    train_crisis_model()
    print("\n🎉 All models trained and saved to ./models/")
    print("\nNext: uvicorn main:app --host 0.0.0.0 --port 8000 --reload")
