/*
  Author: Abdur Nabil
  Project: Software Developer Portfolio
  Description: Handles interactive features of the portfolio website.
  Date: October 2026
*/

/* Show a button to return to the top of the page. */
const backToTop = document.getElementById("back-to-top");

/* Display the button after scrolling down. */
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

/* Mini hacker navigation animation */
const navBuilder = document.getElementById("nav-builder");
const navLogo = document.getElementById("mascot-logo");

if (navBuilder && navLogo) {
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

  //Grab Frames
  const grabFrames = ["sprites/grab_01.png", "sprites/grab_02.png"];

  //Throw Frames
  const throwFrames = ["sprites/throw_01.png", "sprites/throw_02.png"];

  //Catch Frames
  const catchFrames = [
    "sprites/catch_01.png",
    "sprites/catch_02.png",
    "sprites/catch_03.png",
    "sprites/catch_04.png",
    "sprites/catch_05.png",
  ];

  const aboutLink = document.querySelector('.nav-links a[href="#about"]');

  // Normal run speed
  const runSpeed = 15;
  const runFrameDelay = 60;

  // After Clicking
  const navigationRunSpeed = 35;
  const navigationFrameDelay = 25;

  const frameDelay = 90;
  const pauseDuration = 2000;
  const jumpDistance = 65;

  let jumpFrameIndex = 0;
  let selectedNavLink = null;

  let animationVersion = 0;
  let activeTimer = null;
  let activeFrame = null;
  let activeTextAnimation = null;
  let activeFlyingText = null;
  let activeCarriedText = null;
  let activeHiddenLink = null;

  /**
   * Cancels the current animation and restores any
   * navigation text before starting a new interaction.
   */
  function cancelCurrentAnimation() {
    animationVersion++;

    clearTimeout(activeTimer);
    clearInterval(activeTimer);
    cancelAnimationFrame(activeFrame);

    activeTimer = null;
    activeFrame = null;

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
  }

  /**
   * Restores the hacker's normal navigation-bar positioning
   * while preserving its current visible horizontal position.
   */
  function placeBuilderInNavbar() {
    const builderRect = navBuilder.getBoundingClientRect();
    const navRect = navBuilder.parentElement.getBoundingClientRect();

    navBuilder.style.position = "";
    navBuilder.style.left = "";
    navBuilder.style.top = "";
    navBuilder.style.bottom = "";
    navBuilder.style.zIndex = "";

    const position = builderRect.left - navRect.left - navBuilder.offsetLeft;

    navBuilder.style.transform = `translateX(${position}px)`;
    navBuilder.dataset.position = position;

    return position;
  }

  /**
   * Gives navigation clicks priority over the normal
   * patrol and prevents overlapping navigation animations.
   */
  document.querySelectorAll(".nav-links a").forEach((link) => {
    link.addEventListener("click", () => {
      cancelCurrentAnimation();

      const version = animationVersion;

      selectedNavLink = link;

      placeBuilderInNavbar();

      navBuilder.style.opacity = "1";

      runToNavLink(link, version);
    });
  });

  /**
   * Plays the grabbing animation when the character
   * reaches a selected navigation link.
   */
  function animateGrab(version) {
    let frameIndex = 0;

    activeTimer = setInterval(() => {
      if (version !== animationVersion) {
        clearInterval(activeTimer);
        return;
      }

      navBuilder.src = grabFrames[frameIndex];
      frameIndex++;

      if (frameIndex >= grabFrames.length) {
        clearInterval(activeTimer);
        activeTimer = null;
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
        clearInterval(activeTimer);
        return;
      }

      navBuilder.src = throwFrames[frameIndex];

      frameIndex++;

      if (frameIndex >= throwFrames.length) {
        clearInterval(activeTimer);
        activeTimer = null;

        activeHiddenLink = selectedNavLink;
        activeHiddenLink.style.color = "transparent";
        animateFlyingText(version);
      }
    }, 150);
  }

  /**
   * Animates the selected navigation text toward its page section
   * and restores the original navigation link afterward.
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

    Object.assign(flyingText.style, {
      position: "fixed",
      left: `${linkRect.left}px`,
      top: `${linkRect.top}px`,
      font: window.getComputedStyle(link).font,
      color: "#a855f7",
      whiteSpace: "nowrap",
      pointerEvents: "none",
      zIndex: "1000",
    });

    document.body.appendChild(flyingText);
    activeFlyingText = flyingText;

    const targetX = sectionRect.left + sectionRect.width / 2;
    const targetY = sectionRect.top + sectionRect.height / 2;

    const animation = flyingText.animate(
      [
        {
          transform: "translate(0, 0) rotate(0deg)",
          opacity: 1,
        },
        {
          transform: `translate(${targetX - linkRect.left}px, ${
            targetY - linkRect.top
          }px) rotate(360deg)`,
          opacity: 0,
        },
      ],
      {
        duration: 900,
        easing: "ease-in-out",
        fill: "forwards",
      },
    );

    activeTextAnimation = animation;
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
   * Makes the character follow the flying navigation text
   * toward the selected page section before catching it.
   *
   * @param flyingText - The animated navigation text.
   * @param animation - The flying text animation.
   * @param version - The current animation version.
   */
  function animateChaseJump(flyingText, animation, version) {
    const builderRect = navBuilder.getBoundingClientRect();

    // Move the character into the page so it can leave the navigation bar.
    navBuilder.style.position = "fixed";
    navBuilder.style.left = `${builderRect.left}px`;
    navBuilder.style.top = `${builderRect.top}px`;
    navBuilder.style.bottom = "auto";
    navBuilder.style.transform = "none";
    navBuilder.style.zIndex = "1001";

    let frameIndex = 0;

    /**
     * Updates the character's position while following
     * the flying navigation text.
     */
    function followText() {
      if (version !== animationVersion) {
        return;
      }

      if (animation.playState === "finished") {
        activeFrame = null;
        animateCatch(version);
        return;
      }

      const textRect = flyingText.getBoundingClientRect();

      const progress = Math.min((animation.currentTime || 0) / 900, 1);

      const jumpHeight = Math.sin(progress * Math.PI) * 45;

      navBuilder.src = jumpFrames[frameIndex];
      navBuilder.style.left = `${textRect.left - navBuilder.offsetWidth / 2}px`;
      navBuilder.style.top = `${textRect.top - jumpHeight}px`;

      frameIndex = (frameIndex + 1) % jumpFrames.length;

      activeFrame = requestAnimationFrame(followText);
    }

    followText();
  }

  /**
   * Runs the character back to the navigation logo
   * after returning the captured navigation text.
   */
  function runBackToLogo(version) {
    const navRect = navBuilder.parentElement.getBoundingClientRect();
    const logoRect = navLogo.getBoundingClientRect();

    const destination = logoRect.left - navRect.left + jumpDistance;

    // Keep the character at its current visible position.
    let position = placeBuilderInNavbar();
    let frameIndex = 0;

    activeTimer = setInterval(() => {
      if (version !== animationVersion) {
        clearInterval(activeTimer);
        return;
      }
      const direction = destination >= position ? 1 : -1;

      position +=
        Math.min(runSpeed, Math.abs(destination - position)) * direction;

      navBuilder.src = runFrames[frameIndex];
      navBuilder.style.transform = `translateX(${position}px) scaleX(${direction})`;
      navBuilder.dataset.position = position;

      frameIndex = (frameIndex + 1) % runFrames.length;

      if (position === destination) {
        clearInterval(activeTimer);
        activeTimer = null;
        animateReturnJump(version);
      }
    }, runFrameDelay);
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

    Object.assign(carriedText.style, {
      position: "fixed",
      left: `${builderRect.left + navBuilder.offsetWidth / 2}px`,
      top: `${builderRect.top - 20}px`,
      color: "#a855f7",
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

      navBuilder.src = runFrames[frameIndex];
      navBuilder.style.left = `${x}px`;
      navBuilder.style.top = `${y}px`;
      navBuilder.style.transform = "scaleX(-1)";

      carriedText.style.left = `${x + navBuilder.offsetWidth / 2}px`;
      carriedText.style.top = `${y - 20}px`;

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

  /**
   * Plays the character's catching animation after
   * the navigation text reaches its destination.
   */
  function animateCatch(version) {
    const section = document.querySelector(
      selectedNavLink?.getAttribute("href"),
    );

    if (section && version === animationVersion) {
      section.classList.remove("hacker-section-glow");
      section.getBoundingClientRect();
      section.classList.add("hacker-section-glow");
    }
    let frameIndex = 0;

    activeTimer = setInterval(() => {
      if (version !== animationVersion) {
        clearInterval(activeTimer);
        return;
      }
      navBuilder.src = catchFrames[frameIndex];

      frameIndex++;

      if (frameIndex >= catchFrames.length) {
        clearInterval(activeTimer);
        activeTimer = null;
        returnWithText(version);
      }
    }, 120);
  }

  /**
   * Runs the character toward the selected navigation link.
   *
   * @param  link - The navigation link that was clicked.
   * @param version - The current animation version.
   */
  function runToNavLink(link, version) {
    const navRect = navBuilder.parentElement.getBoundingClientRect();
    const linkRect = link.getBoundingClientRect();

    const destination =
      linkRect.left - navRect.left - navBuilder.offsetWidth + 10;

    let position = Number.parseFloat(navBuilder.dataset.position);

    let frameIndex = 0;

    activeTimer = setInterval(() => {
      if (version !== animationVersion) {
        clearInterval(activeTimer);
        return;
      }

      const direction = destination >= position ? 1 : -1;

      position +=
        Math.min(navigationRunSpeed, Math.abs(destination - position)) *
        direction;

      navBuilder.src = runFrames[frameIndex];
      navBuilder.style.transform = `translateX(${position}px) scaleX(${direction})`;

      navBuilder.dataset.position = position;

      frameIndex = (frameIndex + 1) % runFrames.length;

      if (position === destination) {
        clearInterval(activeTimer);
        activeTimer = null;
        animateGrab(version);
      }
    }, navigationFrameDelay);
  }

  /**
   * Runs the character toward the About link and back
   * to its starting position.
   */
  function animateRun(version) {
    if (!aboutLink || version !== animationVersion) {
      return;
    }

    const navRect = navBuilder.parentElement.getBoundingClientRect();
    const aboutRect = aboutLink.getBoundingClientRect();

    const logoRect = navLogo.getBoundingClientRect();
    const startPosition = logoRect.left - navRect.left + jumpDistance;
    const destination = aboutRect.left - navRect.left - 48;

    let position = startPosition;
    let direction = 1;
    let frameIndex = 0;

    activeTimer = setInterval(() => {
      if (version !== animationVersion) {
        clearInterval(activeTimer);
        return;
      }

      position += runSpeed * direction;

      if (position >= destination) {
        position = destination;
        direction = -1;
      }

      if (position <= startPosition && direction === -1) {
        clearInterval(activeTimer);
        activeTimer = null;
        animateReturnJump(version);
        return;
      }

      navBuilder.src = runFrames[frameIndex];
      navBuilder.style.transform = `translateX(${position}px) scaleX(${direction})`;
      navBuilder.dataset.position = position;

      frameIndex = (frameIndex + 1) % runFrames.length;
    }, runFrameDelay);
  }

  /**
   * Jumps back into the navigation logo and restarts
   * the patrol after a short pause.
   */
  function animateReturnJump(version) {
    if (version !== animationVersion) {
      return;
    }

    const logoRect = navLogo.getBoundingClientRect();
    const navRect = navBuilder.parentElement.getBoundingClientRect();

    const logoPosition = logoRect.left - navRect.left;
    const startPosition = logoPosition + jumpDistance;

    let frameIndex = 0;

    activeTimer = setInterval(() => {
      if (version !== animationVersion) {
        clearInterval(activeTimer);
        return;
      }

      const progress = frameIndex / (jumpFrames.length - 1);

      const position = startPosition - progress * (jumpDistance + 45);
      const height = Math.sin(progress * Math.PI) * 35;

      navBuilder.src = jumpFrames[frameIndex];
      navBuilder.style.transform = `translate(${position}px, ${-height}px) scaleX(-1)`;

      frameIndex++;

      if (frameIndex >= jumpFrames.length) {
        clearInterval(activeTimer);
        activeTimer = null;

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
   * Displays the next jumping frame as the character
   * moves away from the navigation logo.
   */
  function animateJump(version) {
    if (version !== animationVersion) {
      return;
    }

    if (jumpFrameIndex >= jumpFrames.length) {
      animateRun(version);
      return;
    }

    const logoRect = navLogo.getBoundingClientRect();
    const navRect = navBuilder.parentElement.getBoundingClientRect();

    const startX = logoRect.left - navRect.left;
    const progress = jumpFrameIndex / (jumpFrames.length - 1);

    const horizontalMovement = progress * 65;
    const verticalMovement = Math.sin(progress * Math.PI) * 35;

    navBuilder.src = jumpFrames[jumpFrameIndex];
    navBuilder.style.opacity = "1";
    navBuilder.style.transform = `translate(
      ${startX + horizontalMovement}px,
      ${-verticalMovement}px
    )`;

    navBuilder.dataset.position = startX + horizontalMovement;

    jumpFrameIndex++;
    activeTimer = setTimeout(() => {
      activeTimer = null;
      animateJump(version);
    }, frameDelay);
  }
  if (!window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    animateJump(animationVersion);
  }
}
