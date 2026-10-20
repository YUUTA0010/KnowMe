import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";

/* =========================================================================
   HELPERS
   ========================================================================= */

const uid = () => Math.random().toString(36).slice(2, 10);
const genCode = () => Math.random().toString(36).slice(2, 8).toUpperCase();

function mkQuestion(text, opts) {
  const options = opts.map((t) => ({ id: uid(), text: t }));
  return {
    id: uid(),
    text,
    type: "multiple_choice",
    options,
    correctOptionId: options[0].id,
  };
}

function defaultQuestions() {
  return [
    mkQuestion("What's my biggest pet peeve?", ["Loud chewing", "Being late", "Messy rooms", "Slow replies"]),
    mkQuestion("What would I probably do on a completely free Sunday?", ["Sleep all day", "Go on an adventure", "Binge a show", "See friends"]),
    mkQuestion("What's something that instantly makes me happy?", ["Good food", "Music", "A message from someone I love", "Being outside"]),
    mkQuestion("If I could travel anywhere tomorrow, where would I go?", ["Japan", "Italy", "A beach, anywhere", "Somewhere with mountains"]),
    mkQuestion("What type of situation makes me most uncomfortable?", ["Big crowds", "Public speaking", "Confrontation", "Silence"]),
    mkQuestion("What's my biggest weakness?", ["Overthinking", "Procrastination", "Being too stubborn", "Caring too much what people think"]),
    mkQuestion("Which type of person would I get along with best?", ["Someone quiet and thoughtful", "Someone loud and spontaneous", "Someone ambitious", "Someone chill and easygoing"]),
    mkQuestion("What is something I secretly care about a lot?", ["What people think of me", "Being seen as reliable", "My family", "Being creative"]),
    mkQuestion("If I suddenly became rich, what would I probably buy first?", ["Travel", "A house", "Something for my family", "I'd honestly just save it"]),
    mkQuestion("What's one thing I could never live without?", ["My phone", "Music", "Coffee", "My people"]),
  ];
}

function scoreSubmission(quiz, answersByQuestionId) {
  let correct = 0;
  const perQuestion = quiz.questions.map((q) => {
    const selected = answersByQuestionId[q.id] ?? null;
    const isCorrect = selected !== null && selected === q.correctOptionId;
    if (isCorrect) correct++;
    return { questionId: q.id, selectedOptionId: selected, isCorrect };
  });
  const total = quiz.questions.length;
  const percentage = total ? Math.round((correct / total) * 100) : 0;
  return { correct, total, percentage, perQuestion };
}

function resultMessage(pct) {
  if (pct === 100) return "You're basically their personal database 😂";
  if (pct >= 90) return "Okay... you KNOW them. 👀";
  if (pct >= 70) return "Pretty impressive! You pay attention.";
  if (pct >= 50) return "You're a friend... but maybe not THAT good of a friend 😂";
  return "Do you two even know each other? 💀";
}

function medal(rank) {
  if (rank === 0) return "🥇";
  if (rank === 1) return "🥈";
  if (rank === 2) return "🥉";
  return `${rank + 1}.`;
}

function formatTime(ms) {
  const s = Math.round(ms / 1000);
  const m = Math.floor(s / 60);
  const rem = s % 60;
  return m > 0 ? `${m}m ${rem}s` : `${rem}s`;
}

async function storageGet(key, shared) {
  try {
    const res = await window.storage.get(key, !!shared);
    return res ? JSON.parse(res.value) : null;
  } catch (e) {
    return null;
  }
}
async function storageSet(key, value, shared) {
  try {
    await window.storage.set(key, JSON.stringify(value), !!shared);
    return true;
  } catch (e) {
    return false;
  }
}

/* =========================================================================
   SMALL UI PRIMITIVES
   ========================================================================= */

function GlassCard({ children, className = "", style = {}, glow }) {
  return (
    <div
      className={`glass-card ${glow ? "glass-card-glow" : ""} ${className}`}
      style={style}
    >
      {children}
    </div>
  );
}

function Button({ children, onClick, variant = "primary", disabled, className = "", type = "button", full }) {
  return (
    <button
      type={type}
      disabled={disabled}
      onClick={onClick}
      className={`btn btn-${variant} ${full ? "btn-full" : ""} ${className}`}
    >
      {children}
    </button>
  );
}

function IconButton({ children, onClick, title, danger }) {
  return (
    <button type="button" onClick={onClick} title={title} className={`icon-btn ${danger ? "icon-btn-danger" : ""}`}>
      {children}
    </button>
  );
}

function ProgressBar({ value }) {
  return (
    <div className="progress-track">
      <div className="progress-fill" style={{ width: `${value}%` }} />
    </div>
  );
}

function Confetti({ active }) {
  const pieces = useMemo(
    () =>
      Array.from({ length: 60 }).map((_, i) => ({
        id: i,
        left: Math.random() * 100,
        delay: Math.random() * 0.6,
        duration: 2.2 + Math.random() * 1.6,
        rotate: Math.random() * 360,
        color: ["#ff5fa8", "#2dd6f0", "#a78bfa", "#ffd166", "#7bffb0"][i % 5],
        size: 6 + Math.random() * 8,
      })),
    [active]
  );
  if (!active) return null;
  return (
    <div className="confetti-layer" aria-hidden="true">
      {pieces.map((p) => (
        <span
          key={p.id}
          className="confetti-piece"
          style={{
            left: `${p.left}%`,
            animationDelay: `${p.delay}s`,
            animationDuration: `${p.duration}s`,
            background: p.color,
            width: p.size,
            height: p.size * 1.4,
            transform: `rotate(${p.rotate}deg)`,
          }}
        />
      ))}
    </div>
  );
}

function FloatingParticles() {
  const particles = useMemo(
    () =>
      Array.from({ length: 18 }).map((_, i) => ({
        id: i,
        left: Math.random() * 100,
        top: Math.random() * 100,
        size: 2 + Math.random() * 4,
        duration: 10 + Math.random() * 14,
        delay: Math.random() * 6,
      })),
    []
  );
  return (
    <div className="particle-layer" aria-hidden="true">
      {particles.map((p) => (
        <span
          key={p.id}
          className="particle"
          style={{
            left: `${p.left}%`,
            top: `${p.top}%`,
            width: p.size,
            height: p.size,
            animationDuration: `${p.duration}s`,
            animationDelay: `${p.delay}s`,
          }}
        />
      ))}
    </div>
  );
}

function ToastHost({ toasts }) {
  return (
    <div className="toast-host">
      {toasts.map((t) => (
        <div key={t.id} className="toast">
          {t.text}
        </div>
      ))}
    </div>
  );
}

function EmptyState({ emoji, title, sub, action }) {
  return (
    <div className="empty-state">
      <div className="empty-emoji">{emoji}</div>
      <div className="empty-title">{title}</div>
      {sub && <div className="empty-sub">{sub}</div>}
      {action}
    </div>
  );
}

/* =========================================================================
   LANDING PAGE
   ========================================================================= */

