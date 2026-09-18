-- SahiMilo Gmail + 6-digit PIN account update
-- Run once in Supabase Dashboard > SQL Editor > New query.
-- PINs are stored only by Supabase Auth and never in these profile tables.

begin;

alter table public.user_profiles
  add column if not exists phone text,
  add column if not exists whatsapp text,
  add column if not exists address_line text,
  add column if not exists area text,
  add column if not exists city text,
  add column if not exists state text,
  add column if not exists pincode text;

alter table public.user_profiles enable row level security;

drop policy if exists "users read own profile" on public.user_profiles;
drop policy if exists "users create own profile" on public.user_profiles;
drop policy if exists "users update own profile" on public.user_profiles;

create policy "users read own profile"
on public.user_profiles for select
to authenticated
using ((select auth.uid()) = id);

create policy "users create own profile"
on public.user_profiles for insert
to authenticated
with check (
  (select auth.uid()) = id
  and coalesce(role, 'customer') <> 'admin'
);

create policy "users update own profile"
on public.user_profiles for update
to authenticated
using ((select auth.uid()) = id)
with check ((select auth.uid()) = id);

grant select, insert, update on public.user_profiles to authenticated;

create schema if not exists private;

create or replace function private.guard_user_profile_role()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  caller_is_admin boolean;
begin
  select exists (
    select 1 from public.user_profiles
    where id = (select auth.uid()) and role = 'admin'
  ) into caller_is_admin;

  if not caller_is_admin and new.role is distinct from old.role then
    raise exception 'Only an admin can change account roles';
  end if;
  return new;
end;
$$;

revoke all on function private.guard_user_profile_role() from public, anon, authenticated;

drop trigger if exists guard_user_profile_role on public.user_profiles;
create trigger guard_user_profile_role
before update on public.user_profiles
for each row execute function private.guard_user_profile_role();

alter table public.professionals
  alter column status set default 'pending',
  alter column verified_mobile set default false,
  alter column verified_whatsapp set default false,
  alter column verified_by_admin set default false;

create unique index if not exists professionals_one_profile_per_user
on public.professionals(user_id)
where user_id is not null;

alter table public.professionals enable row level security;

drop policy if exists "owner reads professional profile" on public.professionals;
drop policy if exists "owner creates professional profile" on public.professionals;
drop policy if exists "owner updates professional profile" on public.professionals;

create policy "owner reads professional profile"
on public.professionals for select
to authenticated
using ((select auth.uid()) = user_id);

create policy "owner creates professional profile"
on public.professionals for insert
to authenticated
with check (
  (select auth.uid()) = user_id
  and status = 'pending'
  and verified_mobile = false
  and verified_whatsapp = false
  and verified_by_admin = false
);

create policy "owner updates professional profile"
on public.professionals for update
to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

grant select, insert, update on public.professionals to authenticated;

create or replace function private.guard_professional_moderation_fields()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  caller_is_admin boolean;
begin
  select exists (
    select 1 from public.user_profiles
    where id = (select auth.uid()) and role = 'admin'
  ) into caller_is_admin;

  if not caller_is_admin and (
    new.status is distinct from old.status
    or new.verified_mobile is distinct from old.verified_mobile
    or new.verified_whatsapp is distinct from old.verified_whatsapp
    or new.verified_by_admin is distinct from old.verified_by_admin
    or new.user_id is distinct from old.user_id
  ) then
    raise exception 'Only an admin can change approval or ownership fields';
  end if;
  return new;
end;
$$;

revoke all on function private.guard_professional_moderation_fields() from public, anon, authenticated;

drop trigger if exists guard_professional_moderation_fields on public.professionals;
create trigger guard_professional_moderation_fields
before update on public.professionals
for each row execute function private.guard_professional_moderation_fields();

commit;

select policyname, roles, cmd
from pg_policies
where schemaname = 'public'
  and tablename in ('user_profiles', 'professionals')
order by tablename, policyname;