// API 베이스 URL
// 개발: 빈 문자열 → package.json proxy가 localhost:8080으로 전달
// 배포: Vercel 환경변수 REACT_APP_API_URL = 백엔드 주소
export const API_BASE = process.env.REACT_APP_API_URL || '';

// 같은 식당 재제보 제한 시간 (백엔드 COOLDOWN_MINUTES와 동일하게 5분)
export const REPORT_COOLDOWN_MS = 5 * 60 * 1000;

// 혼잡도 제보 전송. 프론트 쿨다운(익명·연타 방지) + 백엔드 409 응답을 함께 처리한다.
// 반환: { ok: boolean, message: string }
export async function submitReport(zoneId, level, studentId) {
  const key = `report_cooldown_${zoneId}`;
  const last = Number(localStorage.getItem(key) || 0);
  const elapsed = Date.now() - last;

  if (elapsed < REPORT_COOLDOWN_MS) {
    const leftMin = Math.ceil((REPORT_COOLDOWN_MS - elapsed) / 60000);
    return { ok: false, message: `같은 식당은 잠시 후 다시 제보할 수 있어요. (약 ${leftMin}분 남음)` };
  }

  try {
    const res = await fetch(`${API_BASE}/api/zones/${zoneId}/reports`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ level, studentId }),
    });

    if (res.ok) {
      localStorage.setItem(key, String(Date.now()));
      return { ok: true, message: '제보가 완료되었습니다! 감사합니다.' };
    }

    if (res.status === 409) {
      // 백엔드 쿨다운에 걸림 → 프론트 타이머도 동기화
      localStorage.setItem(key, String(Date.now()));
      const data = await res.json().catch(() => ({}));
      return { ok: false, message: data.message || '같은 식당은 잠시 후 다시 제보할 수 있어요.' };
    }

    return { ok: false, message: '제보 전송에 실패했습니다. 다시 시도해주세요.' };
  } catch {
    return { ok: false, message: '제보 전송에 실패했습니다. 다시 시도해주세요.' };
  }
}
