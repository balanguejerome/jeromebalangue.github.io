// Portfolio navigation, page transitions, and motion effects.
const PrintWebGLViewer = window.Print3D?.PrintWebGLViewer;
const navToggle = document.querySelector(".nav-toggle");
const sidebar = document.querySelector(".toc-sidebar");
const scrim = document.querySelector(".toc-scrim");
const navLabel = navToggle.querySelector(".sr-only");
const pageViews = [...document.querySelectorAll(".page-view")];
const pageLinks = [...sidebar.querySelectorAll('a[href^="#"]')];
const mobileSidebar = window.matchMedia("(max-width: 720px)");
const portfolioCharacters = [...document.querySelectorAll(".portfolio-title__character")];
const portfolioCursor = document.querySelector(".portfolio-title__cursor");
const aboutCopy = document.querySelector(".about-section__copy");
const educationSection = document.querySelector(".education-section");
const educationTimeline = document.querySelector(".education-timeline");
const educationTimelineItems = [...document.querySelectorAll(".education-timeline__item")];
const socialSection = document.querySelector(".social-section");
const socialSlides = [...document.querySelectorAll(".social-carousel__slide")];
const socialFilterButtons = [...document.querySelectorAll("[data-social-filter]")];
const socialPreviousButton = document.querySelector(".social-carousel__control--previous");
const socialNextButton = document.querySelector(".social-carousel__control--next");
const socialCurrentNumber = document.querySelector("[data-social-current]");
const socialTotalNumber = document.querySelector("[data-social-total]");
const socialLightbox = document.querySelector(".social-lightbox");
const socialLightboxImage = document.querySelector(".social-lightbox__image");
const socialLightboxCaption = document.querySelector("[data-social-lightbox-caption]");
const socialLightboxCurrent = document.querySelector("[data-social-lightbox-current]");
const socialLightboxTotal = document.querySelector("[data-social-lightbox-total]");
const socialLightboxClose = document.querySelector(".social-lightbox__close");
const socialLightboxBackdrop = document.querySelector(".social-lightbox__backdrop");
const socialLightboxPrevious = document.querySelector(".social-lightbox__control--previous");
const socialLightboxNext = document.querySelector(".social-lightbox__control--next");
const printSection = document.querySelector(".print-section");
const printObjects = [...document.querySelectorAll(".print-object")];
const printViewer = document.querySelector(".print-viewer");
const printViewerTitle = document.querySelector(".print-viewer__title");
const printViewerStage = document.querySelector(".print-viewer__stage");
const printViewerCanvas = document.querySelector(".print-viewer__webgl");
const printViewerRotator = document.querySelector(".print-viewer__rotator");
const printViewerModel = document.querySelector(".print-viewer__model");
const printViewerFront = document.querySelector(".print-viewer__image--front");
const printViewerBack = document.querySelector(".print-viewer__image--back");
const printViewerClose = document.querySelector(".print-viewer__close");
const printViewerBackdrop = document.querySelector(".print-viewer__backdrop");
const printViewerReset = document.querySelector(".print-viewer__reset");
const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
let lastTypedCharacter = null;
let aboutRevealFrame = null;
let educationTimelineFrame = null;
let educationLineProgress = 0;
let socialRevealFrame = null;
let socialActiveIndex = 0;
let socialActiveCategory = "all";
let socialLightboxIndex = 0;
let socialLightboxOpener = null;
let printViewerOpener = null;
let printWebGLViewer = null;
let printRotationX = -8;
let printRotationY = -18;
let printDragPointerId = null;
let printDragStartX = 0;
let printDragStartY = 0;
let printDragStartRotationX = 0;
let printDragStartRotationY = 0;
const educationRevealTimers = new Set();
let wheelDelta = 0;
let wheelResetTimer = null;
let pageNavigationLocked = false;

const WHEEL_NAVIGATION_THRESHOLD = 40;
const PAGE_NAVIGATION_LOCK_MS = 650;
const EDUCATION_REVEAL_POINT = 0.68;

if (printViewerCanvas) {
    try {
        printWebGLViewer = new PrintWebGLViewer(printViewerCanvas);
    } catch (error) {
        console.warn("WebGL 3D viewer could not be initialized.", error);
    }
}

const positionPortfolioCursor = (character) => {
    const cursorPosition = character ? character.offsetLeft + character.offsetWidth : 0;
    portfolioCursor.style.left = `${cursorPosition}px`;
};

