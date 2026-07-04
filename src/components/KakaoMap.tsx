import { useEffect, useRef, useState } from 'react';
import { loadKakaoMaps } from '../lib/kakaoMap';
import type { Address } from '../types';

interface KakaoMapProps {
  center: { lat: number; lng: number };
  addresses: Address[];
  selectedAddressId?: string;
  onSelectAddress?: (address: Address) => void;
  onMapClick?: (coords: { lat: number; lng: number }) => void;
  height?: string;
}

export function KakaoMap({
  center,
  addresses,
  selectedAddressId,
  onSelectAddress,
  onMapClick,
  height = '360px',
}: KakaoMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const markersRef = useRef<any[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    loadKakaoMaps()
      .then(() => {
        if (cancelled || !containerRef.current) return;
        const { kakao } = window;
        const map = new kakao.maps.Map(containerRef.current, {
          center: new kakao.maps.LatLng(center.lat, center.lng),
          level: 4,
        });
        mapRef.current = map;
        if (onMapClick) {
          kakao.maps.event.addListener(map, 'click', (e: any) => {
            onMapClick({ lat: e.latLng.getLat(), lng: e.latLng.getLng() });
          });
        }
        setError(null);
      })
      .catch((err) => setError(err.message));

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Recenter when center prop changes
  useEffect(() => {
    if (!mapRef.current || !window.kakao) return;
    mapRef.current.setCenter(new window.kakao.maps.LatLng(center.lat, center.lng));
  }, [center.lat, center.lng]);

  // Redraw markers when addresses change
  useEffect(() => {
    if (!mapRef.current || !window.kakao) return;
    const { kakao } = window;

    markersRef.current.forEach((m) => m.setMap(null));
    markersRef.current = [];

    addresses.forEach((addr) => {
      const isSelected = addr.id === selectedAddressId;
      const marker = new kakao.maps.Marker({
        position: new kakao.maps.LatLng(addr.lat, addr.lng),
        map: mapRef.current,
        image: isSelected
          ? new kakao.maps.MarkerImage(
              'data:image/svg+xml;base64,' +
                btoa(
                  '<svg xmlns="http://www.w3.org/2000/svg" width="32" height="40"><path d="M16 0C7.163 0 0 7.163 0 16c0 11 16 24 16 24s16-13 16-24C32 7.163 24.837 0 16 0z" fill="%23e53e3e"/><circle cx="16" cy="16" r="6" fill="white"/></svg>'.replace(
                    /%23/g,
                    '#'
                  )
                ),
              new kakao.maps.Size(32, 40)
            )
          : undefined,
      });
      if (onSelectAddress) {
        kakao.maps.event.addListener(marker, 'click', () => onSelectAddress(addr));
      }
      markersRef.current.push(marker);
    });
  }, [addresses, selectedAddressId, onSelectAddress]);

  if (error) {
    return (
      <div className="kakao-map-error" style={{ height }}>
        {error}
      </div>
    );
  }

  return <div ref={containerRef} style={{ width: '100%', height }} />;
}
