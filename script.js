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

    document.querySelectorAll(".video-placeholder").forEach((ph) => {
        ph.addEventListener("click", (event) => {
            if (event.target.closest(".recording-brief")) return;
            const id = ph.dataset.videoId || "unknown";
            const brief = ph.parentElement && ph.parentElement.querySelector(".recording-brief");
            if (brief) brief.open = true;
            console.info(`[Go Atlas] Placeholder clicked: ${id}. Edit this video and replace the .video-placeholder with a <video> tag.`);
        });
    });
});
