/* Crossroads — decision oracle prototype */
const { useState, useEffect, useRef, useCallback } = React;

const STAGE_W = 1672, STAGE_H = 941;
const CHAR_HOME = { x: 815, y: 790, h: 270 };

const ROADS = [
  { id: "left",   numeral: "I",   sign: { x: 505, y: 608, h: 215 }, end: { x: 468, y: 450, s: 0.13 } },
  { id: "middle", numeral: "II",  sign: { x: 882, y: 552, h: 175 }, end: { x: 888, y: 436, s: 0.10 } },
  { id: "right",  numeral: "III", sign: { x: 1198, y: 608, h: 215 }, end: { x: 1308, y: 452, s: 0.14 } },
];

const TONES = {
  Mystic: "an ancient, warm-voiced fortune teller who keeps a desert crossroads; poetic but always concrete and specific",
  Coach: "a thoughtful, grounded career coach; clear-eyed, practical, kind, no fluff",
  Witty: "a wry, playful trail guide; lightly humorous but genuinely insightful",
};

const FALLBACK_PATHS = [
  {
    label: "The Bold Leap",
    essence: "You go all in, and the ground moves.",
    reading: "You hand in the letter and the first month tastes like both freedom and free fall. Savings shrink faster than you planned; conviction grows faster than you expected. By winter you have shipped something imperfect that real people use, and one stranger writes to say it helped. The risk is real — the runway is short and the nights are long — but you stop wondering what you are capable of, because you are busy finding out.",
    watchword: "Courage",
  },
  {
    label: "The Steady Road",
    essence: "You stay, and you grow where you are planted.",
    reading: "You stay, and the relief surprises you. The salary keeps its promises, and you redirect the energy of the decision into the work in front of you. A bigger project lands on your desk; people start coming to you for answers. The danger on this road is quiet: comfort can become a ceiling, and the question you carried to this crossroads will knock again in a year. But stability is not failure — it is soil, and things grow in it.",
    watchword: "Patience",
  },
  {
    label: "The Twin Path",
    essence: "You keep the job and build by lantern light.",
    reading: "Days belong to the company; early mornings and weekends belong to the thing that is yours. Progress is slower than your ambition wants — months, not weeks — and tiredness becomes a familiar coat. But every small win is proof, not theory, and your paycheck buys you the right to be patient. One evening you look up and realize the side project has users, revenue, a pulse. The leap, when it comes, will be onto solid ground.",
    watchword: "Persistence",
  },
];

function buildPrompt(question, toneKey) {
  return `You are ${TONES[toneKey] || TONES.Mystic}. A traveler stands at a three-way crossroads and asks: "${question}"

Divine three distinct paths forward:
- Path 1: the bold leap — fully making the change.
- Path 2: the steady road — staying the current course.
- Path 3: the twin path — a middle road combining both.

Tailor every path concretely to the traveler's actual question. Respond with STRICT JSON only, no markdown, no commentary:
{"paths":[{"label":"2-4 word signpost name","essence":"one line, max 12 words","reading":"75-105 words, second person, vivid and concrete, include one real risk and one real hope","watchword":"one word"},...3 paths total]}`;
}

async function fetchPaths(question, toneKey) {
  const raw = await window.claude.complete(buildPrompt(question, toneKey));
  const json = raw.slice(raw.indexOf("{"), raw.lastIndexOf("}") + 1);
  const data = JSON.parse(json);
  if (!data.paths || data.paths.length !== 3) throw new Error("bad shape");
  return data.paths.map((p) => ({
    label: String(p.label || "The Unknown Road"),
    essence: String(p.essence || ""),
    reading: String(p.reading || ""),
    watchword: String(p.watchword || "Fate"),
  }));
}

/* ---------- Components ---------- */

function keyFramePixels(data, mode) {
  for (let i = 0; i < data.length; i += 4) {
    const r = data[i], g = data[i + 1], b = data[i + 2];
    if (mode === "black") {
      const lum = Math.max(r, g, b);
      if (lum <= 28) data[i + 3] = 0;
      else if (lum < 58) data[i + 3] = Math.min(data[i + 3], Math.floor((lum - 28) * 8));
    } else {
      const lum = (r + g + b) / 3;
      const sat = Math.max(r, g, b) - Math.min(r, g, b);
      if (lum > 168 && sat < 48) data[i + 3] = Math.min(data[i + 3], Math.max(0, Math.floor((212 - lum) * 7)));
    }
  }
}

