-- =============================================================================
-- 晩餐杯 店舗営業: 初期スキーマ
--
-- 権限の考え方
--   - アプリを使えるのは allowed_emails に登録されたメールアドレスのユーザーだけ。
--     すべての RLS ポリシーは public.is_allowed() を条件に含める。
--   - 営業記録・営業予定は許可ユーザー全員が閲覧でき、編集・削除は登録した本人のみ。
--   - 店舗マスタはアプリからは閲覧のみ。投入は scripts/fetch-stores.ts が
--     secret key（service_role）で行う（RLS をバイパスする）。
--   - 「今日」は日本時間で判定する。
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 選択肢（値は英字、表示ラベルはアプリ側で持つ）
-- -----------------------------------------------------------------------------

-- チラシ配布状況: 配布 / 未配布 / 前回以前配布済
create type public.flyer_status as enum ('distributed', 'not_distributed', 'previously_distributed');
-- 性別: 男 / 女 / その他
create type public.gender as enum ('male', 'female', 'other');
-- 雇用形態: 店長 / 社員 / アルバイト / 不明
create type public.employment_type as enum ('manager', 'employee', 'part_time', 'unknown');
-- サッカーへの興味: 有 / 無 / 不明
create type public.soccer_interest as enum ('yes', 'no', 'unknown');
-- 時間帯: 昼 / 夕方 / 夜 / 未定
create type public.time_slot as enum ('noon', 'evening', 'night', 'undecided');

-- -----------------------------------------------------------------------------
-- 共通関数
-- -----------------------------------------------------------------------------

-- 日本時間の今日
create function public.today_jst()
returns date
language sql
stable
set search_path = ''
as $$
  select (now() at time zone 'Asia/Tokyo')::date;
$$;

create function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

-- -----------------------------------------------------------------------------
-- allowed_emails: 利用を許可するメールアドレス（ダッシュボードから手動で追加）
-- -----------------------------------------------------------------------------

create table public.allowed_emails (
  email text primary key,
  note text,
  created_at timestamptz not null default now()
);

comment on table public.allowed_emails is 'アプリの利用を許可する Google アカウントのメールアドレス。Table Editor から行を追加する。';
comment on column public.allowed_emails.note is '誰のアドレスかなどのメモ（任意）';

-- 大文字・前後の空白が混ざっても一致するように正規化する
create function public.normalize_allowed_email()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.email := lower(trim(new.email));
  return new;
end;
$$;

create trigger allowed_emails_normalize
before insert or update on public.allowed_emails
for each row execute function public.normalize_allowed_email();

-- ログイン中のユーザーが許可されているか。
-- JWT ではなく auth.users のメールアドレス（確認済みのもの）で判定する。
create function public.is_allowed()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from auth.users u
    join public.allowed_emails a on a.email = lower(u.email)
    where u.id = auth.uid()
      and u.email_confirmed_at is not null
  );
$$;

