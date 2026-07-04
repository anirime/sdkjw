declare global {
  interface Window {
    kakao: any;
  }
}

let loadPromise: Promise<void> | undefined;

/** Loads the Kakao Maps JS SDK once and resolves when it is ready to use. */
export function loadKakaoMaps(): Promise<void> {
  if (loadPromise) return loadPromise;

  const appKey = import.meta.env.VITE_KAKAO_MAP_APP_KEY;

  loadPromise = new Promise((resolve, reject) => {
    if (!appKey) {
      reject(new Error('VITE_KAKAO_MAP_APP_KEY가 설정되지 않았습니다. .env 파일을 확인하세요.'));
      return;
    }
    if (window.kakao?.maps) {
      resolve();
      return;
    }
    const script = document.createElement('script');
    script.src = `https://dapi.kakao.com/v2/maps/sdk.js?appkey=${appKey}&autoload=false&libraries=services`;
    script.async = true;
    script.onload = () => window.kakao.maps.load(() => resolve());
    script.onerror = () => reject(new Error('카카오맵 SDK를 불러오지 못했습니다.'));
    document.head.appendChild(script);
  });

  return loadPromise;
}
