'use client';

import { useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import './admin-access.css';

export default function AdminAccess({ loggedIn }: { loggedIn: boolean }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [pending, setPending] = useState(false);

  async function logIn(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError('');
    try {
      const response = await fetch('/api/admin/session', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ password }),
      });
      if (!response.ok) {
        const body = await response.json();
        setError(body.error || '로그인에 실패했습니다.');
        return;
      }
      setPassword('');
      setOpen(false);
      router.refresh();
    } catch {
      setError('로그인 요청에 실패했습니다. 다시 시도해 주세요.');
    } finally {
      setPending(false);
    }
  }

  async function logOut() {
    setPending(true);
    try {
      const response = await fetch('/api/admin/session', { method: 'DELETE' });
      if (!response.ok) throw new Error('logout failed');
      router.refresh();
    } catch {
      window.alert('로그아웃 요청에 실패했습니다. 다시 시도해 주세요.');
    } finally {
      setPending(false);
    }
  }

  return <>
    {loggedIn ? <span className="admin-footer-status"><span>관리자 모드</span><button type="button" onClick={logOut} disabled={pending}>로그아웃</button></span> : <button type="button" className="admin-login-trigger" onClick={() => { setError(''); setOpen(true); }}>관리자 로그인</button>}
    {open && <div className="admin-login-backdrop" onMouseDown={event => { if (event.target === event.currentTarget) setOpen(false); }}>
      <div className="admin-login-dialog" role="dialog" aria-modal="true" aria-labelledby="admin-login-title" onKeyDown={event => { if (event.key === 'Escape') setOpen(false); }}>
        <div className="admin-login-title"><div><p className="eyebrow">● ADMIN ACCESS</p><h2 id="admin-login-title">관리자 로그인</h2></div><button type="button" aria-label="닫기" onClick={() => setOpen(false)}>×</button></div>
        <p>관리자 비밀번호를 입력하면 경기 목록에서 전적을 삭제할 수 있습니다.</p>
        <form onSubmit={logIn}><label htmlFor="admin-password">비밀번호</label><input id="admin-password" type="password" autoComplete="current-password" value={password} onChange={event => setPassword(event.target.value)} autoFocus required />{error && <span className="admin-login-error" role="alert">{error}</span>}<button className="button" type="submit" disabled={pending}>{pending ? '확인 중…' : '로그인'}</button></form>
      </div>
    </div>}
  </>;
}
