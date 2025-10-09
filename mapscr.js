function initWhenReady() {
  if (window.mappls) return initMap();
  const sdkScript = document.querySelector('script[src*="mappls"]');
  if (sdkScript) {
    sdkScript.addEventListener('load', initMap);
  } else {
    const interval = setInterval(() => {
      if (window.mappls) { clearInterval(interval); initMap(); }
    }, 100);
  }
}
initWhenReady();
function initWhenReady() {
  if (window.mappls) return initMap();
  const sdkScript = document.querySelector('script[src*="mappls"]');
  if (sdkScript) {
    sdkScript.addEventListener('load', initMap);
  } else {
    const interval = setInterval(() => {
      if (window.mappls) { clearInterval(interval); initMap(); }
    }, 100);
  }
}
initWhenReady();
