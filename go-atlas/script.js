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
                slot.removeAttribute("data-pending"); slot.removeAttribute("aria-hidden");
                return;
            }
            slot.textContent = " (" + data.remaining + " remaining)";
            slot.removeAttribute("data-pending"); slot.removeAttribute("aria-hidden");
        })
        .catch(function () { /* silence voulu : la carte reste lisible sans le nombre */ });
})();

/* ==========================================================================
   LE PRIX PLEIN VIENT DE LEMON SQUEEZY, PAS D'UN CHIFFRE ECRIT ICI.
   Ajoute le 2026-09-16, meme source que le prix affiche dans la fenetre Go
   Atlas : license.getgoatlas.com, action get_prices, public et sans cle.

   LA REMISE FONDATEUR (-100 EUR) N'EST PAS LUE : Lemon Squeezy n'expose
   aucune API publique sur un code de reduction. Le prix plein arrive donc en
   direct, la remise reste calculee ici. Si le prix plein change dans Lemon
   Squeezy, la carte le suit tout seul ; si la remise change, ce fichier doit
   suivre a la main.
   ========================================================================== */
(function () {
    var fullEls = document.querySelectorAll("[data-price-full]"); // one plain, one struck through
    var earlyEl = document.querySelector("[data-price-early]");
    if (!fullEls.length || !earlyEl || !window.fetch) return;

    var FOUNDER_DISCOUNT_EUR = 100;
    var ENDPOINT = "https://license.getgoatlas.com";

    fetch(ENDPOINT, {
        method: "POST",
        mode: "cors",
        cache: "no-store",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "get_prices" })
    })
        .then(function (r) { return r.ok ? r.json() : null; })
        .then(function (data) {
            var early = data && data.prices && data.prices.earlyAccess;
            if (!early) return; // pas de prix sur : la carte garde le texte ecrit dans le HTML
            var full = Number(String(early).replace(/[^\d.]/g, ""));
            if (!full) return;
            fullEls.forEach(function (el) { el.textContent = "€" + full; });
            earlyEl.textContent = "€" + Math.max(0, full - FOUNDER_DISCOUNT_EUR);
        })
        .catch(function () { /* silence voulu : la carte garde le prix ecrit dans le HTML */ });
})();
