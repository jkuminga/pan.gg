export const won = (value: number | string) => `₩${Number(value).toLocaleString('ko-KR')}`;

export const gameDate = (value: Date) => new Intl.DateTimeFormat('ko-KR', {
  timeZone: 'Asia/Seoul', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit',
}).format(value);
