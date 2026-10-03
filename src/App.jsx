import { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Lenis from "lenis";

import weddingVideo from "./assets/video/wedding-cinematic.mp4";

// Mobile frames
const frameFiles = import.meta.glob(
  "./assets/frames/*.webp",
  {
    eager: true,
    query: "?url",
    import: "default",
  }
);

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
   SORT FRAME FILES
===================================================== */

const frameUrls = Object.entries(frameFiles)
  .sort(([a], [b]) => {
    const numA = parseInt(
      a.match(/(\d+)\.webp$/)?.[1] || "0",
      10
    );

    const numB = parseInt(
      b.match(/(\d+)\.webp$/)?.[1] || "0",
      10
    );

    return numA - numB;
  })
  .map(([, url]) => url);

/* =====================================================
   APP
===================================================== */

function App() {
  /* ===================================================
     REFS
  =================================================== */

  const sectionRef = useRef(null);

  const videoRef = useRef(null);

  const canvasRef = useRef(null);

  const textRef = useRef(null);

  const lenisRef = useRef(null);

  const frameImagesRef = useRef(new Map());

  const currentFrameRef = useRef(-1);

  const targetFrameRef = useRef(0);

  const mobileRef = useRef(false);

  /* ===================================================
     STATE
  =================================================== */

  const [entered, setEntered] = useState(false);

  const [sceneIndex, setSceneIndex] = useState(0);

  const currentScene = scenes[sceneIndex];

  /* ===================================================
     LOCK BODY SCROLL
  =================================================== */

  useEffect(() => {
    document.body.style.overflow = entered
      ? ""
      : "hidden";

    return () => {
      document.body.style.overflow = "";
    };
  }, [entered]);

  /* =====================================================
     MOBILE DETECTION
  ===================================================== */

  useEffect(() => {
    const checkMobile = () => {
      mobileRef.current =
        window.matchMedia(
          "(max-width: 768px)"
        ).matches;
    };

    checkMobile();

    window.addEventListener(
      "resize",
      checkMobile
    );

    return () => {
      window.removeEventListener(
        "resize",
        checkMobile
      );
    };
  }, []);

  /* =====================================================
     CANVAS DRAW
  ===================================================== */

  const drawFrame = (
    image,
    canvas
  ) => {
    if (!image || !canvas) return;

    const ctx =
      canvas.getContext("2d", {
        alpha: false,
        desynchronized: true,
      });

    if (!ctx) return;

    const width =
      window.innerWidth;

    const height =
      window.innerHeight;

    /*
     * Limit DPR for mobile performance.
     */
    const dpr = Math.min(
      window.devicePixelRatio || 1,
      1.5
    );

    canvas.width =
      width * dpr;

    canvas.height =
      height * dpr;

    canvas.style.width =
      `${width}px`;

    canvas.style.height =
      `${height}px`;

    ctx.setTransform(
      dpr,
      0,
      0,
      dpr,
      0,
      0
    );

    /*
     * Black background
     */
    ctx.fillStyle = "#000";
    ctx.fillRect(
      0,
      0,
      width,
      height
    );

    /*
     * Cover calculation
     */
    const imageRatio =
      image.width / image.height;

    const canvasRatio =
      width / height;

    let drawWidth;
    let drawHeight;
    let offsetX;
    let offsetY;

    if (
      imageRatio >
      canvasRatio
    ) {
      drawHeight = height;

      drawWidth =
        height * imageRatio;

      offsetX =
        (width - drawWidth) / 2;

      offsetY = 0;
    } else {
      drawWidth = width;

      drawHeight =
        width / imageRatio;

      offsetX = 0;

      offsetY =
        (height - drawHeight) / 2;
    }

    ctx.drawImage(
      image,
      offsetX,
      offsetY,
      drawWidth,
      drawHeight
    );
  };

  /* =====================================================
     LOAD FRAME
  ===================================================== */

  const loadFrame = (
    index
  ) => {
    if (
      index < 0 ||
      index >= frameUrls.length
    ) {
      return Promise.resolve(null);
    }

    const cache =
      frameImagesRef.current;

    if (cache.has(index)) {
      return Promise.resolve(
        cache.get(index)
      );
    }

    return new Promise(
      (resolve) => {
        const image =
          new Image();

        image.decoding =
          "async";

        image.onload = () => {
          cache.set(
            index,
            image
          );

          resolve(image);
        };

        image.onerror = () => {
          resolve(null);
        };

        image.src =
          frameUrls[index];
      }
    );
  };

  /* =====================================================
     PRELOAD NEARBY FRAMES
  ===================================================== */

  const preloadFrames = (
    center
  ) => {
    const radius = 10;

    for (
      let i =
        Math.max(
          0,
          center - radius
        );

      i <=
        Math.min(
          frameUrls.length - 1,
          center + radius
        );

      i++
    ) {
      loadFrame(i);
    }
  };

  /* =====================================================
     DRAW CURRENT FRAME
  ===================================================== */

  const renderFrame = async (
    frameIndex
  ) => {
    const canvas =
      canvasRef.current;

    if (!canvas) return;

    if (
      frameIndex ===
      currentFrameRef.current
    ) {
      return;
    }

    const image =
      await loadFrame(
        frameIndex
      );

    if (!image) return;

    /*
     * Check again after async load.
     */
    const latestFrame =
      targetFrameRef.current;

    if (
      Math.abs(
        latestFrame -
          frameIndex
      ) > 2
    ) {
      return;
    }

    drawFrame(
      image,
      canvas
    );

    currentFrameRef.current =
      frameIndex;

    preloadFrames(
      frameIndex
    );
  };

  /* =====================================================
     MOBILE FRAME ANIMATION
  ===================================================== */

  useEffect(() => {
    if (!entered) return;

    if (
      !window.matchMedia(
        "(max-width: 768px)"
      ).matches
    ) {
      return;
    }

    const canvas =
      canvasRef.current;

    if (!canvas) return;

    let rafId;

    const animate = () => {
      const target =
        targetFrameRef.current;

      const current =
        currentFrameRef.current;

      /*
       * Move one frame at a time.
       * This prevents large jumps.
       */
      let next =
        current < 0
          ? target
          : current;

      if (
        next !== target
      ) {
        if (
          next < target
        ) {
          next += Math.min(
            3,
            target - next
          );
        } else {
          next -= Math.min(
            3,
            next - target
          );
        }

        renderFrame(next);
      }

      rafId =
        requestAnimationFrame(
          animate
        );
    };

    /*
     * Load first frame.
     */
    renderFrame(0);

    rafId =
      requestAnimationFrame(
        animate
      );

    return () => {
      cancelAnimationFrame(
        rafId
      );
    };
  }, [entered]);

  /* =====================================================
     MAIN CINEMATIC ENGINE
  ===================================================== */

  useEffect(() => {
    if (!entered) return;

    const section =
      sectionRef.current;

    const video =
      videoRef.current;

    if (!section) return;

    let lenis = null;

    let ticker = null;

    let trigger = null;

    let videoRAF = null;

    let targetVideoTime = 0;

    let currentVideoTime = 0;

    const isMobile =
      window.matchMedia(
        "(max-width: 768px)"
      ).matches;

    mobileRef.current =
      isMobile;

    /* =================================================
       DESKTOP VIDEO ENGINE
    ================================================= */

    const updateVideo = () => {
      if (
        !isMobile &&
        video &&
        video.duration
      ) {
        currentVideoTime +=
          (
            targetVideoTime -
              currentVideoTime
          ) * 0.18;

        if (
          Math.abs(
            video.currentTime -
              currentVideoTime
          ) > 0.025 &&
          video.readyState >= 2
        ) {
          video.currentTime =
            currentVideoTime;
        }
      }

      videoRAF =
        requestAnimationFrame(
          updateVideo
        );
    };

    /* =================================================
       LENIS
    ================================================= */

    lenis = new Lenis({
      lerp: 0.08,

      smoothWheel: true,

      /*
       * Native mobile touch scrolling.
       */
      smoothTouch: false,

      syncTouch: false,

      wheelMultiplier: 0.8,

      touchMultiplier: 1,
    });

    lenisRef.current =
      lenis;

    lenis.on(
      "scroll",
      ScrollTrigger.update
    );

    /* =================================================
       GSAP TICKER
    ================================================= */

    ticker = (time) => {
      lenis.raf(
        time * 1000
      );
    };

    gsap.ticker.add(
      ticker
    );

    gsap.ticker.lagSmoothing(
      0
    );

    /* =================================================
       DESKTOP VIDEO START
    ================================================= */

    if (
      !isMobile &&
      video
    ) {
      video.pause();

      video.currentTime = 0;

      currentVideoTime = 0;

      targetVideoTime = 0;
    }

    /* =================================================
       ANIMATION LOOP
    ================================================= */

    videoRAF =
      requestAnimationFrame(
        updateVideo
      );

    /* =================================================
       SCROLL TRIGGER
    ================================================= */

    trigger =
      ScrollTrigger.create({
        trigger: section,

        start: "top top",

        end: "bottom bottom",

        scrub: true,

        invalidateOnRefresh: true,

        onUpdate: (
          self
        ) => {
          const progress =
            self.progress;

          /* ==========================================
             MOBILE → CANVAS FRAME
          ========================================== */

          if (
            isMobile &&
            frameUrls.length
          ) {
            const frameIndex =
              Math.min(
                frameUrls.length -
                  1,
                Math.max(
                  0,
                  Math.round(
                    progress *
                      (
                        frameUrls.length -
                        1
                      )
                  )
                )
              );

            targetFrameRef.current =
              frameIndex;
          }

          /* ==========================================
             DESKTOP → VIDEO
          ========================================== */

          if (
            !isMobile &&
            video &&
            video.duration
          ) {
            targetVideoTime =
              progress *
              video.duration;
          }

          /* ==========================================
             SCENE
          ========================================== */

          let nextScene = 0;

          for (
            let i = 0;
            i < scenes.length;
            i++
          ) {
            if (
              progress >=
                scenes[i].start &&
              progress <
                scenes[i].end
            ) {
              nextScene = i;
              break;
            }
          }

          setSceneIndex(
            (oldIndex) => {
              if (
                oldIndex ===
                nextScene
              ) {
                return oldIndex;
              }

              return nextScene;
            }
          );
        },
      });

    ScrollTrigger.refresh();

    /* =================================================
       CLEANUP
    ================================================= */

    return () => {
      if (trigger) {
        trigger.kill();
      }

      if (ticker) {
        gsap.ticker.remove(
          ticker
        );
      }

      if (lenis) {
        lenis.destroy();
      }

      if (videoRAF) {
        cancelAnimationFrame(
          videoRAF
        );
      }

      lenisRef.current =
        null;
    };
  }, [entered]);

  /* =====================================================
     TEXT ANIMATION
  ===================================================== */

  useEffect(() => {
    if (!textRef.current)
      return;

    const element =
      textRef.current;

    gsap.killTweensOf(
      element
    );

    gsap.fromTo(
      element,

      {
        opacity: 0,

        y: 28,

        filter:
          "blur(8px)",
      },

      {
        opacity: 1,

        y: 0,

        filter:
          "blur(0px)",

        duration: 0.8,

        ease:
          "power3.out",
      }
    );

    return () => {
      gsap.killTweensOf(
        element
      );
    };
  }, [sceneIndex]);

  /* =====================================================
     ENTER
  ===================================================== */

  const enterExperience =
    () => {
      setEntered(true);

      window.scrollTo(
        0,
        0
      );
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
              onClick={
                enterExperience
              }
            >
              TAP TO ENTER
            </button>

            <p className="enter-hint">
              Scroll to enter the
              celebration
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
              DESKTOP VIDEO
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
              MOBILE CANVAS
          ================================================= */}

          <canvas
            ref={canvasRef}
            className="cinematic-canvas"
          />

          {/* =================================================
              OVERLAY
          ================================================= */}

          <div className="cinematic-overlay" />

          {/* =================================================
              VIGNETTE
          ================================================= */}

          <div className="cinematic-vignette" />

          {/* =================================================
              TEXT
          ================================================= */}

          {currentScene.title && (
            <div className="wedding-text-wrapper">

              <div
                ref={textRef}
                className="wedding-text"
                key={
                  currentScene.title
                }
              >

                {currentScene.eyebrow && (
                  <p className="wedding-eyebrow">
                    {
                      currentScene.eyebrow
                    }
                  </p>
                )}

                <h1>
                  {
                    currentScene.title
                  }
                </h1>

                {currentScene.subtitle && (
                  <p className="wedding-subtitle">
                    {
                      currentScene.subtitle
                    }
                  </p>
                )}

              </div>

            </div>
          )}

          {/* =================================================
              SCROLL
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