const startPortfolioTyping = () => {
    if (reducedMotion.matches) {
        portfolioCharacters.forEach((character) => character.classList.add("is-typed"));
        return;
    }

    let characterIndex = 0;

    const typeNextCharacter = () => {
        if (characterIndex >= portfolioCharacters.length) return;

        lastTypedCharacter = portfolioCharacters[characterIndex];
        lastTypedCharacter.classList.add("is-typed");
        requestAnimationFrame(() => positionPortfolioCursor(lastTypedCharacter));
        characterIndex += 1;

        if (characterIndex === portfolioCharacters.length) {
            window.setTimeout(() => portfolioCursor.classList.add("is-finished"), 2000);
        } else {
            window.setTimeout(typeNextCharacter, 260);
        }
    };

    window.setTimeout(typeNextCharacter, 1500);
};

if (document.readyState === "complete") {
    startPortfolioTyping();
} else {
    window.addEventListener("load", startPortfolioTyping, { once: true });
}

window.addEventListener("resize", () => positionPortfolioCursor(lastTypedCharacter));

const syncSidebarAvailability = () => {
    const isHiddenMobileMenu = mobileSidebar.matches && sidebar.dataset.open !== "true";
    sidebar.inert = isHiddenMobileMenu;
    sidebar.setAttribute("aria-hidden", String(isHiddenMobileMenu));
};

const setSidebarOpen = (isOpen) => {
    sidebar.dataset.open = String(isOpen);
    navToggle.setAttribute("aria-expanded", String(isOpen));
    navLabel.textContent = isOpen ? "Close table of contents" : "Open table of contents";
    document.body.classList.toggle("nav-open", isOpen);
    syncSidebarAvailability();
};

const pageExists = (pageId) => pageViews.some((view) => view.dataset.page === pageId);
const pageNavigationOrder = pageLinks
    .map((link) => link.getAttribute("href").slice(1))
    .filter((pageId, index, pageIds) => pageExists(pageId) && pageIds.indexOf(pageId) === index);
const pageTitles = {
    home: "Jerome Balangue | Portfolio",
    "about-me": "About Me | Jerome Balangue",
    education: "Education | Jerome Balangue",
    "social-media-design": "Social Media Designs | Jerome Balangue",
    "print-marketing-materials": "Print & Marketing Materials | Jerome Balangue"
};
const cleanPageUrl = `${window.location.pathname}${window.location.search}`;
const PAGE_SCROLL_EDGE_TOLERANCE = 1;

const setAboutCopyVisible = (isVisible) => {
    if (aboutRevealFrame !== null) {
        window.cancelAnimationFrame(aboutRevealFrame);
        aboutRevealFrame = null;
    }

    aboutCopy.classList.remove("is-in-view");
    if (!isVisible) return;

    // Start from the clipped, left-shifted state after About is visible.
    void aboutCopy.offsetWidth;
    aboutRevealFrame = window.requestAnimationFrame(() => {
        aboutCopy.classList.add("is-in-view");
        aboutRevealFrame = null;
    });
};

const clearEducationRevealTimers = () => {
    educationRevealTimers.forEach((timer) => window.clearTimeout(timer));
    educationRevealTimers.clear();
};

const revealEducationItemsAtCurrentScroll = () => {
    if (
        !educationSection ||
        !educationTimeline ||
        !educationSection.classList.contains("is-active")
    ) return;

    const sectionRect = educationSection.getBoundingClientRect();
    const scrollTop = educationSection.scrollTop;
    const viewportBottom = scrollTop + educationSection.clientHeight;
    const scrollLimit = getPageScrollLimit(educationSection);
    const isAtTimelineEnd = scrollTop >= scrollLimit - PAGE_SCROLL_EDGE_TOLERANCE;
    const revealPoint = isAtTimelineEnd
        ? viewportBottom
        : scrollTop + educationSection.clientHeight * EDUCATION_REVEAL_POINT;
    const newlyReachedItems = educationTimelineItems.filter((item) => {
        if (item.classList.contains("is-revealed") || item.classList.contains("is-reveal-pending")) {
            return false;
        }

        const axis = item.querySelector(".education-timeline__axis");
        const axisRect = axis.getBoundingClientRect();
        const itemRect = item.getBoundingClientRect();
        const axisCenter = scrollTop + axisRect.top - sectionRect.top + axisRect.height / 2;
        const itemTop = scrollTop + itemRect.top - sectionRect.top;
        const itemBottom = itemTop + itemRect.height;
        const isInViewport = itemBottom >= scrollTop && itemTop <= viewportBottom;

        return isInViewport && axisCenter <= revealPoint;
    });

    newlyReachedItems.forEach((item, index) => {
        item.classList.add("is-reveal-pending");
        const timer = window.setTimeout(() => {
            item.classList.remove("is-reveal-pending");
            item.classList.add("is-revealed");
            educationRevealTimers.delete(timer);
        }, index * 180);
        educationRevealTimers.add(timer);
    });
};

