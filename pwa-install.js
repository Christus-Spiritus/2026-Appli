// PWA install helper (Android/Chrome + iOS instructions)
let deferredPrompt = null;

function $(id){ return document.getElementById(id); }

window.addEventListener("beforeinstallprompt", (e) => {
  // Chrome/Edge on Android
  e.preventDefault();
  deferredPrompt = e;
  const btn = $("installBtn");
  if(btn){
    btn.style.display = "inline-flex";
    btn.disabled = false;
  }
});

window.addEventListener("appinstalled", () => {
  deferredPrompt = null;
  const btn = $("installBtn");
  if(btn) btn.style.display = "none";
});

async function promptInstall(){
  if(!deferredPrompt){
    // iOS or already installed
    const ios = /iphone|ipad|ipod/i.test(navigator.userAgent);
    if(ios){
      alert("Sur iPhone/iPad : ouvre dans Safari → Partager → “Sur l’écran d’accueil”.");
    }else{
      alert("Installation non disponible ici. Essaie sur Chrome/Edge (Android) ou utilise “Ajouter à l’écran d’accueil”.");
    }
    return;
  }
  deferredPrompt.prompt();
  await deferredPrompt.userChoice;
  deferredPrompt = null;
  const btn = $("installBtn");
  if(btn) btn.style.display = "none";
}

// Expose for onclick
window.promptInstall = promptInstall;
