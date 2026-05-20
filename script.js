document.addEventListener("DOMContentLoaded", () => {
    if (window.AOS) {
        AOS.init({ duration: 700, once: true, offset: 80 });
    }

    document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
        anchor.addEventListener("click", function (event) {
            const href = this.getAttribute("href");
            if (href.length <= 1) return;
            const target = document.querySelector(href);
            if (!target) return;
            event.preventDefault();
            target.scrollIntoView({ behavior: "smooth", block: "start" });
        });
    });

    const nav = document.querySelector(".nav");
    const navToggle = document.querySelector(".nav-toggle");

    if (nav && navToggle) {
        const closeNav = () => {
            nav.classList.remove("nav-open");
            navToggle.setAttribute("aria-expanded", "false");
        };

        navToggle.addEventListener("click", (event) => {
            event.stopPropagation();
            const isOpen = nav.classList.toggle("nav-open");
            navToggle.setAttribute("aria-expanded", isOpen ? "true" : "false");
        });

        document.addEventListener("click", (event) => {
            if (!event.target.closest(".nav-inner")) closeNav();
        });

        nav.querySelectorAll(".nav-menu a").forEach((link) => {
            link.addEventListener("click", closeNav);
        });

        window.addEventListener("resize", () => {
            if (window.innerWidth > 768) closeNav();
        });
    }

    const lightboxTriggers = document.querySelectorAll("[data-lightbox-video]");

    if (lightboxTriggers.length) {
        const lightbox = document.createElement("div");
        lightbox.className = "video-lightbox";
        lightbox.setAttribute("role", "dialog");
        lightbox.setAttribute("aria-modal", "true");
        lightbox.setAttribute("aria-label", "Expanded video preview");
        lightbox.innerHTML = `
            <button class="video-lightbox-close" type="button" aria-label="Close video preview">&times;</button>
            <video controls autoplay playsinline></video>
        `;
        document.body.appendChild(lightbox);

        const lightboxVideo = lightbox.querySelector("video");
        const closeButton = lightbox.querySelector(".video-lightbox-close");

        const closeLightbox = () => {
            lightbox.classList.remove("is-open");
            document.body.style.overflow = "";
            lightboxVideo.pause();
            lightboxVideo.removeAttribute("src");
            lightboxVideo.load();
        };

        lightboxTriggers.forEach((trigger) => {
            trigger.setAttribute("role", "button");
            trigger.setAttribute("tabindex", "0");
            trigger.setAttribute("aria-label", "Open video preview");

            const openLightbox = () => {
                const sourceVideo = trigger.querySelector("video");
                if (!sourceVideo) return;
                lightboxVideo.src = sourceVideo.currentSrc || sourceVideo.getAttribute("src");
                lightbox.classList.add("is-open");
                document.body.style.overflow = "hidden";
                lightboxVideo.play().catch(() => {});
            };

            trigger.addEventListener("click", openLightbox);
            trigger.addEventListener("keydown", (event) => {
                if (event.key !== "Enter" && event.key !== " ") return;
                event.preventDefault();
                openLightbox();
            });
        });

        closeButton.addEventListener("click", closeLightbox);
        lightbox.addEventListener("click", (event) => {
            if (event.target === lightbox) closeLightbox();
        });
        document.addEventListener("keydown", (event) => {
            if (event.key === "Escape" && lightbox.classList.contains("is-open")) {
                closeLightbox();
            }
        });
    }

    document.querySelectorAll(".video-placeholder").forEach((ph) => {
        ph.addEventListener("click", (event) => {
            if (ph.matches("[data-lightbox-video]")) return;
            if (event.target.closest(".recording-brief")) return;
            const id = ph.dataset.videoId || "unknown";
            const brief = ph.parentElement && ph.parentElement.querySelector(".recording-brief");
            if (brief) brief.open = true;
            console.info(`[Go Atlas] Placeholder clicked: ${id}. Edit this video and replace the .video-placeholder with a <video> tag.`);
        });
    });
});