const updateEducationTimeline = () => {
    educationTimelineFrame = null;
    if (
        !educationSection ||
        !educationTimeline ||
        !educationSection.classList.contains("is-active")
    ) return;

    if (reducedMotion.matches) {
        educationLineProgress = 1;
        educationTimeline.style.setProperty("--education-line-progress", "100%");
        educationTimelineItems.forEach((item) => item.classList.add("is-revealed"));
        return;
    }

    const revealPoint = educationSection.scrollTop
        + educationSection.clientHeight * EDUCATION_REVEAL_POINT;
    const timelineStart = educationTimeline.offsetTop;
    const drawableHeight = Math.max(1, educationTimeline.offsetHeight);
    const scrollLimit = getPageScrollLimit(educationSection);
    const isAtTimelineEnd = educationSection.scrollTop >= scrollLimit - PAGE_SCROLL_EDGE_TOLERANCE;
    const nextProgress = isAtTimelineEnd
        ? 1
        : Math.min(1, Math.max(0, (revealPoint - timelineStart) / drawableHeight));

    educationLineProgress = Math.max(educationLineProgress, nextProgress);
    educationTimeline.style.setProperty(
        "--education-line-progress",
        `${educationLineProgress * 100}%`
    );
    revealEducationItemsAtCurrentScroll();
};

const scheduleEducationTimelineUpdate = () => {
    if (educationTimelineFrame !== null) return;
    educationTimelineFrame = window.requestAnimationFrame(updateEducationTimeline);
};

const setEducationTimelineActive = (isActive) => {
    if (!educationTimeline) return;

    clearEducationRevealTimers();
    if (educationTimelineFrame !== null) {
        window.cancelAnimationFrame(educationTimelineFrame);
        educationTimelineFrame = null;
    }

    educationLineProgress = 0;
    educationTimeline.style.setProperty("--education-line-progress", "0%");
    educationTimelineItems.forEach((item) => {
        item.classList.remove("is-revealed", "is-reveal-pending");
    });

    if (!isActive) return;

    if (reducedMotion.matches) {
        updateEducationTimeline();
        return;
    }

    // Commit the empty state first so the vertical stroke visibly draws downward.
    void educationTimeline.offsetHeight;
    scheduleEducationTimelineUpdate();
};

const getFilteredSocialSlides = () => socialSlides.filter((slide) => {
    if (socialActiveCategory === "all") return true;
    return slide.dataset.socialCategory.split(" ").includes(socialActiveCategory);
});

const syncSocialSlideAspect = (slide) => {
    const image = slide.querySelector("img");
    if (!image?.naturalWidth || !image.naturalHeight) return;

    const aspectRatio = image.naturalWidth / image.naturalHeight;
    slide.style.setProperty("--social-aspect-ratio", `${image.naturalWidth} / ${image.naturalHeight}`);
    slide.classList.toggle("is-tall", aspectRatio < 0.68);
    slide.classList.toggle("is-square", aspectRatio >= 0.9 && aspectRatio <= 1.15);
    slide.classList.toggle("is-landscape", aspectRatio > 1.15);
};

const isSocialLightboxOpen = () => socialLightbox?.classList.contains("is-open");

const updateSocialLightbox = () => {
    const filteredSlides = getFilteredSocialSlides();
    const slideCount = filteredSlides.length;
    if (slideCount === 0) return;

    socialLightboxIndex = ((socialLightboxIndex % slideCount) + slideCount) % slideCount;
    const slide = filteredSlides[socialLightboxIndex];
    const image = slide.querySelector("img");

    socialLightboxImage.src = image.currentSrc || image.src;
    socialLightboxImage.alt = image.alt;
    socialLightboxImage.classList.remove("is-changing");
    void socialLightboxImage.offsetWidth;
    socialLightboxImage.classList.add("is-changing");
    socialLightboxCaption.textContent = image.alt;
    socialLightboxCurrent.textContent = String(socialLightboxIndex + 1).padStart(2, "0");
    socialLightboxTotal.textContent = String(slideCount).padStart(2, "0");
};