function KeyedVideo({ src, playing, startAt = 0.5, rate = 1, keyMode, className }) {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);

  useEffect(() => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;
    let raf = 0;
    video.playbackRate = rate;

    const paint = () => {
      if (video.readyState >= 2) {
        const w = video.videoWidth;
        const h = video.videoHeight;
        if (canvas.width !== w || canvas.height !== h) {
          canvas.width = w;
          canvas.height = h;
        }
        const ctx = canvas.getContext("2d");
        ctx.drawImage(video, 0, 0, w, h);
        const frame = ctx.getImageData(0, 0, w, h);
        keyFramePixels(frame.data, keyMode);
        ctx.putImageData(frame, 0, 0);
      }
      raf = requestAnimationFrame(paint);
    };

    const boot = () => {
      video.currentTime = startAt;
      if (playing) video.play().catch(() => {});
      else video.pause();
      paint();
    };

    if (video.readyState >= 2) boot();
    else video.addEventListener("loadeddata", boot, { once: true });

    return () => {
      cancelAnimationFrame(raf);
      video.removeEventListener("loadeddata", boot);
    };
  }, [src, playing, startAt, rate, keyMode]);

  return (
    <>
      <video ref={videoRef} src={src} loop muted playsInline preload="auto" style={{ display: "none" }} />
      <canvas ref={canvasRef} className={className} draggable="false" />
    </>
  );
}

function Character({ x, y, h, mode, charRef }) {
  const playing = mode === "pacing" || mode === "walking";
  const rate = mode === "walking" ? 1.35 : 1;
  return (
    <div
      ref={charRef}
      className={"char-wrap no-click"}
      style={{ left: x, top: y, height: h, zIndex: 5 }}
      data-comment-anchor="character"
    >
      <div className={mode === "pacing" ? "char-pace" : ""} style={{ height: "100%" }}>
        <div className="char-video-shell">
          <KeyedVideo
            src="assets/character-back-animation.mp4"
            playing={playing}
            startAt={0.5}
            rate={rate}
            keyMode="black"
            className="char-video"
          />
          {mode === "pacing" && <div className="qmark">?</div>}
          {mode === "pacing" && <div className="qmark q2">?</div>}
        </div>
      </div>
    </div>
  );
}

function Signboard({ road, path, index, onClick }) {
  const fontSize = road.sign.h * 0.082;
  return (
    <div
      className="sign"
      style={{ left: road.sign.x, top: road.sign.y, height: road.sign.h, zIndex: 4, animationDelay: index * 0.16 + "s" }}
      onClick={onClick}
      title="Read this possibility"
      data-comment-anchor={"sign-" + road.id}
    >
      <div className="sign-inner">
        <img className="sign-img" src="assets/signboard-final.png" alt="" draggable="false" />
        <div className="sign-label" style={{ fontSize }}>{path ? path.label : "…"}</div>
      </div>
    </div>
  );
}

function FaceVideo() {
  return (
    <KeyedVideo
      src="assets/character-face-animation.mp4"
      playing={true}
      startAt={0.25}
      rate={1}
      keyMode="cream"
      className="char-zoom char-video"
    />
  );
}

function AskPanel({ question, setQuestion, onSubmit, onClose }) {
  const ref = useRef(null);
  useEffect(() => { if (ref.current) ref.current.focus(); }, []);
  const canAsk = question.trim().length > 3;
  return (
    <div className="panel-backdrop" data-screen-label="Ask question panel">
      <div className="call-card">
        <div className="call-header">
          <div className="live-dot"></div>
          <span>LIVE · THE CROSSROADS</span>
          <div className="spacer"></div>
          <button className="call-close" onClick={onClose} title="Close">✕</button>
        </div>
        <div className="call-frame">
          <FaceVideo />
          <div className="call-caption">The Wanderer — awaiting your question</div>
        </div>
        <div className="call-body">
          <p className="call-prompt">What decision weighs on you, traveler?</p>
          <textarea
            ref={ref}
            className="call-input"
            placeholder="Should I quit my job and become a founder?"
            value={question}
            maxLength={300}
            onChange={(e) => setQuestion(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey && canAsk) { e.preventDefault(); onSubmit(); } }}
          ></textarea>
          <div className="call-actions">
            <button className="btn btn-primary" disabled={!canAsk} onClick={onSubmit}>Show me my paths</button>
            <button className="btn btn-ghost" onClick={onClose}>Not yet</button>
          </div>
        </div>
      </div>
    </div>
  );
}