function Landing({ onCreate, onJoin, joinCode, setJoinCode }) {
  const notifications = [
    { text: "Sarah got 9/10 🔥", top: "12%", left: "6%", delay: "0s" },
    { text: "Rahul knows you REALLY well 👀", top: "62%", left: "2%", delay: "1.2s" },
    { text: "Ananya just took the lead 🏆", top: "20%", right: "4%", delay: "2.1s" },
    { text: "Vikram scored 100% 🎉", top: "70%", right: "6%", delay: "3.4s" },
  ];

  return (
    <div className="landing">
      <FloatingParticles />
      <div className="floating-notifs">
        {notifications.map((n, i) => (
          <div
            key={i}
            className="notif-chip"
            style={{ top: n.top, left: n.left, right: n.right, animationDelay: n.delay }}
          >
            {n.text}
          </div>
        ))}
      </div>

      <div className="landing-inner">
        <div className="eyebrow-free">The friendship test everyone's sharing</div>
        <h1 className="hero-title">
          How well do your
          <br />
          friends <span className="text-gradient">really</span> know you?
        </h1>
        <p className="hero-sub">
          Build a quiz about yourself, send the link, and watch your friends fight for the top of the
          leaderboard.
        </p>

        <div className="hero-ctas">
          <Button variant="primary" onClick={onCreate}>
            Create My Quiz
          </Button>
          <div className="join-inline">
            <input
              className="text-input join-input"
              placeholder="Have a code? e.g. 8FK29X"
              value={joinCode}
              onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
              onKeyDown={(e) => e.key === "Enter" && onJoin()}
            />
            <Button variant="secondary" onClick={onJoin}>
              Take a Quiz
            </Button>
          </div>
        </div>

        <div className="hero-demo-row">
          <GlassCard className="mini-leaderboard-card">
            <div className="mini-lb-title">Who Knows Alex Best?</div>
            <div className="mini-lb-row"><span>🥇 Sarah</span><span>10/10</span></div>
            <div className="mini-lb-row"><span>🥈 Rahul</span><span>9/10</span></div>
            <div className="mini-lb-row"><span>🥉 Ananya</span><span>8/10</span></div>
          </GlassCard>
        </div>
      </div>
    </div>
  );
}

/* =========================================================================
   QUESTION EDITOR CARD
   ========================================================================= */

function QuestionEditor({ question, index, total, onChange, onDelete, onDuplicate, onMove }) {
  const update = (patch) => onChange({ ...question, ...patch });

  const updateOption = (optId, text) => {
    update({ options: question.options.map((o) => (o.id === optId ? { ...o, text } : o)) });
  };
  const addOption = () => {
    if (question.options.length >= 10) return;
    update({ options: [...question.options, { id: uid(), text: "" }] });
  };
  const removeOption = (optId) => {
    if (question.options.length <= 2) return;
    const options = question.options.filter((o) => o.id !== optId);
    const correctOptionId = question.correctOptionId === optId ? options[0].id : question.correctOptionId;
    update({ options, correctOptionId });
  };
  const setType = (type) => {
    if (type === "true_false") {
      const yes = { id: uid(), text: "Yes" };
      const no = { id: uid(), text: "No" };
      update({ type, options: [yes, no], correctOptionId: yes.id });
    } else if (question.type !== "multiple_choice") {
      update({ type: "multiple_choice" });
    }
  };

  return (
    <GlassCard className="question-card">
      <div className="question-card-head">
        <span className="question-number">Question {index + 1}</span>
        <div className="question-card-actions">
          <IconButton title="Move up" onClick={() => onMove(-1)}>↑</IconButton>
          <IconButton title="Move down" onClick={() => onMove(1)}>↓</IconButton>
          <IconButton title="Duplicate" onClick={onDuplicate}>⧉</IconButton>
          <IconButton title="Delete" danger onClick={onDelete}>🗑</IconButton>
        </div>
      </div>

      <textarea
        className="text-input question-text-input"
        value={question.text}
        placeholder="Type your question..."
        rows={2}
        onChange={(e) => update({ text: e.target.value })}
      />

      <div className="type-toggle">
        <button
          className={`type-pill ${question.type === "multiple_choice" ? "type-pill-active" : ""}`}
          onClick={() => setType("multiple_choice")}
          type="button"
        >
          Multiple choice
        </button>
        <button
          className={`type-pill ${question.type === "true_false" ? "type-pill-active" : ""}`}
          onClick={() => setType("true_false")}
          type="button"
        >
          Yes / No
        </button>
      </div>

      <div className="option-list">
        {question.options.map((opt) => (
          <div key={opt.id} className="option-row">
            <button
              type="button"
              className={`option-radio ${question.correctOptionId === opt.id ? "option-radio-active" : ""}`}
              onClick={() => update({ correctOptionId: opt.id })}
              title="Mark as correct answer"
            >
              {question.correctOptionId === opt.id ? "✓" : ""}
            </button>
            <input
              className="text-input option-text-input"
              value={opt.text}
              placeholder="Answer option"
              onChange={(e) => updateOption(opt.id, e.target.value)}
              disabled={question.type === "true_false"}
            />
            {question.type === "multiple_choice" && question.options.length > 2 && (
              <button type="button" className="option-remove" onClick={() => removeOption(opt.id)}>
                ✕
              </button>
            )}
          </div>
        ))}
      </div>

      {question.type === "multiple_choice" && question.options.length < 10 && (
        <button type="button" className="add-option-btn" onClick={addOption}>
          + Add answer option
        </button>
      )}
      <div className="correct-hint">Tap the circle next to the right answer ✓</div>
    </GlassCard>
  );
}

/* =========================================================================
   ADD CUSTOM QUESTION MODAL
   ========================================================================= */

function AddQuestionModal({ onClose, onAdd }) {
  const [text, setText] = useState("");
  const [options, setOptions] = useState(["", "", "", ""]);
  const [correctIdx, setCorrectIdx] = useState(0);

  const setOpt = (i, v) => setOptions((prev) => prev.map((o, idx) => (idx === i ? v : o)));
  const addOpt = () => options.length < 10 && setOptions((p) => [...p, ""]);
  const removeOpt = (i) => {
    if (options.length <= 2) return;
    setOptions((p) => p.filter((_, idx) => idx !== i));
    if (correctIdx === i) setCorrectIdx(0);
    else if (correctIdx > i) setCorrectIdx((c) => c - 1);
  };

  const canSubmit = text.trim() && options.filter((o) => o.trim()).length >= 2;

  const submit = () => {
    const cleanOptions = options.filter((o) => o.trim()).map((t) => ({ id: uid(), text: t.trim() }));
    const correctText = options[correctIdx];
    const correctOpt = cleanOptions.find((o) => o.text === correctText.trim()) || cleanOptions[0];
    onAdd({
      id: uid(),
      text: text.trim(),
      type: "multiple_choice",
      options: cleanOptions,
      correctOptionId: correctOpt.id,
    });
    onClose();
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <GlassCard className="modal-card" style={{}}>
        <div onClick={(e) => e.stopPropagation()}>
          <div className="modal-title">Add your own question</div>
          <textarea
            className="text-input question-text-input"
            placeholder="What's the question?"
            rows={2}
            value={text}
            onChange={(e) => setText(e.target.value)}
          />
          <div className="option-list">
            {options.map((o, i) => (
              <div key={i} className="option-row">
                <button
                  type="button"
                  className={`option-radio ${correctIdx === i ? "option-radio-active" : ""}`}
                  onClick={() => setCorrectIdx(i)}
                >
                  {correctIdx === i ? "✓" : ""}
                </button>
                <input
                  className="text-input option-text-input"
                  placeholder={`Answer ${i + 1}`}
                  value={o}
                  onChange={(e) => setOpt(i, e.target.value)}
                />
                {options.length > 2 && (
                  <button type="button" className="option-remove" onClick={() => removeOpt(i)}>
                    ✕
                  </button>
                )}
              </div>
            ))}
          </div>
          {options.length < 10 && (
            <button type="button" className="add-option-btn" onClick={addOpt}>
              + Add answer option
            </button>
          )}
          <div className="modal-actions">
            <Button variant="ghost" onClick={onClose}>Cancel</Button>
            <Button variant="primary" disabled={!canSubmit} onClick={submit}>Add Question</Button>
          </div>
        </div>
      </GlassCard>
    </div>
  );
}

/* =========================================================================
   CREATE FLOW
   ========================================================================= */

