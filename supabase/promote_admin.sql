-- Run this in the Supabase SQL Editor after creating a user account
-- (Authentication > Users > Add User) to grant it admin access.
update public.profiles
set role = 'admin'
where id = (select id from auth.users where email = 'you@thememoryclub.com');
