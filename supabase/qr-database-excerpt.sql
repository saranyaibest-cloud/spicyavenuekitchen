-- QR-RELATED DATABASE OBJECTS: REFERENCE EXCERPT ONLY.
-- Do not run this file on its own. The authoritative source is supabase/migrations/ (applied in order);
-- these blocks are copied verbatim from there so the QR logic can be read in one place.

-- ===== Table: qr_destinations (from core_schema) =====
-- ---------------------------------------------------------------------------
-- qr_destinations: permanent short codes encoded in printed QR codes
-- target_path is restricted to an on-site path so a QR can never become an open redirect.
-- ---------------------------------------------------------------------------
create table public.qr_destinations (
  id uuid primary key default gen_random_uuid(),
  restaurant_id uuid not null references public.restaurants (id) on delete cascade,
  code text not null unique check (code ~ '^[a-z0-9]+(-[a-z0-9]+)*$' and char_length(code) between 2 and 40),
  label text not null check (char_length(label) between 1 and 80),
  target_path text not null default '/menu'
    check (target_path ~ '^/[A-Za-z0-9/_\-]*(\?[A-Za-z0-9=&_\-]*)?(#[A-Za-z0-9_\-]*)?$' and target_path not like '//%'),
  table_label text check (char_length(table_label) <= 40),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index qr_destinations_restaurant_idx on public.qr_destinations (restaurant_id);
create trigger qr_destinations_touch before update on public.qr_destinations
  for each row execute function public.touch_updated_at();

-- ===== Table: qr_scan_events (from core_schema) =====
-- ---------------------------------------------------------------------------
-- qr_scan_events: anonymous scan analytics (no IP, no full user agent, no identifiers)
-- ---------------------------------------------------------------------------
create table public.qr_scan_events (
  id uuid primary key default gen_random_uuid(),
  restaurant_id uuid not null references public.restaurants (id) on delete cascade,
  qr_destination_id uuid not null references public.qr_destinations (id) on delete cascade,
  scanned_at timestamptz not null default now(),
  device_type text not null default 'unknown' check (device_type in ('mobile', 'tablet', 'desktop', 'bot', 'unknown')),
  os_family text not null default 'other' check (os_family in ('ios', 'android', 'windows', 'macos', 'linux', 'other'))
);
create index qr_scan_events_restaurant_time_idx on public.qr_scan_events (restaurant_id, scanned_at desc);
create index qr_scan_events_destination_idx on public.qr_scan_events (qr_destination_id, scanned_at desc);

-- ===== Trigger: tenant lock (from security) =====
create trigger qr_destinations_restaurant_lock before update on public.qr_destinations
  for each row execute function public.forbid_restaurant_change();

-- ===== Trigger: audit trail (from security) =====
create trigger audit_qr_destinations after insert or update or delete on public.qr_destinations
  for each row execute function public.audit_row_change();

-- ===== RLS policies (from security) =====
-- qr_destinations (public resolution happens only through record_qr_scan)
create policy qr_destinations_read on public.qr_destinations
  for select to authenticated
  using (public.has_role(restaurant_id));
create policy qr_destinations_insert on public.qr_destinations
  for insert to authenticated
  with check (public.has_role(restaurant_id, array['OWNER']::public.admin_role[]));
create policy qr_destinations_update on public.qr_destinations
  for update to authenticated
  using (public.has_role(restaurant_id, array['OWNER']::public.admin_role[]))
  with check (public.has_role(restaurant_id, array['OWNER']::public.admin_role[]));
create policy qr_destinations_delete on public.qr_destinations
  for delete to authenticated
  using (public.has_role(restaurant_id, array['OWNER']::public.admin_role[]));

-- qr_scan_events / audit_logs: read-only for owners and managers
create policy qr_scan_events_read on public.qr_scan_events
  for select to authenticated
  using (public.has_role(restaurant_id, array['OWNER', 'MANAGER']::public.admin_role[]));
-- (audit_logs policy follows in the migration)

-- ===== RPC: record_qr_scan (from security) =====
-- ---------------------------------------------------------------------------
-- RPC: resolve a QR code and record an anonymous scan
-- ---------------------------------------------------------------------------
create or replace function public.record_qr_scan(p_code text, p_device text default 'unknown', p_os text default 'other')
returns text
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  dest record;
  device text := case when p_device in ('mobile', 'tablet', 'desktop', 'bot', 'unknown') then p_device else 'unknown' end;
  os text := case when p_os in ('ios', 'android', 'windows', 'macos', 'linux', 'other') then p_os else 'other' end;
begin
  if p_code is null or p_code !~ '^[a-z0-9]+(-[a-z0-9]+)*$' or char_length(p_code) > 40 then
    return null;
  end if;

  select d.id, d.restaurant_id, d.target_path into dest
  from public.qr_destinations d
  join public.restaurants r on r.id = d.restaurant_id and r.is_active
  where d.code = p_code and d.is_active;

  if not found then
    return null;
  end if;

  -- Link-preview bots and crawlers are redirected but not counted.
  if device <> 'bot' then
    insert into public.qr_scan_events (restaurant_id, qr_destination_id, device_type, os_family)
    values (dest.restaurant_id, dest.id, device, os);
  end if;

  return dest.target_path;
end;
$$;
revoke all on function public.record_qr_scan(text, text, text) from public;
grant execute on function public.record_qr_scan(text, text, text) to anon, authenticated;

-- ===== RPC: qr_scan_summary (from security) =====
-- ---------------------------------------------------------------------------
-- RPC: scan analytics (SECURITY INVOKER, so RLS limits it to owners/managers)
-- ---------------------------------------------------------------------------
create or replace function public.qr_scan_summary(p_restaurant uuid, p_days integer default 30)
returns jsonb
language sql
stable
security invoker
set search_path = ''
as $$
  with tz as (
    select coalesce((select timezone from public.restaurants where id = p_restaurant), 'UTC') as name
  ),
  ev as (
    select e.*, (e.scanned_at at time zone (select name from tz))::date as local_day
    from public.qr_scan_events e
    where e.restaurant_id = p_restaurant
  ),
  today as (select (now() at time zone (select name from tz))::date as d),
  days as (
    select generate_series((select d from today) - (least(greatest(p_days, 1), 366) - 1), (select d from today), interval '1 day')::date as day
  )
  select jsonb_build_object(
    'total', (select count(*) from ev),
    'today', (select count(*) from ev where local_day = (select d from today)),
    'last7', (select count(*) from ev where local_day > (select d from today) - 7),
    'last30', (select count(*) from ev where local_day > (select d from today) - 30),
    'thisWeek', (select count(*) from ev where local_day >= date_trunc('week', (select d from today))::date),
    'thisMonth', (select count(*) from ev where local_day >= date_trunc('month', (select d from today))::date),
    'daily', coalesce((
      select jsonb_agg(jsonb_build_object('day', days.day, 'count', coalesce(c.n, 0)) order by days.day)
      from days
      left join (select local_day, count(*) n from ev group by local_day) c on c.local_day = days.day
    ), '[]'::jsonb),
    'weekly', coalesce((
      select jsonb_agg(jsonb_build_object('week', w, 'count', n) order by w)
      from (
        select date_trunc('week', local_day)::date w, count(*) n
        from ev where local_day > (select d from today) - 84 group by 1
      ) x
    ), '[]'::jsonb),
    'monthly', coalesce((
      select jsonb_agg(jsonb_build_object('month', m, 'count', n) order by m)
      from (
        select date_trunc('month', local_day)::date m, count(*) n
        from ev where local_day > (select d from today) - 366 group by 1
      ) x
    ), '[]'::jsonb),
    'byDevice', coalesce((select jsonb_object_agg(device_type, n) from (select device_type, count(*) n from ev group by 1) x), '{}'::jsonb),
    'byOs', coalesce((select jsonb_object_agg(os_family, n) from (select os_family, count(*) n from ev group by 1) x), '{}'::jsonb),
    'byDestination', coalesce((
      select jsonb_agg(jsonb_build_object('code', d.code, 'label', d.label, 'count', x.n) order by x.n desc)
      from (select qr_destination_id, count(*) n from ev group by 1) x
      join public.qr_destinations d on d.id = x.qr_destination_id
    ), '[]'::jsonb)
  );
$$;
revoke all on function public.qr_scan_summary(uuid, integer) from public;
grant execute on function public.qr_scan_summary(uuid, integer) to authenticated;

-- ===== Seed: the permanent 'main' code (from seed.sql) =====
-- Permanent QR code. Printed QR codes encode https://<domain>/q/main; the target can be changed later without reprinting.
insert into public.qr_destinations (restaurant_id, code, label, target_path)
values ('5a4b0000-0000-4000-8000-00000000a001', 'main', 'Table QR – main menu', '/menu')
on conflict (code) do nothing;
