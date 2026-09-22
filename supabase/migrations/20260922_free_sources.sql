-- Free knowledge sources connected to AZWO
create table if not exists public.quran_verses (
  surah smallint not null check (surah between 1 and 114),
  ayah smallint not null check (ayah >= 1),
  text_uthmani text not null,
  source_id uuid references public.sources(id),
  source_version text not null default 'Tanzil Uthmani 1.1',
  created_at timestamptz not null default now(),
  primary key (surah,ayah)
);

alter table public.quran_verses enable row level security;
drop policy if exists "public read quran verses" on public.quran_verses;
create policy "public read quran verses" on public.quran_verses
for select to anon, authenticated using (true);

create index if not exists idx_quran_verses_source on public.quran_verses(source_id);

-- The actual 6236 Tanzil verses are imported separately to preserve
-- the verbatim source and attribution. See docs/FREE_SOURCES.md.


create or replace function public.azwo_normalize_arabic(input text)
returns text
language sql
immutable
parallel safe
as $$
  select regexp_replace(
    translate(
      coalesce(input,''),
      'ٱأإآىةؤئـًٌٍَُِّْٰۖۗۘۙۚۛۜ۟۠ۢۤۥۦ۪ۭۧۨ۫۬',
      'اااايهوي'
    ),
    '[[:space:][:punct:]]+',
    '',
    'g'
  );
$$;

create or replace function public.search_quran_quote(q text, limit_count integer default 10)
returns table (surah smallint, ayah smallint, text_uthmani text, source_version text)
language sql
stable
security invoker
set search_path = public
as $$
  select v.surah,v.ayah,v.text_uthmani,v.source_version
  from public.quran_verses v
  where length(public.azwo_normalize_arabic(q)) >= 3
    and public.azwo_normalize_arabic(v.text_uthmani)
        like '%' || public.azwo_normalize_arabic(q) || '%'
  order by v.surah,v.ayah
  limit greatest(1,least(limit_count,20));
$$;

grant execute on function public.search_quran_quote(text,integer) to anon, authenticated;

alter function public.azwo_normalize_arabic(text) set search_path = pg_catalog;
