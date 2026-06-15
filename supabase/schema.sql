create extension if not exists "pgcrypto";

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create table if not exists public.wedding_profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  groom_name text not null,
  bride_name text not null,
  wedding_date date not null,
  city text not null default '',
  guest_estimate integer not null default 0,
  target_amount integer,
  currency_code text not null default 'IDR',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.categories (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  icon text not null default 'folder',
  color_hex text not null default '#7D9A83',
  sort_order integer not null default 0,
  is_archived boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.cost_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  category_id uuid not null references public.categories(id) on delete cascade,
  name text not null,
  estimated_amount integer not null default 0,
  cost_status text not null default 'not_searched' check (cost_status in ('not_searched', 'estimate', 'quote', 'deal')),
  notes text not null default '',
  sort_order integer not null default 0,
  is_archived boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.vendors (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  category_id uuid references public.categories(id) on delete set null,
  contact_name text not null default '',
  phone text not null default '',
  instagram text not null default '',
  package_name text not null default '',
  agreed_amount integer not null default 0,
  notes text not null default '',
  is_archived boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.payment_schedules (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  vendor_id uuid references public.vendors(id) on delete set null,
  category_id uuid references public.categories(id) on delete set null,
  cost_item_id uuid references public.cost_items(id) on delete set null,
  title text not null,
  due_date date not null,
  amount_due integer not null default 0,
  status text not null default 'pending' check (status in ('pending', 'partial', 'paid')),
  notes text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  date date not null default current_date,
  title text not null,
  amount integer not null default 0,
  category_id uuid not null references public.categories(id) on delete cascade,
  cost_item_id uuid references public.cost_items(id) on delete set null,
  vendor_id uuid references public.vendors(id) on delete set null,
  payment_schedule_id uuid references public.payment_schedules(id) on delete set null,
  receipt_attachment_id uuid,
  kind text not null default 'expense' check (kind in ('expense', 'payment')),
  notes text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.checklist_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  category_id uuid references public.categories(id) on delete set null,
  title text not null,
  deadline date not null,
  status text not null default 'todo' check (status in ('todo', 'in_progress', 'done')),
  priority text not null default 'normal' check (priority in ('low', 'normal', 'high')),
  notes text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.receipt_attachments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  transaction_id uuid references public.transactions(id) on delete cascade,
  storage_path text not null,
  original_filename text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.transactions drop constraint if exists transactions_receipt_attachment_id_fkey;

alter table public.transactions
  add constraint transactions_receipt_attachment_id_fkey
  foreign key (receipt_attachment_id)
  references public.receipt_attachments(id)
  on delete set null
  not valid;

alter table public.transactions validate constraint transactions_receipt_attachment_id_fkey;

create index if not exists idx_wedding_profiles_user_id on public.wedding_profiles(user_id);
create index if not exists idx_categories_user_id on public.categories(user_id);
create index if not exists idx_cost_items_user_id on public.cost_items(user_id);
create index if not exists idx_transactions_user_id on public.transactions(user_id);
create index if not exists idx_vendors_user_id on public.vendors(user_id);
create index if not exists idx_payment_schedules_user_id on public.payment_schedules(user_id);
create index if not exists idx_checklist_items_user_id on public.checklist_items(user_id);
create index if not exists idx_receipt_attachments_user_id on public.receipt_attachments(user_id);

drop trigger if exists set_wedding_profiles_updated_at on public.wedding_profiles;
create trigger set_wedding_profiles_updated_at before update on public.wedding_profiles for each row execute function public.set_updated_at();
drop trigger if exists set_categories_updated_at on public.categories;
create trigger set_categories_updated_at before update on public.categories for each row execute function public.set_updated_at();
drop trigger if exists set_cost_items_updated_at on public.cost_items;
create trigger set_cost_items_updated_at before update on public.cost_items for each row execute function public.set_updated_at();
drop trigger if exists set_transactions_updated_at on public.transactions;
create trigger set_transactions_updated_at before update on public.transactions for each row execute function public.set_updated_at();
drop trigger if exists set_vendors_updated_at on public.vendors;
create trigger set_vendors_updated_at before update on public.vendors for each row execute function public.set_updated_at();
drop trigger if exists set_payment_schedules_updated_at on public.payment_schedules;
create trigger set_payment_schedules_updated_at before update on public.payment_schedules for each row execute function public.set_updated_at();
drop trigger if exists set_checklist_items_updated_at on public.checklist_items;
create trigger set_checklist_items_updated_at before update on public.checklist_items for each row execute function public.set_updated_at();
drop trigger if exists set_receipt_attachments_updated_at on public.receipt_attachments;
create trigger set_receipt_attachments_updated_at before update on public.receipt_attachments for each row execute function public.set_updated_at();

alter table public.wedding_profiles enable row level security;
alter table public.categories enable row level security;
alter table public.cost_items enable row level security;
alter table public.transactions enable row level security;
alter table public.vendors enable row level security;
alter table public.payment_schedules enable row level security;
alter table public.checklist_items enable row level security;
alter table public.receipt_attachments enable row level security;

drop policy if exists "Users can manage own wedding profiles" on public.wedding_profiles;
create policy "Users can manage own wedding profiles" on public.wedding_profiles
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
drop policy if exists "Users can manage own categories" on public.categories;
create policy "Users can manage own categories" on public.categories
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
drop policy if exists "Users can manage own cost items" on public.cost_items;
create policy "Users can manage own cost items" on public.cost_items
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
drop policy if exists "Users can manage own transactions" on public.transactions;
create policy "Users can manage own transactions" on public.transactions
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
drop policy if exists "Users can manage own vendors" on public.vendors;
create policy "Users can manage own vendors" on public.vendors
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
drop policy if exists "Users can manage own payment schedules" on public.payment_schedules;
create policy "Users can manage own payment schedules" on public.payment_schedules
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
drop policy if exists "Users can manage own checklist items" on public.checklist_items;
create policy "Users can manage own checklist items" on public.checklist_items
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
drop policy if exists "Users can manage own receipt attachments" on public.receipt_attachments;
create policy "Users can manage own receipt attachments" on public.receipt_attachments
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('receipts', 'receipts', false, 5242880, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do update
set public = excluded.public,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Users can read own receipt files" on storage.objects;
create policy "Users can read own receipt files" on storage.objects
  for select using (
    bucket_id = 'receipts'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

drop policy if exists "Users can upload own receipt files" on storage.objects;
create policy "Users can upload own receipt files" on storage.objects
  for insert with check (
    bucket_id = 'receipts'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

drop policy if exists "Users can update own receipt files" on storage.objects;
create policy "Users can update own receipt files" on storage.objects
  for update using (
    bucket_id = 'receipts'
    and auth.uid()::text = (storage.foldername(name))[1]
  ) with check (
    bucket_id = 'receipts'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

drop policy if exists "Users can delete own receipt files" on storage.objects;
create policy "Users can delete own receipt files" on storage.objects
  for delete using (
    bucket_id = 'receipts'
    and auth.uid()::text = (storage.foldername(name))[1]
  );