const openSocialLightbox = (slide) => {
    if (!socialLightbox) return;

    const filteredSlides = getFilteredSocialSlides();
    const selectedIndex = filteredSlides.indexOf(slide);
    if (selectedIndex < 0) return;

    socialLightboxIndex = selectedIndex;
    socialLightboxOpener = slide;
    updateSocialLightbox();
    socialLightbox.classList.add("is-open");
    socialLightbox.setAttribute("aria-hidden", "false");
    document.body.classList.add("social-lightbox-open");
    window.requestAnimationFrame(() => socialLightboxClose.focus());
};

const closeSocialLightbox = () => {
    if (!socialLightbox || !isSocialLightboxOpen()) return;

    socialLightbox.classList.remove("is-open");
    socialLightbox.setAttribute("aria-hidden", "true");
    document.body.classList.remove("social-lightbox-open");

    if (socialLightboxOpener?.isConnected) socialLightboxOpener.focus();
    socialLightboxOpener = null;
};

const moveSocialLightbox = (step) => {
    const slideCount = getFilteredSocialSlides().length;
    if (slideCount < 2 || step === 0) return;

    socialLightboxIndex = (socialLightboxIndex + step + slideCount) % slideCount;
    updateSocialLightbox();
};

const updateSocialCarousel = () => {
    const filteredSlides = getFilteredSocialSlides();
    const slideCount = filteredSlides.length;

    if (slideCount === 0) return;
    socialActiveIndex = ((socialActiveIndex % slideCount) + slideCount) % slideCount;

    socialSlides.forEach((slide) => {
        slide.dataset.position = "hidden";
        slide.setAttribute("aria-hidden", "true");
        slide.removeAttribute("aria-current");
        slide.tabIndex = -1;
    });

    filteredSlides.forEach((slide, index) => {
        let offset = index - socialActiveIndex;
        if (offset > slideCount / 2) offset -= slideCount;
        if (offset < slideCount / -2) offset += slideCount;

        const position = {
            "-2": "previous-far",
            "-1": "previous",
            0: "active",
            1: "next",
            2: "next-far"
        }[offset] || "hidden";

        slide.dataset.position = position;
        const isShown = position !== "hidden";
        slide.setAttribute("aria-hidden", String(!isShown));
        slide.tabIndex = isShown ? 0 : -1;
        slide.setAttribute("aria-current", position === "active" ? "true" : "false");
    });

    socialCurrentNumber.textContent = String(socialActiveIndex + 1).padStart(2, "0");
    socialTotalNumber.textContent = String(slideCount).padStart(2, "0");
};

const moveSocialCarousel = (step) => {
    const slideCount = getFilteredSocialSlides().length;
    if (slideCount < 2 || step === 0) return;

    socialActiveIndex = (socialActiveIndex + step + slideCount) % slideCount;
    updateSocialCarousel();
};

const setSocialGalleryActive = (isActive) => {
    if (!socialSection) return;

    if (socialRevealFrame !== null) {
        window.cancelAnimationFrame(socialRevealFrame);
        socialRevealFrame = null;
    }

    socialSection.classList.remove("is-gallery-ready");
    if (!isActive) {
        closeSocialLightbox();
        return;
    }

    updateSocialCarousel();
    if (reducedMotion.matches) {
        socialSection.classList.add("is-gallery-ready");
        return;
    }

    void socialSection.offsetWidth;
    socialRevealFrame = window.requestAnimationFrame(() => {
        socialSection.classList.add("is-gallery-ready");
        socialRevealFrame = null;
    });
};

const isPrintViewerOpen = () => printViewer?.classList.contains("is-open");

const getPrintDefaultRotation = (kind) => ({
    banner: { x: -5, y: -18 },
    card: { x: -13, y: -24 },
    gift: { x: -10, y: -20 },
    booth: { x: -7, y: -17 },
    flyer: { x: -12, y: -23 }
}[kind] || { x: -8, y: -18 });

const applyPrintViewerRotation = () => {
    if (!printViewerModel) return;

    printViewerModel.style.setProperty("--print-rotate-x", `${printRotationX}deg`);
    printViewerModel.style.setProperty("--print-rotate-y", `${printRotationY}deg`);

    if (printViewer?.classList.contains("is-webgl-model")) {
        printWebGLViewer?.setRotation(printRotationX, printRotationY);
    }
};

