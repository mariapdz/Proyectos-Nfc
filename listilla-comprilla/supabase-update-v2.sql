-- Ejecuta esto una sola vez en Supabase: SQL Editor > New query > Run.
-- Permite editar y eliminar productos desde la lista pública.
create policy "Lista publica actualiza productos"
on public.shopping_products for update
to anon, authenticated
using (true)vale,with check (true);

create policy "Lista publica borra productos"
on public.shopping_products for delete
to anon, authenticated
using (true);
