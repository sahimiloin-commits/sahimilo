-- SahiMilo: remove OTP requirement for professional registration
-- Run this once in Supabase Dashboard > SQL Editor > New query

begin;

alter table public.professionals alter column user_id drop not null;
alter table public.professionals
  alter column status set default 'pending',
  alter column verified_mobile set default false,
  alter column verified_whatsapp set default false,
  alter column verified_by_admin set default false;

drop policy if exists "owner creates professional profile" on public.professionals;
drop policy if exists "public creates pending professional profile" on public.professionals;

create policy "public creates pending professional profile"
on public.professionals for insert to anon, authenticated
with check (
  user_id is null
  and status='pending'
  and verified_mobile=false
  and verified_whatsapp=false
  and verified_by_admin=false
);

revoke insert on public.professionals from anon;
grant insert (
  name,phone,whatsapp,category,services,area,city,state,pincode,
  experience_years,bio,verified_mobile,verified_whatsapp,verified_by_admin,status
) on public.professionals to anon;

drop policy if exists "public reads approved professionals" on public.professionals;
create policy "public reads approved professionals"
on public.professionals for select to anon
using (status='approved' and verified_by_admin=true);

commit;

select policyname,roles,cmd from pg_policies
where schemaname='public' and tablename='professionals' order by policyname;