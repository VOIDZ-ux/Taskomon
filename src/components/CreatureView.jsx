import { useState, useEffect, useRef, useCallback } from "react";

const CELL = 6;

const EggSprite = () => (
  <img src="/EggSprite.png" alt="egg"
    style={{ width: "96px", height: "96px", imageRendering: "pixelated" }} />
);

const PetBase = () => (
  <img src="/PetBase.png" alt="pet"
    style={{ width: "96px", height: "96px", imageRendering: "pixelated" }} />
);

const PetSleep = () => (
  <img src="/PetSleep.png" alt="sleeping pet"
    style={{ width: "96px", height: "96px", imageRendering: "pixelated" }} />
);

const PetHappy = () => (
  <img src="/PetHappy.png" alt="happy pet"
    style={{ width: "96px", height: "96px", imageRendering: "pixelated" }} />
);

const PetIll = () => (
  <img src="/PetIll.png" alt="ill pet"
    style={{ position: "relative", width: "96px", height: "96px", imageRendering: "pixelated", zIndex: 1 }} />
);

const PetGold = () => (
  <img src="/PetGold.png" alt="golden pet"
    style={{ width: "96px", height: "96px", imageRendering: "pixelated" }} />
);

const PetGoldHappy = () => (
  <img src="/PetGoldHappy.png" alt="happy golden pet"
    style={{ width: "96px", height: "96px", imageRendering: "pixelated" }} />
);

const PetGoldSleep = () => (
  <img src="/PetGoldSleep.png" alt="sleeping golden pet"
    style={{ width: "96px", height: "96px", imageRendering: "pixelated" }} />
);

const SPARKLE_DOTS = [
  { top: 38, left: -8, dur: "2.1s", del: "0.0s" },
  { top: 20, left: 14, dur: "5.3s", del: "0.7s" },
  { top: 13, left: 44, dur: "3.7s", del: "3.1s" },
  { top: 20, left: 74, dur: "4.8s", del: "1.9s" },
  { top: 38, left: 96, dur: "2.9s", del: "4.4s" },
];

const GoldenSparkles = () => (
  <>
    {SPARKLE_DOTS.map((s, i) => (
      <div
        key={i}
        className="golden-sparkle-dot"
        style={{ top: s.top, left: s.left, "--sp-dur": s.dur, "--sp-del": s.del }}
      />
    ))}
  </>
);

// Crack overlay — sprite-based, one image per stage (1–3)
const CRACK_SRCS = [null, "/EggCrack1.png", "/EggCrack2.png", "/EggCrack3.png"];

const CrackOverlay = ({ stage }) => {
  const src = CRACK_SRCS[stage];
  if (!src) return null;
  return (
    <img
      src={src}
      alt=""
      style={{
        position: "absolute",
        inset: 0,
        width: "96px",
        height: "96px",
        imageRendering: "pixelated",
        pointerEvents: "none",
      }}
    />
  );
};

const GIF_DURATION = 2400;       // 12 frames × 200ms — must match egg-wiggle CSS duration
const SLEEP_GIF_DURATION = 2400; // 12 frames × 200ms

