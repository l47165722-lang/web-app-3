// [필수] 상수
export const cafeteriaLocations = [
  { id: 'gongdae', name: '공대 식당', label: '공대 식당', lat: 35.8584, lng: 128.4893 },
  { id: 'guba', name: '구바', lat: 35.8543, lng: 128.4861 },
  { id: 'shinba', name: '신바', lat: 35.8540, lng: 128.4856 },
  { id: 'aram', name: '아람관', lat: 35.8541, lng: 128.4826 },
];

export const DEFAULT_LOCATION = { lat: 35.8564, lng: 128.4938 };
export const MAP_ZOOM = 17;
export const FIT_BOUNDS_PADDING = { top: 48, right: 48, bottom: 48, left: 48 };
export const MOBILE_FIT_BOUNDS_PADDING = { top: 48, right: 48, bottom: 240, left: 48 };
export const MOBILE_BREAKPOINT = 768;
export const GEOLOCATION_OPTIONS = { enableHighAccuracy: true, timeout: 7000, maximumAge: 0 };

export function getFitBoundsPadding() {
  if (window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT}px)`).matches) {
    return MOBILE_FIT_BOUNDS_PADDING;
  }
  return FIT_BOUNDS_PADDING;
}

export const NAVER_CLIENT_ID = process.env.REACT_APP_NAVER_MAP_CLIENT_ID;
export const NAVER_SCRIPT_SELECTOR = 'script[data-naver-maps]';
export const NAVER_SCRIPT_URL = `https://oapi.map.naver.com/openapi/v3/maps.js?ncpKeyId=${NAVER_CLIENT_ID}`;

export const API_ERROR_MESSAGE = '일시적인 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.';

const TMAP_KEY = 'NhPEBpY4iC2XVJJFxYttUaB27IAi9vwd216HB3nw';
const TMAP_URL = 'https://apis.openapi.sk.com/tmap/routes/pedestrian?version=1&callback=function';
const ROUTE_STYLE = { strokeColor: '#3b82f6', strokeOpacity: 0.8, strokeWeight: 6 };

// [필수] 좌표 변환
export function latLng(lat, lng) {
  return new window.naver.maps.LatLng(lat, lng);
}

// [필수] GPS 조회
export function fetchMyLocation(onSuccess, onFallback) {
  if (!navigator.geolocation) {
    onFallback(DEFAULT_LOCATION);
    return;
  }

  navigator.geolocation.getCurrentPosition(
    function ({ coords }) {
      onSuccess({ lat: coords.latitude, lng: coords.longitude });
    },
    function () {
      onFallback(DEFAULT_LOCATION);
    },
    GEOLOCATION_OPTIONS
  );
}

// [필수] 네이버 SDK 로드
export function loadNaverMapsScript(onReady, onError) {
  if (window.naver?.maps) {
    onReady();
    return;
  }

  if (!NAVER_CLIENT_ID) {
    onError(API_ERROR_MESSAGE);
    return;
  }

  const existingScript = document.querySelector(NAVER_SCRIPT_SELECTOR);
  if (existingScript) {
    existingScript.addEventListener('load', onReady);
    return;
  }

  const script = document.createElement('script');
  script.src = NAVER_SCRIPT_URL;
  script.async = true;
  script.dataset.naverMaps = 'true';
  script.onload = onReady;
  script.onerror = function () {
    onError(API_ERROR_MESSAGE);
  };
  document.head.appendChild(script);
}

// [필수] 지도 초기화 조건
export function canInitMap(myLocation, naverReady, mapElement, mapRef) {
  return Boolean(myLocation && naverReady && mapElement && window.naver?.maps && !mapRef.current);
}

// [필수] 지도 + 마커 생성
export function initMapWithMarkers(mapElement, myLocation, mapRef, markersAndWindowsRef, onMarkerClick) {
  const map = new window.naver.maps.Map(mapElement, {
    center: latLng(myLocation.lat, myLocation.lng),
    zoom: MAP_ZOOM,
  });
  mapRef.current = map;
  addMyLocationMarker(map, myLocation);

  const { refs, listeners } = addCafeteriaMarkers(map, cafeteriaLocations, onMarkerClick);
  markersAndWindowsRef.current = refs;

  return { map, listeners };
}

