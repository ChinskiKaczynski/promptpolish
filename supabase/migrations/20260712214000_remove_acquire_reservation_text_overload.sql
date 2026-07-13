begin;
-- Stara wersja powodująca PGRST203.
drop function if exists public.acquire_usage_reservation(uuid, text, uuid);
-- Wymuszenie odświeżenia listy RPC w PostgREST.
notify pgrst,
'reload schema';
commit;