const resetPrintViewerRotation = () => {
    const defaults = getPrintDefaultRotation(printViewerModel?.dataset.kind);
    printRotationX = defaults.x;
    printRotationY = defaults.y;
    applyPrintViewerRotation();
};

const syncPrintViewerSize = () => {
    if (
        !printViewer ||
        !printViewerStage ||
        !printViewerFront?.naturalWidth ||
        !printViewerFront.naturalHeight
    ) return;

    const stageWidth = Math.max(180, printViewerStage.clientWidth);
    const stageHeight = Math.max(180, printViewerStage.clientHeight);
    const isCompact = mobileSidebar.matches;
    const kind = printViewerModel?.dataset.kind;
    const maximumWidth = stageWidth * (
        kind === "banner"
            ? (isCompact ? 0.86 : 0.56)
            : kind === "booth"
                ? (isCompact ? 1.12 : 0.82)
                : (isCompact ? 0.88 : 0.76)
    );
    const maximumHeight = stageHeight * (
        kind === "banner"
            ? (isCompact ? 0.76 : 0.84)
            : kind === "booth"
                ? (isCompact ? 0.72 : 0.75)
                : (isCompact ? 0.68 : 0.76)
    );
    const aspectRatio = kind === "banner"
        ? 0.72
        : kind === "booth"
            ? (isCompact ? 1.45 : 1.58)
            : printViewerFront.naturalWidth / printViewerFront.naturalHeight;
    const width = Math.min(maximumWidth, maximumHeight * aspectRatio);
    const height = width / aspectRatio;

    printViewer.style.setProperty("--print-viewer-width", `${Math.max(112, width)}px`);
    printViewer.style.setProperty("--print-viewer-height", `${Math.max(112, height)}px`);

    if (printViewer.classList.contains("is-webgl-model")) {
        printWebGLViewer?.resize(stageWidth, stageHeight);
    }
};

const openPrintViewer = (printObject) => {
    if (!printViewer || !printObject) return;

    const title = printObject.dataset.printTitle || "Print material";
    const frontSource = printObject.dataset.printImage;
    const backSource = printObject.dataset.printBack || frontSource;
    const kind = printObject.dataset.printKind || "card";

    closeSocialLightbox();
    printViewerOpener = printObject;
    printViewerTitle.textContent = title;
    printViewerFront.src = frontSource;
    printViewerFront.alt = `${title}, front view`;
    printViewerBack.src = backSource;
    printViewerBack.alt = `${title}, reverse view`;
    printViewerModel.dataset.kind = kind;
    const useWebGLModel = ["banner", "booth"].includes(kind) && printWebGLViewer?.isReady;
    printViewer.classList.toggle("is-webgl-model", Boolean(useWebGLModel));
    if (useWebGLModel) printWebGLViewer.setModel(kind, frontSource);
    printViewerRotator.setAttribute(
        "aria-label",
        `Draggable 3D model of ${title}`
    );
    resetPrintViewerRotation();

    printViewer.classList.add("is-open");
    printViewer.setAttribute("aria-hidden", "false");
    document.body.classList.add("print-viewer-open");
    syncPrintViewerSize();
    printViewerRotator.focus();
};

const closePrintViewer = () => {
    if (!printViewer || !isPrintViewerOpen()) return;

    printViewer.classList.remove("is-open");
    printViewer.setAttribute("aria-hidden", "true");
    document.body.classList.remove("print-viewer-open");
    printViewerRotator.classList.remove("is-dragging");
    printDragPointerId = null;

    if (printViewerOpener?.isConnected) printViewerOpener.focus();
    printViewerOpener = null;
};

const setPrintShowcaseActive = (isActive) => {
    if (!printSection) return;

    printSection.classList.remove("is-print-ready");
    if (!isActive) {
        closePrintViewer();
        return;
    }

    if (reducedMotion.matches) {
        printSection.classList.add("is-print-ready");
        return;
    }

    void printSection.offsetWidth;
    printSection.classList.add("is-print-ready");
};