-- -----------------------------------------------------------------------------
-- profiles: 表示名とユーザー色
-- -----------------------------------------------------------------------------

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text not null
    constraint profiles_display_name_length check (char_length(btrim(display_name)) between 1 and 20),
  -- ユーザーごとの色（アプリ側のパレットのキー）。登録時に自動で割り当てる
  color text not null
    constraint profiles_color_valid check (color in ('c1', 'c2', 'c3', 'c4', 'c5', 'c6', 'c7', 'c8', 'c9', 'c10')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 表示名を整え、色が未指定なら一番使われていない色を割り当てる
create function public.prepare_profile()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  new.display_name := btrim(new.display_name);
  if tg_op = 'INSERT' and new.color is null then
    select c.key into new.color
    from unnest(array['c1', 'c2', 'c3', 'c4', 'c5', 'c6', 'c7', 'c8', 'c9', 'c10'])
      with ordinality as c (key, ord)
    left join public.profiles p on p.color = c.key
    group by c.key, c.ord
    order by count(p.id), c.ord
    limit 1;
  end if;
  return new;
end;
$$;

create trigger profiles_prepare
before insert or update on public.profiles
for each row execute function public.prepare_profile();

create trigger profiles_updated_at
before update on public.profiles
for each row execute function public.set_updated_at();

-- -----------------------------------------------------------------------------
-- stores: 店舗マスタ（scripts/fetch-stores.ts で投入）
-- -----------------------------------------------------------------------------

create table public.stores (
  id text primary key, -- 公式の店舗コード
  name text not null, -- 「鳥貴族」を除いた店舗名
  name_kana text not null, -- name の読み（ひらがな）
  prefecture text not null
    constraint stores_prefecture_valid check (prefecture in ('埼玉県', '東京都', '神奈川県', '千葉県')),
  city text not null,
  address text not null,
  zip_code text,
  tel text,
  lat double precision,
  lng double precision,
  official_url text not null,
  opening_note text, -- 開店前の店舗の注記（例: 2026年12月16日オープン予定）
  is_active boolean not null default true, -- 公式から消えた（閉店した）店舗は false。記録を残すため削除しない
  updated_at timestamptz not null default now()
);

create index stores_prefecture_city_idx on public.stores (prefecture, city);

-- -----------------------------------------------------------------------------
-- visits / visit_staff: 営業記録
-- -----------------------------------------------------------------------------

create table public.visits (
  id uuid primary key default gen_random_uuid(),
  store_id text not null references public.stores (id),
  visit_date date not null,
  flyer_status public.flyer_status,
  note text constraint visits_note_length check (char_length(note) <= 2000),
  created_by uuid not null default auth.uid() references public.profiles (id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index visits_store_id_visit_date_idx on public.visits (store_id, visit_date desc);
create index visits_visit_date_idx on public.visits (visit_date desc, created_at desc);
create index visits_created_by_idx on public.visits (created_by);

create table public.visit_staff (
  id uuid primary key default gen_random_uuid(),
  visit_id uuid not null references public.visits (id) on delete cascade,
  sort_order smallint not null default 0,
  staff_name text constraint visit_staff_name_length check (char_length(staff_name) <= 50),
  gender public.gender,
  employment_type public.employment_type,
  conversation text constraint visit_staff_conversation_length check (char_length(conversation) <= 2000),
  soccer_interest public.soccer_interest,
  constraint visit_staff_visit_sort_unique unique (visit_id, sort_order)
);

-- 訪問日は未来にできない
create function public.validate_visit()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.visit_date > public.today_jst() then
    raise exception '訪問日に未来の日付は指定できません' using errcode = 'check_violation';
  end if;
  return new;
end;
$$;

create trigger visits_validate
before insert or update of visit_date on public.visits
for each row execute function public.validate_visit();

create trigger visits_updated_at
before update on public.visits
for each row execute function public.set_updated_at();

-- -----------------------------------------------------------------------------
-- schedules / schedule_stores: 営業予定
-- -----------------------------------------------------------------------------

create table public.schedules (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references public.profiles (id),
  date date not null,
  time_slot public.time_slot,
  memo text constraint schedules_memo_length check (char_length(memo) <= 1000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index schedules_date_idx on public.schedules (date);
create index schedules_user_id_idx on public.schedules (user_id);

create table public.schedule_stores (
  schedule_id uuid not null references public.schedules (id) on delete cascade,
  store_id text not null references public.stores (id),
  sort_order smallint not null default 0, -- 回る順番
  primary key (schedule_id, store_id)
);

create index schedule_stores_store_id_idx on public.schedule_stores (store_id);

-- 予定日は今日以降（過去の予定のメモ修正などは日付を変えなければ可能）
create function public.validate_schedule()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if (tg_op = 'INSERT' or new.date is distinct from old.date) and new.date < public.today_jst() then
    raise exception '予定日に過去の日付は指定できません' using errcode = 'check_violation';
  end if;
  return new;
end;
$$;

create trigger schedules_validate
before insert or update of date on public.schedules
for each row execute function public.validate_schedule();

create trigger schedules_updated_at
before update on public.schedules
for each row execute function public.set_updated_at();

-- -----------------------------------------------------------------------------
-- RLS
-- -----------------------------------------------------------------------------

alter table public.allowed_emails enable row level security;
alter table public.profiles enable row level security;
alter table public.stores enable row level security;
alter table public.visits enable row level security;
alter table public.visit_staff enable row level security;
alter table public.schedules enable row level security;
alter table public.schedule_stores enable row level security;

-- テーブル権限は明示する（新しいプロジェクトでは public のテーブルが自動で公開されない設定もあるため）。
-- 行単位の制御は下の RLS ポリシーで行う。

-- 未ログイン（anon）には何も見せない
revoke all on table
  public.allowed_emails, public.profiles, public.stores, public.visits,
  public.visit_staff, public.schedules, public.schedule_stores
from anon;

-- allowed_emails: アプリからは読み書き不可（is_allowed() は security definer で参照）
revoke all on table public.allowed_emails from authenticated;

-- stores: 閲覧のみ
revoke insert, update, delete, truncate on table public.stores from authenticated;
grant select on table public.stores to authenticated;

grant select, insert, update on table public.profiles to authenticated;
grant select, insert, update, delete on table
  public.visits, public.visit_staff, public.schedules, public.schedule_stores
to authenticated;

-- scripts/fetch-stores.ts（secret key = service_role）からの店舗投入用
grant select, insert, update on table public.stores to service_role;

create policy "許可ユーザーは店舗を閲覧できる"
on public.stores for select to authenticated
using ((select public.is_allowed()));

-- profiles
create policy "許可ユーザーはプロフィールを閲覧できる"
on public.profiles for select to authenticated
using ((select public.is_allowed()));

create policy "許可ユーザーは自分のプロフィールを作成できる"
on public.profiles for insert to authenticated
with check (id = (select auth.uid()) and (select public.is_allowed()));

create policy "自分のプロフィールのみ更新できる"
on public.profiles for update to authenticated
using (id = (select auth.uid()) and (select public.is_allowed()))
with check (id = (select auth.uid()));

-- visits
create policy "許可ユーザーは営業記録を閲覧できる"
on public.visits for select to authenticated
using ((select public.is_allowed()));

create policy "許可ユーザーは自分の営業記録を作成できる"
on public.visits for insert to authenticated
with check (created_by = (select auth.uid()) and (select public.is_allowed()));

create policy "自分の営業記録のみ更新できる"
on public.visits for update to authenticated
using (created_by = (select auth.uid()) and (select public.is_allowed()))
with check (created_by = (select auth.uid()));

create policy "自分の営業記録のみ削除できる"
on public.visits for delete to authenticated
using (created_by = (select auth.uid()) and (select public.is_allowed()));

-- visit_staff: 親の営業記録の登録者のみ書き込める
create policy "許可ユーザーは会話スタッフを閲覧できる"
on public.visit_staff for select to authenticated
using ((select public.is_allowed()));

create policy "自分の営業記録の会話スタッフのみ作成できる"
on public.visit_staff for insert to authenticated
with check (
  (select public.is_allowed())
  and exists (select 1 from public.visits v where v.id = visit_id and v.created_by = (select auth.uid()))
);

create policy "自分の営業記録の会話スタッフのみ更新できる"
on public.visit_staff for update to authenticated
using (
  (select public.is_allowed())
  and exists (select 1 from public.visits v where v.id = visit_id and v.created_by = (select auth.uid()))
)
with check (
  exists (select 1 from public.visits v where v.id = visit_id and v.created_by = (select auth.uid()))
);

create policy "自分の営業記録の会話スタッフのみ削除できる"
on public.visit_staff for delete to authenticated
using (
  (select public.is_allowed())
  and exists (select 1 from public.visits v where v.id = visit_id and v.created_by = (select auth.uid()))
);

-- schedules
create policy "許可ユーザーは営業予定を閲覧できる"
on public.schedules for select to authenticated
using ((select public.is_allowed()));

create policy "許可ユーザーは自分の営業予定を作成できる"
on public.schedules for insert to authenticated
with check (user_id = (select auth.uid()) and (select public.is_allowed()));

create policy "自分の営業予定のみ更新できる"
on public.schedules for update to authenticated
using (user_id = (select auth.uid()) and (select public.is_allowed()))
with check (user_id = (select auth.uid()));

create policy "自分の営業予定のみ削除できる"
on public.schedules for delete to authenticated
using (user_id = (select auth.uid()) and (select public.is_allowed()));

-- schedule_stores: 親の営業予定の登録者のみ書き込める
create policy "許可ユーザーは予定の店舗を閲覧できる"
on public.schedule_stores for select to authenticated
using ((select public.is_allowed()));

create policy "自分の営業予定の店舗のみ作成できる"
on public.schedule_stores for insert to authenticated
with check (
  (select public.is_allowed())
  and exists (select 1 from public.schedules s where s.id = schedule_id and s.user_id = (select auth.uid()))
);

create policy "自分の営業予定の店舗のみ更新できる"
on public.schedule_stores for update to authenticated
using (
  (select public.is_allowed())
  and exists (select 1 from public.schedules s where s.id = schedule_id and s.user_id = (select auth.uid()))
)
with check (
  exists (select 1 from public.schedules s where s.id = schedule_id and s.user_id = (select auth.uid()))
);

create policy "自分の営業予定の店舗のみ削除できる"
on public.schedule_stores for delete to authenticated
using (
  (select public.is_allowed())
  and exists (select 1 from public.schedules s where s.id = schedule_id and s.user_id = (select auth.uid()))
);

-- -----------------------------------------------------------------------------
-- store_progress: 店舗一覧のバッジ用（N+1 を避けるため店舗ごとに集計して返す）
--   営業記録か今日以降の予定がある店舗だけを返す。ここに無い店舗は「未訪問」。
--   security_invoker なので呼び出したユーザーの RLS がそのまま効く。
-- -----------------------------------------------------------------------------

create view public.store_progress
with (security_invoker = true)
as
with visit_summary as (
  select store_id, max(visit_date) as last_visit_date, count(*)::int as visit_count
  from public.visits
  group by store_id
),
schedule_summary as (
  select ss.store_id, min(s.date) as next_schedule_date
  from public.schedule_stores ss
  join public.schedules s on s.id = ss.schedule_id
  where s.date >= public.today_jst()
  group by ss.store_id
)
select
  coalesce(v.store_id, s.store_id) as store_id,
  v.last_visit_date,
  coalesce(v.visit_count, 0) as visit_count,
  s.next_schedule_date
from visit_summary v
full outer join schedule_summary s on s.store_id = v.store_id;

revoke all on table public.store_progress from anon;
grant select on table public.store_progress to authenticated;

-- -----------------------------------------------------------------------------
-- RPC
-- -----------------------------------------------------------------------------

-- ログイン中のユーザーの状態（proxy から呼ぶ）
create function public.get_my_access()
returns json
language sql
stable
security definer
set search_path = ''
as $$
  select json_build_object(
    'allowed', public.is_allowed(),
    'has_profile', exists (select 1 from public.profiles where id = auth.uid())
  );
$$;

-- 営業記録をスタッフごと 1 トランザクションで保存する（RLS は呼び出したユーザーで効く）
--   p_visit_id が null なら新規作成、指定があれば更新（本人の記録のみ）。
--   p_staff: [{ "staff_name", "gender", "employment_type", "conversation", "soccer_interest" }, ...]
--   すべての項目が空のスタッフは保存しない。
create function public.save_visit(
  p_visit_id uuid,
  p_store_id text,
  p_visit_date date,
  p_flyer_status public.flyer_status,
  p_note text,
  p_staff jsonb default '[]'::jsonb
)
returns uuid
language plpgsql
set search_path = ''
as $$
declare
  v_id uuid;
begin
  if p_visit_id is null then
    insert into public.visits (store_id, visit_date, flyer_status, note)
    values (p_store_id, p_visit_date, p_flyer_status, nullif(btrim(p_note), ''))
    returning id into v_id;
  else
    update public.visits
    set store_id = p_store_id,
        visit_date = p_visit_date,
        flyer_status = p_flyer_status,
        note = nullif(btrim(p_note), '')
    where id = p_visit_id
    returning id into v_id;

    if v_id is null then
      raise exception '営業記録が見つからないか、編集する権限がありません' using errcode = 'insufficient_privilege';
    end if;

    delete from public.visit_staff where visit_id = v_id;
  end if;

  insert into public.visit_staff (visit_id, sort_order, staff_name, gender, employment_type, conversation, soccer_interest)
  select v_id, (row_number() over (order by t.ord) - 1)::smallint,
         t.staff_name, t.gender, t.employment_type, t.conversation, t.soccer_interest
  from (
    select x.ord,
           nullif(btrim(x.item ->> 'staff_name'), '') as staff_name,
           (nullif(x.item ->> 'gender', ''))::public.gender as gender,
           (nullif(x.item ->> 'employment_type', ''))::public.employment_type as employment_type,
           nullif(btrim(x.item ->> 'conversation'), '') as conversation,
           (nullif(x.item ->> 'soccer_interest', ''))::public.soccer_interest as soccer_interest
    from jsonb_array_elements(coalesce(p_staff, '[]'::jsonb)) with ordinality as x (item, ord)
  ) t
  where coalesce(t.staff_name, t.gender::text, t.employment_type::text, t.conversation, t.soccer_interest::text) is not null;

  return v_id;
end;
$$;

-- 営業予定を回る店舗ごと 1 トランザクションで保存する
--   p_store_ids の並び順がそのまま回る順番になる。
create function public.save_schedule(
  p_schedule_id uuid,
  p_date date,
  p_time_slot public.time_slot,
  p_memo text,
  p_store_ids text[] default '{}'
)
returns uuid
language plpgsql
set search_path = ''
as $$
declare
  v_id uuid;
begin
  if p_schedule_id is null then
    insert into public.schedules (date, time_slot, memo)
    values (p_date, p_time_slot, nullif(btrim(p_memo), ''))
    returning id into v_id;
  else
    update public.schedules
    set date = p_date,
        time_slot = p_time_slot,
        memo = nullif(btrim(p_memo), '')
    where id = p_schedule_id
    returning id into v_id;

    if v_id is null then
      raise exception '営業予定が見つからないか、編集する権限がありません' using errcode = 'insufficient_privilege';
    end if;

    delete from public.schedule_stores where schedule_id = v_id;
  end if;

  insert into public.schedule_stores (schedule_id, store_id, sort_order)
  select v_id, x.store_id, (min(x.ord) - 1)::smallint
  from unnest(coalesce(p_store_ids, '{}')) with ordinality as x (store_id, ord)
  group by x.store_id;

  return v_id;
end;
$$;

-- 関数の実行権限: ログイン済みユーザーのみ
revoke execute on function
  public.is_allowed(),
  public.get_my_access(),
  public.save_visit(uuid, text, date, public.flyer_status, text, jsonb),
  public.save_schedule(uuid, date, public.time_slot, text, text[])
from public, anon;

grant execute on function
  public.is_allowed(),
  public.get_my_access(),
  public.save_visit(uuid, text, date, public.flyer_status, text, jsonb),
  public.save_schedule(uuid, date, public.time_slot, text, text[])
to authenticated;