function ReadingCard({ paths, index, setIndex, onClose, onChoose }) {
  const path = paths[index];
  const road = ROADS[index];
  return (
    <div className="card-backdrop" data-screen-label="Reading card">
      <div className="reading-card">
        <div className="reading-card-inner" key={index}>
          <div className="card-numeral">✶ {road.numeral} ✶</div>
          <h2 className="card-title">{path.label}</h2>
          <p className="card-essence">{path.essence}</p>
          <div className="card-rule">❖</div>
          <p className="card-reading">{path.reading}</p>
          <div className="card-watchword"><span>{path.watchword}</span></div>
          <div className="card-footer">
            <div className="card-nav">
              <button className="nav-arrow" disabled={index === 0} onClick={() => setIndex(index - 1)} title="Previous path">‹</button>
              <button className="nav-arrow" disabled={index === paths.length - 1} onClick={() => setIndex(index + 1)} title="Next path">›</button>
            </div>
            <div className="flex"></div>
            <button className="btn btn-ghost" onClick={onClose}>Close</button>
            <button className="btn btn-primary" onClick={() => onChoose(index)}>Walk this path</button>
          </div>
        </div>
      </div>
    </div>
  );
}

function Epilogue({ chosenPath, onAskAnother }) {
  const [nps, setNps] = useState(null);
  const pick = (n) => {
    setNps(n);
    try {
      const arr = JSON.parse(localStorage.getItem("crossroads_nps") || "[]");
      arr.push({ score: n, ts: Date.now() });
      localStorage.setItem("crossroads_nps", JSON.stringify(arr));
    } catch (e) {}
  };
  return (
    <div className="epilogue" data-screen-label="Epilogue and NPS">
      <div className="epi-card">
        <div className="epi-eyebrow">The choice is made</div>
        <h1 className="epi-title">The wanderer walks “{chosenPath.label}”</h1>
        <p className="epi-sub">Watchword: {chosenPath.watchword}. May the road rise to meet you.</p>
        <div className="epi-actions">
          <button className="btn btn-primary btn-big" onClick={onAskAnother}>Ask another question</button>
        </div>
        {nps === null ? (
          <div>
            <div className="nps-q">How likely are you to send a fellow traveler to this crossroads?</div>
            <div className="nps-row">
              {Array.from({ length: 11 }, (_, n) => (
                <button key={n} className="nps-chip" onClick={() => pick(n)}>{n}</button>
              ))}
            </div>
            <div className="nps-scale-hints"><span>Never</span><span>Without hesitation</span></div>
          </div>
        ) : (
          <div className="nps-thanks">Thank you, traveler. Your word travels far.</div>
        )}
      </div>
    </div>
  );
}

/* ---------- App ---------- */

const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "tone": "Mystic",
  "useAI": true,
  "walkSeconds": 4.5,
  "warmth": 22
}/*EDITMODE-END*/;