const showPage = (requestedPage, shouldScroll = true) => {
    const pageId = pageExists(requestedPage) ? requestedPage : "home";

    pageViews.forEach((view) => {
        const isActive = view.dataset.page === pageId;
        view.classList.toggle("is-active", isActive);
        view.inert = !isActive;
        view.setAttribute("aria-hidden", String(!isActive));
    });

    pageLinks.forEach((link) => {
        const isCurrent = link.getAttribute("href") === `#${pageId}`;
        if (isCurrent) {
            link.setAttribute("aria-current", "page");
        } else {
            link.removeAttribute("aria-current");
        }
    });

    setAboutCopyVisible(pageId === "about-me");
    setEducationTimelineActive(pageId === "education");
    setSocialGalleryActive(pageId === "social-media-design");
    setPrintShowcaseActive(pageId === "print-marketing-materials");

    document.body.dataset.page = pageId;
    document.title = pageTitles[pageId] || pageTitles.home;

    if (shouldScroll) window.scrollTo({ top: 0, left: 0, behavior: "auto" });
};

const getPageScrollLimit = (page) => {
    if (window.getComputedStyle(page).overflowY === "hidden") return 0;
    return Math.max(0, page.scrollHeight - page.clientHeight);
};

const positionPageAtEntry = (pageId, direction) => {
    const page = pageViews.find((view) => view.dataset.page === pageId);
    if (!page) return;

    page.scrollTop = direction < 0 ? getPageScrollLimit(page) : 0;
    if (pageId === "education") scheduleEducationTimelineUpdate();
};

const navigateToPage = (pageId, direction = 0) => {
    if (!pageExists(pageId)) return;

    if (document.body.dataset.page !== pageId) {
        window.history.pushState({ page: pageId }, "", cleanPageUrl);
    }

    showPage(pageId);
    positionPageAtEntry(pageId, direction);
};

const lockPageNavigation = () => {
    pageNavigationLocked = true;
    window.setTimeout(() => {
        pageNavigationLocked = false;
    }, PAGE_NAVIGATION_LOCK_MS);
};

const navigateByStep = (step) => {
    if (pageNavigationLocked || step === 0) return false;

    const currentIndex = pageNavigationOrder.indexOf(document.body.dataset.page);
    const safeCurrentIndex = currentIndex >= 0 ? currentIndex : 0;
    const targetIndex = Math.min(
        pageNavigationOrder.length - 1,
        Math.max(0, safeCurrentIndex + step)
    );

    if (targetIndex === safeCurrentIndex) return false;

    navigateToPage(pageNavigationOrder[targetIndex], step);
    lockPageNavigation();
    return true;
};

const scrollActivePage = (delta) => {
    const activePage = pageViews.find((view) => view.classList.contains("is-active"));
    if (!activePage || delta === 0) return false;

    const scrollLimit = getPageScrollLimit(activePage);
    if (scrollLimit <= PAGE_SCROLL_EDGE_TOLERANCE) return false;

    const scrollingDown = delta > 0;
    const atStart = activePage.scrollTop <= PAGE_SCROLL_EDGE_TOLERANCE;
    const atEnd = activePage.scrollTop >= scrollLimit - PAGE_SCROLL_EDGE_TOLERANCE;

    if ((scrollingDown && atEnd) || (!scrollingDown && atStart)) return false;

    activePage.scrollTop = Math.min(
        scrollLimit,
        Math.max(0, activePage.scrollTop + delta)
    );
    return true;
};

navToggle.addEventListener("click", () => {
    setSidebarOpen(sidebar.dataset.open !== "true");
});

scrim.addEventListener("click", () => setSidebarOpen(false));

document.addEventListener("click", (event) => {
    if (
        sidebar.dataset.open === "true" &&
        !sidebar.contains(event.target) &&
        !navToggle.contains(event.target)
    ) {
        setSidebarOpen(false);
    }
});

pageLinks.forEach((link) => {
    link.addEventListener("click", (event) => {
        event.preventDefault();
        const pageId = link.getAttribute("href").slice(1);
        navigateToPage(pageId);
        setSidebarOpen(false);
    });
});

socialFilterButtons.forEach((button) => {
    button.addEventListener("click", () => {
        closeSocialLightbox();
        socialActiveCategory = button.dataset.socialFilter;
        socialActiveIndex = 0;

        socialFilterButtons.forEach((filterButton) => {
            const isActive = filterButton === button;
            filterButton.classList.toggle("is-active", isActive);
            filterButton.setAttribute("aria-pressed", String(isActive));
        });

        updateSocialCarousel();
    });
});

