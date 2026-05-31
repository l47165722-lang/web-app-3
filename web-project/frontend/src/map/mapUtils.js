export const cafeteriaLocations = [
  { id: 'gongdae', name: '공식당', label: '공대 식당', lat: 35.8584, lng: 128.4893 },
  { id: 'guba', name: '구바', lat: 35.8543, lng: 128.4861 },
  { id: 'shinba', name: '신바', lat: 35.8540, lng: 128.4856 },
  { id: 'aram', name: '아람관', lat: 35.8541, lng: 128.4826 },
];

export const DEFAULT_LOCATION = { lat: 35.8564, lng: 128.4938 };
export const MAP_ZOOM = 17;
export const FIT_BOUNDS_PADDING = { top: 48, right: 48, bottom: 48, left: 48 };
export const GEOLOCATION_OPTIONS = { enableHighAccuracy: true, timeout: 7000, maximumAge: 0 };

const TMAP_KEY = 'NhPEBpY4iC2XVJJFxYttUaB27IAi9vwd216HB3nw';
const TMAP_URL = 'https://apis.openapi.sk.com/tmap/routes/pedestrian?version=1&callback=function';
const ROUTE_STYLE = { strokeColor: '#3b82f6', strokeOpacity: 0.8, strokeWeight: 6 };

export const latLng = (lat, lng) => new window.naver.maps.LatLng(lat, lng);
const coordToLatLng = ([lng, lat]) => latLng(lat, lng);

const infoHtml = (name, body) => `<div class="map-info-window"><b>${name}</b><br/>${body}</div>`;
export const infoWindowLoadingContent = (name) => infoHtml(name, '경로 탐색 중...');
export const infoWindowRouteContent = (name, time, distance) =>
  infoHtml(name, `⏱️ 소요시간: <span class="map-info-window__highlight">${time}분</span><br/>📏 총거리: ${distance}m`);

export function addMyLocationMarker(map, { lat, lng }) {
  return new window.naver.maps.Marker({
    position: latLng(lat, lng),
    map,
    icon: {
      content: '<div class="map-my-location-marker"></div>',
      anchor: new window.naver.maps.Point(7, 7),
    },
  });
}

export function addCafeteriaMarkers(map, locations, onClick) {
  const refs = {};
  const listeners = locations.map((loc) => {
    const marker = new window.naver.maps.Marker({ position: latLng(loc.lat, loc.lng), map, title: loc.name });
    const infoWindow = new window.naver.maps.InfoWindow({ content: infoWindowLoadingContent(loc.name) });
    refs[loc.id] = { marker, infoWindow };
    return window.naver.maps.Event.addListener(marker, 'click', () => onClick(loc, marker, infoWindow));
  });
  return { refs, listeners };
}

const parseRoutePath = (features) =>
  features.flatMap(({ geometry }) =>
    geometry.type === 'Point'
      ? [coordToLatLng(geometry.coordinates)]
      : geometry.type === 'LineString'
        ? geometry.coordinates.map(coordToLatLng)
        : []
  );

const drawPolyline = (mapRef, lineRef, path) => {
  if (lineRef.current) lineRef.current.setMap(null);
  lineRef.current = new window.naver.maps.Polyline({ map: mapRef.current, path, ...ROUTE_STYLE });
};

const tmapRequestBody = (origin, target) => ({
  startX: String(origin.lng),
  startY: String(origin.lat),
  endX: String(target.lng),
  endY: String(target.lat),
  reqCoordType: 'WGS84GEO',
  resCoordType: 'WGS84GEO',
  startName: '내 위치',
  endName: target.name,
});

export async function fetchPedestrianRoute(target, infoWindow, originPos, { mapRef, currentPolyline, fitMapToRoute }) {
  if (!mapRef.current || !originPos) return;

  try {
    const res = await fetch(TMAP_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', appKey: TMAP_KEY },
      body: JSON.stringify(tmapRequestBody(originPos, target)),
    });
    if (!res.ok) throw new Error('티맵 에러');

    const { features } = await res.json();
    const routePath = parseRoutePath(features);
    const { totalDistance: distance, totalTime } = features[0].properties;

    infoWindow.setContent(infoWindowRouteContent(target.name, Math.ceil(totalTime / 60), distance));
    drawPolyline(mapRef, currentPolyline, routePath);
    fitMapToRoute(originPos, target, routePath);
  } catch (err) {
    console.error('Route error:', err);
  }
}
