/** Script anti-FOUC. Solo se inyecta desde el layout (Server Component). */
export const THEME_INIT_SCRIPT = `(function(){try{var t=localStorage.getItem("theme")||"dark";var r=t==="system"?(window.matchMedia("(prefers-color-scheme: dark)").matches?"dark":"light"):t;var d=document.documentElement;d.classList.remove("light","dark");d.classList.add(r);d.style.colorScheme=r;}catch(e){}})();`;
