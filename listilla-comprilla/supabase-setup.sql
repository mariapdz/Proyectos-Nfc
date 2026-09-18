-- Ejecuta esto una sola vez en Supabase: SQL Editor > New query > Run.
-- Esta lista es pública: cualquiera con el enlace podrá añadir y cambiar productos.
create table if not exists public.shopping_products (
  id uuid primary key default gen_random_uuid(),
  emoji text not null,
  name text not null unique,
  created_at timestamptz not null default now()
);

create table if not exists public.shopping_list_items (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null unique references public.shopping_products(id) on delete cascade,
  quantity integer not null default 1 check (quantity > 0),
  comment text not null default '',
  updated_at timestamptz not null default now()
);

alter table public.shopping_products enable row level security;
alter table public.shopping_list_items enable row level security;

create policy "Lista publica lee productos" on public.shopping_products for select to anon, authenticated using (true);
create policy "Lista publica crea productos" on public.shopping_products for insert to anon, authenticated with check (true);
create policy "Lista publica lee articulos" on public.shopping_list_items for select to anon, authenticated using (true);
create policy "Lista publica crea articulos" on public.shopping_list_items for insert to anon, authenticated with check (true);
create policy "Lista publica actualiza articulos" on public.shopping_list_items for update to anon, authenticated using (true) with check (true);
create policy "Lista publica borra articulos" on public.shopping_list_items for delete to anon, authenticated using (true);

insert into public.shopping_products (emoji, name) values
  ('🥛', 'Leche'), ('🍞', 'Pan'), ('🥚', 'Huevos'), ('🍌', 'Plátanos'),
  ('🍎', 'Manzanas'), ('🧀', 'Queso'), ('🧻', 'Papel de cocina'), ('🧼', 'Jabón')
on conflict (name) do nothing;