function CreateFlow({ onPublished, toast }) {
  const [step, setStep] = useState("name"); // name -> questions -> preview
  const [creatorName, setCreatorName] = useState("");
  const [questions, setQuestions] = useState(defaultQuestions);
  const [showAddModal, setShowAddModal] = useState(false);
  const [publishing, setPublishing] = useState(false);

  const updateQuestion = (id, next) =>
    setQuestions((qs) => qs.map((q) => (q.id === id ? next : q)));
  const deleteQuestion = (id) => setQuestions((qs) => qs.filter((q) => q.id !== id));
  const duplicateQuestion = (id) =>
    setQuestions((qs) => {
      const idx = qs.findIndex((q) => q.id === id);
      const copy = JSON.parse(JSON.stringify(qs[idx]));
      copy.id = uid();
      copy.options = copy.options.map((o) => ({ ...o, id: uid() }));
      copy.correctOptionId = copy.options[qs[idx].options.findIndex((o) => o.id === qs[idx].correctOptionId)]?.id || copy.options[0].id;
      const next = [...qs];
      next.splice(idx + 1, 0, copy);
      return next;
    });
  const moveQuestion = (id, dir) =>
    setQuestions((qs) => {
      const idx = qs.findIndex((q) => q.id === id);
      const target = idx + dir;
      if (target < 0 || target >= qs.length) return qs;
      const next = [...qs];
      [next[idx], next[target]] = [next[target], next[idx]];
      return next;
    });

  const validQuestions = questions.filter((q) => q.text.trim() && q.options.every((o) => o.text.trim()));
  const canProceed = creatorName.trim().length > 0;
  const canPreview = validQuestions.length >= 1;

  const publish = async () => {
    setPublishing(true);
    const shareCode = genCode();
    const quiz = {
      shareCode,
      title: `How well do you know ${creatorName.trim()}?`,
      creatorName: creatorName.trim(),
      questions: validQuestions,
      createdAt: Date.now(),
    };
    await storageSet(`quiz:${shareCode}`, quiz, true);
    await storageSet(`submissions:${shareCode}`, [], true);
    const mine = (await storageGet("my-quizzes", false)) || [];
    await storageSet("my-quizzes", [{ shareCode, title: quiz.title, createdAt: quiz.createdAt }, ...mine], false);
    setPublishing(false);
    toast("Quiz published 🎉");
    onPublished(quiz);
  };

  if (step === "name") {
    return (
      <div className="page-center">
        <GlassCard className="step-card" glow>
          <div className="step-eyebrow">Step 1 of 3</div>
          <h2 className="step-title">What should your friends call you?</h2>
          <input
            className="text-input big-input"
            placeholder="Your name"
            value={creatorName}
            onChange={(e) => setCreatorName(e.target.value)}
            autoFocus
          />
          <Button variant="primary" full disabled={!canProceed} onClick={() => setStep("questions")}>
            Continue
          </Button>
        </GlassCard>
      </div>
    );
  }

  if (step === "questions") {
    return (
      <div className="builder-page">
        <div className="builder-header">
          <div>
            <div className="step-eyebrow">Step 2 of 3</div>
            <h2 className="step-title">Build your friendship test</h2>
            <p className="step-sub">Edit the starter questions, or add your own. You decide the right answers.</p>
          </div>
          <Button variant="secondary" onClick={() => setShowAddModal(true)}>
            + Add Your Own Question
          </Button>
        </div>

        <div className="question-grid">
          {questions.map((q, i) => (
            <QuestionEditor
              key={q.id}
              question={q}
              index={i}
              total={questions.length}
              onChange={(next) => updateQuestion(q.id, next)}
              onDelete={() => deleteQuestion(q.id)}
              onDuplicate={() => duplicateQuestion(q.id)}
              onMove={(dir) => moveQuestion(q.id, dir)}
            />
          ))}
        </div>

        <div className="builder-footer">
          <Button variant="ghost" onClick={() => setStep("name")}>← Back</Button>
          <Button variant="primary" disabled={!canPreview} onClick={() => setStep("preview")}>
            Preview Quiz
          </Button>
        </div>

        {showAddModal && (
          <AddQuestionModal
            onClose={() => setShowAddModal(false)}
            onAdd={(q) => setQuestions((qs) => [...qs, q])}
          />
        )}
      </div>
    );
  }

  // preview
  return (
    <div className="page-center">
      <GlassCard className="step-card" glow>
        <div className="step-eyebrow">Step 3 of 3 · Preview</div>
        <h2 className="step-title">"How well do you know {creatorName}?"</h2>
        <p className="step-sub">{validQuestions.length} questions, exactly as your friends will see them.</p>
        <div className="preview-list">
          {validQuestions.map((q, i) => (
            <div key={q.id} className="preview-item">
              <div className="preview-q">{i + 1}. {q.text}</div>
              <div className="preview-opts">
                {q.options.map((o) => (
                  <span key={o.id} className="preview-opt-chip">{o.text}</span>
                ))}
              </div>
            </div>
          ))}
        </div>
        <div className="builder-footer">
          <Button variant="ghost" onClick={() => setStep("questions")}>← Back</Button>
          <Button variant="primary" disabled={publishing} onClick={publish}>
            {publishing ? "Publishing..." : "Publish Quiz"}
          </Button>
        </div>
      </GlassCard>
    </div>
  );
}

/* =========================================================================
   PUBLISHED / SHARE SCREEN
   ========================================================================= */

function PublishedScreen({ quiz, onLeaderboard, onDashboard, onEdit, toast }) {
  const shareUrl = `${typeof window !== "undefined" ? window.location.href.split("#")[0] : ""}#quiz=${quiz.shareCode}`;

  const copy = async (text, label) => {
    try {
      await navigator.clipboard.writeText(text);
      toast(`${label} copied ✓`);
    } catch {
      toast("Couldn't copy — copy it manually");
    }
  };

  return (
    <div className="page-center">
      <GlassCard className="step-card" glow>
        <div className="celebrate-emoji">🎉</div>
        <h2 className="step-title">Your quiz is ready!</h2>
        <p className="step-sub">Now let's see who REALLY knows {quiz.creatorName}.</p>

        <div className="share-code-box">
          <div className="share-code-label">Your quiz code</div>
          <div className="share-code-value">{quiz.shareCode}</div>
        </div>

        <div className="share-link-row">
          <input className="text-input" readOnly value={shareUrl} onFocus={(e) => e.target.select()} />
          <Button variant="secondary" onClick={() => copy(shareUrl, "Link")}>Copy Link</Button>
        </div>
        <Button variant="ghost" onClick={() => copy(quiz.shareCode, "Code")}>Copy Code Instead</Button>

        <div className="published-actions">
          <Button variant="primary" onClick={onLeaderboard}>View Leaderboard</Button>
          <Button variant="secondary" onClick={onDashboard}>Creator Dashboard</Button>
          <Button variant="ghost" onClick={onEdit}>Edit Quiz</Button>
        </div>
      </GlassCard>
    </div>
  );
}

/* =========================================================================
   JOIN SCREEN
   ========================================================================= */

function JoinScreen({ code, setCode, onSubmit, error }) {
  return (
    <div className="page-center">
      <GlassCard className="step-card" glow>
        <h2 className="step-title">Got a quiz code?</h2>
        <p className="step-sub">Enter it below to take the friendship test.</p>
        <input
          className="text-input big-input"
          placeholder="e.g. 8FK29X"
          value={code}
          onChange={(e) => setCode(e.target.value.toUpperCase())}
          onKeyDown={(e) => e.key === "Enter" && onSubmit()}
          autoFocus
        />
        {error && <div className="form-error">{error}</div>}
        <Button variant="primary" full onClick={onSubmit}>Find Quiz</Button>
      </GlassCard>
    </div>
  );
}

