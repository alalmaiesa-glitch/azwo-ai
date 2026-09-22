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
