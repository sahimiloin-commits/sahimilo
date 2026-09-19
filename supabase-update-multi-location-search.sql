-- SahiMilo multi-location coverage
alter table public.professionals
  add column if not exists service_cities text[] not null default '{}',
  add column if not exists service_districts text[] not null default '{}',
  add column if not exists service_pincodes text[] not null default '{}';
create index if not exists professionals_service_cities_gin_idx on public.professionals using gin(service_cities);
create index if not exists professionals_service_districts_gin_idx on public.professionals using gin(service_districts);
create index if not exists professionals_service_pincodes_gin_idx on public.professionals using gin(service_pincodes);
notify pgrst, 'reload schema';