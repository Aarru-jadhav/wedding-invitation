import { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Lenis from "lenis";

import weddingVideo from "./assets/video/wedding-cinematic.mp4";

gsap.registerPlugin(ScrollTrigger);

/* =====================================================
   SCENES
===================================================== */

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

/* =====================================================
   APP
===================================================== */

function App() {
  /* ===================================================
     REFS
  =================================================== */

  const sectionRef = useRef(null);
  const videoRef = useRef(null);
  const textRef = useRef(null);

  const lenisRef = useRef(null);

  /*
   * Target video position
   *
   * Scroll changes this value.
   * RAF smoothly moves actual video.currentTime
   * towards this value.
   */
  const playheadRef = useRef({
    time: 0,
  });

  /* ===================================================
     STATE
  =================================================== */

  const [entered, setEntered] = useState(false);
  const [sceneIndex, setSceneIndex] = useState(0);

  const currentScene = scenes[sceneIndex];

  /* =====================================================
     LOCK BODY SCROLL BEFORE ENTER
  ===================================================== */

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

  /* =====================================================
     CINEMATIC ENGINE
  ===================================================== */

  useEffect(() => {
    if (!entered) return;

    const video = videoRef.current;
    const section = sectionRef.current;

    if (!video || !section) return;

    let lenis = null;
    let ticker = null;
    let trigger = null;
    let videoRAF = null;

    let videoReady = false;

    /*
     * Target video time
     *
     * Scroll changes this.
     */
    let targetTime = 0;

    /*
     * Actual smoothed video time
     */
    let currentTime = 0;

    /* =================================================
       VIDEO UPDATE LOOP
    ================================================= */

    const updateVideo = () => {
      if (videoReady && video.duration) {
        /*
         * Smooth movement toward target.
         *
         * Higher value = faster response
         * Lower value = smoother/slower
         */
        currentTime +=
          (targetTime - currentTime) * 0.18;

        /*
         * Only seek when difference is meaningful.
         *
         * This prevents thousands of unnecessary
         * currentTime assignments.
         */
        if (
          Math.abs(
            video.currentTime - currentTime
          ) > 0.025
        ) {
          if (video.readyState >= 2) {
            video.currentTime = currentTime;
          }
        }
      }

      videoRAF =
        requestAnimationFrame(updateVideo);
    };

    /* =================================================
       INITIALIZE EXPERIENCE
    ================================================= */

    const init = () => {
      if (videoReady) return;

      videoReady = true;

      /* ===============================================
         VIDEO INITIAL STATE
      =============================================== */

      video.pause();

      video.currentTime = 0;

      targetTime = 0;
      currentTime = 0;

      playheadRef.current.time = 0;

      /* ===============================================
         LENIS
      =============================================== */

      lenis = new Lenis({
        /*
         * Main smooth scrolling.
         */
        lerp: 0.08,

        smoothWheel: true,

        /*
         * Native touch scrolling is better
         * for mobile video scrubbing.
         */
        smoothTouch: false,

        syncTouch: false,

        wheelMultiplier: 0.8,

        touchMultiplier: 1,
      });

      lenisRef.current = lenis;

      /* ===============================================
         LENIS → SCROLLTRIGGER
      =============================================== */

      lenis.on(
        "scroll",
        ScrollTrigger.update
      );

      /* ===============================================
         GSAP TICKER
      =============================================== */

      ticker = (time) => {
        lenis.raf(time * 1000);
      };

      gsap.ticker.add(ticker);

      /*
       * Prevent GSAP from adding its own lag smoothing.
       */
      gsap.ticker.lagSmoothing(0);

      /* ===============================================
         START VIDEO RAF
      =============================================== */

      videoRAF =
        requestAnimationFrame(updateVideo);

      /* ===============================================
         SCROLLTRIGGER
      =============================================== */

      trigger = ScrollTrigger.create({
        trigger: section,

        start: "top top",

        end: "bottom bottom",

        /*
         * IMPORTANT:
         *
         * Lenis already smooths scrolling.
         *
         * Therefore ScrollTrigger doesn't need
         * scrub: 1.5 or another smoothing layer.
         */
        scrub: true,

        invalidateOnRefresh: true,

        onUpdate: (self) => {
          if (!video.duration) return;

          /* =========================================
             VIDEO TARGET TIME
          ========================================= */

          targetTime =
            self.progress *
            video.duration;

          playheadRef.current.time =
            targetTime;

          /* =========================================
             FIND CURRENT SCENE
          ========================================= */

          let nextScene = 0;

          for (
            let i = 0;
            i < scenes.length;
            i++
          ) {
            if (
              self.progress >=
                scenes[i].start &&
              self.progress <
                scenes[i].end
            ) {
              nextScene = i;
              break;
            }
          }

          /* =========================================
             ONLY UPDATE REACT WHEN SCENE CHANGES
          ========================================= */

          setSceneIndex((oldIndex) => {
            if (oldIndex === nextScene) {
              return oldIndex;
            }

            return nextScene;
          });
        },
      });

      /* ===============================================
         REFRESH
      =============================================== */

      ScrollTrigger.refresh();
    };

    /* =================================================
       VIDEO LOAD
    ================================================= */

    if (video.readyState >= 2) {
      init();
    } else {
      video.addEventListener(
        "loadedmetadata",
        init,
        {
          once: true,
        }
      );
    }

    /* =================================================
       CLEANUP
    ================================================= */

    return () => {
      video.removeEventListener(
        "loadedmetadata",
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

      if (videoRAF) {
        cancelAnimationFrame(videoRAF);
      }

      lenisRef.current = null;
    };
  }, [entered]);

  /* =====================================================
     TEXT ANIMATION
  ===================================================== */

  useEffect(() => {
    if (!textRef.current) return;

    const element = textRef.current;

    /*
     * Kill previous animation
     */
    gsap.killTweensOf(element);

    /*
     * New scene animation
     */
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

        duration: 0.8,

        ease: "power3.out",
      }
    );

    return () => {
      gsap.killTweensOf(element);
    };
  }, [sceneIndex]);

  /* =====================================================
     ENTER EXPERIENCE
  ===================================================== */

  const enterExperience = () => {
    setEntered(true);

    /*
     * Make sure page starts from top.
     */
    window.scrollTo(0, 0);
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

          {/* =================================================
              VIDEO
          ================================================= */}

          <video
            ref={videoRef}

            src={weddingVideo}

            muted

            playsInline

            preload="auto"

            disablePictureInPicture

            className="cinematic-video"
          />

          {/* =================================================
              DARK OVERLAY
          ================================================= */}

          <div className="cinematic-overlay" />

          {/* =================================================
              VIGNETTE
          ================================================= */}

          <div className="cinematic-vignette" />

          {/* =================================================
              WEDDING TEXT
          ================================================= */}

          {currentScene.title && (
            <div className="wedding-text-wrapper">

              <div
                ref={textRef}
                className="wedding-text"
                key={currentScene.title}
              >

                {/* EYEBROW */}

                {currentScene.eyebrow && (
                  <p className="wedding-eyebrow">
                    {currentScene.eyebrow}
                  </p>
                )}

                {/* TITLE */}

                <h1>
                  {currentScene.title}
                </h1>

                {/* SUBTITLE */}

                {currentScene.subtitle && (
                  <p className="wedding-subtitle">
                    {currentScene.subtitle}
                  </p>
                )}

              </div>

            </div>
          )}

          {/* =================================================
              SCROLL INDICATOR
          ================================================= */}

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