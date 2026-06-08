const axios     = require('axios');
const Groq      = require('groq-sdk');
const Session   = require('../models/Session.model');
const MoodEntry = require('../models/MoodEntry.model');
const User      = require('../models/User.model');
const sendEmail = require('../utils/sendEmail');               // ← added
const { AppError } = require('../middleware/error.middleware');

const ML_SERVICE_URL = process.env.ML_SERVICE_URL || "http://localhost:8000";
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

const SYSTEM_PROMPT = `You are MindEase, a warm and caring AI mental health companion — like a close friend who truly listens.

VERY IMPORTANT - HOW TO RESPOND:

STEP 1 - EMOTIONAL VALIDATION FIRST (always):
- First acknowledge and validate exactly what they felt
- Make them feel heard and understood BEFORE anything else
- Never jump to advice or questions immediately
- Sound like a real friend, not a therapist

STEP 2 - RELATE AND SUPPORT:
- Say something that shows you truly understand their situation
- Be specific to what they said, never generic
- Add warmth like: "that sounds really exhausting", "of course you feel that way"

STEP 3 - GENTLE QUESTION (only at the end, only one):
- Ask ONE natural follow-up question at the very end
- Only after giving emotional support first
- Make it feel like curiosity from a friend, not a therapist

FORMAT RULES:
- Write in SHORT separate lines with a blank line between each thought
- Maximum 1-2 sentences per line, maximum 4-5 lines total
- Like a text message from a caring friend, NOT an essay
- NEVER start with "It sounds like..." or "I understand that..." or "Anxiety can be..." these feel robotic and cold

EXAMPLE OF GOOD RESPONSE to "I am stressed about daily life":
"That is so exhausting.

When everything piles up at once, even small things start to feel impossible.

You are allowed to feel overwhelmed — it does not mean you are failing.

What has been draining you the most lately?"

STRICT RULES:
- Emotional support and validation ALWAYS comes before any question
- Be specific to exactly what the user said — never give generic responses
- Be warm and human like a real friend texting you
- Never diagnose or replace professional therapy
- If someone says they are tired, exhausted, burned out — respond like a friend would: "hey take a break", suggest something simple, THEN ask what happened
- If someone says they are stressed or overwhelmed — first say something comforting, suggest one small thing, then ask what is going on
- NEVER sound like a therapist — always sound like a caring friend who knows you well
- If someone expresses any suicidal thoughts or wanting to die, respond with deep warmth and concern, then always end with: "Please contact your loved ones"`;

const CRISIS_HELPLINE = "\n\nPlease reach out - iCall India: 9152987821 (free, confidential)";

// ==========================================
// 1. KEYWORD OVERRIDE
// ==========================================
const CRISIS_PHRASES_HIGH = [
  "kill myself", "killing myself",
  "end my life", "ending my life",
  "want to die", "wanting to die",
  "going to kill", "going to die",
  "suicide", "suicidal",
  "take my life", "taking my life",
  "hang myself", "hurt myself",
  "cut myself", "overdose",
  "jump off", "no reason to live",
  "nothing to live for", "better off dead",
  "rather be dead", "end it all",
  "not worth living", "life is worthless",
  "don't want to live", "don't want to be here",
  "can't go on", "cannot go on",
  "give up on life", "feel like dying",
  "planning to die", "goodbye forever",
  "don't want to wake up",
];

const CRISIS_PHRASES_LOW = [
  "self harm", "self-harm",
  "feel worthless", "no point in living",
  "no point anymore", "disappear forever",
  "wish i was dead",
];

