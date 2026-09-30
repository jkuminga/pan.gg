-- PostgreSQL / Supabase
-- players: 전적 입력 시 선택할 수 있는 플레이어 목록
create table players (
    id bigint generated always as identity primary key,
    name text not null check (length(btrim(name)) > 0),
    nickname text,
    created_at timestamptz not null default now()
);

-- 같은 이름과 닉네임 조합을 중복 등록하지 않는다 (앞뒤 공백·대소문자 무시).
create unique index players_identity_unique_idx
    on players (lower(btrim(name)), coalesce(lower(btrim(nickname)), ''));

-- game_histories: 한 경기의 결과와 참가자 1인당 판돈
create table game_histories (
    id bigint generated always as identity primary key,
    played_at timestamptz not null default now(),
    winning_team text not null check (winning_team in ('BLUE', 'RED')),
    stake integer not null default 0 check (stake >= 0),
    created_at timestamptz not null default now()
);

-- game_participants: 각 경기에 참가한 플레이어와 팀 내 위치
create table game_participants (
    game_history_id bigint not null references game_histories(id) on delete cascade,
    player_id bigint not null references players(id) on delete restrict,
    team text not null check (team in ('BLUE', 'RED')),
    slot smallint not null check (slot between 1 and 5),
    primary key (game_history_id, player_id),
    unique (game_history_id, team, slot)
);

create index game_histories_played_at_idx on game_histories (played_at desc);
create index game_participants_player_id_idx on game_participants (player_id);
