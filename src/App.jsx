import { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Lenis from "lenis";

import weddingVideo from "./assets/video/wedding-cinematic.mp4";

gsap.registerPlugin(ScrollTrigger);

const scenes = [
  {
    start: 0.00,
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

function App() {
  const sectionRef = useRef(null);
  const videoRef = useRef(null);
  const textRef = useRef(null);

  const lenisRef = useRef(null);
  const playheadRef = useRef({ time: 0 });

  const [entered, setEntered] = useState(false);
  const [sceneIndex, setSceneIndex] = useState(0);

  const currentScene = scenes[sceneIndex];

  /* =====================================================
     LOCK SCROLL BEFORE ENTER
  ===================================================== */

  useEffect(() => {
    document.body.style.overflow = entered ? "" : "hidden";

    return () => {
      document.body.style.overflow = "";
    };
  }, [entered]);

  /* =====================================================
     MAIN CINEMATIC ENGINE
  ===================================================== */

  useEffect(() => {
    if (!entered) return;

    const video = videoRef.current;
    const section = sectionRef.current;

    if (!video || !section) return;

    let lenis;
    let ticker;
    let trigger;
    let videoReady = false;

    const init = () => {
      if (videoReady) return;

      videoReady = true;

      /* ================================================
         LENIS
      ================================================ */

      lenis = new Lenis({
        duration: 1.15,
        lerp: 0.08,
        smoothWheel: true,
        smoothTouch: true,
        syncTouch: true,
        wheelMultiplier: 0.7,
        touchMultiplier: 1.0,
      });

      lenisRef.current = lenis;

      /* ================================================
         LENIS → GSAP
      ================================================ */

      lenis.on("scroll", ScrollTrigger.update);

      ticker = (time) => {
        lenis.raf(time * 1000);
      };

      gsap.ticker.add(ticker);

      gsap.ticker.lagSmoothing(0);

      /* ================================================
         PLAYHEAD
      ================================================ */

      const playhead = playheadRef.current;

      playhead.time = 0;

      video.currentTime = 0;

      /* ================================================
         SCROLL TRIGGER
      ================================================ */

      trigger = ScrollTrigger.create({
        trigger: section,

        start: "top top",

        end: "bottom bottom",

        scrub: 1.5,

        invalidateOnRefresh: true,

        onUpdate: (self) => {
          if (!video.duration) return;

          const targetTime =
            self.progress * video.duration;

          /*
           * Instead of directly jumping:
           *
           * video.currentTime = targetTime
           *
           * we smoothly animate a playhead.
           */

          gsap.to(playhead, {
            time: targetTime,

            duration: 0.18,

            ease: "power2.out",

            overwrite: true,

            onUpdate: () => {
              if (
                video.readyState >= 2
              ) {
                video.currentTime =
                  playhead.time;
              }
            },
          });

          /* ============================================
             TEXT SCENE
          ============================================ */

          let nextScene = 0;

          for (let i = 0; i < scenes.length; i++) {
            if (
              self.progress >= scenes[i].start &&
              self.progress < scenes[i].end
            ) {
              nextScene = i;
              break;
            }
          }

          setSceneIndex((old) => {
            if (old === nextScene) return old;
            return nextScene;
          });
        },
      });

      ScrollTrigger.refresh();
    };

    if (video.readyState >= 2) {
      init();
    } else {
      video.addEventListener(
        "canplay",
        init,
        { once: true }
      );
    }

    return () => {
      video.removeEventListener(
        "canplay",
        init
      );

      if (trigger) {
        trigger.kill();
      }

      if (ticker) {
        gsap.ticker.remove(ticker);
      }

      if (lenis) {
        lenis.destroy();
      }
    };
  }, [entered]);

  /* =====================================================
     TEXT ANIMATION
  ===================================================== */

  useEffect(() => {
    if (!textRef.current) return;

    const element = textRef.current;

    gsap.killTweensOf(element);

    gsap.fromTo(
      element,

      {
        opacity: 0,
        y: 28,
        filter: "blur(8px)",
      },

      {
        opacity: 1,
        y: 0,
        filter: "blur(0px)",

        duration: 0.9,

        ease: "power3.out",
      }
    );
  }, [sceneIndex]);

  /* =====================================================
     ENTER
  ===================================================== */

  const enterExperience = () => {
    setEntered(true);
  };

  /* =====================================================
     UI
  ===================================================== */

  return (
    <main className="wedding-page">

      {/* =================================================
          ENTER SCREEN
      ================================================= */}

      {!entered && (
        <div className="enter-screen">

          <div className="enter-content">

            <p className="enter-small">
              YOU ARE INVITED
            </p>

            <h1>
              The Wedding
            </h1>

            <div className="enter-line" />

            <button
              onClick={enterExperience}
            >
              TAP TO ENTER
            </button>

            <p className="enter-hint">
              Scroll to enter the celebration
            </p>

          </div>

        </div>
      )}

      {/* =================================================
          CINEMATIC JOURNEY
      ================================================= */}

      <section
        ref={sectionRef}
        className="cinematic-section"
      >

        <div className="cinematic-viewport">

          {/* VIDEO */}

          <video
            ref={videoRef}
            src={weddingVideo}

            muted

            playsInline

            preload="auto"

            className="cinematic-video"
          />

          {/* OVERLAY */}

          <div className="cinematic-overlay" />

          {/* VIGNETTE */}

          <div className="cinematic-vignette" />

          {/* TEXT */}

          {currentScene.title && (
            <div className="wedding-text-wrapper">

              <div
                ref={textRef}
                className="wedding-text"
                key={currentScene.title}
              >

                {currentScene.eyebrow && (
                  <p className="wedding-eyebrow">
                    {currentScene.eyebrow}
                  </p>
                )}

                <h1>
                  {currentScene.title}
                </h1>

                {currentScene.subtitle && (
                  <p className="wedding-subtitle">
                    {currentScene.subtitle}
                  </p>
                )}

              </div>

            </div>
          )}

          {/* SCROLL */}

          <div className="scroll-indicator">

            <span>
              SCROLL
            </span>

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