const EMOTION_OVERRIDE_RULES = [
  {
    phrases: [
      "i am depressed", "i'm depressed", "feeling depressed", "feel depressed",
      "i have depression", "suffering from depression",
      "feel empty", "feel nothing", "feel numb", "feeling numb",
      "burned out", "burnt out", "mentally exhausted", "emotionally exhausted",
      "no hope", "lost all hope", "feel hopeless", "feeling hopeless",
      "can't stop crying", "been crying", "cried all day",
      "feel broken", "feel shattered", "feel worthless", "feel useless",
      "i am useless", "i am worthless", "nothing matters",
      "nothing makes me happy", "can't get out of bed",
    ],
    emotion: "sad", confidence: 0.92,
  },
  {
    phrases: [
      "i am sad", "i'm sad", "feeling sad", "feel sad",
      "very sad", "so sad", "really sad", "extremely sad", "deeply sad",
      "heartbroken", "heart is broken", "devastated",
      "grief", "grieving", "mourning",
      "feel down", "feeling down", "really down",
      "feeling low", "feel low", "really low",
    ],
    emotion: "sad", confidence: 0.88,
  },
  {
    phrases: [
      "i am anxious", "i'm anxious", "feeling anxious", "feel anxious",
      "having anxiety", "anxiety attack", "panic attack",
      "can't breathe", "heart is racing", "heart racing", "shaking",
      "overthinking everything", "can't stop thinking",
      "so stressed", "very stressed", "extremely stressed",
      "feel overwhelmed", "feeling overwhelmed", "totally overwhelmed",
      "too much to handle", "can't cope",
    ],
    emotion: "anxious", confidence: 0.88,
  },
  {
    phrases: [
      "i am angry", "i'm angry", "i am anger", "feeling angry", "feel angry",
      "so angry", "very angry", "really angry", "extremely angry",
      "full of rage", "feel rage", "feeling rage",
      "want to scream", "feel like screaming",
      "so frustrated", "very frustrated", "really frustrated",
      "so fed up", "totally fed up", "had enough", "pissed off",
    ],
    emotion: "angry", confidence: 0.88,
  },
  {
    phrases: [
      "i am lonely", "i'm lonely", "feeling lonely", "feel lonely",
      "so alone", "very alone", "feel so alone", "completely alone",
      "no one cares", "nobody cares", "no one understands",
      "nobody understands", "feel invisible", "feel like a burden",
      "no friends", "lost all my friends", "have nobody",
    ],
    emotion: "lonely", confidence: 0.88,
  },
];

function applyKeywordOverride(text, mlResult) {
  const t = text.toLowerCase().trim();

  for (const phrase of CRISIS_PHRASES_HIGH) {
    if (t.includes(phrase)) {
      console.log(`🚨 Crisis override: "${phrase}"`);
      return { ...mlResult, emotion: "sad", confidence: Math.max(mlResult.confidence, 0.95), isCrisis: true, crisisScore: 1.0 };
    }
  }

  const lowHits = CRISIS_PHRASES_LOW.filter(p => t.includes(p));
  if (lowHits.length > 0) {
    const score = Math.min(0.5 + lowHits.length * 0.2, 1.0);
    console.log(`⚠️ Low crisis override: ${lowHits}`);
    return { ...mlResult, emotion: "sad", confidence: Math.max(mlResult.confidence, 0.85), isCrisis: score > 0.5, crisisScore: Math.round(score * 1000) / 1000 };
  }

  for (const rule of EMOTION_OVERRIDE_RULES) {
    for (const phrase of rule.phrases) {
      if (t.includes(phrase)) {
        console.log(`🎯 Emotion override: "${mlResult.emotion}" → "${rule.emotion}" (matched: "${phrase}")`);
        return { ...mlResult, emotion: rule.emotion, confidence: Math.max(mlResult.confidence, rule.confidence) };
      }
    }
  }

  return mlResult;
}

// ==========================================
// 2. PYTHON ML SERVICE
// ==========================================
async function getPythonMLAnalysis(text) {
  try {
    const response = await axios.post(`${ML_SERVICE_URL}/predict`, { text }, { timeout: 8000 });
    return {
      emotion:     response.data.emotion,
      confidence:  response.data.confidence,
      sentiment:   response.data.sentiment,
      isCrisis:    response.data.isCrisis,
      crisisScore: response.data.crisisScore,
      suggestions: response.data.suggestions,
    };
  } catch (err) {
    console.error("ML Service unreachable:", err.message);
    return {
      emotion: "neutral", confidence: 0.5, sentiment: 0.0,
      isCrisis: false, crisisScore: 0.0,
      suggestions: [
        "Take 5 deep breaths right now",
        "Step outside for a short walk",
        "Write down what is on your mind",
      ],
    };
  }
}

