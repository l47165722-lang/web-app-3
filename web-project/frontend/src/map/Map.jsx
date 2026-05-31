import React, { useCallback, useEffect, useRef, useState } from 'react';
import './Map_style.css';
import {
  addCafeteriaMarkers,
  addMyLocationMarker,
  cafeteriaLocations,
  DEFAULT_LOCATION,
  fetchPedestrianRoute,
  FIT_BOUNDS_PADDING,
  GEOLOCATION_OPTIONS,
  latLng,
  MAP_ZOOM,
} from './mapUtils';

const NAVER_CLIENT_ID = process.env.REACT_APP_NAVER_MAP_CLIENT_ID;
const NAVER_SCRIPT_SELECTOR = 'script[data-naver-maps]';
const NAVER_SCRIPT_URL = `https://oapi.map.naver.com/openapi/v3/maps.js?ncpKeyId=${NAVER_CLIENT_ID}`;

const ERROR_MESSAGES = {
  missingApiKey: '네이버 지도 API 키가 없습니다.',
  scriptLoadFailed: '네이버 지도 스크립트를 불러오지 못했습니다.',
};

function Map() {
  const mapElement = useRef(null);
  const mapRef = useRef(null);
  const currentPolyline = useRef(null);
  const markersAndWindowsRef = useRef({});

  const [myLocation, setMyLocation] = useState(null);
  const [naverReady, setNaverReady] = useState(() => Boolean(window.naver?.maps));
  const [mapError, setMapError] = useState(null);
  const [selectedCafeteria, setSelectedCafeteria] = useState(null);

  const resizeMap = useCallback(() => {
    if (mapRef.current && window.naver?.maps) {
      window.naver.maps.Event.trigger(mapRef.current, 'resize');
    }
  }, []);

  const fitMapToRoute = useCallback((originPos, target, routePath = []) => {
    const map = mapRef.current;
    if (!map || !window.naver?.maps || !originPos || !target) return;

    const bounds = new window.naver.maps.LatLngBounds();
    bounds.extend(latLng(originPos.lat, originPos.lng));
    bounds.extend(latLng(target.lat, target.lng));
    routePath.forEach((point) => bounds.extend(point));
    map.fitBounds(bounds, FIT_BOUNDS_PADDING);
  }, []);

  const getPedestrianRoute = useCallback(
    (target, infoWindow, originPos) =>
      fetchPedestrianRoute(target, infoWindow, originPos, {
        mapRef,
        currentPolyline,
        fitMapToRoute,
      }),
    [fitMapToRoute]
  );

  const openCafeteriaRoute = useCallback(
    (loc, marker, infoWindow, map = mapRef.current) => {
      setSelectedCafeteria(loc.id);
      infoWindow.open(map, marker);
      getPedestrianRoute(loc, infoWindow, myLocation);
    },
    [getPedestrianRoute, myLocation]
  );

  // GPS 위치 조회
  useEffect(() => {
    if (!navigator.geolocation) {
      setMyLocation(DEFAULT_LOCATION);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      ({ coords }) => setMyLocation({ lat: coords.latitude, lng: coords.longitude }),
      () => setMyLocation(DEFAULT_LOCATION),
      GEOLOCATION_OPTIONS
    );
  }, []);

  // 네이버 지도 SDK 로드
  useEffect(() => {
    if (window.naver?.maps) {
      setNaverReady(true);
      return;
    }

    if (!NAVER_CLIENT_ID) {
      setMapError(ERROR_MESSAGES.missingApiKey);
      return;
    }

    const existingScript = document.querySelector(NAVER_SCRIPT_SELECTOR);
    if (existingScript) {
      existingScript.addEventListener('load', () => setNaverReady(true));
      return;
    }

    const script = document.createElement('script');
    script.src = NAVER_SCRIPT_URL;
    script.async = true;
    script.dataset.naverMaps = 'true';
    script.onload = () => setNaverReady(true);
    script.onerror = () => setMapError(ERROR_MESSAGES.scriptLoadFailed);
    document.head.appendChild(script);
  }, []);

  // 지도·마커 초기화
  useEffect(() => {
    const canInitMap =
      myLocation &&
      naverReady &&
      mapElement.current &&
      window.naver?.maps &&
      !mapRef.current;

    if (!canInitMap) return;

    const map = new window.naver.maps.Map(mapElement.current, {
      center: latLng(myLocation.lat, myLocation.lng),
      zoom: MAP_ZOOM,
    });
    mapRef.current = map;

    addMyLocationMarker(map, myLocation);

    const { refs, listeners } = addCafeteriaMarkers(map, cafeteriaLocations, (loc, marker, infoWindow) => {
      openCafeteriaRoute(loc, marker, infoWindow, map);
    });
    markersAndWindowsRef.current = refs;

    resizeMap();

    return () => {
      listeners.forEach((listener) => window.naver.maps.Event.removeListener(listener));
      if (currentPolyline.current) {
        currentPolyline.current.setMap(null);
        currentPolyline.current = null;
      }
      mapRef.current = null;
      markersAndWindowsRef.current = {};
    };
  }, [myLocation, naverReady, openCafeteriaRoute, resizeMap]);

  // 창 크기 변경 시 지도 리사이즈
  useEffect(() => {
    resizeMap();
    window.addEventListener('resize', resizeMap);
    return () => window.removeEventListener('resize', resizeMap);
  }, [resizeMap, naverReady]);

  const handleCafeteriaSelect = (targetId) => {
    const targetData = markersAndWindowsRef.current[targetId];
    const locInfo = cafeteriaLocations.find((loc) => loc.id === targetId);
    if (!targetData || !locInfo || !mapRef.current) return;

    const { marker, infoWindow } = targetData;
    openCafeteriaRoute(locInfo, marker, infoWindow);
  };

  const handleMyLocation = () => {
    if (!mapRef.current || !myLocation) return;
    mapRef.current.setCenter(latLng(myLocation.lat, myLocation.lng));
    mapRef.current.setZoom(MAP_ZOOM);
  };

  const showMap = myLocation && !mapError && naverReady;

  return (
    <div className="map-page">
      <aside className="map-sidebar">
        <div className="map-panel-brand">
          <img
            src={`${process.env.PUBLIC_URL}/keimyung-logo.png`}
            alt="계명대학교"
            className="map-brand-logo"
          />
        </div>

        <div className="map-tab-body">
          <div className="map-panel-header">
            <span className="map-panel-label">Cafeteria</span>
            <span className="map-panel-title">학식당</span>
            <span className="map-panel-desc">식당을 선택하면 경로가 표시됩니다.</span>
          </div>

          <div className="map-tab-content">
            <p className="map-section-title">식당 선택</p>

            <div className="map-cafeteria-list">
              {cafeteriaLocations.map((loc) => {
                const isSelected = selectedCafeteria === loc.id;
                return (
                  <button
                    key={loc.id}
                    type="button"
                    className={`map-cafeteria-btn${isSelected ? ' map-cafeteria-btn--selected' : ''}`}
                    onClick={() => handleCafeteriaSelect(loc.id)}
                  >
                    <span className="map-cafeteria-btn__name">{loc.label || loc.name}</span>
                  </button>
                );
              })}
            </div>

            {showMap && (
              <button type="button" className="map-location-btn" onClick={handleMyLocation}>
                내 위치로 이동
              </button>
            )}
          </div>
        </div>
      </aside>

      <div className="map-area">
        {!myLocation && <div className="map-status">실시간 GPS 위치를 확인하고 있습니다...</div>}
        {mapError && <div className="map-status map-status--error">{mapError}</div>}
        {myLocation && !mapError && !naverReady && (
          <div className="map-status">네이버 지도를 불러오는 중...</div>
        )}
        <div
          ref={mapElement}
          className={showMap ? 'map-container' : 'map-container map-container--hidden'}
        />
      </div>
    </div>
  );
}

export default Map;