// [필수] 지도 정리
export function cleanupMap(listeners, currentPolyline, mapRef, markersAndWindowsRef) {
  listeners.forEach(function (listener) {
    window.naver.maps.Event.removeListener(listener);
  });
  if (currentPolyline.current) {
    currentPolyline.current.setMap(null);
    currentPolyline.current = null;
  }
  mapRef.current = null;
  markersAndWindowsRef.current = {};
}

// [필수] 경로 API + Polyline + fitBounds
export async function fetchPedestrianRoute(
  target,
  infoWindow,
  originPos,
  { mapRef, currentPolyline, fitBoundsPadding, setMapError }
) {
  if (!mapRef.current || !originPos) return;

  try {
    const res = await fetch(TMAP_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', appKey: TMAP_KEY },
      body: JSON.stringify(tmapRequestBody(originPos, target)),
    });
    if (!res.ok) {
      showApiFailure(infoWindow, setMapError);
      return;
    }

    const { features } = await res.json();
    if (!features || !features[0] || !features[0].properties) {
      showApiFailure(infoWindow, setMapError);
      return;
    }

    const routePath = parseRoutePath(features);
    const { totalDistance: distance, totalTime } = features[0].properties;

    infoWindow.setContent(infoWindowRouteContent(target.name, Math.ceil(totalTime / 60), distance));
    drawPolyline(mapRef, currentPolyline, routePath);
    fitBoundsToRoute(mapRef.current, originPos, target, routePath, fitBoundsPadding);
  } catch (err) {
    console.error('Route error:', err);
    showApiFailure(infoWindow, setMapError);
  }
}

// [필수] 식당 선택 → 경로 표시
export function openCafeteriaRoute(
  loc,
  marker,
  infoWindow,
  map,
  myLocation,
  mapRef,
  currentPolyline,
  fitBoundsPadding,
  setSelectedCafeteria,
  setMapError
) {
  setMapError(null);
  setSelectedCafeteria(loc.id);
  infoWindow.open(map, marker);
  fetchPedestrianRoute(loc, infoWindow, myLocation, {
    mapRef,
    currentPolyline,
    fitBoundsPadding,
    setMapError,
  });
}

// [필수] 버튼 클릭 시 식당 선택
export function selectCafeteria(
  targetId,
  markersAndWindowsRef,
  mapRef,
  myLocation,
  currentPolyline,
  fitBoundsPadding,
  setSelectedCafeteria,
  setMapError
) {
  const targetData = markersAndWindowsRef.current[targetId];
  const locInfo = cafeteriaLocations.find(function (loc) {
    return loc.id === targetId;
  });
  if (!targetData || !locInfo || !mapRef.current) return;

  const { marker, infoWindow } = targetData;
  openCafeteriaRoute(
    locInfo,
    marker,
    infoWindow,
    mapRef.current,
    myLocation,
    mapRef,
    currentPolyline,
    fitBoundsPadding,
    setSelectedCafeteria,
    setMapError
  );
}

// --- 내부 헬퍼 (필수) ---
function fitBoundsToRoute(map, originPos, target, routePath, padding) {
  if (!map || !window.naver?.maps || !originPos || !target) return;
  const bounds = new window.naver.maps.LatLngBounds();
  bounds.extend(latLng(originPos.lat, originPos.lng));
  bounds.extend(latLng(target.lat, target.lng));
  routePath.forEach(function (point) {
    bounds.extend(point);
  });
  map.fitBounds(bounds, padding);
}

function addMyLocationMarker(map, { lat, lng }) {
  return new window.naver.maps.Marker({
    position: latLng(lat, lng),
    map,
    icon: {
      content: '<div class="map-my-location-marker"></div>',
      anchor: new window.naver.maps.Point(7, 7),
    },
  });
}