socialSlides.forEach((slide) => {
    const image = slide.querySelector("img");
    if (image.complete) {
        syncSocialSlideAspect(slide);
    } else {
        image.addEventListener("load", () => syncSocialSlideAspect(slide), { once: true });
    }

    slide.addEventListener("click", () => {
        const filteredSlides = getFilteredSocialSlides();
        const selectedIndex = filteredSlides.indexOf(slide);
        if (selectedIndex < 0) return;

        if (selectedIndex === socialActiveIndex) {
            openSocialLightbox(slide);
            return;
        }

        socialActiveIndex = selectedIndex;
        updateSocialCarousel();
    });
});

socialPreviousButton?.addEventListener("click", () => moveSocialCarousel(-1));
socialNextButton?.addEventListener("click", () => moveSocialCarousel(1));
socialLightboxClose?.addEventListener("click", closeSocialLightbox);
socialLightboxBackdrop?.addEventListener("click", closeSocialLightbox);
socialLightboxPrevious?.addEventListener("click", () => moveSocialLightbox(-1));
socialLightboxNext?.addEventListener("click", () => moveSocialLightbox(1));

printObjects.forEach((printObject) => {
    printObject.addEventListener("click", () => openPrintViewer(printObject));
});

printViewerClose?.addEventListener("click", closePrintViewer);
printViewerBackdrop?.addEventListener("click", closePrintViewer);
printViewerReset?.addEventListener("click", resetPrintViewerRotation);
printViewerFront?.addEventListener("load", syncPrintViewerSize);

printViewerRotator?.addEventListener("pointerdown", (event) => {
    if (event.button !== 0 || printDragPointerId !== null) return;

    event.preventDefault();
    printDragPointerId = event.pointerId;
    printDragStartX = event.clientX;
    printDragStartY = event.clientY;
    printDragStartRotationX = printRotationX;
    printDragStartRotationY = printRotationY;
    printViewerRotator.classList.add("is-dragging");
    printViewerRotator.setPointerCapture(event.pointerId);
});

printViewerRotator?.addEventListener("pointermove", (event) => {
    if (event.pointerId !== printDragPointerId) return;

    const horizontalDistance = event.clientX - printDragStartX;
    const verticalDistance = event.clientY - printDragStartY;
    printRotationY = printDragStartRotationY + horizontalDistance * 0.34;
    printRotationX = Math.max(
        -78,
        Math.min(78, printDragStartRotationX - verticalDistance * 0.3)
    );
    applyPrintViewerRotation();
});

const stopPrintViewerDrag = (event) => {
    if (event.pointerId !== printDragPointerId) return;

    if (printViewerRotator.hasPointerCapture(event.pointerId)) {
        printViewerRotator.releasePointerCapture(event.pointerId);
    }
    printViewerRotator.classList.remove("is-dragging");
    printDragPointerId = null;
};

printViewerRotator?.addEventListener("pointerup", stopPrintViewerDrag);
printViewerRotator?.addEventListener("pointercancel", stopPrintViewerDrag);

document.addEventListener("wheel", (event) => {
    if (event.ctrlKey) return;
    if (isSocialLightboxOpen() || isPrintViewerOpen()) {
        event.preventDefault();
        return;
    }
    if (
        sidebar.dataset.open === "true" &&
        event.target instanceof Element &&
        event.target.closest(".toc-sidebar__nav")
    ) return;

    event.preventDefault();
    if (pageNavigationLocked || event.deltaY === 0) return;

    const deltaMultiplier = event.deltaMode === WheelEvent.DOM_DELTA_LINE
        ? 16
        : event.deltaMode === WheelEvent.DOM_DELTA_PAGE
            ? window.innerHeight
            : 1;
    const normalizedDelta = event.deltaY * deltaMultiplier;

    if (scrollActivePage(normalizedDelta)) {
        wheelDelta = 0;
        window.clearTimeout(wheelResetTimer);
        return;
    }

    wheelDelta += normalizedDelta;
    window.clearTimeout(wheelResetTimer);
    wheelResetTimer = window.setTimeout(() => {
        wheelDelta = 0;
    }, 180);

    if (Math.abs(wheelDelta) < WHEEL_NAVIGATION_THRESHOLD) return;

    const direction = Math.sign(wheelDelta);
    wheelDelta = 0;
    navigateByStep(direction);
}, { passive: false });

window.addEventListener("popstate", (event) => {
    showPage(event.state?.page || "home");
});