// animState: "idle" | "wiggle" | "tap-vibrate" | "hatch-shake" | "hatch-fade"
export default function CreatureView({ creatureState, wiggleTrigger, hatchTrigger, happyTrigger, hatchProgress = 0, onHatched, onHappyEnd }) {
  const [animState, setAnimState] = useState("idle");
  const [animKey, setAnimKey] = useState(0);
  const [showSparkle, setShowSparkle] = useState(false);
  const [sparkleKey, setSparkleKey] = useState(0);
  const [showSleep, setShowSleep] = useState(false);
  const [sleepKey, setSleepKey] = useState(0);
  const [happyOverlayGif, setHappyOverlayGif] = useState(null); // src string | null
  const [happyOverlayKey, setHappyOverlayKey] = useState(0);
  const [showIllAnim, setShowIllAnim] = useState(false);
  const [illAnimKey, setIllAnimKey] = useState(0);

  const animStateRef = useRef("idle");
  const tapPendingRef = useRef([]);
  const wiggleCountRef = useRef(0);
  const sleepCountRef = useRef(0);
  const happyCountRef = useRef(0);
  const animatingRef = useRef(false);
  const hatchingRef = useRef(false);
  const startWiggleRef = useRef(null);
  const startSleepRef = useRef(null);
  const startHappyRef = useRef(null);
  const startIllRef = useRef(null);
  const onHappyEndRef = useRef(onHappyEnd);
  const sparkleTimerRef = useRef(null);
  const hatchTimerRef = useRef(null);
  const sleepTimerRef = useRef(null);
  const happyTimerRef = useRef(null);
  const illTimerRef = useRef(null);
  const illCountRef = useRef(0);

  onHappyEndRef.current = onHappyEnd;

  const setAnim = useCallback((s, incrementKey = true) => {
    animStateRef.current = s;
    setAnimState(s);
    if (incrementKey) setAnimKey(k => k + 1);
  }, []);

  const doTapVibrate = useCallback(() => {
    animatingRef.current = true;
    setAnim("tap-vibrate");
  }, [setAnim]);

  // Called when a tap-vibrate CSS animationEnd fires, or when wiggles exhaust and taps remain
  const playNextTap = useCallback(() => {
    if (tapPendingRef.current.length > 0) {
      tapPendingRef.current.shift();
      setAnim("idle", false);
      requestAnimationFrame(() => requestAnimationFrame(doTapVibrate));
    } else if (wiggleCountRef.current > 0) {
      setAnim("idle", false);
      requestAnimationFrame(() => requestAnimationFrame(() => startWiggleRef.current?.()));
    } else {
      animatingRef.current = false;
      setAnim("idle", false);
    }
  }, [setAnim, doTapVibrate]);

  // Mounts Sparkle.gif and plays one wiggle cycle; used by both "egg" and "hatched" states
  const startWiggleAndSparkle = useCallback(() => {
    setSparkleKey(k => k + 1);
    setShowSparkle(true);
    setAnim("wiggle");

    clearTimeout(sparkleTimerRef.current);
    sparkleTimerRef.current = setTimeout(() => {
      setShowSparkle(false);
      wiggleCountRef.current--;
      if (wiggleCountRef.current > 0) {
        requestAnimationFrame(() => requestAnimationFrame(() => startWiggleRef.current?.()));
      } else {
        playNextTap();
      }
    }, GIF_DURATION);
  }, [setAnim, playNextTap]);

  startWiggleRef.current = startWiggleAndSparkle;

  // Mounts SleepAnimation.gif once; used exclusively by "sleepy" state
  const startSleepAnim = useCallback(() => {
    setSleepKey(k => k + 1);
    setShowSleep(true);

    clearTimeout(sleepTimerRef.current);
    sleepTimerRef.current = setTimeout(() => {
      setShowSleep(false);
      sleepCountRef.current--;
      if (sleepCountRef.current > 0) {
        requestAnimationFrame(() => requestAnimationFrame(() => startSleepRef.current?.()));
      }
    }, SLEEP_GIF_DURATION);
  }, []);

  startSleepRef.current = startSleepAnim;

  // Mounts IllAnimation.gif once per queued ill animation; used exclusively by "ill" state
  const startIllAnim = useCallback(() => {
    setIllAnimKey(k => k + 1);
    setShowIllAnim(true);

    clearTimeout(illTimerRef.current);
    illTimerRef.current = setTimeout(() => {
      setShowIllAnim(false);
      illCountRef.current--;
      if (illCountRef.current > 0) {
        requestAnimationFrame(() => requestAnimationFrame(() => startIllRef.current?.()));
      }
    }, 2400);
  }, []);

  startIllRef.current = startIllAnim;

  // Mounts a random GIF overlay (Sparkle, Wash, or Ball) once per queued happy animation
  const startHappyAnim = useCallback(() => {
    const options = [
      { src: '/Sparkle.gif',       duration: 2400 },
      { src: '/WashAnimation.gif', duration: 2400 },
      { src: '/BallAnimation.gif', duration: 3300 },
      { src: '/PetEat.gif',        duration: 2800 },
    ];
    const pick = options[Math.floor(Math.random() * options.length)];
    setHappyOverlayGif(pick.src);
    setHappyOverlayKey(k => k + 1);

    clearTimeout(happyTimerRef.current);
    happyTimerRef.current = setTimeout(() => {
      setHappyOverlayGif(null);
      happyCountRef.current--;
      if (happyCountRef.current > 0) {
        requestAnimationFrame(() => requestAnimationFrame(() => startHappyRef.current?.()));
      } else {
        onHappyEndRef.current?.();
      }
    }, pick.duration);
  }, []); // stable — reads via refs

  startHappyRef.current = startHappyAnim;

  const triggerSleepAnim = useCallback(() => {
    sleepCountRef.current++;
    if (sleepCountRef.current === 1) startSleepAnim();
    // if > 1: running timeout will decrement and restart
  }, [startSleepAnim]);

  const triggerIllAnim = useCallback(() => {
    illCountRef.current++;
    if (illCountRef.current === 1) startIllAnim();
  }, [startIllAnim]);

  const handleAnimEnd = useCallback(() => {
    const cur = animStateRef.current;
    // "wiggle" animationEnd is intentionally ignored — the setTimeout drives it
    if (cur === "tap-vibrate") {
      playNextTap();
    } else if (cur === "hatch-shake") {
      clearTimeout(hatchTimerRef.current);
      hatchTimerRef.current = setTimeout(() => {
        animStateRef.current = "hatch-fade";
        setAnimState("hatch-fade");
        setAnimKey(k => k + 1);
      }, 500);
    } else if (cur === "hatch-fade") {
      animStateRef.current = "idle";
      setAnimState("idle");
      onHatched();
    }
  }, [playNextTap, onHatched]);

  // Happy trigger — queues one random-overlay animation per completion (hatched pet only)
  useEffect(() => {
    if (happyTrigger === 0) return;
    happyCountRef.current++;
    if (happyCountRef.current === 1) startHappyAnim();
  }, [happyTrigger, startHappyAnim]);

  // Wiggle trigger — egg only (sparkle + egg-wiggle CSS animation)
  useEffect(() => {
    if (wiggleTrigger === 0) return;
    if (creatureState !== "egg") return;
    if (hatchingRef.current) return;
    wiggleCountRef.current++;
    if (!animatingRef.current) {
      animatingRef.current = true;
      startWiggleAndSparkle();
    }
  }, [wiggleTrigger, creatureState, startWiggleAndSparkle]);

  // Hatch trigger — egg only
  useEffect(() => {
    if (hatchTrigger === 0 || creatureState !== "egg" || hatchingRef.current) return;
    hatchingRef.current = true;
    animatingRef.current = false;
    tapPendingRef.current = [];
    wiggleCountRef.current = 0;
    clearTimeout(sparkleTimerRef.current);
    setShowSparkle(false);
    setAnim("hatch-shake");
  }, [hatchTrigger, creatureState, setAnim]);

  // Autonomous sleep animation: every 60 s while sleepy or golden-sleepy, 75% chance
  useEffect(() => {
    if (creatureState !== "sleepy" && creatureState !== "golden-sleepy") return;
    const id = setInterval(() => {
      if (Math.random() < 0.75) triggerSleepAnim();
    }, 60 * 1000);
    return () => clearInterval(id);
  }, [creatureState, triggerSleepAnim]);

  // Autonomous ill animation: every 30 s while ill, 33% chance
  useEffect(() => {
    if (creatureState !== "ill") return;
    const id = setInterval(() => {
      if (Math.random() < 0.333) triggerIllAnim();
    }, 30 * 1000);
    return () => clearInterval(id);
  }, [creatureState, triggerIllAnim]);

  // Unified tap handler — behaviour differs by state
  const handleTap = useCallback(() => {
    if (creatureState === "egg") {
      if (hatchingRef.current) return;
      if (animatingRef.current) tapPendingRef.current.push("tap-vibrate");
      else doTapVibrate();
    } else if (creatureState === "hatched" || creatureState === "golden") {
      if (animatingRef.current) tapPendingRef.current.push("tap-vibrate");
      else doTapVibrate();
    } else if (creatureState === "sleepy" || creatureState === "golden-sleepy") {
      triggerSleepAnim();
    } else if (creatureState === "ill") {
      triggerIllAnim();
      if (animatingRef.current) tapPendingRef.current.push("tap-vibrate");
      else doTapVibrate();
    }
  }, [creatureState, doTapVibrate, triggerSleepAnim, triggerIllAnim]);

  // Cleanup timers on unmount
  useEffect(() => () => {
    clearTimeout(sparkleTimerRef.current);
    clearTimeout(hatchTimerRef.current);
    clearTimeout(sleepTimerRef.current);
    clearTimeout(happyTimerRef.current);
    clearTimeout(illTimerRef.current);
  }, []);

  const crackStage = hatchProgress < 0.25 ? 0 : hatchProgress < 0.5 ? 1 : hatchProgress < 0.75 ? 2 : 3;

  const idleClass = (creatureState === "sleepy" || creatureState === "golden-sleepy") ? "sleep-idle" : "egg-idle";
  const animClass = {
    idle: idleClass,
    wiggle: "egg-wiggle",
    "tap-vibrate": "egg-tap-vibrate",
    "hatch-shake": "egg-hatch-shake",
    "hatch-fade": "egg-fade-out",
  }[animState] ?? idleClass;

  const sprite =
    creatureState === "egg" ? <EggSprite /> :
    creatureState === "happy" ? <PetHappy /> :
    creatureState === "golden-happy" ? <PetGoldHappy /> :
    creatureState === "hatched" ? <PetBase /> :
    creatureState === "ill" ? <PetIll /> :
    creatureState === "golden" ? <PetGold /> :
    creatureState === "golden-sleepy" ? <PetGoldSleep /> :
    <PetSleep />;

  const overlayStyle = {
    position: "absolute", top: 0, left: 0,
    width: "100%", height: "100%",
    imageRendering: "pixelated",
    pointerEvents: "none",
  };


  return (
    <div className="creature-wrap">
      <div className="creature">
        <div
          key={animKey}
          className={`egg-anim-wrap ${animClass}`}
          style={{ cursor: "pointer" }}
          onAnimationEnd={handleAnimEnd}
          onClick={handleTap}
        >
          {showIllAnim && creatureState === "ill" && (
            <img
              key={illAnimKey}
              src={`/IllAnimation.gif?t=${illAnimKey}`}
              alt=""
              style={{
                position: "absolute", top: 0, left: 0,
                width: "100%", height: "100%",
                imageRendering: "pixelated",
                pointerEvents: "none",
                zIndex: 0,
              }}
            />
          )}
          {(creatureState === "golden" || creatureState === "golden-happy" || creatureState === "golden-sleepy") && (
            <GoldenSparkles />
          )}
          {sprite}
          {creatureState === "egg" && <CrackOverlay stage={crackStage} />}
          {showSparkle && creatureState === "egg" && (
            <img key={sparkleKey} src={`/Sparkle.gif?t=${sparkleKey}`} alt="" style={overlayStyle} />
          )}
          {happyOverlayGif && (creatureState === "happy" || creatureState === "golden-happy") && (
            <img
              key={happyOverlayKey}
              src={`${happyOverlayGif}?t=${happyOverlayKey}`}
              alt=""
              style={overlayStyle}
            />
          )}
          {showSleep && (creatureState === "sleepy" || creatureState === "golden-sleepy") && (
            <img key={sleepKey} src={`/SleepAnimation.gif?t=${sleepKey}`} alt="" style={overlayStyle} />
          )}
        </div>
      </div>
    </div>
  );
}
