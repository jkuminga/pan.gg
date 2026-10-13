'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function DeleteGameButton({ gameId }: { gameId: string }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);

  async function remove() {
    if (!window.confirm(`경기 #${gameId} 전적을 삭제할까요? 삭제 후 되돌릴 수 없습니다.`)) return;
    setPending(true);
    try {
      const response = await fetch(`/api/games/${gameId}`, { method: 'DELETE' });
      if (!response.ok) {
        const body = await response.json();
        window.alert(body.error || '삭제하지 못했습니다.');
        return;
      }
      router.refresh();
    } catch {
      window.alert('삭제 요청에 실패했습니다. 다시 시도해 주세요.');
    } finally {
      setPending(false);
    }
  }

  return <button className="match-delete-button" type="button" onClick={remove} disabled={pending}>{pending ? '삭제 중…' : '삭제'}</button>;
}
