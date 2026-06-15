import React from "react";
import { useNavigate } from "react-router-dom";
import "./Header.css";

function Header() {
    const navigate = useNavigate();
    return (
        <header className="site-hdr">
            <span className="site-hdr-logo" onClick={() => navigate('/main')}>
                밥탐
            </span>
            <nav className="site-hdr-nav">
                <button className="site-hdr-btn" onClick={() => navigate('/congestion')}>혼잡도 제보</button>
                <button className="site-hdr-btn" onClick={() => navigate('/info')}>식당 정보</button>
                <button className="site-hdr-btn" onClick={() => navigate('/map')}>캠퍼스 지도</button>
            </nav>
            <button className="site-hdr-back" onClick={() => navigate('/main')}>← 메인</button>
        </header>
    );
}

export default Header;