/* =========================================================================
   QUIZ INTRO (for participant)
   ========================================================================= */

function QuizIntro({ quiz, participantName, setParticipantName, onStart }) {
  return (
    <div className="page-center">
      <GlassCard className="step-card" glow>
        <div className="step-eyebrow">Friendship Test</div>
        <h2 className="step-title">{quiz.title}</h2>
        <p className="step-sub">You have {quiz.questions.length} questions to prove it.</p>
        <input
          className="text-input big-input"
          placeholder="What's your name?"
          value={participantName}
          onChange={(e) => setParticipantName(e.target.value)}
          autoFocus
        />
        <Button variant="primary" full disabled={!participantName.trim()} onClick={onStart}>
          Start Quiz →
        </Button>
      </GlassCard>
    </div>
  );
}

/* =========================================================================
   TAKING THE QUIZ
   ========================================================================= */

function TakingQuiz({ quiz, participantName, onFinish }) {
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [selected, setSelected] = useState(null);
  const [animKey, setAnimKey] = useState(0);
  const startRef = useRef(Date.now());

  const question = quiz.questions[index];
  const progress = Math.round(((index) / quiz.questions.length) * 100);

  const pick = (optId) => {
    if (selected) return;
    setSelected(optId);
    const nextAnswers = { ...answers, [question.id]: optId };
    setAnswers(nextAnswers);
    setTimeout(() => {
      if (index + 1 < quiz.questions.length) {
        setIndex((i) => i + 1);
        setSelected(null);
        setAnimKey((k) => k + 1);
      } else {
        const completionTime = Date.now() - startRef.current;
        onFinish(nextAnswers, completionTime);
      }
    }, 420);
  };

  return (
    <div className="page-center">
      <div className="quiz-take-wrap">
        <div className="quiz-progress-row">
          <span>Question {index + 1} / {quiz.questions.length}</span>
          <span>{progress}%</span>
        </div>
        <ProgressBar value={progress} />

        <GlassCard className="quiz-question-card" key={animKey}>
          <div className="quiz-question-text">{question.text}</div>
          <div className="quiz-option-grid">
            {question.options.map((opt) => (
              <button
                key={opt.id}
                type="button"
                className={`quiz-option-btn ${selected === opt.id ? "quiz-option-selected" : ""} ${selected && selected !== opt.id ? "quiz-option-dim" : ""}`}
                onClick={() => pick(opt.id)}
                disabled={!!selected}
              >
                {opt.text}
              </button>
            ))}
          </div>
        </GlassCard>
        <div className="quiz-take-footer">Answering as <strong>{participantName}</strong></div>
      </div>
    </div>
  );
}

/* =========================================================================
   RESULT SCREEN
   ========================================================================= */

