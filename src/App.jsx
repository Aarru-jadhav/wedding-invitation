import { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Lenis from "lenis";

/*
 * Frame sequence (instead of <video>)
 * Phone par aadhe frames (STEP = 2), computer par saare.
 */
const IS_MOBILE = window.matchMedia("(max-width: 768px)").matches;
const IS_TOUCH = window.matchMedia("(pointer: coarse)").matches;
const STEP = IS_MOBILE ? 2 : 1;

const frameUrls = Object.entries(
  import.meta.glob("./assets/frames/*.webp", {
    eager: true,
    query: "?url",
    import: "default",
  })
)
  .sort(([a], [b]) => a.localeCompare(b))
  .map(([, url]) => url)
  .filter((_, i) => i % STEP === 0);

const FRAME_COUNT = frameUrls.length;

/* pehle har 4th frame, phir 2nd, phir baaki */
const loadOrder = Array.from({ length: FRAME_COUNT }, (_, i) => i).sort(
  (a, b) => {
    const pri = (i) => (i % 4 === 0 ? 0 : i % 2 === 0 ? 1 : 2);
    return pri(a) - pri(b) || a - b;
  }
);

gsap.registerPlugin(ScrollTrigger);
ScrollTrigger.config({ ignoreMobileResize: true });

/* =====================================================
   SCENES
===================================================== */

const scenes = [
  {
    start: 0.0,
    end: 0.18,
    eyebrow: "THE WEDDING OF",
    title: "Gautam",
    subtitle: "& Divya",
  },
  {
    start: 0.18,
    end: 0.35,
    eyebrow: "A BEAUTIFUL BEGINNING",
    title: "Two Hearts",
    subtitle: "One Beautiful Journey",
  },
  {
    start: 0.35,
    end: 0.52,
    eyebrow: "SAVE THE DATE",
    title: "19 July 2026",
    subtitle: "",
  },
  {
    start: 0.52,
    end: 0.72,
    eyebrow: "THE CELEBRATION",
    title: "Boho Farms",
    subtitle: "& Retreat · Indore",
  },
  {
    start: 0.72,
    end: 0.88,
    eyebrow: "CELEBRATION AWAITS",
    title: "Join Us",
    subtitle: "For a celebration of love",
  },
  {
    start: 0.88,
    end: 1.0,
    eyebrow: "",
    title: "",
    subtitle: "",
  },
];

/* =====================================================
   APP
===================================================== */

function App() {
  const sectionRef = useRef(null);
  const canvasRef = useRef(null);
  const framesRef = useRef(new Array(FRAME_COUNT).fill(null));
  const textRef = useRef(null);
  const lenisRef = useRef(null);

  const [entered, setEntered] = useState(false);
  const [progress, setProgress] = useState(0);
  const [sceneIndex, setSceneIndex] = useState(0);

  const currentScene = scenes[sceneIndex];

  /* enter se pehle scroll band */
  useEffect(() => {
    if (!entered) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }

    return () => {
      document.body.style.overflow = "";
    };
  }, [entered]);

  /* frames preload (enter screen ke time hi shuru) */
  useEffect(() => {
    let cancelled = false;
    const frames = framesRef.current;
    let next = 0;
    let done = 0;

    const worker = async () => {
      while (!cancelled && next < loadOrder.length) {
        const i = loadOrder[next++];
        try {
          if (!frames[i]) {
            const blob = await (await fetch(frameUrls[i])).blob();
            frames[i] = await createImageBitmap(
              blob,
              IS_MOBILE
                ? { resizeWidth: 400, resizeQuality: "medium" }
                : undefined
            );
          }
        } catch {
          /* kharab frame skip */
        }
        done++;
        if (done % 6 === 0 || done === FRAME_COUNT) {
          setProgress(done / FRAME_COUNT);
        }
      }
    };

    Promise.all(Array.from({ length: 6 }, worker));

    return () => {
      cancelled = true;
    };
  }, []);

  /* canvas frame engine */
  useEffect(() => {
    if (!entered) return;

    const canvas = canvasRef.current;
    const section = sectionRef.current;
    if (!canvas || !section) return;

    const ctx = canvas.getContext("2d", { alpha: false });
    const frames = framesRef.current;

    let lenis = null;
    let ticker = null;
    let trigger = null;
    let raf = null;

    let target = 0;
    let current = 0;
    let shown = -1;

    const nearest = (idx) => {
      for (let d = 0; d < FRAME_COUNT; d++) {
        if (frames[idx - d]) return idx - d;
        if (frames[idx + d]) return idx + d;
      }
      return -1;
    };

    const draw = () => {
      current += (target - current) * 0.2;

      const idx = Math.min(
        FRAME_COUNT - 1,
        Math.max(0, Math.round(current * (FRAME_COUNT - 1)))
      );
      const k = nearest(idx);

      if (k !== -1 && k !== shown) {
        const img = frames[k];
        if (canvas.width !== img.width) {
          canvas.width = img.width;
          canvas.height = img.height;
        }
        ctx.drawImage(img, 0, 0);
        shown = k;
      }

      raf = requestAnimationFrame(draw);
    };

    /* Lenis sirf computer par, phone par normal scroll */
    if (!IS_TOUCH) {
      lenis = new Lenis({
        lerp: 0.1,
        smoothWheel: true,
        wheelMultiplier: 1,
      });

      lenis.on("scroll", ScrollTrigger.update);

      ticker = (time) => {
        lenis.raf(time * 1000);
      };
      gsap.ticker.add(ticker);
      gsap.ticker.lagSmoothing(0);
    }

    raf = requestAnimationFrame(draw);

    trigger = ScrollTrigger.create({
      trigger: section,
      start: "top top",
      end: "bottom bottom",
      scrub: true,
      invalidateOnRefresh: true,

      onUpdate: (self) => {
        target = self.progress;

        let nextScene = 0;
        for (let i = 0; i < scenes.length; i++) {
          if (self.progress >= scenes[i].start && self.progress < scenes[i].end) {
            nextScene = i;
            break;
          }
        }

        setSceneIndex((old) => (old === nextScene ? old : nextScene));
      },
    });

    ScrollTrigger.refresh();

    return () => {
      if (trigger) trigger.kill();
      if (ticker) gsap.ticker.remove(ticker);
      if (lenis) lenis.destroy();
      if (raf) cancelAnimationFrame(raf);
      lenisRef.current = null;
    };
  }, [entered]);

  /* text animation */
  useEffect(() => {
    if (!textRef.current) return;

    const element = textRef.current;

    gsap.killTweensOf(element);

    gsap.fromTo(
      element,
      { opacity: 0, y: 28, filter: "blur(8px)" },
      { opacity: 1, y: 0, filter: "blur(0px)", duration: 0.8, ease: "power3.out" }
    );

    return () => {
      gsap.killTweensOf(element);
    };
  }, [sceneIndex]);

  const enterExperience = () => {
    setEntered(true);
    window.scrollTo(0, 0);
  };

  return (
    <main className="wedding-page">
      {!entered && (
        <div className="enter-screen">
          <div className="enter-content">
            <p className="enter-small">YOU ARE INVITED</p>

            <h1>The Wedding</h1>

            <div className="enter-line" />

            <button onClick={enterExperience} disabled={progress < 0.26}>
              {progress < 0.26
                ? `LOADING ${Math.round((progress / 0.26) * 100)}%`
                : "TAP TO ENTER"}
            </button>

            <p className="enter-hint">Scroll to enter the celebration</p>
          </div>
        </div>
      )}

      <section ref={sectionRef} className="cinematic-section">
        <div className="cinematic-viewport">
          <canvas ref={canvasRef} className="cinematic-video" />

          <div className="cinematic-overlay" />
          <div className="cinematic-vignette" />

          {currentScene.title && (
            <div className="wedding-text-wrapper">
              <div
                ref={textRef}
                className="wedding-text"
                key={currentScene.title}
              >
                {currentScene.eyebrow && (
                  <p className="wedding-eyebrow">{currentScene.eyebrow}</p>
                )}

                <h1>{currentScene.title}</h1>

                {currentScene.subtitle && (
                  <p className="wedding-subtitle">{currentScene.subtitle}</p>
                )}
              </div>
            </div>
          )}

          <div className="scroll-indicator">
            <span>SCROLL</span>

            <div className="scroll-line">
              <span />
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}

export default App;