-- SahiMilo: repair user_profiles ownership link
-- Safe, non-destructive fix. Existing profile rows are preserved.

begin;

alter table public.user_profiles
  drop constraint if exists user_profiles_id_fkey;

alter table public.user_profiles
  add constraint user_profiles_id_fkey
  foreign key (id)
  references auth.users(id)
  on delete cascade
  not valid;

notify pgrst, 'reload schema';

commit;

select
  conname as constraint_name,
  pg_get_constraintdef(oid) as definition
from pg_constraint
where conrelid = 'public.user_profiles'::regclass
  and conname = 'user_profiles_id_fkey';