// ==========================================
// 3. EMERGENCY EMAIL  (replaces SMS)
// ==========================================
async function sendEmergencyNotification(user, message) {
  if (!user?.emergencyContact) {
    console.log("No emergency contact saved for this user.");
    return;
  }

  const contactEmail = user.emergencyContact.trim();
  const contactName  = user.emergencyName  || "Someone you care about";
  const userName     = user.name           || "A MindEase user";

  console.log(`🚨 EMERGENCY: Sending email to ${contactName} at ${contactEmail}`);

  try {
    await sendEmail({
      to:      contactEmail,
      subject: `🆘 Urgent: ${userName} may need your support right now`,
      html: `
        <div style="font-family: sans-serif; max-width: 520px; margin: auto; padding: 24px;">

          <div style="background: #d32f2f; border-radius: 12px; padding: 20px 24px; margin-bottom: 24px;">
            <h2 style="color: #fff; margin: 0; font-size: 20px;">🆘 Someone needs your help</h2>
          </div>

          <p style="font-size: 16px; color: #333;">Hi <strong>${contactName}</strong>,</p>

          <p style="font-size: 15px; color: #333; line-height: 1.6;">
            <strong>${userName}</strong> is using MindEase, a mental health support app,
            and their conversation has indicated they may be going through a very difficult time
            and could need immediate support.
          </p>

          <div style="background: #fff3e0; border-left: 4px solid #e65100; border-radius: 8px; padding: 16px 20px; margin: 20px 0;">
            <p style="margin: 0; font-size: 15px; color: #bf360c;">
              <strong>Please reach out to them as soon as possible.</strong><br/>
              A phone call, a text, or showing up in person can make all the difference.
            </p>
          </div>

          <p style="font-size: 14px; color: #555; line-height: 1.6;">
            If you believe they are in immediate danger, please contact emergency services
            or the iCall India helpline: <strong>9152987821</strong> (free &amp; confidential).
          </p>

          <hr style="border: none; border-top: 1px solid #eee; margin: 24px 0;" />

          <p style="font-size: 12px; color: #aaa; text-align: center;">
            This is an automated alert from MindEase. You are receiving this because
            ${userName} listed you as their emergency contact.
          </p>

        </div>
      `,
    });

    console.log(`✅ Emergency email sent to ${contactName} (${contactEmail})`);
  } catch (err) {
    console.error("Emergency email error:", err.message);
  }
}

// ==========================================
// 4. FORMAT HELPER
// ==========================================
function formatAsShortLines(text) {
  if (!text) return text;
  if (text.includes("\n\n")) {
    return text.split("\n\n").map(l => l.trim()).filter(l => l.length > 0).join("\n\n");
  }
  const sentences = text.replace(/([.!?])\s+/g, "$1\n").split("\n").map(s => s.trim()).filter(s => s.length > 0);
  return sentences.join("\n\n");
}

// ==========================================
// 5. CONTEXTUAL EMOTION
// ==========================================
function deriveContextualEmotion(savedMessages, currentMLEmotion) {
  const recentEmotions = savedMessages
    .filter(m => m.role === "user" && m.emotion)
    .slice(-4)
    .map(m => m.emotion);

  recentEmotions.push(currentMLEmotion);
  recentEmotions.push(currentMLEmotion);

  const weights = {};
  recentEmotions.forEach(e => { weights[e] = (weights[e] || 0) + 1; });

  const dominant = Object.entries(weights).sort((a, b) => b[1] - a[1])[0][0];
  console.log(`Contextual emotion: ${dominant} (raw ML: ${currentMLEmotion})`);
  return dominant;
}

// ==========================================
// 6. CONTEXT-AWARE ACTIVITIES
// ==========================================
async function getContextualActivities(userMessages, contextualEmotion, mlFallback) {
  try {
    if (!process.env.GROQ_API_KEY) throw new Error("No GROQ_API_KEY");

    const conversationContext = userMessages.slice(-5).map(m => m.content).join("\n");

    const prompt = `A user is feeling "${contextualEmotion}". Here is what they said recently:

${conversationContext}

Suggest exactly 3 short, specific, actionable wellness activities tailored to what they are going through.

Rules:
- Be SPECIFIC to their situation, never generic
- Each activity must be under 10 words
- Return ONLY a raw JSON array of 3 strings, nothing else
- No markdown, no backticks, no explanation
- Example output: ["Take a 10-min walk alone", "Write down what upset you", "Text one person you trust"]`;

    const completion = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.5,
      max_tokens: 120,
    });

    const raw = completion.choices?.[0]?.message?.content?.trim();
    if (!raw) throw new Error("Empty Groq activity response");

    const parsed = JSON.parse(raw.replace(/```json|```/g, "").trim());
    if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    throw new Error("Activity array malformed");
  } catch (err) {
    console.error("Activity generation failed, using fallback:", err.message);
    return mlFallback;
  }
}

