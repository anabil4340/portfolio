/*
  Author: Abdur Nabil
  Project: Software Developer Portfolio
  Description: Handles interactive features of the portfolio website.
  Date: October 2026
*/

/* Show a button to return to the top of the page. */
const backToTop = document.getElementById("back-to-top");

/* Display the button after scrolling down. */
if (backToTop) {
  window.addEventListener("scroll", function () {
    if (window.scrollY > 300) {
      backToTop.classList.add("visible");
    } else {
      backToTop.classList.remove("visible");
    }
  });

  /* Return to the top when the button is clicked. */
  backToTop.addEventListener("click", function () {
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  });
}

/* Mini hacker navigation animation */
const navBuilder = document.getElementById("nav-builder");
const navLogo = document.getElementById("mascot-logo");

if (navBuilder && navLogo) {
  const navbar = navBuilder.parentElement;

  const jumpFrames = [
    "sprites/jump_01.png",
    "sprites/jump_02.png",
    "sprites/jump_03.png",
    "sprites/jump_04.png",
    "sprites/jump_05.png",
    "sprites/jump_06.png",
  ];

  const runFrames = [
    "sprites/run_01.png",
    "sprites/run_02.png",
    "sprites/run_03.png",
    "sprites/run_04.png",
    "sprites/run_05.png",
    "sprites/run_06.png",
    "sprites/run_07.png",
    "sprites/run_08.png",
  ];

  // Grab Frames
  const grabFrames = ["sprites/grab_01.png", "sprites/grab_02.png"];

  // Throw Frames
  const throwFrames = ["sprites/throw_01.png", "sprites/throw_02.png"];

  // Catch Frames
  const catchFrames = [
    "sprites/catch_01.png",
    "sprites/catch_02.png",
    "sprites/catch_03.png",
    "sprites/catch_04.png",
    "sprites/catch_05.png",
  ];

  // Normal patrol speed
  const runSpeed = 15;
  const runFrameDelay = 60;

  // Navigation-click speed
  const navigationRunSpeed = 35;
  const navigationFrameDelay = 25;

  // Jump settings
  const frameDelay = 90;
  const pauseDuration = 2000;
  const jumpDistance = 65;
  const jumpHeight = 35;

  // Collision settings
  const edgeMargin = 2;

  // Shared animation state
  let jumpFrameIndex = 0;
  let selectedNavLink = null;

  let animationVersion = 0;
  let activeTimer = null;
  let activeFrame = null;
  let activeTextAnimation = null;
  let activeFlyingText = null;
  let activeCarriedText = null;
  let activeHiddenLink = null;

  // Current hacker position in navbar coordinates
  let positionX = 0;
  let positionY = 0;

  // Current orientation
  let facingDirection = 1;

  // Whether the hacker is temporarily positioned on the page
  let isFollowingText = false;

  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

  /**
   * Applies the persistent neon effect to a navigation link.
   *
   * The effect remains until the page is refreshed.
   *
   * @param {HTMLElement} link - Navigation link to illuminate.
   */
  function activateNeonLink(link) {
    if (!link) {
      return;
    }

    link.classList.add("nav-neon-active");
  }

  /**
   * Returns a horizontal position that keeps the
   * flying word fully inside the browser viewport.
   *
   * @param {number} x - Requested horizontal position.
   * @param {number} width - Width of the flying word.
   * @returns {number} Safe horizontal position.
   */
  function clampFlyingTextX(x, width) {
    const viewportWidth = document.documentElement.clientWidth;

    return Math.max(0, Math.min(x, viewportWidth - width));
  }

  /**
   * Creates a short-lived hollow neon spark behind
   * the flying navigation word.
   *
   * @param {number} x - Horizontal spark position.
   * @param {number} y - Vertical spark position.
   */
  function createNeonSpark(x, y) {
    const spark = document.createElement("span");
    spark.className = "hacker-neon-spark";

    spark.style.left = `${x}px`;
    spark.style.top = `${y}px`;

    document.body.appendChild(spark);

    spark.addEventListener("animationend", () => spark.remove(), {
      once: true,
    });
  }

  /**
   * Returns the logo's exact center relative to the
   * hacker's normal absolute-positioned layout.
   *
   * The coordinates are recalculated when needed,
   * so they also work with the stacked mobile navbar.
   *
   * @returns {{x: number, y: number}} Logo center.
   */
  function getLogoCenterPosition() {
    const logoRect = navLogo.getBoundingClientRect();
    const navRect = navbar.getBoundingClientRect();

    return {
      x:
        logoRect.left +
        logoRect.width / 2 -
        navRect.left -
        navBuilder.offsetLeft -
        navBuilder.offsetWidth / 2,

      y:
        logoRect.top +
        logoRect.height / 2 -
        navRect.top -
        navBuilder.offsetTop -
        navBuilder.offsetHeight / 2,
    };
  }

  /**
   * Returns the hacker's running level.
   *
   * The hacker runs along the navbar's bottom edge.
   *
   * @returns {number} Vertical translation.
   */
  function getRunningY() {
    return 0;
  }

  /**
   * Returns the horizontal position where the hacker
   * should collide just before the browser's right edge.
   *
   * @returns {number} Collision position.
   */
  function getRightEdgePosition() {
    const navbarRect = navbar.getBoundingClientRect();
    const browserWidth = document.documentElement.clientWidth;

    return Math.max(
      0,
      browserWidth -
        navbarRect.left -
        navBuilder.offsetLeft -
        navBuilder.offsetWidth -
        edgeMargin,
    );
  }

  /**
   * Updates the hacker's position in the navbar.
   *
   * Also stores its coordinates so navigation clicks
   * can interrupt the patrol without losing position.
   *
   * @param {number} x - Horizontal position.
   * @param {number} y - Vertical position.
   * @param {number} direction - Facing direction.
   * @param {number} rotation - Rotation in degrees.
   * @param {number} scale - Character scale.
   */
  function setBuilderPosition(x, y, direction = 1, rotation = 0, scale = 1) {
    positionX = x;
    positionY = y;
    facingDirection = direction;

    navBuilder.style.transform =
      `translate(${x}px, ${y}px) ` +
      `rotate(${rotation}deg) ` +
      `scale(${direction * scale}, ${scale})`;

    navBuilder.dataset.position = String(x);
  }

  /**
   * Stops the currently active timer or animation frame.
   */
  function stopMotion() {
    if (activeTimer !== null) {
      clearTimeout(activeTimer);
      clearInterval(activeTimer);
      activeTimer = null;
    }

    if (activeFrame !== null) {
      cancelAnimationFrame(activeFrame);
      activeFrame = null;
    }
  }

  /**
   * Cancels the current animation and restores any
   * navigation text before starting a new interaction.
   */
  function cancelCurrentAnimation() {
    animationVersion++;

    stopMotion();

    if (activeTextAnimation) {
      activeTextAnimation.cancel();
      activeTextAnimation = null;
    }

    if (activeFlyingText) {
      activeFlyingText.remove();
      activeFlyingText = null;
    }

    if (activeCarriedText) {
      activeCarriedText.remove();
      activeCarriedText = null;
    }

    if (activeHiddenLink) {
      activeHiddenLink.style.color = "";
      activeHiddenLink = null;
    }

    selectedNavLink = null;

    navBuilder.style.transformOrigin = "";
  }

  /**
   * Restores the hacker's normal navbar positioning
   * while preserving its current visible coordinates.
   *
   * This is used after page-level navigation animations.
   */
  function placeBuilderInNavbar() {
    const builderRect = navBuilder.getBoundingClientRect();
    const navRect = navbar.getBoundingClientRect();

    // Temporarily remove the transform and fixed positioning.
    navBuilder.style.position = "";
    navBuilder.style.left = "";
    navBuilder.style.top = "";
    navBuilder.style.bottom = "";
    navBuilder.style.zIndex = "";
    navBuilder.style.transform = "";
    navBuilder.style.transformOrigin = "";

    const x = builderRect.left - navRect.left - navBuilder.offsetLeft;

    const y = builderRect.top - navRect.top - navBuilder.offsetTop;

    setBuilderPosition(x, y, facingDirection);

    isFollowingText = false;

    return { x, y };
  }

  /**
   * Returns the hacker to the running level smoothly
   * while moving toward a navigation link.
   *
   * @param {HTMLElement} link - Selected navigation link.
   * @param {number} version - Current animation version.
   */
  function runToNavLink(link, version) {
    if (version !== animationVersion) {
      return;
    }

    const navRect = navbar.getBoundingClientRect();
    const linkRect = link.getBoundingClientRect();

    const destination =
      linkRect.left -
      navRect.left -
      navBuilder.offsetLeft -
      navBuilder.offsetWidth +
      10;

    let x = positionX;
    let y = positionY;
    let frameIndex = 0;

    activeTimer = setInterval(() => {
      if (version !== animationVersion) {
        return;
      }

      const distance = destination - x;
      const direction = distance >= 0 ? 1 : -1;

      const step = Math.min(navigationRunSpeed, Math.abs(distance));

      x += step * direction;

      // Gradually move to the navbar's running level.
      y += (getRunningY() - y) * 0.35;

      if (Math.abs(y - getRunningY()) < 0.5) {
        y = getRunningY();
      }

      navBuilder.src = runFrames[frameIndex];
      setBuilderPosition(x, y, direction);

      frameIndex = (frameIndex + 1) % runFrames.length;

      if (Math.abs(destination - x) < 0.01) {
        setBuilderPosition(destination, getRunningY(), direction);

        stopMotion();
        animateGrab(version);
      }
    }, navigationFrameDelay);
  }

  /**
   * Gives navigation clicks priority over the normal
   * patrol and prevents overlapping navigation animations.
   */
  document.querySelectorAll(".nav-links a").forEach((link) => {
    link.addEventListener("click", () => {
      if (reducedMotion.matches) {
        return;
      }

      // Capture the hacker's current visible position
      // before cancelling a collision or page animation.
      const builderRect = navBuilder.getBoundingClientRect();

      cancelCurrentAnimation();

      selectedNavLink = link;

      const version = animationVersion;

      // Restore normal navbar positioning.
      if (isFollowingText) {
        navBuilder.style.position = "";
        navBuilder.style.left = "";
        navBuilder.style.top = "";
        navBuilder.style.bottom = "";
        navBuilder.style.zIndex = "";
        navBuilder.style.transform = "";
      }

      const navRect = navbar.getBoundingClientRect();

      // Start at the character's actual visible location.
      const x = builderRect.left - navRect.left - navBuilder.offsetLeft;

      const y = builderRect.top - navRect.top - navBuilder.offsetTop;

      navBuilder.style.position = "";
      navBuilder.style.left = "";
      navBuilder.style.top = "";
      navBuilder.style.bottom = "";
      navBuilder.style.zIndex = "";
      navBuilder.style.transformOrigin = "";

      isFollowingText = false;

      setBuilderPosition(x, y, facingDirection);

      navBuilder.style.opacity = "1";

      runToNavLink(link, version);
    });
  });

  /**
   * Plays the grabbing animation when the character
   * reaches a selected navigation link.
   */
  function animateGrab(version) {
    if (version !== animationVersion) {
      return;
    }

    let frameIndex = 0;

    activeTimer = setInterval(() => {
      if (version !== animationVersion) {
        return;
      }

      navBuilder.src = grabFrames[frameIndex];
      frameIndex++;

      if (frameIndex >= grabFrames.length) {
        stopMotion();
        animateThrow(version);
      }
    }, 150);
  }

  /**
   * Plays the throwing animation and temporarily hides
   * the selected navigation link's text.
   */
  function animateThrow(version) {
    if (!selectedNavLink || version !== animationVersion) {
      return;
    }

    let frameIndex = 0;

    activeTimer = setInterval(() => {
      if (version !== animationVersion) {
        return;
      }

      navBuilder.src = throwFrames[frameIndex];
      frameIndex++;

      if (frameIndex >= throwFrames.length) {
        stopMotion();

        // Transform the selected word into neon pink when thrown.
        activateNeonLink(selectedNavLink);

        activeHiddenLink = selectedNavLink;
        activeHiddenLink.style.color = "transparent";

        animateFlyingText(version);
      }
    }, 150);
  }

  /**
   * Throws the neon navigation text toward a random
   * browser wall, bounces it, and sends it to its section.
   *
   * The word remains within the viewport horizontally.
   */
  function animateFlyingText(version) {
    if (!selectedNavLink || version !== animationVersion) {
      return;
    }

    const link = selectedNavLink;
    const section = document.querySelector(link.getAttribute("href"));

    if (!section) {
      link.style.color = "";
      activeHiddenLink = null;
      restoreBuilder(version);
      return;
    }

    const linkRect = link.getBoundingClientRect();
    const sectionRect = section.getBoundingClientRect();

    const flyingText = document.createElement("span");
    flyingText.textContent = link.textContent.trim();
    flyingText.classList.add("hacker-neon-text");

    Object.assign(flyingText.style, {
      position: "fixed",
      left: `${linkRect.left}px`,
      top: `${linkRect.top}px`,
      font: window.getComputedStyle(link).font,
      whiteSpace: "nowrap",
      pointerEvents: "none",
      zIndex: "1000",
    });

    document.body.appendChild(flyingText);
    activeFlyingText = flyingText;

    const textWidth = flyingText.getBoundingClientRect().width;
    const viewportWidth = document.documentElement.clientWidth;
    const viewportHeight = window.innerHeight;

    const startX = clampFlyingTextX(linkRect.left, textWidth);
    const startY = linkRect.top;

    const bounceRight = Math.random() < 0.5;

    const wallX = bounceRight ? Math.max(0, viewportWidth - textWidth - 2) : 2;

    const targetX = clampFlyingTextX(
      sectionRect.left + sectionRect.width / 2 - textWidth / 2,
      textWidth,
    );

    const targetY = Math.max(
      0,
      Math.min(
        sectionRect.top + sectionRect.height / 2,
        viewportHeight - flyingText.offsetHeight,
      ),
    );

    const duration = 1100;

    const animation = flyingText.animate(
      [
        {
          left: `${startX}px`,
          top: `${startY}px`,
          opacity: 1,
          offset: 0,
        },
        {
          left: `${wallX}px`,
          top: `${startY + (targetY - startY) * 0.4}px`,
          opacity: 1,
          offset: 0.45,
        },
        {
          left: `${targetX}px`,
          top: `${targetY}px`,
          opacity: 1,
          offset: 1,
        },
      ],
      {
        duration,
        easing: "linear",
        fill: "forwards",
      },
    );

    activeTextAnimation = animation;

    let lastSparkTime = 0;

    /**
     * Generates sparks while the word is moving.
     */
    function updateSparks(timestamp) {
      if (version !== animationVersion) {
        return;
      }

      if (animation.playState === "finished") {
        return;
      }

      if (timestamp - lastSparkTime > 65) {
        const rect = flyingText.getBoundingClientRect();

        createNeonSpark(rect.left + rect.width / 2, rect.top + rect.height / 2);

        lastSparkTime = timestamp;
      }

      requestAnimationFrame(updateSparks);
    }

    requestAnimationFrame(updateSparks);

    animateChaseJump(flyingText, animation, version);

    animation.addEventListener("finish", () => {
      if (version !== animationVersion) {
        return;
      }

      flyingText.remove();

      activeTextAnimation = null;
      activeFlyingText = null;
    });
  }

  /**
   * Times the hacker's jump so he catches the neon word
   * when it reaches the selected page section.
   *
   * The hacker waits briefly, then grows while jumping
   * toward the word's final landing position.
   *
   * @param {HTMLElement} flyingText - Animated navigation text.
   * @param {Animation} animation - Flying text animation.
   * @param {number} version - Current animation version.
   */
  function animateChaseJump(flyingText, animation, version) {
    if (version !== animationVersion) {
      return;
    }

    const builderRect = navBuilder.getBoundingClientRect();

    const startX = builderRect.left;
    const startY = builderRect.top;

    const section = document.querySelector(
      selectedNavLink?.getAttribute("href"),
    );

    if (!section) {
      restoreBuilder(version);
      return;
    }

    const sectionRect = section.getBoundingClientRect();

    const viewportWidth = document.documentElement.clientWidth;
    const viewportHeight = window.innerHeight;

    const builderWidth = navBuilder.offsetWidth;
    const builderHeight = navBuilder.offsetHeight;

    const finalScale = 2.2;

    // Keep the enlarged hacker within the browser width.
    const maxX = Math.max(0, viewportWidth - builderWidth * finalScale);

    const targetX = Math.max(
      0,
      Math.min(
        sectionRect.left +
          sectionRect.width / 2 -
          (builderWidth * finalScale) / 2,
        maxX,
      ),
    );

    const targetY = Math.max(
      0,
      Math.min(
        sectionRect.top +
          sectionRect.height / 2 -
          (builderHeight * finalScale) / 2,
        viewportHeight - builderHeight * finalScale,
      ),
    );

    // Switch to fixed positioning for the page-level jump.
    navBuilder.style.position = "fixed";
    navBuilder.style.left = `${startX}px`;
    navBuilder.style.top = `${startY}px`;
    navBuilder.style.bottom = "auto";
    navBuilder.style.transform = "none";
    navBuilder.style.transformOrigin = "top left";
    navBuilder.style.zIndex = "1001";

    isFollowingText = true;

    const totalDuration = 1100;
    const jumpDelay = 300;
    const jumpDuration = totalDuration - jumpDelay;

    let frameIndex = 0;

    /**
     * Moves the hacker toward the landing point while
     * synchronizing with the flying word's animation.
     */
    function followText() {
      if (version !== animationVersion) {
        return;
      }

      const elapsed = Math.min(animation.currentTime || 0, totalDuration);

      const progress = Math.max(
        0,
        Math.min((elapsed - jumpDelay) / jumpDuration, 1),
      );

      const easedProgress = 1 - Math.pow(1 - progress, 2);

      const scale = 1 + (finalScale - 1) * easedProgress;

      const x = startX + (targetX - startX) * easedProgress;

      const arc = Math.sin(progress * Math.PI) * 55;

      const y = startY + (targetY - startY) * easedProgress - arc;

      navBuilder.src = jumpFrames[frameIndex];

      navBuilder.style.left = `${x}px`;
      navBuilder.style.top = `${y}px`;
      navBuilder.style.transform = `scale(${scale})`;

      frameIndex = (frameIndex + 1) % jumpFrames.length;

      if (animation.playState === "finished" || elapsed >= totalDuration) {
        activeFrame = null;

        // Position the hacker at the word's landing point.
        navBuilder.style.left = `${targetX}px`;
        navBuilder.style.top = `${targetY}px`;
        navBuilder.style.transform = `scale(${finalScale})`;

        animateCatch(version);
        return;
      }

      activeFrame = requestAnimationFrame(followText);
    }

    followText();
  }

  /**
   * Creates a hollow cyberpunk power-up aura around
   * the hacker after catching the navigation text.
   *
   * The aura expands and fades without covering the sprite.
   *
   * @param {number} version - Current animation version.
   */
  function animatePowerUp(version) {
    if (version !== animationVersion) {
      return;
    }

    const builderRect = navBuilder.getBoundingClientRect();

    const aura = document.createElement("div");
    aura.className = "hacker-power-aura";

    Object.assign(aura.style, {
      position: "fixed",
      left: `${builderRect.left + builderRect.width / 2}px`,
      top: `${builderRect.top + builderRect.height / 2}px`,
      width: `${builderRect.width}px`,
      height: `${builderRect.height}px`,
      pointerEvents: "none",
      zIndex: "1000",
    });

    document.body.appendChild(aura);

    // Keep the hacker visible above the aura.
    navBuilder.style.zIndex = "1001";

    aura.addEventListener(
      "animationend",
      () => {
        aura.remove();

        if (version !== animationVersion) {
          return;
        }

        returnWithText(version);
      },
      { once: true },
    );
  }

  /**
   * Plays the character's catching animation after
   * the navigation text reaches its destination.
   */
  function animateCatch(version) {
    if (version !== animationVersion) {
      return;
    }

    const section = document.querySelector(
      selectedNavLink?.getAttribute("href"),
    );

    if (section) {
      section.classList.remove("hacker-section-glow");

      // Restart the CSS glow animation.
      section.getBoundingClientRect();

      section.classList.add("hacker-section-glow");
    }

    let frameIndex = 0;

    activeTimer = setInterval(() => {
      if (version !== animationVersion) {
        return;
      }

      navBuilder.src = catchFrames[frameIndex];
      frameIndex++;

      if (frameIndex >= catchFrames.length) {
        stopMotion();

        // Power up before carrying the captured word home.
        animatePowerUp(version);
      }
    }, 120);
  }

  /**
   * Positions the captured navigation text in front of
   * the hacker so it appears to be held while moving.
   *
   * The text remains readable regardless of which
   * direction the hacker is facing.
   *
   * @param {HTMLElement} carriedText - Captured navigation word.
   * @param {number} direction - Hacker facing direction.
   */
  function positionCarriedText(carriedText, direction) {
    const builderRect = navBuilder.getBoundingClientRect();
    const textRect = carriedText.getBoundingClientRect();

    const viewportWidth = document.documentElement.clientWidth;

    // Position the word in front of the hacker's upper body.
    const handHeight = builderRect.top + builderRect.height * 0.45;

    const gap = 3;

    let textX;

    if (direction === 1) {
      // Facing right: hold the word on the right.
      textX = builderRect.right + gap;
    } else {
      // Facing left: hold the word on the left.
      textX = builderRect.left - textRect.width - gap;
    }

    // Keep the word within the browser viewport.
    textX = Math.max(0, Math.min(textX, viewportWidth - textRect.width));

    carriedText.style.left = `${textX}px`;
    carriedText.style.top = `${handHeight - textRect.height / 2}px`;
  }

  /**
   * Carries the captured text back to its original
   * position in the navigation bar.
   */
  function returnWithText(version) {
    if (!selectedNavLink || version !== animationVersion) {
      return;
    }

    const link = selectedNavLink;
    const linkRect = link.getBoundingClientRect();
    const builderRect = navBuilder.getBoundingClientRect();

    const carriedText = document.createElement("span");
    carriedText.textContent = link.textContent.trim();
    carriedText.classList.add("hacker-neon-text", "hacker-carried-text");
    Object.assign(carriedText.style, {
      position: "fixed",
      left: `${builderRect.left + navBuilder.offsetWidth / 2}px`,
      top: `${builderRect.top - 20}px`,
      font: window.getComputedStyle(link).font,
      whiteSpace: "nowrap",
      pointerEvents: "none",
      zIndex: "1002",
    });

    document.body.appendChild(carriedText);
    activeCarriedText = carriedText;

    const startX = builderRect.left;
    const startY = builderRect.top;

    const endX = linkRect.left - navBuilder.offsetWidth / 2;

    const endY = linkRect.top;

    const duration = 900;

    let startTime = null;
    let frameIndex = 0;

    /**
     * Moves the hacker and captured text together
     * toward the original navigation link.
     */
    function moveBack(timestamp) {
      if (version !== animationVersion) {
        return;
      }

      if (startTime === null) {
        startTime = timestamp;
      }

      const progress = Math.min((timestamp - startTime) / duration, 1);

      const x = startX + (endX - startX) * progress;

      const y = startY + (endY - startY) * progress;

      // Face the direction of travel.
      const direction = endX >= startX ? 1 : -1;

      navBuilder.src = runFrames[frameIndex];
      navBuilder.style.left = `${x}px`;
      navBuilder.style.top = `${y}px`;
      navBuilder.style.transform = `scaleX(${direction})`;

      // Keep the word in front of the hacker's hands.
      positionCarriedText(carriedText, direction);

      frameIndex = (frameIndex + 1) % runFrames.length;

      if (progress < 1) {
        activeFrame = requestAnimationFrame(moveBack);
      } else {
        activeFrame = null;

        carriedText.remove();
        activeCarriedText = null;

        link.style.color = "";
        activeHiddenLink = null;

        runBackToLogo(version);
      }
    }

    activeFrame = requestAnimationFrame(moveBack);
  }

  /**
   * Runs the character back toward the logo after
   * returning the captured navigation text.
   */
  function runBackToLogo(version) {
    if (version !== animationVersion) {
      return;
    }

    // Preserve its visible position when leaving fixed mode.
    placeBuilderInNavbar();

    runBackToLogoPosition(version);
  }

  /**
   * Shared return movement used after both the collision
   * and the navigation-click animations.
   *
   * @param {number} version - Current animation version.
   */
  function runBackToLogoPosition(version) {
    if (version !== animationVersion) {
      return;
    }

    let frameIndex = 0;

    activeTimer = setInterval(() => {
      if (version !== animationVersion) {
        return;
      }

      // Recalculate destination for responsive layouts.
      const destination = getLogoCenterPosition().x + jumpDistance;

      const distance = destination - positionX;
      const direction = distance >= 0 ? 1 : -1;

      const step = Math.min(runSpeed, Math.abs(distance));

      const x = positionX + step * direction;

      // Smoothly return to the running level.
      let y = positionY + (getRunningY() - positionY) * 0.35;

      if (Math.abs(y - getRunningY()) < 0.5) {
        y = getRunningY();
      }

      navBuilder.src = runFrames[frameIndex];

      setBuilderPosition(x, y, direction);

      frameIndex = (frameIndex + 1) % runFrames.length;

      if (
        Math.abs(destination - positionX) < 0.01 &&
        Math.abs(positionY - getRunningY()) < 0.5
      ) {
        stopMotion();
        animateReturnJump(version);
      }
    }, runFrameDelay);
  }

  /**
   * Restores the character to the navigation bar
   * and restarts its normal patrol cycle.
   */
  function restoreBuilder(version) {
    if (version !== animationVersion) {
      return;
    }

    navBuilder.style.opacity = "0";

    navBuilder.style.position = "";
    navBuilder.style.left = "";
    navBuilder.style.top = "";
    navBuilder.style.bottom = "";
    navBuilder.style.zIndex = "";
    navBuilder.style.transform = "";

    navBuilder.dataset.position = "";

    isFollowingText = false;
    selectedNavLink = null;

    stopMotion();

    activeTimer = setTimeout(() => {
      if (version !== animationVersion) {
        return;
      }

      activeTimer = null;
      jumpFrameIndex = 0;

      animateJump(version);
    }, pauseDuration);
  }

  /**
   * Jumps out of the exact center of the navigation logo
   * and lands on the navbar's running level.
   */
  function animateJump(version) {
    if (version !== animationVersion) {
      return;
    }

    if (jumpFrameIndex >= jumpFrames.length) {
      animateRun(version);
      return;
    }

    const logo = getLogoCenterPosition();

    const progress = jumpFrameIndex / (jumpFrames.length - 1);

    const x = logo.x + progress * jumpDistance;

    const y =
      logo.y +
      (getRunningY() - logo.y) * progress -
      Math.sin(progress * Math.PI) * jumpHeight;

    navBuilder.src = jumpFrames[jumpFrameIndex];
    navBuilder.style.opacity = "1";

    setBuilderPosition(x, y, 1);

    jumpFrameIndex++;

    activeTimer = setTimeout(() => {
      if (version !== animationVersion) {
        return;
      }

      activeTimer = null;
      animateJump(version);
    }, frameDelay);
  }

  /**
   * Runs across the navbar until the hacker reaches
   * the collision point just before its right edge.
   */
  function animateRun(version) {
    if (version !== animationVersion) {
      return;
    }

    let frameIndex = 0;

    activeTimer = setInterval(() => {
      if (version !== animationVersion) {
        return;
      }

      const destination = getRightEdgePosition();

      const x = Math.min(positionX + runSpeed, destination);

      navBuilder.src = runFrames[frameIndex];

      setBuilderPosition(x, getRunningY(), 1);

      frameIndex = (frameIndex + 1) % runFrames.length;

      if (x >= destination) {
        stopMotion();
        animateEdgeCollision(version);
      }
    }, runFrameDelay);
  }

  /**
   * Plays the wall collision, backward jump,
   * sitting pose, and recovery.
   *
   * The hacker continues facing the wall while
   * jumping backward, then turns toward the logo.
   *
   * Navigation clicks can interrupt this animation.
   */
  function animateEdgeCollision(version) {
    if (version !== animationVersion) {
      return;
    }

    const edgePosition = positionX;
    const landingPosition = Math.max(0, edgePosition - jumpDistance);

    const runningY = getRunningY();

    // Jump backward while continuing to face the wall.
    const stages = [
      {
        frame: jumpFrames[1],
        duration: 80,
        x: edgePosition,
        y: runningY,
      },
      {
        frame: jumpFrames[2],
        duration: 80,
        x: edgePosition - jumpDistance * 0.3,
        y: runningY - jumpHeight,
      },
      {
        frame: jumpFrames[3],
        duration: 80,
        x: edgePosition - jumpDistance * 0.7,
        y: runningY - jumpHeight,
      },
      {
        frame: jumpFrames[0],
        duration: 600,
        x: landingPosition,
        y: runningY,
      },
      {
        frame: jumpFrames[1],
        duration: 100,
        x: landingPosition,
        y: runningY,
      },
    ];

    let stageIndex = 0;

    /**
     * Advances through the backward jump and recovery sprites.
     */
    function playCollisionStage() {
      if (version !== animationVersion) {
        return;
      }

      if (stageIndex >= stages.length) {
        activeTimer = null;

        positionX = landingPosition;
        positionY = runningY;

        // Turn left only after landing and getting up.
        setBuilderPosition(positionX, positionY, -1, 0, 1);

        // Run toward the logo using the existing animation.
        runBackFromEdge(version);
        return;
      }

      const stage = stages[stageIndex];

      navBuilder.src = stage.frame;

      // Face right throughout the backward jump.
      setBuilderPosition(stage.x, stage.y, 1, 0, 1);

      positionX = stage.x;
      positionY = stage.y;

      stageIndex++;

      activeTimer = setTimeout(playCollisionStage, stage.duration);
    }

    playCollisionStage();
  }

  /**
   * Runs back toward the logo after recovering
   * from the collision.
   *
   * Navigation clicks can interrupt this movement.
   */
  function runBackFromEdge(version) {
    if (version !== animationVersion) {
      return;
    }

    runBackToLogoPosition(version);
  }

  /**
   * Jumps back into the exact center of the logo
   * and restarts the patrol after a short pause.
   */
  function animateReturnJump(version) {
    if (version !== animationVersion) {
      return;
    }

    let frameIndex = 0;

    activeTimer = setInterval(() => {
      if (version !== animationVersion) {
        return;
      }

      const logo = getLogoCenterPosition();

      const progress = frameIndex / (jumpFrames.length - 1);

      const startX = logo.x + jumpDistance;
      const startY = getRunningY();

      const x = startX + (logo.x - startX) * progress;

      const y =
        startY +
        (logo.y - startY) * progress -
        Math.sin(progress * Math.PI) * jumpHeight;

      navBuilder.src = jumpFrames[frameIndex];

      setBuilderPosition(x, y, -1);

      frameIndex++;

      if (frameIndex >= jumpFrames.length) {
        stopMotion();

        // Final position is the exact center of the logo.
        setBuilderPosition(logo.x, logo.y, -1);

        navBuilder.style.opacity = "0";
        selectedNavLink = null;

        activeTimer = setTimeout(() => {
          if (version !== animationVersion) {
            return;
          }

          activeTimer = null;
          jumpFrameIndex = 0;

          animateJump(version);
        }, pauseDuration);
      }
    }, frameDelay);
  }

  /**
   * Recalculates the character's location when the
   * viewport changes size or orientation.
   *
   * A resize restarts the patrol from the logo so the
   * character cannot become stuck outside the navbar.
   */
  function handleResize() {
    if (reducedMotion.matches) {
      return;
    }

    cancelCurrentAnimation();

    isFollowingText = false;

    navBuilder.style.position = "";
    navBuilder.style.left = "";
    navBuilder.style.top = "";
    navBuilder.style.bottom = "";
    navBuilder.style.zIndex = "";
    navBuilder.style.transform = "";
    navBuilder.style.opacity = "0";

    jumpFrameIndex = 0;

    animateJump(animationVersion);
  }

  window.addEventListener("resize", handleResize);

  /**
   * Start the automatic patrol unless the user
   * has requested reduced motion.
   */
  if (!reducedMotion.matches) {
    animateJump(animationVersion);
  }
}