function ResultScreen({ quiz, result, onLeaderboard, onShare, toast }) {
  const [displayScore, setDisplayScore] = useState(0);

  useEffect(() => {
    let raf;
    const start = performance.now();
    const duration = 900;
    const tick = (t) => {
      const p = Math.min(1, (t - start) / duration);
      setDisplayScore(Math.round(p * result.percentage));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [result.percentage]);

  return (
    <div className="page-center">
      <Confetti active={result.percentage === 100} />
      <GlassCard className="step-card result-card" glow>
        <div className="celebrate-emoji">🎉</div>
        <div className="result-heading">Quiz Complete!</div>
        <div className="result-sub">You survived the friendship test.</div>
        <div className="result-score">{result.correct} / {result.total}</div>
        <div className="result-pct">{displayScore}%</div>
        <div className="result-message">{resultMessage(result.percentage)}</div>

        <div className="result-share-card">
          <div className="result-share-title">I KNOW {quiz.creatorName.toUpperCase()} 👀</div>
          <div className="result-share-score">{result.correct} / {result.total}</div>
          <div className="result-share-pct">{result.percentage}%</div>
          <div className="result-share-cta">Can you beat my score?</div>
        </div>

        <div className="published-actions">
          <Button variant="primary" onClick={onLeaderboard}>Who Knows Them Best?</Button>
          <Button variant="secondary" onClick={onShare}>Share My Result</Button>
        </div>
      </GlassCard>
    </div>
  );
}

/* =========================================================================
   LEADERBOARD
   ========================================================================= */

function sortSubmissions(subs) {
  return [...subs].sort((a, b) => b.score - a.score || a.completionTime - b.completionTime);
}

function Leaderboard({ quiz, submissions, onTakeQuiz }) {
  const sorted = sortSubmissions(submissions);

  return (
    <div className="page-center">
      <GlassCard className="step-card leaderboard-card" glow>
        <h2 className="step-title">Who Knows {quiz.creatorName} Best?</h2>
        {sorted.length === 0 ? (
          <EmptyState
            emoji="🕵️"
            title="No one has taken this quiz yet."
            sub="Send the link to friends and let's expose them 👀"
          />
        ) : (
          <div className="lb-list">
            {sorted.map((s, i) => (
              <div key={s.id} className={`lb-row ${i < 3 ? "lb-row-top" : ""}`} style={{ animationDelay: `${i * 60}ms` }}>
                <span className="lb-rank">{medal(i)}</span>
                <span className="lb-name">{s.participantName}</span>
                <span className="lb-score">{s.score}/{s.total}</span>
                <span className="lb-pct">{s.percentage}%</span>
                <span className="lb-time">{formatTime(s.completionTime)}</span>
              </div>
            ))}
          </div>
        )}
        <Button variant="primary" full onClick={onTakeQuiz}>Take This Quiz</Button>
      </GlassCard>
    </div>
  );
}

/* =========================================================================
   CREATOR DASHBOARD
   ========================================================================= */

function Dashboard({ myQuizzes, activeQuiz, activeSubmissions, onSelectQuiz, onCreateNew, onOpenLeaderboard }) {
  if (myQuizzes.length === 0) {
    return (
      <div className="page-center">
        <GlassCard className="step-card" glow>
          <EmptyState
            emoji="📊"
            title="You haven't made a quiz yet."
            sub="Create one and this dashboard will fill up with your friends' answers."
            action={<Button variant="primary" onClick={onCreateNew}>Create My Quiz</Button>}
          />
        </GlassCard>
      </div>
    );
  }

  const sorted = sortSubmissions(activeSubmissions);
  const scores = activeSubmissions.map((s) => s.percentage);
  const avg = scores.length ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0;
  const high = scores.length ? Math.max(...scores) : 0;
  const low = scores.length ? Math.min(...scores) : 0;
  const avgTime = activeSubmissions.length
    ? activeSubmissions.reduce((a, b) => a + b.completionTime, 0) / activeSubmissions.length
    : 0;

  const distBuckets = [
    { name: "0-49%", min: 0, max: 49 },
    { name: "50-69%", min: 50, max: 69 },
    { name: "70-89%", min: 70, max: 89 },
    { name: "90-99%", min: 90, max: 99 },
    { name: "100%", min: 100, max: 100 },
  ].map((b) => ({ name: b.name, count: scores.filter((s) => s >= b.min && s <= b.max).length }));

  const questionAccuracy = activeQuiz
    ? activeQuiz.questions.map((q) => {
        const attempts = activeSubmissions.length;
        const correctCount = activeSubmissions.reduce((acc, sub) => {
          const pq = (sub.perQuestion || []).find((p) => p.questionId === q.id);
          return acc + (pq && pq.isCorrect ? 1 : 0);
        }, 0);
        const pct = attempts ? Math.round((correctCount / attempts) * 100) : 0;
        return { name: q.text.length > 24 ? q.text.slice(0, 24) + "…" : q.text, pct };
      })
    : [];

  const toughest = [...questionAccuracy].sort((a, b) => a.pct - b.pct)[0];

  return (
    <div className="dashboard-page">
      <div className="dashboard-sidebar">
        <div className="sidebar-title">Your Quizzes</div>
        <div className="sidebar-list">
          {myQuizzes.map((q) => (
            <button
              key={q.shareCode}
              className={`sidebar-item ${activeQuiz && activeQuiz.shareCode === q.shareCode ? "sidebar-item-active" : ""}`}
              onClick={() => onSelectQuiz(q.shareCode)}
            >
              {q.title}
              <span className="sidebar-item-code">{q.shareCode}</span>
            </button>
          ))}
        </div>
        <Button variant="secondary" full onClick={onCreateNew}>+ New Quiz</Button>
      </div>

      <div className="dashboard-main">
        {activeQuiz && (
          <>
            <div className="dashboard-header-row">
              <h2 className="step-title" style={{ marginBottom: 0 }}>{activeQuiz.title}</h2>
              <Button variant="ghost" onClick={onOpenLeaderboard}>View Leaderboard →</Button>
            </div>

            <div className="stat-grid">
              <GlassCard className="stat-card"><div className="stat-value">{activeQuiz.questions.length}</div><div className="stat-label">Questions</div></GlassCard>
              <GlassCard className="stat-card"><div className="stat-value">{activeSubmissions.length}</div><div className="stat-label">Participants</div></GlassCard>
              <GlassCard className="stat-card"><div className="stat-value">{avg}%</div><div className="stat-label">Average score</div></GlassCard>
              <GlassCard className="stat-card"><div className="stat-value">{scores.length ? `${high}% / ${low}%` : "—"}</div><div className="stat-label">Highest / lowest</div></GlassCard>
              <GlassCard className="stat-card"><div className="stat-value">{scores.length ? formatTime(avgTime) : "—"}</div><div className="stat-label">Avg. completion time</div></GlassCard>
            </div>

            {activeSubmissions.length > 0 ? (
              <>
                <GlassCard className="chart-card">
                  <div className="chart-title">Score distribution</div>
                  <ResponsiveContainer width="100%" height={220}>
                    <BarChart data={distBuckets}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.08)" />
                      <XAxis dataKey="name" stroke="rgba(255,255,255,0.5)" fontSize={12} />
                      <YAxis stroke="rgba(255,255,255,0.5)" fontSize={12} allowDecimals={false} />
                      <Tooltip contentStyle={{ background: "#1a1030", border: "1px solid rgba(255,255,255,0.15)", borderRadius: 8, color: "#fff" }} />
                      <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                        {distBuckets.map((_, i) => (
                          <Cell key={i} fill={["#ff5f8f", "#ffb84d", "#2dd6f0", "#a78bfa", "#ffd166"][i]} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </GlassCard>

                <GlassCard className="chart-card">
                  <div className="chart-title">Trickiest questions</div>
                  <ResponsiveContainer width="100%" height={Math.max(180, questionAccuracy.length * 40)}>
                    <BarChart data={questionAccuracy} layout="vertical" margin={{ left: 10 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.08)" />
                      <XAxis type="number" domain={[0, 100]} stroke="rgba(255,255,255,0.5)" fontSize={12} />
                      <YAxis type="category" dataKey="name" width={160} stroke="rgba(255,255,255,0.5)" fontSize={11} />
                      <Tooltip contentStyle={{ background: "#1a1030", border: "1px solid rgba(255,255,255,0.15)", borderRadius: 8, color: "#fff" }} formatter={(v) => `${v}% correct`} />
                      <Bar dataKey="pct" radius={[0, 6, 6, 0]} fill="#2dd6f0" />
                    </BarChart>
                  </ResponsiveContainer>
                  {toughest && (
                    <div className="chart-footnote">
                      "{toughest.name}" destroyed everyone 💀 — only {toughest.pct}% got it right.
                    </div>
                  )}
                </GlassCard>

                <GlassCard className="chart-card">
                  <div className="chart-title">Leaderboard</div>
                  <div className="lb-list">
                    {sorted.slice(0, 8).map((s, i) => (
                      <div key={s.id} className={`lb-row ${i < 3 ? "lb-row-top" : ""}`}>
                        <span className="lb-rank">{medal(i)}</span>
                        <span className="lb-name">{s.participantName}</span>
                        <span className="lb-score">{s.score}/{s.total}</span>
                        <span className="lb-pct">{s.percentage}%</span>
                        <span className="lb-time">{formatTime(s.completionTime)}</span>
                      </div>
                    ))}
                  </div>
                </GlassCard>
              </>
            ) : (
              <GlassCard className="chart-card">
                <EmptyState emoji="👀" title="No one has taken your quiz yet." sub="Send the link to your friends and let's expose them." />
              </GlassCard>
            )}
          </>
        )}
      </div>
    </div>
  );
}

/* =========================================================================
   TOP NAV
   ========================================================================= */

function TopNav({ onHome, onDashboard, theme, toggleTheme }) {
  return (
    <div className="top-nav">
      <button className="brand" onClick={onHome}>
        <span className="brand-dot" /> KnowMe
      </button>
      <div className="nav-actions">
        <button className="nav-link" onClick={onDashboard}>Dashboard</button>
        <button className="theme-toggle" onClick={toggleTheme} title="Toggle theme">
          {theme === "dark" ? "☀️" : "🌙"}
        </button>
      </div>
    </div>
  );
}

/* =========================================================================
   ROOT APP
   ========================================================================= */

export default function App() {
  const [view, setView] = useState("landing");
  const [theme, setTheme] = useState("dark");
  const [toasts, setToasts] = useState([]);

  const [joinCode, setJoinCode] = useState("");
  const [joinError, setJoinError] = useState("");

  const [activeQuiz, setActiveQuiz] = useState(null); // quiz currently published/being viewed by creator
  const [participantQuiz, setParticipantQuiz] = useState(null); // quiz being taken
  const [participantName, setParticipantName] = useState("");
  const [result, setResult] = useState(null);
  const [submissions, setSubmissions] = useState([]);

  const [myQuizzes, setMyQuizzes] = useState([]);
  const [dashQuiz, setDashQuiz] = useState(null);
  const [dashSubs, setDashSubs] = useState([]);

  const toast = useCallback((text) => {
    const id = uid();
    setToasts((t) => [...t, { id, text }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 2600);
  }, []);

  // handle deep link on load: #quiz=CODE
  useEffect(() => {
    const hash = window.location.hash || "";
    const m = hash.match(/quiz=([A-Za-z0-9]+)/);
    if (m) {
      setJoinCode(m[1].toUpperCase());
      loadQuizForJoin(m[1].toUpperCase());
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadQuizForJoin = async (code) => {
    setJoinError("");
    const quiz = await storageGet(`quiz:${code}`, true);
    if (!quiz) {
      setJoinError("Couldn't find a quiz with that code. Double-check and try again.");
      setView("join");
      return;
    }
    setParticipantQuiz(quiz);
    setView("quiz-intro");
  };

  const handleJoinSubmit = () => {
    if (!joinCode.trim()) return;
    loadQuizForJoin(joinCode.trim());
  };

  const handlePublished = (quiz) => {
    setActiveQuiz(quiz);
    setView("published");
  };

  const handleStartTaking = () => {
    setView("taking");
  };

  const handleFinishQuiz = async (answers, completionTime) => {
    const scored = scoreSubmission(participantQuiz, answers);
    const submission = {
      id: uid(),
      participantName: participantName.trim() || "Anonymous",
      score: scored.correct,
      total: scored.total,
      percentage: scored.percentage,
      perQuestion: scored.perQuestion,
      completionTime,
      createdAt: Date.now(),
    };
    const existing = (await storageGet(`submissions:${participantQuiz.shareCode}`, true)) || [];
    const next = [...existing, submission];
    await storageSet(`submissions:${participantQuiz.shareCode}`, next, true);
    setSubmissions(next);
    setResult(scored);
    setView("result");
  };

  const openLeaderboardFor = async (quiz) => {
    const subs = (await storageGet(`submissions:${quiz.shareCode}`, true)) || [];
    setSubmissions(subs);
    setParticipantQuiz(quiz);
    setView("leaderboard");
  };

  const goDashboard = async () => {
    const mine = (await storageGet("my-quizzes", false)) || [];
    setMyQuizzes(mine);
    if (mine.length > 0) {
      await selectDashQuiz(mine[0].shareCode);
    } else {
      setDashQuiz(null);
      setDashSubs([]);
    }
    setView("dashboard");
  };

  const selectDashQuiz = async (code) => {
    const quiz = await storageGet(`quiz:${code}`, true);
    const subs = (await storageGet(`submissions:${code}`, true)) || [];
    setDashQuiz(quiz);
    setDashSubs(subs);
  };

  const toggleTheme = () => setTheme((t) => (t === "dark" ? "light" : "dark"));

  const goHome = () => {
    window.location.hash = "";
    setView("landing");
  };

  return (
    <div className={`app-root theme-${theme}`}>
      <style>{CSS}</style>
      <ToastHost toasts={toasts} />
      <TopNav onHome={goHome} onDashboard={goDashboard} theme={theme} toggleTheme={toggleTheme} />

      <div className="app-body">
        {view === "landing" && (
          <Landing
            onCreate={() => setView("create")}
            onJoin={handleJoinSubmit}
            joinCode={joinCode}
            setJoinCode={setJoinCode}
          />
        )}

        {view === "create" && <CreateFlow onPublished={handlePublished} toast={toast} />}

        {view === "published" && activeQuiz && (
          <PublishedScreen
            quiz={activeQuiz}
            toast={toast}
            onLeaderboard={() => openLeaderboardFor(activeQuiz)}
            onDashboard={goDashboard}
            onEdit={() => setView("create")}
          />
        )}

        {view === "join" && (
          <JoinScreen code={joinCode} setCode={setJoinCode} onSubmit={handleJoinSubmit} error={joinError} />
        )}

        {view === "quiz-intro" && participantQuiz && (
          <QuizIntro
            quiz={participantQuiz}
            participantName={participantName}
            setParticipantName={setParticipantName}
            onStart={handleStartTaking}
          />
        )}

        {view === "taking" && participantQuiz && (
          <TakingQuiz quiz={participantQuiz} participantName={participantName} onFinish={handleFinishQuiz} />
        )}

        {view === "result" && result && participantQuiz && (
          <ResultScreen
            quiz={participantQuiz}
            result={result}
            toast={toast}
            onLeaderboard={() => openLeaderboardFor(participantQuiz)}
            onShare={() => toast("Result card ready to share ✨")}
          />
        )}

        {view === "leaderboard" && participantQuiz && (
          <Leaderboard
            quiz={participantQuiz}
            submissions={submissions}
            onTakeQuiz={() => setView("quiz-intro")}
          />
        )}

        {view === "dashboard" && (
          <Dashboard
            myQuizzes={myQuizzes}
            activeQuiz={dashQuiz}
            activeSubmissions={dashSubs}
            onSelectQuiz={selectDashQuiz}
            onCreateNew={() => setView("create")}
            onOpenLeaderboard={() => dashQuiz && openLeaderboardFor(dashQuiz)}
          />
        )}
      </div>
    </div>
  );
}

/* =========================================================================
   STYLES
   ========================================================================= */

const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Sora:wght@400;600;700;800&family=Inter:wght@400;500;600&display=swap');

.app-root {
  --bg-1: #0a0a1a;
  --bg-2: #1a0b2e;
  --bg-3: #150a2e;
  --glass: rgba(255,255,255,0.06);
  --glass-border: rgba(255,255,255,0.14);
  --text-1: #f5f3ff;
  --text-2: rgba(245,243,255,0.65);
  --cyan: #2dd6f0;
  --pink: #ff5f9e;
  --purple: #a78bfa;
  --gold: #ffd166;
  font-family: 'Inter', sans-serif;
  color: var(--text-1);
  min-height: 100vh;
  background: radial-gradient(circle at 15% 10%, #2a1250 0%, transparent 45%),
              radial-gradient(circle at 85% 15%, #0d2f42 0%, transparent 40%),
              radial-gradient(circle at 50% 90%, #3a0e3f 0%, transparent 50%),
              linear-gradient(180deg, var(--bg-1), var(--bg-2) 60%, var(--bg-3));
  position: relative;
  overflow-x: hidden;
}
.app-root.theme-light {
  --glass: rgba(20,10,40,0.04);
  --glass-border: rgba(20,10,40,0.10);
  --text-1: #1c1330;
  --text-2: rgba(28,19,48,0.65);
  background: radial-gradient(circle at 15% 10%, #ffe3f2 0%, transparent 45%),
              radial-gradient(circle at 85% 15%, #dff5ff 0%, transparent 40%),
              radial-gradient(circle at 50% 90%, #f2e6ff 0%, transparent 50%),
              linear-gradient(180deg, #fdfbff, #f6f0ff 60%, #f9f1ff);
}
* { box-sizing: border-box; }
h1, h2, .brand, .step-title, .result-score, .lb-rank { font-family: 'Sora', sans-serif; }
@media (prefers-reduced-motion: reduce) {
  * { animation-duration: 0.001ms !important; animation-iteration-count: 1 !important; transition-duration: 0.001ms !important; }
}

.top-nav {
  display: flex; align-items: center; justify-content: space-between;
  padding: 18px 28px; position: relative; z-index: 20;
}
.brand { background: none; border: none; color: var(--text-1); font-weight: 700; font-size: 18px; display: flex; align-items: center; gap: 8px; cursor: pointer; }
.brand-dot { width: 10px; height: 10px; border-radius: 50%; background: linear-gradient(135deg, var(--cyan), var(--pink)); display: inline-block; }
.nav-actions { display: flex; align-items: center; gap: 14px; }
.nav-link { background: none; border: none; color: var(--text-2); font-size: 14px; cursor: pointer; }
.nav-link:hover { color: var(--text-1); }
.theme-toggle { background: var(--glass); border: 1px solid var(--glass-border); border-radius: 10px; padding: 6px 10px; cursor: pointer; }

.app-body { position: relative; z-index: 5; min-height: calc(100vh - 70px); }

.glass-card {
  background: var(--glass);
  border: 1px solid var(--glass-border);
  border-radius: 20px;
  backdrop-filter: blur(18px);
  -webkit-backdrop-filter: blur(18px);
  padding: 24px;
  box-shadow: 0 8px 32px rgba(0,0,0,0.25);
}
.glass-card-glow { box-shadow: 0 8px 40px rgba(167,139,250,0.18), 0 0 0 1px rgba(255,255,255,0.04) inset; }

.btn {
  border-radius: 14px; padding: 13px 22px; font-size: 15px; font-weight: 600;
  border: none; cursor: pointer; transition: transform 0.15s ease, box-shadow 0.15s ease, opacity 0.15s;
  font-family: 'Inter', sans-serif;
}
.btn:active { transform: scale(0.97); }
.btn:disabled { opacity: 0.4; cursor: not-allowed; }
.btn-primary { background: linear-gradient(135deg, var(--pink), var(--purple)); color: white; box-shadow: 0 6px 24px rgba(255,95,158,0.35); }
.btn-primary:hover:not(:disabled) { box-shadow: 0 8px 30px rgba(255,95,158,0.5); }
.btn-secondary { background: rgba(45,214,240,0.14); color: var(--cyan); border: 1px solid rgba(45,214,240,0.35); }
.btn-secondary:hover:not(:disabled) { background: rgba(45,214,240,0.22); }
.btn-ghost { background: transparent; color: var(--text-2); border: 1px solid var(--glass-border); }
.btn-ghost:hover { color: var(--text-1); }
.btn-full { width: 100%; }

.icon-btn { background: var(--glass); border: 1px solid var(--glass-border); color: var(--text-2); border-radius: 8px; width: 30px; height: 30px; cursor: pointer; font-size: 13px; }
.icon-btn:hover { color: var(--text-1); }
.icon-btn-danger:hover { color: #ff6b6b; }

.text-input {
  width: 100%; background: rgba(255,255,255,0.05); border: 1px solid var(--glass-border);
  border-radius: 12px; padding: 12px 14px; color: var(--text-1); font-size: 15px; font-family: inherit;
  outline: none; margin-bottom: 12px; resize: none;
}
.text-input:focus { border-color: var(--purple); }
.big-input { font-size: 18px; padding: 16px; text-align: center; }

.page-center { display: flex; align-items: center; justify-content: center; padding: 40px 16px 80px; min-height: calc(100vh - 70px); }
.step-card { width: 100%; max-width: 560px; }
.step-eyebrow { color: var(--cyan); font-size: 13px; font-weight: 600; margin-bottom: 8px; }
.step-title { font-size: 26px; font-weight: 700; margin: 0 0 10px; line-height: 1.3; }
.step-sub { color: var(--text-2); margin-bottom: 20px; font-size: 15px; }

/* Landing */
.landing { position: relative; min-height: calc(100vh - 70px); overflow: hidden; }
.landing-inner { position: relative; z-index: 3; max-width: 760px; margin: 0 auto; padding: 60px 20px 80px; text-align: center; }
.eyebrow-free { color: var(--cyan); font-size: 13px; font-weight: 600; letter-spacing: 0.02em; margin-bottom: 18px; }
.hero-title { font-size: clamp(34px, 6vw, 58px); line-height: 1.12; font-weight: 800; margin: 0 0 20px; }
.text-gradient { background: linear-gradient(135deg, var(--pink), var(--cyan)); -webkit-background-clip: text; background-clip: text; color: transparent; }
.hero-sub { color: var(--text-2); font-size: 18px; max-width: 480px; margin: 0 auto 34px; }
.hero-ctas { display: flex; flex-direction: column; align-items: center; gap: 18px; }
.join-inline { display: flex; gap: 10px; width: 100%; max-width: 420px; }
.join-input { margin-bottom: 0; }
.hero-demo-row { margin-top: 56px; display: flex; justify-content: center; }
.mini-leaderboard-card { width: 280px; text-align: left; }
.mini-lb-title { font-weight: 700; margin-bottom: 12px; font-family: 'Sora', sans-serif; }
.mini-lb-row { display: flex; justify-content: space-between; padding: 6px 0; color: var(--text-2); font-size: 14px; }

.particle-layer { position: absolute; inset: 0; pointer-events: none; z-index: 1; }
.particle { position: absolute; border-radius: 50%; background: rgba(255,255,255,0.5); animation: floatUp linear infinite; }
@keyframes floatUp { 0% { transform: translateY(0) translateX(0); opacity: 0; } 10% { opacity: 0.8; } 90% { opacity: 0.4; } 100% { transform: translateY(-140px) translateX(20px); opacity: 0; } }

.floating-notifs { position: absolute; inset: 0; pointer-events: none; z-index: 2; }
.notif-chip {
  position: absolute; background: var(--glass); border: 1px solid var(--glass-border); backdrop-filter: blur(12px);
  padding: 10px 16px; border-radius: 999px; font-size: 13px; font-weight: 500; white-space: nowrap;
  animation: notifFloat 8s ease-in-out infinite; opacity: 0;
}
@keyframes notifFloat { 0% { opacity: 0; transform: translateY(10px); } 10% { opacity: 1; transform: translateY(0); } 80% { opacity: 1; } 100% { opacity: 0; transform: translateY(-10px); } }

/* Question builder */
.builder-page { max-width: 900px; margin: 0 auto; padding: 30px 20px 90px; }
.builder-header { display: flex; justify-content: space-between; align-items: flex-start; gap: 20px; margin-bottom: 28px; flex-wrap: wrap; }
.question-grid { display: flex; flex-direction: column; gap: 16px; }
.question-card-head { display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; }
.question-number { font-size: 12px; font-weight: 700; color: var(--purple); text-transform: uppercase; letter-spacing: 0.04em; }
.question-card-actions { display: flex; gap: 6px; }
.question-text-input { font-size: 16px; font-weight: 500; }
.type-toggle { display: flex; gap: 8px; margin-bottom: 14px; }
.type-pill { background: rgba(255,255,255,0.05); border: 1px solid var(--glass-border); color: var(--text-2); border-radius: 999px; padding: 6px 14px; font-size: 12px; cursor: pointer; }
.type-pill-active { background: rgba(167,139,250,0.25); border-color: var(--purple); color: var(--text-1); }
.option-list { display: flex; flex-direction: column; gap: 8px; margin-bottom: 10px; }
.option-row { display: flex; align-items: center; gap: 10px; }
.option-radio { width: 26px; height: 26px; min-width: 26px; border-radius: 50%; border: 2px solid var(--glass-border); background: transparent; color: white; cursor: pointer; font-size: 13px; display: flex; align-items: center; justify-content: center; }
.option-radio-active { background: linear-gradient(135deg, #43e97b, #38f9d7); border-color: transparent; color: #06281a; font-weight: 800; }
.option-text-input { margin-bottom: 0; }
.option-remove { background: none; border: none; color: var(--text-2); cursor: pointer; font-size: 14px; padding: 4px; }
.option-remove:hover { color: #ff6b6b; }
.add-option-btn { background: none; border: 1px dashed var(--glass-border); color: var(--text-2); border-radius: 10px; padding: 8px 12px; font-size: 13px; cursor: pointer; width: 100%; margin-top: 4px; }
.correct-hint { font-size: 11px; color: var(--text-2); margin-top: 8px; }
.builder-footer { display: flex; justify-content: space-between; margin-top: 30px; }

/* Modal */
.modal-backdrop { position: fixed; inset: 0; background: rgba(5,2,15,0.7); backdrop-filter: blur(4px); display: flex; align-items: center; justify-content: center; z-index: 100; padding: 20px; animation: fadeIn 0.2s ease; }
@keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
.modal-card { width: 100%; max-width: 520px; max-height: 85vh; overflow-y: auto; animation: modalPop 0.22s ease; }
@keyframes modalPop { from { opacity: 0; transform: scale(0.95) translateY(10px); } to { opacity: 1; transform: scale(1) translateY(0); } }
.modal-title { font-size: 20px; font-weight: 700; margin-bottom: 16px; font-family: 'Sora', sans-serif; }
.modal-actions { display: flex; justify-content: flex-end; gap: 10px; margin-top: 16px; }

/* Preview */
.preview-list { display: flex; flex-direction: column; gap: 14px; margin: 20px 0; max-height: 340px; overflow-y: auto; }
.preview-item { padding-bottom: 12px; border-bottom: 1px solid var(--glass-border); }
.preview-q { font-weight: 600; margin-bottom: 8px; }
.preview-opts { display: flex; flex-wrap: wrap; gap: 6px; }
.preview-opt-chip { background: rgba(255,255,255,0.06); border: 1px solid var(--glass-border); border-radius: 999px; padding: 4px 10px; font-size: 12px; color: var(--text-2); }

/* Published / share */
.celebrate-emoji { font-size: 44px; text-align: center; margin-bottom: 6px; }
.share-code-box { text-align: center; background: rgba(255,255,255,0.05); border: 1px solid var(--glass-border); border-radius: 16px; padding: 16px; margin: 18px 0; }
.share-code-label { font-size: 12px; color: var(--text-2); text-transform: uppercase; letter-spacing: 0.06em; margin-bottom: 6px; }
.share-code-value { font-size: 30px; font-weight: 800; letter-spacing: 0.06em; font-family: 'Sora', sans-serif; background: linear-gradient(135deg, var(--cyan), var(--pink)); -webkit-background-clip: text; background-clip: text; color: transparent; }
.share-link-row { display: flex; gap: 10px; align-items: flex-start; }
.share-link-row .text-input { font-size: 12px; }
.published-actions { display: flex; flex-direction: column; gap: 10px; margin-top: 16px; }
.form-error { color: #ff8a8a; font-size: 13px; margin-bottom: 12px; }

/* Taking quiz */
.quiz-take-wrap { width: 100%; max-width: 600px; }
.quiz-progress-row { display: flex; justify-content: space-between; font-size: 13px; color: var(--text-2); margin-bottom: 8px; }
.progress-track { height: 8px; border-radius: 999px; background: rgba(255,255,255,0.08); overflow: hidden; margin-bottom: 22px; }
.progress-fill { height: 100%; background: linear-gradient(90deg, var(--cyan), var(--pink)); border-radius: 999px; transition: width 0.5s ease; }
.quiz-question-card { animation: slideIn 0.35s ease; }
@keyframes slideIn { from { opacity: 0; transform: translateX(24px); } to { opacity: 1; transform: translateX(0); } }
.quiz-question-text { font-size: 22px; font-weight: 700; margin-bottom: 22px; font-family: 'Sora', sans-serif; }
.quiz-option-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
@media (max-width: 520px) { .quiz-option-grid { grid-template-columns: 1fr; } }
.quiz-option-btn {
  background: rgba(255,255,255,0.05); border: 1px solid var(--glass-border); color: var(--text-1);
  border-radius: 14px; padding: 18px 14px; font-size: 15px; font-weight: 500; cursor: pointer; text-align: left;
  transition: transform 0.12s ease, background 0.15s ease, border-color 0.15s ease;
}
.quiz-option-btn:hover:not(:disabled) { border-color: var(--purple); transform: translateY(-2px); }
.quiz-option-selected { background: linear-gradient(135deg, rgba(255,95,158,0.3), rgba(167,139,250,0.3)); border-color: var(--pink); transform: scale(1.02); }
.quiz-option-dim { opacity: 0.4; }
.quiz-take-footer { text-align: center; color: var(--text-2); margin-top: 18px; font-size: 13px; }

/* Result */
.result-card { text-align: center; }
.result-heading { font-size: 22px; font-weight: 700; font-family: 'Sora', sans-serif; }
.result-sub { color: var(--text-2); margin-bottom: 20px; font-size: 14px; }
.result-score { font-size: 54px; font-weight: 800; }
.result-pct { font-size: 18px; color: var(--cyan); font-weight: 700; margin-bottom: 14px; }
.result-message { font-size: 16px; margin-bottom: 22px; }
.result-share-card { background: linear-gradient(135deg, rgba(255,95,158,0.15), rgba(45,214,240,0.15)); border: 1px solid var(--glass-border); border-radius: 16px; padding: 20px; margin-bottom: 20px; }
.result-share-title { font-weight: 800; letter-spacing: 0.02em; margin-bottom: 8px; }
.result-share-score { font-size: 30px; font-weight: 800; }
.result-share-pct { color: var(--text-2); margin-bottom: 8px; }
.result-share-cta { font-size: 13px; color: var(--text-2); }

/* Confetti */
.confetti-layer { position: fixed; inset: 0; pointer-events: none; z-index: 200; overflow: hidden; }
.confetti-piece { position: absolute; top: -20px; border-radius: 2px; animation: confettiFall linear forwards; }
@keyframes confettiFall { to { transform: translateY(110vh) rotate(720deg); opacity: 0.2; } }

/* Leaderboard */
.leaderboard-card { max-width: 560px; }
.lb-list { display: flex; flex-direction: column; gap: 8px; margin: 18px 0; }
.lb-row { display: grid; grid-template-columns: 34px 1fr 56px 50px 60px; align-items: center; gap: 8px; padding: 12px 14px; border-radius: 12px; background: rgba(255,255,255,0.04); font-size: 14px; animation: lbIn 0.4s ease both; }
@keyframes lbIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
.lb-row-top { background: rgba(255,209,102,0.08); border: 1px solid rgba(255,209,102,0.25); }
.lb-rank { font-size: 16px; text-align: center; }
.lb-name { font-weight: 600; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.lb-score, .lb-pct, .lb-time { color: var(--text-2); text-align: right; font-size: 13px; }

/* Empty state */
.empty-state { text-align: center; padding: 20px 0; }
.empty-emoji { font-size: 40px; margin-bottom: 10px; }
.empty-title { font-weight: 700; margin-bottom: 6px; }
.empty-sub { color: var(--text-2); font-size: 14px; margin-bottom: 16px; }

/* Toasts */
.toast-host { position: fixed; top: 20px; left: 50%; transform: translateX(-50%); z-index: 300; display: flex; flex-direction: column; gap: 8px; align-items: center; }
.toast { background: rgba(20,10,35,0.9); border: 1px solid var(--glass-border); backdrop-filter: blur(10px); color: white; padding: 10px 18px; border-radius: 999px; font-size: 13px; animation: toastIn 0.25s ease; }
@keyframes toastIn { from { opacity: 0; transform: translateY(-10px); } to { opacity: 1; transform: translateY(0); } }

/* Dashboard */
.dashboard-page { display: flex; max-width: 1100px; margin: 0 auto; padding: 30px 20px 90px; gap: 24px; }
.dashboard-sidebar { width: 220px; min-width: 220px; display: flex; flex-direction: column; gap: 14px; }
.sidebar-title { font-size: 12px; text-transform: uppercase; letter-spacing: 0.06em; color: var(--text-2); }
.sidebar-list { display: flex; flex-direction: column; gap: 8px; }
.sidebar-item { text-align: left; background: var(--glass); border: 1px solid var(--glass-border); border-radius: 12px; padding: 10px 12px; color: var(--text-2); font-size: 13px; cursor: pointer; display: flex; flex-direction: column; gap: 4px; }
.sidebar-item-active { border-color: var(--purple); color: var(--text-1); }
.sidebar-item-code { font-size: 11px; opacity: 0.6; }
.dashboard-main { flex: 1; display: flex; flex-direction: column; gap: 18px; min-width: 0; }
.dashboard-header-row { display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 10px; }
.stat-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(140px, 1fr)); gap: 12px; }
.stat-card { text-align: center; padding: 18px 10px; }
.stat-value { font-size: 22px; font-weight: 800; font-family: 'Sora', sans-serif; }
.stat-label { font-size: 12px; color: var(--text-2); margin-top: 4px; }
.chart-card { }
.chart-title { font-weight: 700; margin-bottom: 10px; font-family: 'Sora', sans-serif; }
.chart-footnote { margin-top: 10px; font-size: 13px; color: var(--text-2); }

@media (max-width: 760px) {
  .dashboard-page { flex-direction: column; }
  .dashboard-sidebar { width: 100%; }
  .lb-row { grid-template-columns: 26px 1fr 46px 42px; }
  .lb-time { display: none; }
}
`;
