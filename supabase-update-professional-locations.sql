-- SahiMilo structured professional location fields
-- Run once in Supabase Dashboard > SQL Editor > New query.
-- Safe to run more than once.

begin;

alter table public.professionals
  add column if not exists village text,
  add column if not exists block_name text,
  add column if not exists district text;

create index if not exists professionals_pincode_idx
  on public.professionals (pincode);

create index if not exists professionals_district_lower_idx
  on public.professionals (lower(district));

create index if not exists professionals_block_name_lower_idx
  on public.professionals (lower(block_name));

create index if not exists professionals_village_lower_idx
  on public.professionals (lower(village));

grant select on public.professionals to anon, authenticated;
grant insert, update on public.professionals to authenticated;

commit;

notify pgrst, 'reload schema';

select column_name, data_type
from information_schema.columns
where table_schema = 'public'
  and table_name = 'professionals'
  and column_name in ('village', 'area', 'block_name', 'city', 'district', 'state', 'pincode')
order by ordinal_position;
