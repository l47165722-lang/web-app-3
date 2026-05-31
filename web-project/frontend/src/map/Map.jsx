import React, { useEffect, useRef, useState } from 'react';
import './Map_style.css';
import {
  cafeteriaLocations,
  canInitMap,
  cleanupMap,
  fetchMyLocation,
  getFitBoundsPadding,
  initMapWithMarkers,
  loadNaverMapsScript,
  moveToMyLocation,
  openCafeteriaRoute,
  resizeMapInstance,
  selectCafeteria,
} from './mapUtils';

function Map() {
  const mapElement = useRef(null);
  const mapRef = useRef(null);
  const currentPolyline = useRef(null);
  const markersAndWindowsRef = useRef({});

  const [myLocation, setMyLocation] = useState(null);
  const [naverReady, setNaverReady] = useState(function () {
    return Boolean(window.naver?.maps);
  });
  const [mapError, setMapError] = useState(null);
  const [selectedCafeteria, setSelectedCafeteria] = useState(null);

  useEffect(function () {
    fetchMyLocation(setMyLocation, setMyLocation);
  }, []);

  useEffect(function () {
    loadNaverMapsScript(
      function () {
        setNaverReady(true);
      },
      setMapError
    );
  }, []);

  useEffect(
    function () {
      if (!canInitMap(myLocation, naverReady, mapElement.current, mapRef)) return;

      const { listeners } = initMapWithMarkers(
        mapElement.current,
        myLocation,
        mapRef,
        markersAndWindowsRef,
        function (loc, marker, infoWindow) {
          openCafeteriaRoute(
            loc,
            marker,
            infoWindow,
            mapRef.current,
            myLocation,
            mapRef,
            currentPolyline,
            getFitBoundsPadding(),
            setSelectedCafeteria,
            setMapError
          );
        }
      );

      resizeMapInstance(mapRef);

      return function () {
        cleanupMap(listeners, currentPolyline, mapRef, markersAndWindowsRef);
      };
    },
    [myLocation, naverReady]
  );

  useEffect(
    function () {
      function handleResize() {
        resizeMapInstance(mapRef);
      }
      handleResize();
      window.addEventListener('resize', handleResize);
      return function () {
        window.removeEventListener('resize', handleResize);
      };
    },
    [naverReady]
  );

  const handleCafeteriaSelect = function (targetId) {
    selectCafeteria(
      targetId,
      markersAndWindowsRef,
      mapRef,
      myLocation,
      currentPolyline,
      getFitBoundsPadding(),
      setSelectedCafeteria,
      setMapError
    );
  };

  const handleMyLocation = function () {
    moveToMyLocation(mapRef, myLocation);
  };

  const showMap = Boolean(myLocation && !mapError && naverReady);

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
              {cafeteriaLocations.map(function (loc) {
                const isSelected = selectedCafeteria === loc.id;
                return (
                  <button
                    key={loc.id}
                    type="button"
                    className={`map-cafeteria-btn${isSelected ? ' map-cafeteria-btn--selected' : ''}`}
                    onClick={function () {
                      handleCafeteriaSelect(loc.id);
                    }}
                  >
                    <span className="map-cafeteria-btn__name">{loc.label || loc.name}</span>
                  </button>
                );
              })}
            </div>

            {showMap && (
              <button type="button" className="map-location-btn map-location-btn--desktop" onClick={handleMyLocation}>
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