// ==========================================
// 7. GROQ CHAT
// ==========================================
async function callGroq(messages, currentMessage, emotion) {
  if (!process.env.GROQ_API_KEY) throw new Error("No GROQ_API_KEY set in environment");

  const formattedHistory = messages.slice(-8).map(m => ({
    role: m.role === "assistant" ? "assistant" : "user",
    content: m.content,
  }));
  formattedHistory.push({ role: "user", content: `[Detected emotion: ${emotion}]\n\n${currentMessage}` });

  const completion = await groq.chat.completions.create({
    model: "llama-3.3-70b-versatile",
    messages: [{ role: "system", content: SYSTEM_PROMPT }, ...formattedHistory],
    temperature: 0.7,
    max_tokens: 300,
  });

  const raw = completion.choices?.[0]?.message?.content;
  if (!raw) throw new Error("Empty response from Groq");
  return formatAsShortLines(raw.trim().replace(/^MindEase:\s*/i, "").trim());
}

// ==========================================
// 8. SMART FALLBACK
// ==========================================
function smartFallback(messages, currentMessage, emotion) {
  const t   = currentMessage.toLowerCase();
  const all = messages.filter(m => m.role === "user").map(m => m.content.toLowerCase()).join(" ");
  const isAskingAdvice = t.match(/what (should|can|to do|do i)|how (do|can|should|to)|advice|tip|suggest|guide|tell me|yes|okay|ok|then|so|please|help/);

  if (isAskingAdvice) {
    if (all.match(/intern|job|placement|hire|apply|career/))
      return `Here are steps that actually work:\n\nPersonalize each application — do not copy-paste.\n\nMessage 5 people on LinkedIn every day.\n\nTry Internshala, AngelList, and LetsIntern.\n\nWhich feels most doable today?`;
    if (all.match(/exam|study|assignment|college|marks/))
      return `A few things that help:\n\nBreak it into 25-minute focused sessions.\n\nFocus on understanding, not memorizing.\n\nSleep matters more than late-night cramming.\n\nWhat subject is hardest right now?`;
    if (all.match(/depress|sad|low|down|overwhelm/))
      return `When you are feeling low, start tiny.\n\nOne task. Not everything — just one.\n\nWhat is the ONE most urgent thing today?`;
    return `Start with just one small thing.\n\nNot everything at once — just one step.\n\nWhat is the smallest thing you could do right now?`;
  }

  const responses = {
    sad:     `I hear you.\n\nFeeling this way is completely valid — it is exhausting.\n\nYou do not have to fix everything right now.\n\nWhat feels most overwhelming at this moment?`,
    anxious: `That sounds really stressful.\n\nLet us slow down together — take one breath.\n\nWhat is the most urgent thing on your plate right now?`,
    angry:   `Your frustration makes complete sense.\n\nSometimes things just pile up and it is too much.\n\nWhat happened that pushed you over the edge?`,
    lonely:  `Feeling alone is really painful.\n\nBut you reached out, and that takes courage.\n\nWhat has been making you feel this disconnected?`,
    happy:   `That is great to hear!\n\nTell me more — what has been going well?`,
    neutral: `I am here and I am listening.\n\nWhatever you want to share — no pressure.\n\nWhat has been on your mind lately?`,
    calm:    `It is nice that you are feeling calm.\n\nIs there something you would like to reflect on?`,
  };
  return responses[emotion] || responses.neutral;
}

// ==========================================
// 9. CONTROLLERS
// ==========================================

exports.getOrCreateSession = async (req, res, next) => {
  try {
    let session = await Session.findOne({ user: req.user._id, isActive: true }).sort("-createdAt");
    if (!session) {
      session = await Session.create({
        user: req.user._id,
        messages: [{
          role:    "assistant",
          content: `Hi ${req.user.name.split(" ")[0]} 🌿\n\nWelcome to MindEase — your safe space.\n\nNo pressure, no judgment.\n\nHow are you feeling today?`,
        }],
      });
    }
    res.json({ success: true, data: { session } });
  } catch (err) { next(err); }
};

