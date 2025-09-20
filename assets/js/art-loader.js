/*
  art-loader.js
  ND-safe hero art loader that keeps PNG masters offline and serves WEBP only.
  The manifest is fetched without caching so Netlify cannot revive forbidden assets.
*/

function readJson(url){
  return fetch(url, { cache: "no-store" })
    .then(res => (res.ok ? res.json() : null))
    .catch(() => null);
}

function notify(host, detail){
  if (!host) return;
  host.dispatchEvent(new CustomEvent("hero-status", { detail }));
}

function createHeroImage(hero){
  const img = new Image();
  img.loading = "eager"; // ND-safe: immediate paint, no lazy motion.
  img.decoding = "async"; // Allows main thread to remain calm.
  img.src = hero.src;
  img.alt = hero.alt || "";
  if (hero.width) img.width = hero.width;
  if (hero.height) img.height = hero.height;
  return img;
}

export async function mountArt(){
  const host = document.getElementById("hero-art");
  if (!host) return "no-host";

  const manifest = await readJson("/assets/art/manifest.json");
  if (!manifest || !manifest.hero || !manifest.hero.src){
    host.dataset.status = "manifest-missing";
    host.textContent = "Hero art offline — WEBP manifest absent.";
    notify(host, "manifest-missing");
    return "manifest-missing";
  }

  const heroImage = createHeroImage(manifest.hero);
  heroImage.addEventListener("error", () => {
    host.dataset.status = "hero-error";
    host.textContent = "Hero art unavailable — WEBP asset missing.";
    notify(host, "hero-error");
  }, { once: true });

  host.innerHTML = "";
  host.append(heroImage);
  host.dataset.status = "mounted";
  notify(host, "mounted");
  return "mounted";
}
