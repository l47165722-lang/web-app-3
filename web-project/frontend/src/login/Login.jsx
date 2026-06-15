import { useState, useEffect } from "react";
import "./Login.css";
import { useNavigate } from "react-router-dom";
import { useGoogleLogin } from "@react-oauth/google";
import { API_BASE } from "../api";

function Login() {
    const [studentId, setStudentId] = useState("");
    const [password, setPassword] = useState("");
    const [autoLogin, setAutoLogin] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        const id = localStorage.getItem("studentId") || sessionStorage.getItem("studentId");
        if (id) navigate("/main");
    }, [navigate]);

    const handleLogin = async () => {
        try {
            const response = await fetch(`${API_BASE}/login`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ studentId, password })
            });
            const data = await response.json();
            if (data.success) {
                const storage = autoLogin ? localStorage : sessionStorage;
                storage.setItem("studentId", studentId);
                storage.setItem("loginType", "normal");
                navigate("/main");
            } else {
                alert("학번 또는 비밀번호가 틀렸습니다.");
            }
        } catch (error) {
            alert("서버 연결 실패");
            console.log(error);
        }
    };

    const googleLogin = useGoogleLogin({
        onSuccess: async (tokenResponse) => {
            try {
                const res = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
                    headers: { Authorization: `Bearer ${tokenResponse.access_token}` }
                });
                const userInfo = await res.json();
                localStorage.setItem("studentId", userInfo.email);
                localStorage.setItem("loginType", "google");
                navigate("/main");
            } catch {
                alert("구글 로그인 실패");
            }
        },
        onError: () => alert("구글 로그인 실패"),
    });

    return (
        <div className="lp">
            <div className="box">

                {/* 브랜드 로고 */}
                <div className="lp-brand-row">
                    <div className="lp-brand-icon">
                        <svg width="21" height="21" viewBox="0 0 22 22" fill="none"
                            strokeLinecap="round" strokeLinejoin="round">
                            {/* 메가폰 몸통 (오른쪽으로 퍼지는 사다리꼴) */}
                            <path d="M2 8.5 L2 13.5 L15 20 L15 2 Z"
                                fill="rgba(255,255,255,0.18)" stroke="white" strokeWidth="1.8"/>
                            {/* 손잡이 */}
                            <rect x="0.5" y="9" width="2.5" height="4" rx="1"
                                fill="rgba(255,255,255,0.25)" stroke="white" strokeWidth="1.5"/>
                            {/* 음파 아크 */}
                            <path d="M17 8 Q19.5 11 17 14" stroke="white" strokeWidth="1.8" fill="none"/>
                            <path d="M19 6 Q22.5 11 19 16" stroke="white" strokeWidth="1.6" fill="none" strokeOpacity="0.55"/>
                        </svg>
                    </div>
                    <span className="lp-brand-name">밥탐</span>
                </div>

                {/* 타이틀 */}
                <h1>오늘 식당,<br />붐빌까?</h1>
                <p className="lp-subtitle">
                    식당 실시간 혼잡도 서비스
                </p>

                {/* 구글 로그인 */}
                <button className="btn-google" onClick={() => googleLogin()}>
                    <svg width="18" height="18" viewBox="0 0 48 48">
                        <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
                        <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
                        <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
                        <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
                    </svg>
                    Google 계정으로 로그인
                </button>

                <div className="divider"><span>또는 학번으로 로그인</span></div>

                {/* 학번/비밀번호 */}
                <input
                    type="text"
                    placeholder="학번 입력"
                    value={studentId}
                    onChange={(e) => setStudentId(e.target.value)}
                />
                <input
                    type="password"
                    placeholder="비밀번호 입력"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    onKeyDown={(e) => { if (e.key === "Enter") handleLogin(); }}
                />
                <button onClick={handleLogin}>로그인</button>

                <div className="bottom">
                    <div className="autologin">
                        <input
                            type="checkbox"
                            checked={autoLogin}
                            onChange={() => setAutoLogin(!autoLogin)}
                            className="check"
                        />
                        <span>로그인 상태 유지</span>
                    </div>
                    <span className="join" onClick={() => navigate("/signup")}>
                        회원가입
                    </span>
                </div>
            </div>
        </div>
    );
}

export default Login;