function addCafeteriaMarkers(map, locations, onClick) {
  const refs = {};
  const listeners = locations.map(function (loc) {
    const marker = new window.naver.maps.Marker({
      position: latLng(loc.lat, loc.lng),
      map,
      title: loc.name,
    });
    const infoWindow = new window.naver.maps.InfoWindow({
      content: infoWindowLoadingContent(loc.name),
    });
    refs[loc.id] = { marker, infoWindow };
    return window.naver.maps.Event.addListener(marker, 'click', function () {
      onClick(loc, marker, infoWindow);
    });
  });
  return { refs, listeners };
}

function coordToLatLng([lng, lat]) {
  return latLng(lat, lng);
}

function infoHtml(name, body) {
  return `<div class="map-info-window"><b>${name}</b><br/>${body}</div>`;
}

function infoWindowLoadingContent(name) {
  return infoHtml(name, '경로 탐색 중...');
}

function infoWindowRouteContent(name, time, distance) {
  return infoHtml(
    name,
    `⏱️ 소요시간: <span class="map-info-window__highlight">${time}분</span><br/>📏 총거리: ${distance}m`
  );
}

function infoWindowErrorContent() {
  return `<div class="map-info-window">${API_ERROR_MESSAGE}</div>`;
}

function showApiFailure(infoWindow, setMapError) {
  if (setMapError) setMapError(API_ERROR_MESSAGE);
  if (infoWindow) infoWindow.setContent(infoWindowErrorContent());
}

function parseRoutePath(features) {
  return features.flatMap(function ({ geometry }) {
    if (geometry.type === 'Point') {
      return [coordToLatLng(geometry.coordinates)];
    }
    if (geometry.type === 'LineString') {
      return geometry.coordinates.map(coordToLatLng);
    }
    return [];
  });
}

function drawPolyline(mapRef, lineRef, path) {
  if (lineRef.current) lineRef.current.setMap(null);
  lineRef.current = new window.naver.maps.Polyline({ map: mapRef.current, path, ...ROUTE_STYLE });
}

function tmapRequestBody(origin, target) {
  return {
    startX: String(origin.lng),
    startY: String(origin.lat),
    endX: String(target.lng),
    endY: String(target.lat),
    reqCoordType: 'WGS84GEO',
    resCoordType: 'WGS84GEO',
    startName: '내 위치',
    endName: target.name,
  };
}

/*
// [선택] SDK 준비 여부 — useState 초기값에서 직접 사용
export function isNaverMapsReady() {
  return Boolean(window.naver?.maps);
}

// [선택] 지도 표시 여부 — JSX에서 직접 계산
export function isMapVisible(myLocation, mapError, naverReady) {
  return Boolean(myLocation && !mapError && naverReady);
}

// [선택] 지도 리사이즈 — 창 크기 변경 시
export function resizeMapInstance(mapRef) {
  if (mapRef.current && window.naver?.maps) {
    window.naver.maps.Event.trigger(mapRef.current, 'resize');
  }
}

// [선택] PC 전용 — 내 위치로 이동 버튼
export function moveToMyLocation(mapRef, myLocation) {
  if (!mapRef.current || !myLocation) return;
  mapRef.current.setCenter(latLng(myLocation.lat, myLocation.lng));
  mapRef.current.setZoom(MAP_ZOOM);
}

// [선택] initMapWithMarkers 내부로 통합됨
export function createMapInstance(mapElement, myLocation) {
  return new window.naver.maps.Map(mapElement, {
    center: latLng(myLocation.lat, myLocation.lng),
    zoom: MAP_ZOOM,
  });
}

// [선택] selectCafeteria 내부로 통합됨
export function findCafeteriaById(targetId) {
  return cafeteriaLocations.find(function (loc) {
    return loc.id === targetId;
  });
}
*/

// [선택] resize — 주석 처리 시 창 크기 변경 대응 약함
export function resizeMapInstance(mapRef) {
  if (mapRef.current && window.naver?.maps) {
    window.naver.maps.Event.trigger(mapRef.current, 'resize');
  }
}

// [선택] PC — 내 위치로 이동
export function moveToMyLocation(mapRef, myLocation) {
  if (!mapRef.current || !myLocation) return;
  mapRef.current.setCenter(latLng(myLocation.lat, myLocation.lng));
  mapRef.current.setZoom(MAP_ZOOM);
}
