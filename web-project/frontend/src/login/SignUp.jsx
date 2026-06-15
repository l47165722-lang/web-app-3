import { useState } from "react";
import "./Login.css";
import { useNavigate } from "react-router-dom";
import { API_BASE } from "../api";

function SignUp() {
    const [studentId, setStudentId] = useState("");
    const [password, setPassword] = useState("");
    const navigate = useNavigate();

    const handleSignUp = async () => {
        try {
            const response = await fetch(`${API_BASE}/signup`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ studentId, password })
            });
            const data = await response.json();
            if (data.success) {
                localStorage.setItem("studentId", studentId);
                localStorage.setItem("loginType", "normal");
                navigate("/main");
            } else {
                alert("이미 존재하는 학번입니다.");
            }
        } catch (error) {
            console.log(error);
            alert("회원가입 실패");
        }
    };

    return (
        <div className="lp">
            <div className="box">
                <h1>회원가입</h1>
                <p className="lp-subtitle">학번과 비밀번호를 입력해 계정을 만드세요</p>

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
                    onKeyDown={(e) => { if (e.key === "Enter") handleSignUp(); }}
                />
                <button onClick={handleSignUp}>회원가입</button>

                <div className="bottom">
                    <span style={{ fontSize: '0.83rem', color: '#9CA3AF' }}>
                        이미 계정이 있으신가요?
                    </span>
                    <span className="join" onClick={() => navigate("/login")}>
                        로그인
                    </span>
                </div>
            </div>
        </div>
    );
}

export default SignUp;
