-- Ejecuta este archivo UNA sola vez en Supabase: SQL Editor > New query > Run.
-- Añade color y permite editar/eliminar destinos desde tu cuenta.
alter table public.destinations
add column if not exists color text not null default '#173c3b';

update public.destinations
set color = case slug
  when 'galicia' then '#d95d39'
  else '#173c3b'
end;

create policy "Usuarios identificados editan destinos"
on public.destinations for update
to authenticated
using (true)
with check (true);

create policy "Usuarios identificados eliminan destinos"
on public.destinations for delete
to authenticated
using (true);
