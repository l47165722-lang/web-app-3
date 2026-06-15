// API 베이스 URL
// 개발: 빈 문자열 → package.json proxy가 localhost:8080으로 전달
// 배포: Vercel 환경변수 REACT_APP_API_URL = 백엔드 주소
export const API_BASE = process.env.REACT_APP_API_URL || '';