document.addEventListener("keydown", (event) => {
    if (isPrintViewerOpen()) {
        if (event.key === "Tab") {
            const viewerControls = [
                printViewerRotator,
                printViewerReset,
                printViewerClose
            ].filter((control) => control && !control.disabled);
            const currentControlIndex = viewerControls.indexOf(document.activeElement);
            const nextControlIndex = event.shiftKey
                ? (currentControlIndex <= 0 ? viewerControls.length - 1 : currentControlIndex - 1)
                : (currentControlIndex >= viewerControls.length - 1 ? 0 : currentControlIndex + 1);

            event.preventDefault();
            viewerControls[nextControlIndex].focus();
            return;
        }

        if (event.key === "Escape") {
            event.preventDefault();
            closePrintViewer();
            return;
        }

        if (["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown"].includes(event.key)) {
            event.preventDefault();
            if (event.key === "ArrowLeft") printRotationY -= 8;
            if (event.key === "ArrowRight") printRotationY += 8;
            if (event.key === "ArrowUp") printRotationX = Math.min(78, printRotationX + 8);
            if (event.key === "ArrowDown") printRotationX = Math.max(-78, printRotationX - 8);
            applyPrintViewerRotation();
            return;
        }

        if (event.key === "Home") {
            event.preventDefault();
            resetPrintViewerRotation();
            return;
        }

        if (["PageUp", "PageDown"].includes(event.key)) {
            event.preventDefault();
            return;
        }
    }

    if (isSocialLightboxOpen()) {
        if (event.key === "Tab") {
            const lightboxControls = [
                socialLightboxClose,
                socialLightboxPrevious,
                socialLightboxNext
            ].filter((control) => control && !control.disabled);
            const currentControlIndex = lightboxControls.indexOf(document.activeElement);
            const nextControlIndex = event.shiftKey
                ? (currentControlIndex <= 0 ? lightboxControls.length - 1 : currentControlIndex - 1)
                : (currentControlIndex >= lightboxControls.length - 1 ? 0 : currentControlIndex + 1);

            event.preventDefault();
            lightboxControls[nextControlIndex].focus();
            return;
        }

        if (event.key === "Escape") {
            event.preventDefault();
            closeSocialLightbox();
            return;
        }

        if (event.key === "ArrowLeft" || event.key === "ArrowRight") {
            event.preventDefault();
            moveSocialLightbox(event.key === "ArrowRight" ? 1 : -1);
            return;
        }

        if (["ArrowUp", "ArrowDown", "PageUp", "PageDown"].includes(event.key)) {
            event.preventDefault();
            return;
        }
    }

    if (event.key === "Escape" && sidebar.dataset.open === "true") {
        setSidebarOpen(false);
        navToggle.focus();
        return;
    }

    if (
        event.defaultPrevented ||
        event.ctrlKey ||
        event.metaKey ||
        event.altKey ||
        (
            event.target instanceof Element &&
            event.target.matches("input, textarea, select, [contenteditable='true']")
        ) ||
        (
            sidebar.dataset.open === "true" &&
            event.target instanceof Element &&
            event.target.closest(".toc-sidebar")
        )
    ) return;

    if (
        document.body.dataset.page === "social-media-design" &&
        (event.key === "ArrowLeft" || event.key === "ArrowRight")
    ) {
        event.preventDefault();
        moveSocialCarousel(event.key === "ArrowRight" ? 1 : -1);
        return;
    }

    const keyNavigation = {
        ArrowDown: { direction: 1, distance: 72 },
        PageDown: { direction: 1, distance: window.innerHeight * 0.82 },
        ArrowUp: { direction: -1, distance: -72 },
        PageUp: { direction: -1, distance: window.innerHeight * -0.82 }
    }[event.key];

    if (!keyNavigation) return;

    event.preventDefault();
    if (scrollActivePage(keyNavigation.distance)) return;

    navigateByStep(keyNavigation.direction);
});

mobileSidebar.addEventListener("change", syncSidebarAvailability);
educationSection?.addEventListener("scroll", scheduleEducationTimelineUpdate, { passive: true });
window.addEventListener("resize", () => {
    if (isPrintViewerOpen()) syncPrintViewerSize();
});
reducedMotion.addEventListener("change", () => {
    setEducationTimelineActive(document.body.dataset.page === "education");
    setSocialGalleryActive(document.body.dataset.page === "social-media-design");
    setPrintShowcaseActive(document.body.dataset.page === "print-marketing-materials");
});
updateSocialCarousel();
const initialPage = window.location.hash.slice(1) || "home";
const initialPageId = pageExists(initialPage) ? initialPage : "home";
window.history.replaceState({ page: initialPageId }, "", cleanPageUrl);
showPage(initialPageId, false);
syncSidebarAvailability();