function App() {
  const [t, setTweak] = useTweaks(TWEAK_DEFAULTS);
  const [scene, setScene] = useState("idle"); // idle | ask | consulting | paths | walking | epilogue
  const [question, setQuestion] = useState("");
  const [paths, setPaths] = useState(null);
  const [openCard, setOpenCard] = useState(null); // index | null
  const [chosen, setChosen] = useState(null);
  const [scale, setScale] = useState(1);
  const [charKey, setCharKey] = useState(0);
  const charRef = useRef(null);

  useEffect(() => {
    const fit = () => setScale(Math.max(window.innerWidth / STAGE_W, window.innerHeight / STAGE_H));
    fit();
    window.addEventListener("resize", fit);
    return () => window.removeEventListener("resize", fit);
  }, []);

  const consult = useCallback(async () => {
    setScene("consulting");
    setOpenCard(null);
    const started = Date.now();
    let result = FALLBACK_PATHS;
    if (t.useAI && window.claude && window.claude.complete) {
      try { result = await fetchPaths(question.trim(), t.tone); }
      catch (e) { console.warn("AI reading failed, using fallback:", e); }
    }
    // keep a little drama even when instant
    const minWait = 2200 - (Date.now() - started);
    if (minWait > 0) await new Promise((r) => setTimeout(r, minWait));
    setPaths(result);
    setScene("paths");
  }, [question, t.useAI, t.tone]);

  const choosePath = useCallback((index) => {
    setChosen(index);
    setOpenCard(null);
    setScene("walking");
    const road = ROADS[index];
    const el = charRef.current;
    if (!el) { setScene("epilogue"); return; }
    const dur = (t.walkSeconds || 4.5) * 1000;
    let advanced = false;
    const advance = () => {
      if (advanced) return;
      advanced = true;
      setTimeout(() => setScene("epilogue"), 700);
    };
    const anim = el.animate(
      [
        { left: CHAR_HOME.x + "px", top: CHAR_HOME.y + "px", transform: "translate(-50%, -100%) scale(1)" },
        { left: "815px", top: "718px", transform: "translate(-50%, -100%) scale(0.92)", offset: 0.22 },
        { left: road.end.x + "px", top: road.end.y + "px", transform: `translate(-50%, -100%) scale(${road.end.s})` },
      ],
      { duration: dur, easing: "ease-in-out", fill: "forwards" }
    );
    anim.onfinish = advance;
    if (anim.finished && anim.finished.then) anim.finished.then(advance).catch(() => {});
    setTimeout(advance, dur + 350);
  }, [t.walkSeconds]);

  const reset = useCallback(() => {
    setQuestion("");
    setPaths(null);
    setChosen(null);
    setOpenCard(null);
    setCharKey((k) => k + 1);
    setScene("ask");
  }, []);

  const charMode = scene === "idle" ? "pacing" : scene === "walking" ? "walking" : "still";
  const warmthOpacity = Math.max(0, Math.min(1, (t.warmth || 0) / 100));

  return (
    <div className="stage-viewport">
      <div className="stage" style={{ transform: `translate(-50%, -50%) scale(${scale})` }} data-screen-label={"Scene: " + scene}>
        <div className="stage-bg"></div>
        <div className="warmth-overlay" style={{ opacity: warmthOpacity }}></div>

        <div className="wordmark">CROSSROADS<span className="dot"> ✦</span></div>

        {/* Signboards */}
        {(scene === "paths" || scene === "walking") && paths && ROADS.map((road, i) => {
          if (scene === "walking" && chosen !== i) return null;
          return (
            <Signboard
              key={road.id}
              road={road}
              path={paths[i]}
              index={i}
              onClick={scene === "paths" ? () => setOpenCard(i) : undefined}
            />
          );
        })}

        {/* Character on the stage (hidden visually behind panel during ask) */}
        <Character
          key={charKey}
          charRef={charRef}
          x={CHAR_HOME.x}
          y={CHAR_HOME.y}
          h={CHAR_HOME.h}
          mode={charMode}
        />

        {/* Click catcher for idle character */}
        {scene === "idle" && (
          <div
            style={{ position: "absolute", left: CHAR_HOME.x - 130, top: CHAR_HOME.y - CHAR_HOME.h - 70, width: 260, height: CHAR_HOME.h + 90, cursor: "pointer", zIndex: 6 }}
            onClick={() => setScene("ask")}
            title="Help the wanderer decide"
          ></div>
        )}

        {scene === "idle" && (
          <div className="hint">The wanderer is lost between three roads. Click him to help him decide.</div>
        )}

        {scene === "paths" && openCard === null && (
          <div className="hint">Three possibilities stand before you. Click a signboard to read one.</div>
        )}

        {scene === "ask" && (
          <AskPanel
            question={question}
            setQuestion={setQuestion}
            onSubmit={consult}
            onClose={() => setScene("idle")}
          />
        )}

        {scene === "consulting" && (
          <div className="consult-toast" data-screen-label="Consulting">
            The crossroads is listening<span className="dots"><span>.</span><span>.</span><span>.</span></span>
          </div>
        )}

        {scene === "paths" && openCard !== null && paths && (
          <ReadingCard
            paths={paths}
            index={openCard}
            setIndex={setOpenCard}
            onClose={() => setOpenCard(null)}
            onChoose={choosePath}
          />
        )}

        {scene === "epilogue" && paths && chosen !== null && (
          <Epilogue chosenPath={paths[chosen]} onAskAnother={reset} />
        )}
      </div>

      <TweaksPanel>
        <TweakSection label="Reading" />
        <TweakRadio label="Tone" value={t.tone} options={["Mystic", "Coach", "Witty"]} onChange={(v) => setTweak("tone", v)} />
        <TweakToggle label="AI readings" value={t.useAI} onChange={(v) => setTweak("useAI", v)} />
        <TweakSection label="Scene" />
        <TweakSlider label="Walk time" value={t.walkSeconds} min={2} max={8} step={0.5} unit="s" onChange={(v) => setTweak("walkSeconds", v)} />
        <TweakSlider label="Warmth" value={t.warmth} min={0} max={60} step={1} unit="%" onChange={(v) => setTweak("warmth", v)} />
      </TweaksPanel>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(<App />);