exports.sendMessage = async (req, res, next) => {
  try {
    const { message, sessionId } = req.body;
    if (!message?.trim()) return next(new AppError("Message cannot be empty", 400));

    // STEP 1: ML analysis + keyword override
    const rawML    = await getPythonMLAnalysis(message);
    const mlResult = applyKeywordOverride(message, rawML);
    if (rawML.emotion !== mlResult.emotion || rawML.isCrisis !== mlResult.isCrisis) {
      console.log(`Override: ${rawML.emotion}→${mlResult.emotion} | crisis: ${rawML.isCrisis}→${mlResult.isCrisis}`);
    } else {
      console.log(`ML → emotion: ${mlResult.emotion} (${(mlResult.confidence*100).toFixed(0)}%) | crisis: ${mlResult.isCrisis}`);
    }

    // STEP 2: Get or create session
    let session = sessionId
      ? await Session.findOne({ _id: sessionId, user: req.user._id })
      : await Session.findOne({ user: req.user._id, isActive: true }).sort("-createdAt");
    if (!session) session = await Session.create({ user: req.user._id, messages: [] });

    // STEP 3: Contextual emotion
    const contextualEmotion = deriveContextualEmotion(session.messages, mlResult.emotion);

    // STEP 4: Activities
    const userMessagesForContext = [
      ...session.messages.filter(m => m.role === "user"),
      { content: message },
    ];
    const activities = await getContextualActivities(userMessagesForContext, contextualEmotion, mlResult.suggestions);

    // STEP 5: Save user message
    session.messages.push({
      role: "user", content: message,
      emotion: mlResult.emotion, emotionScore: mlResult.confidence,
      sentimentScore: mlResult.sentiment,
      isCrisis: mlResult.isCrisis, crisisScore: mlResult.crisisScore,
    });

    // STEP 6: Emergency email
    if (mlResult.isCrisis) {
      const user = await User.findById(req.user._id);
      if (user?.emergencyContact) await sendEmergencyNotification(user, message);
    }

    // STEP 7: Groq reply
    let aiReply = "";
    try {
      aiReply = await callGroq(session.messages, message, contextualEmotion);
    } catch (err) {
      console.error("Groq failed:", err.message);
      aiReply = smartFallback(session.messages, message, contextualEmotion);
    }
    if (mlResult.isCrisis) aiReply += CRISIS_HELPLINE;

    // STEP 8: Save assistant reply + update dominant emotion
    session.messages.push({ role: "assistant", content: aiReply });
    const emotionCounts = session.messages
      .filter(m => m.role === "user" && m.emotion)
      .reduce((acc, m) => { acc[m.emotion] = (acc[m.emotion] || 0) + 1; return acc; }, {});
    session.dominantEmotion = Object.entries(emotionCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || "neutral";
    await session.save();

    // STEP 9: Save MoodEntry
    await MoodEntry.create({
      user: req.user._id, emotion: contextualEmotion,
      mlScore: mlResult.confidence, sentiment: mlResult.sentiment,
      isCrisis: mlResult.isCrisis, source: "chat",
    });

    // STEP 10: Send response
    res.json({
      success: true,
      data: {
        reply:      aiReply,
        mlAnalysis: {
          emotion:     contextualEmotion,
          confidence:  mlResult.confidence,
          sentiment:   mlResult.sentiment,
          isCrisis:    mlResult.isCrisis,
          crisisScore: mlResult.crisisScore,
        },
        sessionId:  session._id,
        activities,
      },
    });

  } catch (err) { next(err); }
};

exports.getSessions = async (req, res, next) => {
  try {
    const sessions = await Session.find({ user: req.user._id })
      .select("title dominantEmotion createdAt messages isActive")
      .sort("-createdAt").limit(30);
    res.json({ success: true, data: { sessions } });
  } catch (err) { next(err); }
};

exports.endSession = async (req, res, next) => {
  try {
    const session = await Session.findOne({ _id: req.params.id, user: req.user._id });
    if (!session) return next(new AppError("Session not found", 404));
    session.isActive = false;
    session.endedAt  = new Date();
    session.duration = Math.round((session.endedAt - session.startedAt) / 60000);
    await session.save();
    res.json({ success: true, data: { session } });
  } catch (err) { next(err); }
};