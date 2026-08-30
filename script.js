document.addEventListener("DOMContentLoaded", () => {
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
                lightboxVideo.src = sourceVideo.dataset.srcDesktop || sourceVideo.currentSrc || sourceVideo.getAttribute("src");
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

    // On phones, swap demo videos to lightweight low-res variants before they
    // load — three 1080p loops decoding at once is what makes mobile stutter.
    // The lightbox still pulls the full-res desktop file (one stream, fine).
    if (window.matchMedia("(max-width: 768px)").matches) {
        document.querySelectorAll("video[data-src-mobile]").forEach((video) => {
            const desktop = video.getAttribute("src");
            if (desktop) video.dataset.srcDesktop = desktop;
            video.src = video.dataset.srcMobile;
        });
    }

    // Lazy-load gallery videos: fetch + play only when scrolled into view,
    // pause when off-screen. Keeps initial mobile load tiny and saves battery.
    const lazyVideos = document.querySelectorAll("video[data-lazy]");

    if (lazyVideos.length) {
        const playWhenVisible = (video) => {
            if (video.preload !== "auto") video.preload = "auto";
            const attempt = video.play();
            if (attempt && typeof attempt.catch === "function") attempt.catch(() => {});
        };

        if ("IntersectionObserver" in window) {
            const observer = new IntersectionObserver(
                (entries) => {
                    entries.forEach((entry) => {
                        const video = entry.target;
                        if (entry.isIntersecting) {
                            playWhenVisible(video);
                        } else {
                            video.pause();
                        }
                    });
                },
                { rootMargin: "200px 0px", threshold: 0.1 }
            );

            lazyVideos.forEach((video) => observer.observe(video));
        } else {
            // No IO support: just load + play everything (legacy fallback).
            lazyVideos.forEach(playWhenVisible);
        }
    }

    // Full product walkthrough: user-initiated playback (no autoplay) with a
    // custom YouTube-style control bar — play/pause, scrubbable progress,
    // timer, volume, fullscreen. A replay button surfaces when it ends.
    document.querySelectorAll("[data-walkthrough]").forEach((stage) => {
        const video = stage.querySelector("video");
        const playOverlay = stage.querySelector(".walkthrough-overlay--play");
        const replayOverlay = stage.querySelector(".walkthrough-replay-btn");
        if (!video || !playOverlay) return;

        video.controls = false;

        const playBtn = stage.querySelector(".wt-play");
        const muteBtn = stage.querySelector(".wt-mute");
        const fsBtn = stage.querySelector(".wt-fullscreen");
        const volSlider = stage.querySelector(".wt-volume-slider");
        const progress = stage.querySelector(".wt-progress");
        const played = stage.querySelector(".wt-progress-played");
        const buffered = stage.querySelector(".wt-progress-buffered");
        const thumb = stage.querySelector(".wt-progress-thumb");
        const curEl = stage.querySelector(".wt-time-current");
        const durEl = stage.querySelector(".wt-time-duration");

        const fmt = (t) => {
            if (!isFinite(t) || t < 0) t = 0;
            const m = Math.floor(t / 60);
            const s = Math.floor(t % 60);
            return m + ":" + String(s).padStart(2, "0");
        };

        // --- Auto-hide controls after inactivity while playing ---
        let idleTimer = null;
        const resetIdle = () => {
            stage.classList.remove("is-idle");
            if (idleTimer) clearTimeout(idleTimer);
            if (!video.paused && !video.ended) {
                idleTimer = setTimeout(() => {
                    if (!video.paused && !video.ended) stage.classList.add("is-idle");
                }, 2600);
            }
        };

        const start = () => {
            if (video.preload !== "auto") video.preload = "auto";
            stage.classList.add("is-started");
            stage.classList.remove("is-ended");
            const attempt = video.play();
            if (attempt && typeof attempt.catch === "function") attempt.catch(() => {});
        };
        const togglePlay = () => {
            if (video.paused || video.ended) start();
            else video.pause();
        };

        playOverlay.addEventListener("click", start);
        if (replayOverlay) {
            replayOverlay.addEventListener("click", () => {
                video.currentTime = 0;
                start();
            });
        }
        if (playBtn) playBtn.addEventListener("click", (e) => { e.stopPropagation(); togglePlay(); });
        video.addEventListener("click", () => { if (stage.classList.contains("is-started")) togglePlay(); });

        video.addEventListener("play", () => {
            stage.classList.add("is-playing", "is-started");
            stage.classList.remove("is-ended");
            resetIdle();
        });
        video.addEventListener("pause", () => {
            stage.classList.remove("is-playing", "is-idle");
        });
        video.addEventListener("ended", () => {
            stage.classList.add("is-ended");
            stage.classList.remove("is-playing", "is-idle");
        });

        // --- Time + progress ---
        video.addEventListener("loadedmetadata", () => {
            if (durEl) durEl.textContent = fmt(video.duration);
        });
        const renderProgress = () => {
            const d = video.duration || 0;
            const frac = d ? video.currentTime / d : 0;
            const pct = (frac * 100) + "%";
            if (played) played.style.width = pct;
            if (thumb) thumb.style.left = pct;
            if (curEl) curEl.textContent = fmt(video.currentTime);
            if (progress) progress.setAttribute("aria-valuenow", String(Math.round(frac * 100)));
        };
        video.addEventListener("timeupdate", renderProgress);
        video.addEventListener("progress", () => {
            if (!buffered || !video.buffered.length) return;
            const end = video.buffered.end(video.buffered.length - 1);
            const d = video.duration || 0;
            buffered.style.width = (d ? (end / d) * 100 : 0) + "%";
        });

        // --- Seek (click + drag) ---
        let scrubbing = false;
        const seekToClientX = (clientX) => {
            if (!progress) return;
            const rect = progress.getBoundingClientRect();
            let frac = (clientX - rect.left) / rect.width;
            frac = Math.min(1, Math.max(0, frac));
            if (video.duration) video.currentTime = frac * video.duration;
            const pct = (frac * 100) + "%";
            if (played) played.style.width = pct;
            if (thumb) thumb.style.left = pct;
        };
        if (progress) {
            progress.addEventListener("pointerdown", (e) => {
                e.stopPropagation();
                scrubbing = true;
                stage.classList.add("is-scrubbing");
                try { progress.setPointerCapture(e.pointerId); } catch (_) {}
                seekToClientX(e.clientX);
            });
            progress.addEventListener("pointermove", (e) => { if (scrubbing) seekToClientX(e.clientX); });
            const endScrub = (e) => {
                if (!scrubbing) return;
                scrubbing = false;
                stage.classList.remove("is-scrubbing");
                try { progress.releasePointerCapture(e.pointerId); } catch (_) {}
            };
            progress.addEventListener("pointerup", endScrub);
            progress.addEventListener("pointercancel", endScrub);
            progress.addEventListener("keydown", (e) => {
                if (!video.duration) return;
                if (e.key === "ArrowRight") { video.currentTime = Math.min(video.duration, video.currentTime + 5); e.preventDefault(); }
                else if (e.key === "ArrowLeft") { video.currentTime = Math.max(0, video.currentTime - 5); e.preventDefault(); }
            });
        }

        // --- Volume ---
        const updateVolUI = () => {
            const v = video.muted ? 0 : video.volume;
            stage.classList.toggle("is-muted", video.muted || video.volume === 0);
            if (volSlider) {
                volSlider.value = String(Math.round(v * 100));
                volSlider.style.setProperty("--vol", (v * 100) + "%");
            }
        };
        if (muteBtn) muteBtn.addEventListener("click", (e) => {
            e.stopPropagation();
            video.muted = !video.muted;
            updateVolUI();
        });
        if (volSlider) volSlider.addEventListener("input", (e) => {
            e.stopPropagation();
            const val = Number(volSlider.value) / 100;
            video.volume = val;
            video.muted = val === 0;
            updateVolUI();
        });
        video.addEventListener("volumechange", updateVolUI);

        // --- Fullscreen ---
        const fsElement = () => document.fullscreenElement || document.webkitFullscreenElement;
        const toggleFs = () => {
            if (fsElement() === stage) {
                (document.exitFullscreen || document.webkitExitFullscreen).call(document);
            } else if (stage.requestFullscreen || stage.webkitRequestFullscreen) {
                (stage.requestFullscreen || stage.webkitRequestFullscreen).call(stage);
            }
        };
        if (fsBtn) fsBtn.addEventListener("click", (e) => { e.stopPropagation(); toggleFs(); });
        video.addEventListener("dblclick", toggleFs);
        const onFsChange = () => stage.classList.toggle("is-fullscreen", fsElement() === stage);
        document.addEventListener("fullscreenchange", onFsChange);
        document.addEventListener("webkitfullscreenchange", onFsChange);

        // --- Idle / cursor reveal ---
        stage.addEventListener("pointermove", resetIdle);
        stage.addEventListener("pointerleave", () => {
            if (!video.paused && !video.ended) stage.classList.add("is-idle");
        });

        updateVolUI();
    });

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

/* ==========================================================================
   COMBIEN DE PLACES D'ACCES ANTICIPE RESTENT.
   Ajoute le 2026-08-31.

   Le nombre vient de Plugin-Seats-v1, une fonction cloud qui interroge Lemon
   Squeezy avec la cle API. CETTE CLE NE PEUT PAS DESCENDRE ICI : dans le
   JavaScript d'un site public, elle donnerait le controle de la boutique a
   quiconque ouvre l'inspecteur. Le navigateur ne recoit qu'un nombre.

   RIEN NE S'AFFICHE TANT QUE LE NOMBRE N'EST PAS SUR. Si la fonction est
   injoignable, ou repond `remaining: null`, l'emplacement reste cache et la
   carte lit simplement « Lifetime ». Un compteur invente pousse a l'achat sur
   une information fausse - pire que pas de compteur du tout.
   ========================================================================== */
(function () {
    var slot = document.querySelector("[data-seats]");
    if (!slot || !window.fetch) return;

    var ENDPOINT = "https://us-central1-go-atlas-441715.cloudfunctions.net/Plugin-Seats-v1";

    fetch(ENDPOINT, { mode: "cors", cache: "no-store" })
        .then(function (r) { return r.ok ? r.json() : null; })
        .then(function (data) {
            if (!data || typeof data.remaining !== "number") return;
            if (data.remaining <= 0) {
                slot.textContent = " (sold out)";
                slot.hidden = false;
                return;
            }
            slot.textContent = " (" + data.remaining + " remaining)";
            slot.hidden = false;
        })
        .catch(function () { /* silence voulu : la carte reste lisible sans le nombre */ });
})();
