import Link from 'next/link';
export default function NotFound() { return <div className="empty panel"><h1>게임을 찾을 수 없습니다</h1><Link className="text-link" href="/games">게임 목록으로 →</Link></div>; }
