import { useEffect, useMemo, useState, type FormEvent, type HTMLAttributes, type ReactNode } from 'react';
import type { Session, User } from '@supabase/supabase-js';
import {
  Banknote,
  Building2,
  CalendarClock,
  Camera,
  Car,
  CheckCircle2,
  ChevronLeft,
  Church,
  ClipboardList,
  CreditCard,
  FileText,
  Flower2,
  Folder,
  Gift,
  Heart,
  HeartHandshake,
  Home as HomeIcon,
  Inbox,
  Landmark,
  ListChecks,
  LogOut,
  Mail,
  Mic2,
  Package,
  Plus,
  Receipt,
  Shield,
  Shirt,
  Sparkles,
  Trash2,
  UserRound,
  Users,
  Utensils,
  WalletCards,
  X,
  type LucideIcon,
} from 'lucide-react';
import './index.css';
import {
  categoryEstimate,
  categorySpent,
  estimatedTotal,
  paymentPaidTotal,
  paymentStatus,
  spentTotal,
  unpaidPaymentTotal,
} from './lib/calculations';
import { addDaysInput, currency, daysUntil, inputDate, parseAmount, shortDate, todayInput } from './lib/format';
import { hasSupabaseConfig, requireSupabase, supabase } from './lib/supabase';
import { getTemplate, templateOptions } from './lib/templates';
import type {
  AppData,
  BudgetTemplateType,
  Category,
  ChecklistItem,
  ChecklistPriority,
  ChecklistStatus,
  CostItem,
  CostStatus,
  PaymentSchedule,
  Transaction,
} from './types';

type Tab = 'home' | 'costs' | 'checklist' | 'vendors';
type QuickAdd = 'expense' | 'payment' | 'checklist' | 'vendor' | 'category' | 'costItem';

const emptyData: AppData = {
  profile: null,
  categories: [],
  costItems: [],
  transactions: [],
  vendors: [],
  payments: [],
  checklistItems: [],
  receipts: [],
};

const categoryIcons: Record<string, LucideIcon> = {
  'banknote': Banknote,
  'building-2': Building2,
  'utensils': Utensils,
  'flower-2': Flower2,
  'sparkles': Sparkles,
  'shirt': Shirt,
  'camera': Camera,
  'mail': Mail,
  'gift': Gift,
  'mic-2': Mic2,
  'users': Users,
  'file-text': FileText,
  'package': Package,
  'car': Car,
  'heart-handshake': HeartHandshake,
  'tray': Inbox,
  'shield': Shield,
  'messages-square': ClipboardList,
  'church': Church,
  'landmark': Landmark,
  'home': HomeIcon,
};

const statusLabels: Record<CostStatus, string> = {
  not_searched: 'Belum dicari',
  estimate: 'Estimasi',
  quote: 'Quote',
  deal: 'Deal',
};

const checklistStatusLabels: Record<ChecklistStatus, string> = {
  todo: 'Todo',
  in_progress: 'Diproses',
  done: 'Selesai',
};

const checklistPriorityLabels: Record<ChecklistPriority, string> = {
  low: 'Low',
  normal: 'Normal',
  high: 'High',
};

function App() {
  const [session, setSession] = useState<Session | null>(null);
  const [authLoading, setAuthLoading] = useState(hasSupabaseConfig);

  useEffect(() => {
    if (!hasSupabaseConfig || !supabase) {
      return;
    }

    let ignore = false;
    supabase.auth.getSession().then(({ data }) => {
      if (!ignore) {
        setSession(data.session);
        setAuthLoading(false);
      }
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
      setAuthLoading(false);
    });

    return () => {
      ignore = true;
      subscription.unsubscribe();
    };
  }, []);

  if (!hasSupabaseConfig) return <EnvironmentScreen />;
  if (authLoading) return <LoadingScreen />;
  if (!session?.user) return <AuthScreen />;
  return <PlannerApp user={session.user} />;
}

function PlannerApp({ user }: { user: User }) {
  const [data, setData] = useState<AppData>(emptyData);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState<Tab>('home');
  const [quickAdd, setQuickAdd] = useState<QuickAdd | 'menu' | null>(null);
  const [profileOpen, setProfileOpen] = useState(false);

  const reload = async () => {
    setError(null);
    setLoading(true);
    try {
      const api = requireSupabase();
      const [
        profileResult,
        categoriesResult,
        costItemsResult,
        transactionsResult,
        vendorsResult,
        paymentsResult,
        checklistResult,
        receiptsResult,
      ] = await Promise.all([
        api.from('wedding_profiles').select('*').order('created_at', { ascending: true }).limit(1),
        api.from('categories').select('*').order('sort_order', { ascending: true }),
        api.from('cost_items').select('*').order('sort_order', { ascending: true }),
        api.from('transactions').select('*').order('date', { ascending: false }),
        api.from('vendors').select('*').order('name', { ascending: true }),
        api.from('payment_schedules').select('*').order('due_date', { ascending: true }),
        api.from('checklist_items').select('*').order('deadline', { ascending: true }),
        api.from('receipt_attachments').select('*').order('created_at', { ascending: true }),
      ]);

      const firstError =
        profileResult.error ||
        categoriesResult.error ||
        costItemsResult.error ||
        transactionsResult.error ||
        vendorsResult.error ||
        paymentsResult.error ||
        checklistResult.error ||
        receiptsResult.error;
      if (firstError) throw firstError;

      setData({
        profile: profileResult.data[0] ?? null,
        categories: categoriesResult.data,
        costItems: costItemsResult.data,
        transactions: transactionsResult.data,
        vendors: vendorsResult.data,
        payments: paymentsResult.data,
        checklistItems: checklistResult.data,
        receipts: receiptsResult.data,
      });
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void Promise.resolve().then(() => reload());
  }, []);

  if (loading) return <LoadingScreen />;
  if (error) return <ErrorScreen message={error} onRetry={reload} />;
  if (!data.profile) return <Onboarding user={user} onComplete={reload} />;

  return (
    <div className="app-shell">
      <header className="top-bar">
        <button className="icon-button" type="button" onClick={() => setProfileOpen(true)} aria-label="Profile">
          <UserRound size={20} />
        </button>
        <h1>{tabTitle(tab)}</h1>
        <button className="icon-button" type="button" onClick={() => setQuickAdd('menu')} aria-label="Tambah">
          <Plus size={20} />
        </button>
      </header>

      <main className="screen">
        {tab === 'home' && <HomeView data={data} />}
        {tab === 'costs' && <CostsView data={data} user={user} onRefresh={reload} onQuickAdd={setQuickAdd} />}
        {tab === 'checklist' && <ChecklistView data={data} onRefresh={reload} user={user} />}
        {tab === 'vendors' && <VendorsView data={data} onRefresh={reload} user={user} />}
      </main>

      <nav className="tab-bar">
        <TabButton active={tab === 'home'} label="Home" icon={HomeIcon} onClick={() => setTab('home')} />
        <TabButton active={tab === 'costs'} label="Biaya" icon={WalletCards} onClick={() => setTab('costs')} />
        <div className="tab-spacer" />
        <TabButton active={tab === 'checklist'} label="Checklist" icon={ListChecks} onClick={() => setTab('checklist')} />
        <TabButton active={tab === 'vendors'} label="Vendor" icon={CreditCard} onClick={() => setTab('vendors')} />
      </nav>

      <button className="droplet-add" type="button" onClick={() => setQuickAdd('menu')} aria-label="Tambah">
        <Plus size={28} />
      </button>

      {quickAdd && (
        <QuickAddModal
          mode={quickAdd}
          setMode={setQuickAdd}
          data={data}
          user={user}
          onClose={() => setQuickAdd(null)}
          onSaved={reload}
        />
      )}

      {profileOpen && (
        <ProfileDrawer data={data} user={user} onClose={() => setProfileOpen(false)} onRefresh={reload} />
      )}
    </div>
  );
}

function HomeView({ data }: { data: AppData }) {
  const profile = data.profile!;
  const estimate = estimatedTotal(data.costItems);
  const spent = spentTotal(data.transactions);
  const unpaid = unpaidPaymentTotal(data.payments, data.transactions);
  const overdue = data.checklistItems.filter(
    (item) => item.status !== 'done' && new Date(item.deadline) < startOfToday(),
  );
  const upcomingPayments = data.payments.filter((payment) => paymentStatus(payment, data.transactions) !== 'paid');

  return (
    <div className="stack">
      <section className="summary-card wedding-card">
        <div>
          <p className="eyebrow">Hari pernikahan</p>
          <strong className="countdown">{Math.max(0, daysUntil(profile.wedding_date))}</strong>
          <p className="muted">hari menuju {shortDate(profile.wedding_date)}</p>
        </div>
        <div className="align-right">
          <strong>
            {profile.groom_name} & {profile.bride_name}
          </strong>
          <p className="muted">{profile.city || 'Wedding profile'}</p>
        </div>
      </section>

      <SummaryCard title="Ringkasan biaya" icon={WalletCards}>
        <MetricGrid>
          <Metric label="Estimasi" value={currency(estimate, profile.currency_code)} />
          <Metric label="Keluar" value={currency(spent, profile.currency_code)} tone="rose" />
          <Metric label="Tagihan" value={currency(unpaid, profile.currency_code)} tone={unpaid ? 'gold' : 'sage'} />
        </MetricGrid>
        {profile.target_amount ? (
          <>
            <Divider />
            <MetricGrid columns={2}>
              <Metric label="Target" value={currency(profile.target_amount, profile.currency_code)} />
              <Metric
                label="Sisa Target"
                value={currency(profile.target_amount - spent, profile.currency_code)}
                tone={profile.target_amount >= spent ? 'sage' : 'red'}
              />
            </MetricGrid>
            <Progress value={spent} max={profile.target_amount} />
          </>
        ) : (
          estimate > 0 && <Progress value={spent} max={estimate} />
        )}
      </SummaryCard>

      <SummaryCard title="Jadwal pembayaran" icon={CalendarClock}>
        {upcomingPayments.length === 0 ? (
          <EmptyText>Tidak ada tagihan belum dibayar.</EmptyText>
        ) : (
          upcomingPayments.slice(0, 4).map((payment) => (
            <ListRow key={payment.id} title={payment.title} detail={shortDate(payment.due_date)} amount={currency(payment.amount_due, profile.currency_code)} />
          ))
        )}
      </SummaryCard>

      <SummaryCard title="Checklist terlambat" icon={ClipboardList}>
        {overdue.length === 0 ? (
          <EmptyText>Tidak ada checklist terlambat.</EmptyText>
        ) : (
          overdue.slice(0, 4).map((item) => (
            <ListRow key={item.id} title={item.title} detail={shortDate(item.deadline)} tone="red" />
          ))
        )}
      </SummaryCard>

      <SummaryCard title="Pengeluaran terbaru" icon={Receipt}>
        {data.transactions.length === 0 ? (
          <EmptyText>Belum ada pengeluaran.</EmptyText>
        ) : (
          data.transactions.slice(0, 5).map((transaction) => (
            <ListRow
              key={transaction.id}
              title={transaction.title}
              detail={transactionDetail(transaction, data)}
              amount={currency(transaction.amount, profile.currency_code)}
            />
          ))
        )}
      </SummaryCard>
    </div>
  );
}

function CostsView({
  data,
  user,
  onRefresh,
  onQuickAdd,
}: {
  data: AppData;
  user: User;
  onRefresh: () => Promise<void>;
  onQuickAdd: (mode: QuickAdd) => void;
}) {
  const [selectedCategoryID, setSelectedCategoryID] = useState<string | null>(null);
  const profile = data.profile!;
  const activeCategories = data.categories.filter((category) => !category.is_archived);
  const selectedCategory = activeCategories.find((category) => category.id === selectedCategoryID) ?? null;

  if (selectedCategory) {
    const items = data.costItems.filter((item) => item.category_id === selectedCategory.id && !item.is_archived);
    const transactions = data.transactions.filter((transaction) => transaction.category_id === selectedCategory.id);
    return (
      <div className="stack">
        <button className="back-button" type="button" onClick={() => setSelectedCategoryID(null)}>
          <ChevronLeft size={18} /> Biaya
        </button>
        <section className="summary-card">
          <div className="section-heading inline">
            <CategoryIcon category={selectedCategory} />
            <div>
              <h2>{selectedCategory.name}</h2>
              <p className="muted">{currency(categorySpent(selectedCategory, data.transactions), profile.currency_code)} keluar</p>
            </div>
          </div>
          <MetricGrid columns={2}>
            <Metric label="Keluar" value={currency(categorySpent(selectedCategory, data.transactions), profile.currency_code)} tone="rose" />
            <Metric label="Estimasi" value={currency(categoryEstimate(selectedCategory, data.costItems), profile.currency_code)} />
          </MetricGrid>
        </section>

        <SummaryCard title="Rincian biaya" icon={ListChecks}>
          {items.length === 0 ? (
            <EmptyText>Belum ada rincian biaya.</EmptyText>
          ) : (
            items.map((item) => (
              <CostItemRow key={item.id} item={item} data={data} userID={user.id} onRefresh={onRefresh} currencyCode={profile.currency_code} />
            ))
          )}
          <button className="secondary-action" type="button" onClick={() => onQuickAdd('costItem')}>
            <Plus size={18} /> Tambah rincian biaya
          </button>
        </SummaryCard>

        <SummaryCard title="Pengeluaran" icon={Receipt}>
          {transactions.length === 0 ? (
            <EmptyText>Belum ada pengeluaran untuk kategori ini.</EmptyText>
          ) : (
            transactions.map((transaction) => (
              <ListRow
                key={transaction.id}
                title={transaction.title}
                detail={transactionDetail(transaction, data)}
                amount={currency(transaction.amount, profile.currency_code)}
              />
            ))
          )}
        </SummaryCard>

        <button className="danger-outline" type="button" onClick={() => deleteCategory(selectedCategory, data, user.id, onRefresh)}>
          <Trash2 size={18} /> Hapus kategori
        </button>
      </div>
    );
  }

  return (
    <div className="stack">
      <section className="summary-card">
        <MetricGrid>
          <Metric label="Keluar" value={currency(spentTotal(data.transactions), profile.currency_code)} tone="rose" />
          <Metric label="Estimasi" value={currency(estimatedTotal(data.costItems), profile.currency_code)} />
          <Metric label="Tagihan" value={currency(unpaidPaymentTotal(data.payments, data.transactions), profile.currency_code)} tone="gold" />
        </MetricGrid>
      </section>
      <section className="list-section">
        <div className="section-heading">
          <h2>Kategori biaya</h2>
          <button className="small-button" type="button" onClick={() => onQuickAdd('category')}>
            <Plus size={16} /> Kategori
          </button>
        </div>
        {activeCategories.length === 0 ? (
          <EmptyBlock label="Belum ada kategori biaya." />
        ) : (
          activeCategories.map((category) => {
            const estimate = categoryEstimate(category, data.costItems);
            const spent = categorySpent(category, data.transactions);
            return (
              <button className="category-card" key={category.id} type="button" onClick={() => setSelectedCategoryID(category.id)}>
                <CategoryIcon category={category} />
                <span>
                  <strong>{category.name}</strong>
                  <small>{currency(spent, profile.currency_code)} keluar</small>
                </span>
                <span className="category-amount">
                  {estimate > 0 ? `${Math.min(Math.round((spent / estimate) * 100), 999)}%` : 'Estimasi kosong'}
                </span>
              </button>
            );
          })
        )}
      </section>
    </div>
  );
}

function ChecklistView({ data, user, onRefresh }: { data: AppData; user: User; onRefresh: () => Promise<void> }) {
  const [priority, setPriority] = useState<'all' | ChecklistPriority>('all');
  const [status, setStatus] = useState<'all' | ChecklistStatus>('all');
  const [dateFilter, setDateFilter] = useState<'all' | 'overdue' | 'week' | 'month'>('all');
  const [error, setError] = useState<string | null>(null);

  const filtered = data.checklistItems.filter((item) => {
    if (priority !== 'all' && item.priority !== priority) return false;
    if (status !== 'all' && item.status !== status) return false;
    if (dateFilter === 'overdue') return item.status !== 'done' && new Date(item.deadline) < startOfToday();
    if (dateFilter === 'week') {
      const deadline = new Date(item.deadline);
      const week = new Date();
      week.setDate(week.getDate() + 7);
      return deadline >= startOfToday() && deadline <= week;
    }
    if (dateFilter === 'month') {
      const deadline = new Date(item.deadline);
      const now = new Date();
      return deadline.getMonth() === now.getMonth() && deadline.getFullYear() === now.getFullYear();
    }
    return true;
  });

  const toggle = async (item: ChecklistItem) => {
    setError(null);
    try {
      const nextStatus = item.status === 'done' ? 'todo' : 'done';
      const { error } = await requireSupabase().from('checklist_items').update({ status: nextStatus }).eq('id', item.id).eq('user_id', user.id);
      if (error) throw error;
      await onRefresh();
    } catch (err) {
      setError(errorMessage(err));
    }
  };

  const remove = async (item: ChecklistItem) => {
    if (!confirm(`Hapus checklist "${item.title}"?`)) return;
    setError(null);
    try {
      const { error } = await requireSupabase().from('checklist_items').delete().eq('id', item.id).eq('user_id', user.id);
      if (error) throw error;
      await onRefresh();
    } catch (err) {
      setError(errorMessage(err));
    }
  };

  return (
    <div className="stack">
      <section className="summary-card">
        <Segmented value={priority} onChange={(value) => setPriority(value as typeof priority)} options={[
          ['all', 'All'],
          ['high', 'High'],
          ['normal', 'Normal'],
          ['low', 'Low'],
        ]} />
        <Segmented value={status} onChange={(value) => setStatus(value as typeof status)} options={[
          ['all', 'All'],
          ['todo', 'Todo'],
          ['in_progress', 'Diproses'],
          ['done', 'Selesai'],
        ]} />
        <Segmented value={dateFilter} onChange={(value) => setDateFilter(value as typeof dateFilter)} options={[
          ['all', 'Semua'],
          ['overdue', 'Telat'],
          ['week', '7 hari'],
          ['month', 'Bulan ini'],
        ]} />
      </section>
      {error && <InlineError message={error} />}
      <section className="list-section">
        <div className="section-heading">
          <h2>Checklist</h2>
          <span className="pill">{filtered.length}</span>
        </div>
        {filtered.length === 0 ? (
          <EmptyBlock label="Belum ada checklist." />
        ) : (
          filtered.map((item) => (
            <div className="check-row" key={item.id}>
              <button className="check-main" type="button" onClick={() => toggle(item)}>
                <CheckCircle2 className={item.status === 'done' ? 'done-icon' : ''} size={22} />
                <span>
                  <strong className={item.status === 'done' ? 'done-text' : ''}>{item.title}</strong>
                  <small>
                    {categoryName(item.category_id, data)} • {shortDate(item.deadline)} • {checklistStatusLabels[item.status]}
                  </small>
                </span>
              </button>
              <span className={`priority priority-${item.priority}`}>{checklistPriorityLabels[item.priority]}</span>
              <button className="icon-button danger" type="button" onClick={() => remove(item)} aria-label="Hapus checklist">
                <Trash2 size={17} />
              </button>
            </div>
          ))
        )}
      </section>
    </div>
  );
}

function VendorsView({ data, user, onRefresh }: { data: AppData; user: User; onRefresh: () => Promise<void> }) {
  const profile = data.profile!;
  const [error, setError] = useState<string | null>(null);

  const markPaid = async (payment: PaymentSchedule) => {
    setError(null);
    try {
      const fallbackCategoryID = payment.category_id ?? data.categories.find((category) => !category.is_archived)?.id;
      if (!fallbackCategoryID) throw new Error('Tambahkan kategori biaya dulu sebelum menandai pembayaran lunas.');
      const remaining = Math.max(0, payment.amount_due - paymentPaidTotal(payment, data.transactions));
      if (remaining > 0) {
        const { error: insertError } = await requireSupabase().from('transactions').insert({
          user_id: user.id,
          date: todayInput(),
          title: `Bayar ${payment.title}`,
          amount: remaining,
          category_id: fallbackCategoryID,
          cost_item_id: payment.cost_item_id,
          vendor_id: payment.vendor_id,
          payment_schedule_id: payment.id,
          kind: 'payment',
          notes: 'Ditandai lunas dari jadwal pembayaran.',
        });
        if (insertError) throw insertError;
      }
      const { error: updateError } = await requireSupabase().from('payment_schedules').update({ status: 'paid' }).eq('id', payment.id).eq('user_id', user.id);
      if (updateError) throw updateError;
      await onRefresh();
    } catch (err) {
      setError(errorMessage(err));
    }
  };

  return (
    <div className="stack">
      <section className="summary-card">
        <MetricGrid>
          <Metric label="Vendor" value={`${data.vendors.filter((vendor) => !vendor.is_archived).length}`} />
          <Metric label="Belum Bayar" value={currency(unpaidPaymentTotal(data.payments, data.transactions), profile.currency_code)} tone="rose" />
          <Metric
            label="Segera"
            value={`${data.payments.filter((payment) => paymentStatus(payment, data.transactions) !== 'paid' && daysUntil(payment.due_date) <= 14).length}`}
            tone="gold"
          />
        </MetricGrid>
      </section>
      {error && <InlineError message={error} />}
      <SummaryCard title="Vendor" icon={Users}>
        {data.vendors.filter((vendor) => !vendor.is_archived).length === 0 ? (
          <EmptyText>Belum ada vendor.</EmptyText>
        ) : (
          data.vendors
            .filter((vendor) => !vendor.is_archived)
            .map((vendor) => (
              <ListRow
                key={vendor.id}
                title={vendor.name}
                detail={[categoryName(vendor.category_id, data), vendor.package_name].filter(Boolean).join(' • ')}
                amount={vendor.agreed_amount > 0 ? currency(vendor.agreed_amount, profile.currency_code) : undefined}
              />
            ))
        )}
      </SummaryCard>
      <SummaryCard title="Jadwal pembayaran" icon={CalendarClock}>
        {data.payments.length === 0 ? (
          <EmptyText>Belum ada jadwal pembayaran.</EmptyText>
        ) : (
          data.payments.map((payment) => (
            <div className="payment-row" key={payment.id}>
              <ListRow
                title={payment.title}
                detail={[vendorName(payment.vendor_id, data), categoryName(payment.category_id, data), shortDate(payment.due_date)].filter(Boolean).join(' • ')}
                amount={currency(payment.amount_due, profile.currency_code)}
                tone={paymentStatus(payment, data.transactions) === 'paid' ? 'sage' : 'rose'}
              />
              {paymentStatus(payment, data.transactions) !== 'paid' && (
                <button className="secondary-action compact" type="button" onClick={() => markPaid(payment)}>
                  <CheckCircle2 size={16} /> Tandai lunas
                </button>
              )}
            </div>
          ))
        )}
      </SummaryCard>
    </div>
  );
}

function QuickAddModal({
  mode,
  setMode,
  data,
  user,
  onClose,
  onSaved,
}: {
  mode: QuickAdd | 'menu';
  setMode: (mode: QuickAdd | 'menu' | null) => void;
  data: AppData;
  user: User;
  onClose: () => void;
  onSaved: () => Promise<void>;
}) {
  const saveAndClose = async () => {
    await onSaved();
    onClose();
  };

  return (
    <div className="modal-backdrop" role="dialog" aria-modal="true">
      <div className="modal-sheet">
        <div className="modal-header">
          <strong>{quickAddTitle(mode)}</strong>
          <button className="icon-button" type="button" onClick={onClose} aria-label="Tutup">
            <X size={20} />
          </button>
        </div>
        {mode === 'menu' && (
          <div className="quick-menu">
            <QuickButton icon={Receipt} label="Catat Pengeluaran" onClick={() => setMode('expense')} />
            <QuickButton icon={CalendarClock} label="Jadwal Pembayaran" onClick={() => setMode('payment')} />
            <QuickButton icon={ClipboardList} label="Tambah Checklist" onClick={() => setMode('checklist')} />
            <QuickButton icon={Users} label="Tambah Vendor" onClick={() => setMode('vendor')} />
            <QuickButton icon={Folder} label="Tambah Kategori" onClick={() => setMode('category')} />
          </div>
        )}
        {mode === 'expense' && <ExpenseForm data={data} user={user} onSaved={saveAndClose} />}
        {mode === 'payment' && <PaymentForm data={data} user={user} onSaved={saveAndClose} />}
        {mode === 'checklist' && <ChecklistForm data={data} user={user} onSaved={saveAndClose} />}
        {mode === 'vendor' && <VendorForm data={data} user={user} onSaved={saveAndClose} />}
        {mode === 'category' && <CategoryForm data={data} user={user} onSaved={saveAndClose} />}
        {mode === 'costItem' && <CostItemForm data={data} user={user} onSaved={saveAndClose} />}
      </div>
    </div>
  );
}

function ExpenseForm({ data, user, onSaved }: FormProps) {
  const activeCategories = data.categories.filter((category) => !category.is_archived);
  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(todayInput());
  const [categoryID, setCategoryID] = useState(activeCategories[0]?.id ?? '');
  const [costItemID, setCostItemID] = useState('');
  const [vendorID, setVendorID] = useState('');
  const [paymentID, setPaymentID] = useState('');
  const [notes, setNotes] = useState('');
  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const availableItems = data.costItems.filter((item) => item.category_id === categoryID && !item.is_archived);
  const availableVendors = data.vendors.filter((vendor) => !vendor.is_archived && (!vendor.category_id || vendor.category_id === categoryID));
  const availablePayments = data.payments.filter(
    (payment) => paymentStatus(payment, data.transactions) !== 'paid' && (!payment.category_id || payment.category_id === categoryID),
  );

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setError(null);
    setSaving(true);
    try {
      if (!categoryID) throw new Error('Kategori wajib dipilih.');
      const api = requireSupabase();
      const { data: created, error: insertError } = await api
        .from('transactions')
        .insert({
          user_id: user.id,
          title: title.trim(),
          amount: parseAmount(amount),
          date,
          category_id: categoryID,
          cost_item_id: costItemID || null,
          vendor_id: vendorID || null,
          payment_schedule_id: paymentID || null,
          kind: paymentID ? 'payment' : 'expense',
          notes: notes.trim(),
        })
        .select()
        .single();
      if (insertError) throw insertError;

      if (receiptFile && created) {
        const path = `${user.id}/${created.id}/${Date.now()}-${safeFilename(receiptFile.name)}`;
        const { error: uploadError } = await api.storage.from('receipts').upload(path, receiptFile, { upsert: false });
        if (uploadError) throw uploadError;
        const { data: receipt, error: receiptError } = await api
          .from('receipt_attachments')
          .insert({
            user_id: user.id,
            transaction_id: created.id,
            storage_path: path,
            original_filename: receiptFile.name,
          })
          .select()
          .single();
        if (receiptError) throw receiptError;
        const { error: updateError } = await api
          .from('transactions')
          .update({ receipt_attachment_id: receipt.id })
          .eq('id', created.id)
          .eq('user_id', user.id);
        if (updateError) throw updateError;
      }

      if (paymentID) {
        const { error: paymentError } = await api.from('payment_schedules').update({ status: 'paid' }).eq('id', paymentID).eq('user_id', user.id);
        if (paymentError) throw paymentError;
      }

      await onSaved();
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  return (
    <FormShell onSubmit={submit} error={error}>
      <TextField label="Judul" value={title} onChange={setTitle} required />
      <TextField label="Nominal" value={amount} onChange={setAmount} inputMode="numeric" required />
      <DateField label="Tanggal" value={date} onChange={setDate} />
      <SelectField label="Kategori" value={categoryID} onChange={(value) => { setCategoryID(value); setCostItemID(''); setVendorID(''); }} options={activeCategories.map((category) => [category.id, category.name])} />
      <SelectField label="Rincian biaya" value={costItemID} onChange={setCostItemID} options={availableItems.map((item) => [item.id, item.name])} allowEmpty />
      <SelectField label="Vendor" value={vendorID} onChange={setVendorID} options={availableVendors.map((vendor) => [vendor.id, vendor.name])} allowEmpty />
      <SelectField label="Jadwal pembayaran" value={paymentID} onChange={setPaymentID} options={availablePayments.map((payment) => [payment.id, payment.title])} allowEmpty />
      <label className="field">
        <span>Receipt</span>
        <input type="file" accept="image/png,image/jpeg,image/webp" onChange={(event) => setReceiptFile(event.target.files?.[0] ?? null)} />
      </label>
      <TextArea label="Catatan" value={notes} onChange={setNotes} />
      <SubmitButton saving={saving}>Simpan pengeluaran</SubmitButton>
    </FormShell>
  );
}

function PaymentForm({ data, user, onSaved }: FormProps) {
  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('');
  const [dueDate, setDueDate] = useState(addDaysInput(7));
  const [categoryID, setCategoryID] = useState('');
  const [costItemID, setCostItemID] = useState('');
  const [vendorID, setVendorID] = useState('');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const activeCategories = data.categories.filter((category) => !category.is_archived);
  const availableItems = data.costItems.filter((item) => item.category_id === categoryID && !item.is_archived);
  const availableVendors = data.vendors.filter((vendor) => !vendor.is_archived && (!categoryID || !vendor.category_id || vendor.category_id === categoryID));

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setError(null);
    setSaving(true);
    try {
      const resolvedCategory = categoryID || data.vendors.find((vendor) => vendor.id === vendorID)?.category_id || null;
      const { error } = await requireSupabase().from('payment_schedules').insert({
        user_id: user.id,
        title: title.trim(),
        due_date: dueDate,
        amount_due: parseAmount(amount),
        category_id: resolvedCategory,
        cost_item_id: costItemID || null,
        vendor_id: vendorID || null,
        notes: notes.trim(),
      });
      if (error) throw error;
      await onSaved();
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  return (
    <FormShell onSubmit={submit} error={error}>
      <TextField label="Judul" value={title} onChange={setTitle} required />
      <TextField label="Nominal tagihan" value={amount} onChange={setAmount} inputMode="numeric" required />
      <DateField label="Jatuh tempo" value={dueDate} onChange={setDueDate} />
      <SelectField
        label="Kategori"
        value={categoryID}
        onChange={(value) => {
          setCategoryID(value);
          setCostItemID('');
          const selectedVendor = data.vendors.find((vendor) => vendor.id === vendorID);
          if (selectedVendor?.category_id && selectedVendor.category_id !== value) setVendorID('');
        }}
        options={activeCategories.map((category) => [category.id, category.name])}
        allowEmpty
      />
      <SelectField label="Rincian biaya" value={costItemID} onChange={setCostItemID} options={availableItems.map((item) => [item.id, item.name])} allowEmpty />
      <SelectField label="Vendor" value={vendorID} onChange={setVendorID} options={availableVendors.map((vendor) => [vendor.id, vendor.name])} allowEmpty />
      <TextArea label="Catatan" value={notes} onChange={setNotes} />
      <SubmitButton saving={saving}>Simpan jadwal</SubmitButton>
    </FormShell>
  );
}

function ChecklistForm({ data, user, onSaved }: FormProps) {
  const [title, setTitle] = useState('');
  const [deadline, setDeadline] = useState(addDaysInput(14));
  const [categoryID, setCategoryID] = useState('');
  const [priority, setPriority] = useState<ChecklistPriority>('normal');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setError(null);
    setSaving(true);
    try {
      const { error } = await requireSupabase().from('checklist_items').insert({
        user_id: user.id,
        title: title.trim(),
        deadline,
        category_id: categoryID || null,
        priority,
        notes: notes.trim(),
      });
      if (error) throw error;
      await onSaved();
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  return (
    <FormShell onSubmit={submit} error={error}>
      <TextField label="Judul" value={title} onChange={setTitle} required />
      <DateField label="Deadline" value={deadline} onChange={setDeadline} />
      <SelectField label="Kategori" value={categoryID} onChange={setCategoryID} options={data.categories.filter((category) => !category.is_archived).map((category) => [category.id, category.name])} allowEmpty />
      <SelectField label="Priority" value={priority} onChange={(value) => setPriority(value as ChecklistPriority)} options={[
        ['high', 'High'],
        ['normal', 'Normal'],
        ['low', 'Low'],
      ]} />
      <TextArea label="Catatan" value={notes} onChange={setNotes} />
      <SubmitButton saving={saving}>Simpan checklist</SubmitButton>
    </FormShell>
  );
}

function VendorForm({ data, user, onSaved }: FormProps) {
  const [name, setName] = useState('');
  const [categoryID, setCategoryID] = useState('');
  const [contactName, setContactName] = useState('');
  const [phone, setPhone] = useState('');
  const [instagram, setInstagram] = useState('');
  const [packageName, setPackageName] = useState('');
  const [amount, setAmount] = useState('');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setError(null);
    setSaving(true);
    try {
      const { error } = await requireSupabase().from('vendors').insert({
        user_id: user.id,
        name: name.trim(),
        category_id: categoryID || null,
        contact_name: contactName.trim(),
        phone: phone.trim(),
        instagram: instagram.trim(),
        package_name: packageName.trim(),
        agreed_amount: parseAmount(amount),
        notes: notes.trim(),
      });
      if (error) throw error;
      await onSaved();
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  return (
    <FormShell onSubmit={submit} error={error}>
      <TextField label="Nama vendor" value={name} onChange={setName} required />
      <SelectField label="Kategori" value={categoryID} onChange={setCategoryID} options={data.categories.filter((category) => !category.is_archived).map((category) => [category.id, category.name])} allowEmpty />
      <TextField label="Contact person" value={contactName} onChange={setContactName} />
      <TextField label="Phone / WhatsApp" value={phone} onChange={setPhone} />
      <TextField label="Instagram" value={instagram} onChange={setInstagram} />
      <TextField label="Paket" value={packageName} onChange={setPackageName} />
      <TextField label="Nilai deal" value={amount} onChange={setAmount} inputMode="numeric" />
      <TextArea label="Catatan" value={notes} onChange={setNotes} />
      <SubmitButton saving={saving}>Simpan vendor</SubmitButton>
    </FormShell>
  );
}

function CategoryForm({ data, user, onSaved }: FormProps) {
  const [name, setName] = useState('');
  const [estimate, setEstimate] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setError(null);
    setSaving(true);
    try {
      const { data: category, error } = await requireSupabase()
        .from('categories')
        .insert({
          user_id: user.id,
          name: name.trim(),
          icon: 'folder',
          color_hex: '#7D9A83',
          sort_order: (data.categories.at(-1)?.sort_order ?? 0) + 1,
        })
        .select()
        .single();
      if (error) throw error;
      const amount = parseAmount(estimate);
      if (amount > 0 && category) {
        const { error: itemError } = await requireSupabase().from('cost_items').insert({
          user_id: user.id,
          category_id: category.id,
          name: 'Rincian umum',
          estimated_amount: amount,
          cost_status: 'estimate',
        });
        if (itemError) throw itemError;
      }
      await onSaved();
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  return (
    <FormShell onSubmit={submit} error={error}>
      <TextField label="Nama kategori" value={name} onChange={setName} required />
      <TextField label="Estimasi awal opsional" value={estimate} onChange={setEstimate} inputMode="numeric" />
      <SubmitButton saving={saving}>Simpan kategori</SubmitButton>
    </FormShell>
  );
}

function CostItemForm({ data, user, onSaved }: FormProps) {
  const [categoryID, setCategoryID] = useState(data.categories.find((category) => !category.is_archived)?.id ?? '');
  const [name, setName] = useState('');
  const [amount, setAmount] = useState('');
  const [status, setStatus] = useState<CostStatus>('not_searched');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setError(null);
    setSaving(true);
    try {
      if (!categoryID) throw new Error('Kategori wajib dipilih.');
      const estimated = parseAmount(amount);
      const siblings = data.costItems.filter((item) => item.category_id === categoryID);
      const { error } = await requireSupabase().from('cost_items').insert({
        user_id: user.id,
        category_id: categoryID,
        name: name.trim(),
        estimated_amount: estimated,
        cost_status: status === 'not_searched' && estimated > 0 ? 'estimate' : status,
        notes: notes.trim(),
        sort_order: (siblings.at(-1)?.sort_order ?? 0) + 1,
      });
      if (error) throw error;
      await onSaved();
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  return (
    <FormShell onSubmit={submit} error={error}>
      <SelectField label="Kategori" value={categoryID} onChange={setCategoryID} options={data.categories.filter((category) => !category.is_archived).map((category) => [category.id, category.name])} />
      <TextField label="Nama rincian" value={name} onChange={setName} required />
      <TextField label="Estimasi biaya" value={amount} onChange={setAmount} inputMode="numeric" />
      <SelectField label="Status harga" value={status} onChange={(value) => setStatus(value as CostStatus)} options={[
        ['not_searched', 'Belum dicari'],
        ['estimate', 'Estimasi'],
        ['quote', 'Quote'],
        ['deal', 'Deal'],
      ]} />
      <TextArea label="Catatan" value={notes} onChange={setNotes} />
      <SubmitButton saving={saving}>Simpan rincian</SubmitButton>
    </FormShell>
  );
}

type FormProps = {
  data: AppData;
  user: User;
  onSaved: () => Promise<void>;
};

function Onboarding({ user, onComplete }: { user: User; onComplete: () => Promise<void> }) {
  const [groomName, setGroomName] = useState('');
  const [brideName, setBrideName] = useState('');
  const [weddingDate, setWeddingDate] = useState('2026-12-12');
  const [city, setCity] = useState('');
  const [guestEstimate, setGuestEstimate] = useState('300');
  const [targetAmount, setTargetAmount] = useState('');
  const [templateType, setTemplateType] = useState<BudgetTemplateType>('batak_toba');
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const api = requireSupabase();
      const { error: profileError } = await api.from('wedding_profiles').insert({
        user_id: user.id,
        groom_name: groomName.trim(),
        bride_name: brideName.trim(),
        wedding_date: weddingDate,
        city: city.trim(),
        guest_estimate: Number.parseInt(guestEstimate || '0', 10),
        target_amount: parseAmount(targetAmount) || null,
        currency_code: 'IDR',
      });
      if (profileError) throw profileError;
      await seedTemplate(user.id, weddingDate, templateType);
      await onComplete();
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const selectedTemplate = templateOptions.find((option) => option.value === templateType)!;

  return (
    <div className="auth-page">
      <form className="auth-card setup-card" onSubmit={submit}>
        <div>
          <p className="eyebrow">Setup</p>
          <h1>Rencana Pernikahan</h1>
          <p className="muted">Mulai dari profil wedding, lalu pilih template biaya yang bisa diedit setelah setup.</p>
        </div>
        <TextField label="Nama mempelai pria" value={groomName} onChange={setGroomName} required />
        <TextField label="Nama mempelai wanita" value={brideName} onChange={setBrideName} required />
        <DateField label="Tanggal wedding" value={weddingDate} onChange={setWeddingDate} />
        <TextField label="Kota" value={city} onChange={setCity} />
        <TextField label="Estimasi tamu" value={guestEstimate} onChange={setGuestEstimate} inputMode="numeric" />
        <TextField label="Target total biaya opsional" value={targetAmount} onChange={setTargetAmount} inputMode="numeric" />
        <SelectField label="Template biaya" value={templateType} onChange={(value) => setTemplateType(value as BudgetTemplateType)} options={templateOptions.map((option) => [option.value, option.label])} />
        <div className="template-note">
          <strong>{selectedTemplate.label}</strong>
          <span>{selectedTemplate.description}</span>
        </div>
        {error && <InlineError message={error} />}
        <SubmitButton saving={saving}>Create wedding planner</SubmitButton>
      </form>
    </div>
  );
}

async function seedTemplate(userID: string, weddingDate: string, templateType: BudgetTemplateType) {
  const api = requireSupabase();
  const template = getTemplate(templateType);
  const reference = new Date(weddingDate);

  for (const [categoryIndex, categoryTemplate] of template.entries()) {
    const { data: category, error: categoryError } = await api
      .from('categories')
      .insert({
        user_id: userID,
        name: categoryTemplate.name,
        icon: categoryTemplate.icon,
        color_hex: categoryTemplate.colorHex,
        sort_order: categoryIndex,
      })
      .select()
      .single();
    if (categoryError) throw categoryError;

    const costRows = categoryTemplate.items.map((item, itemIndex) => ({
      user_id: userID,
      category_id: category.id,
      name: item.name,
      estimated_amount: item.estimatedAmount,
      cost_status: (item.estimatedAmount > 0 ? 'estimate' : 'not_searched') as CostStatus,
      sort_order: itemIndex,
    }));
    if (costRows.length) {
      const { error } = await api.from('cost_items').insert(costRows);
      if (error) throw error;
    }

    const checklistRows = categoryTemplate.checklist.map((title, checklistIndex) => {
      const deadline = new Date(reference);
      deadline.setDate(deadline.getDate() - Math.max(14, (24 - categoryIndex - checklistIndex) * 7));
      return {
        user_id: userID,
        category_id: category.id,
        title,
        deadline: inputDate(deadline),
        priority: (checklistIndex === 0 ? 'high' : 'normal') as ChecklistPriority,
      };
    });
    if (checklistRows.length) {
      const { error } = await api.from('checklist_items').insert(checklistRows);
      if (error) throw error;
    }
  }
}

function AuthScreen() {
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setSaving(true);
    setError(null);
    setMessage(null);
    try {
      const api = requireSupabase();
      if (mode === 'signin') {
        const { error } = await api.auth.signInWithPassword({ email, password });
        if (error) throw error;
      } else {
        const { error } = await api.auth.signUp({ email, password });
        if (error) throw error;
        setMessage('Account dibuat. Cek email jika Supabase meminta konfirmasi.');
      }
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="auth-page">
      <form className="auth-card" onSubmit={submit}>
        <div className="brand-mark">
          <Heart size={30} />
        </div>
        <div>
          <p className="eyebrow">Wedding Planner</p>
          <h1>{mode === 'signin' ? 'Masuk' : 'Buat Akun'}</h1>
        </div>
        <TextField label="Email" type="email" value={email} onChange={setEmail} required />
        <TextField label="Password" type="password" value={password} onChange={setPassword} required />
        {error && <InlineError message={error} />}
        {message && <div className="inline-success">{message}</div>}
        <SubmitButton saving={saving}>{mode === 'signin' ? 'Masuk' : 'Buat akun'}</SubmitButton>
        <button className="link-button" type="button" onClick={() => setMode(mode === 'signin' ? 'signup' : 'signin')}>
          {mode === 'signin' ? 'Buat akun baru' : 'Sudah punya akun'}
        </button>
      </form>
    </div>
  );
}

function ProfileDrawer({ data, user, onClose, onRefresh }: { data: AppData; user: User; onClose: () => void; onRefresh: () => Promise<void> }) {
  const profile = data.profile!;
  const [targetAmount, setTargetAmount] = useState(profile.target_amount ? String(profile.target_amount) : '');
  const [guestEstimate, setGuestEstimate] = useState(String(profile.guest_estimate));
  const [city, setCity] = useState(profile.city);
  const [error, setError] = useState<string | null>(null);
  const isStandalone = useMemo(() => window.matchMedia('(display-mode: standalone)').matches || (navigator as Navigator & { standalone?: boolean }).standalone, []);

  const saveProfile = async () => {
    setError(null);
    try {
      const { error } = await requireSupabase()
        .from('wedding_profiles')
        .update({
          city: city.trim(),
          guest_estimate: Number.parseInt(guestEstimate || '0', 10),
          target_amount: parseAmount(targetAmount) || null,
        })
        .eq('id', profile.id)
        .eq('user_id', user.id);
      if (error) throw error;
      await onRefresh();
    } catch (err) {
      setError(errorMessage(err));
    }
  };

  const clearPlanningData = async () => {
    if (!confirm('Kosongkan semua data biaya, vendor, pembayaran, dan checklist? Profil wedding tetap disimpan.')) return;
    setError(null);
    try {
      await clearPlanningDataForUser(data, user.id);
      await onRefresh();
    } catch (err) {
      setError(errorMessage(err));
    }
  };

  const resetData = async () => {
    if (!confirm('Reset semua data wedding untuk akun ini?')) return;
    setError(null);
    try {
      const api = requireSupabase();
      await clearPlanningDataForUser(data, user.id);
      const { error: profileError } = await api.from('wedding_profiles').delete().eq('user_id', user.id);
      if (profileError) throw profileError;
      await onRefresh();
      onClose();
    } catch (err) {
      setError(errorMessage(err));
    }
  };

  return (
    <div className="drawer-backdrop">
      <aside className="profile-drawer">
        <div className="modal-header">
          <div>
            <h2>Profil</h2>
            <p className="muted">{profile.groom_name} & {profile.bride_name}</p>
          </div>
          <button className="icon-button" type="button" onClick={onClose} aria-label="Tutup">
            <X size={20} />
          </button>
        </div>
        <div className="drawer-section">
          <TextField label="Kota" value={city} onChange={setCity} />
          <TextField label="Estimasi tamu" value={guestEstimate} onChange={setGuestEstimate} inputMode="numeric" />
          <TextField label="Target total biaya" value={targetAmount} onChange={setTargetAmount} inputMode="numeric" />
          <button className="primary-action" type="button" onClick={saveProfile}>
            Simpan profil
          </button>
        </div>
        <div className="drawer-section">
          <h3>Install</h3>
          {isStandalone ? (
            <p className="muted">App sudah berjalan dari Home Screen.</p>
          ) : (
            <ol className="install-list">
              <li>Buka link ini di Safari.</li>
              <li>Tap Share.</li>
              <li>Pilih Add to Home Screen.</li>
            </ol>
          )}
        </div>
        <div className="drawer-section">
          <button className="danger-outline full" type="button" onClick={clearPlanningData}>
            <Trash2 size={18} /> Kosongkan Data Planning
          </button>
          <button className="danger-outline full" type="button" onClick={resetData}>
            <Trash2 size={18} /> Reset App ke Awal
          </button>
          <button className="secondary-action full" type="button" onClick={() => requireSupabase().auth.signOut()}>
            <LogOut size={18} /> Keluar
          </button>
        </div>
        {error && <InlineError message={error} />}
      </aside>
    </div>
  );
}

async function clearPlanningDataForUser(data: AppData, userID: string) {
  const api = requireSupabase();
  const receiptPaths = data.receipts.map((receipt) => receipt.storage_path);
  if (receiptPaths.length) {
    await api.storage.from('receipts').remove(receiptPaths);
  }

  const receiptResult = await api.from('receipt_attachments').delete().eq('user_id', userID);
  if (receiptResult.error) throw receiptResult.error;
  const transactionResult = await api.from('transactions').delete().eq('user_id', userID);
  if (transactionResult.error) throw transactionResult.error;
  const paymentResult = await api.from('payment_schedules').delete().eq('user_id', userID);
  if (paymentResult.error) throw paymentResult.error;
  const checklistResult = await api.from('checklist_items').delete().eq('user_id', userID);
  if (checklistResult.error) throw checklistResult.error;
  const costItemResult = await api.from('cost_items').delete().eq('user_id', userID);
  if (costItemResult.error) throw costItemResult.error;
  const vendorResult = await api.from('vendors').delete().eq('user_id', userID);
  if (vendorResult.error) throw vendorResult.error;
  const categoryResult = await api.from('categories').delete().eq('user_id', userID);
  if (categoryResult.error) throw categoryResult.error;
}

function CostItemRow({
  item,
  data,
  userID,
  onRefresh,
  currencyCode,
}: {
  item: CostItem;
  data: AppData;
  userID: string;
  onRefresh: () => Promise<void>;
  currencyCode: string;
}) {
  const [editing, setEditing] = useState(false);
  const spent = data.transactions.filter((transaction) => transaction.cost_item_id === item.id).reduce((total, transaction) => total + transaction.amount, 0);

  const remove = async () => {
    const linked = data.transactions.filter((transaction) => transaction.cost_item_id === item.id);
    const linkedPayments = data.payments.filter((payment) => payment.cost_item_id === item.id);
    const total = linked.reduce((sum, transaction) => sum + transaction.amount, 0);
    if (linked.length || linkedPayments.length) {
      const typed = prompt(
        `Rincian "${item.name}" punya ${linked.length} transaksi (${currency(total, currencyCode)}) dan ${linkedPayments.length} jadwal pembayaran. Ketik DELETE untuk hapus semuanya.`,
      );
      if (typed !== 'DELETE') return;
    } else if (!confirm(`Hapus rincian "${item.name}"?`)) {
      return;
    }

    try {
      const api = requireSupabase();
      const receiptPaths = receiptPathsForTransactions(linked, data);
      await removeReceiptPaths(receiptPaths);
      if (linked.length) {
        const transactionResult = await api.from('transactions').delete().in('id', linked.map((transaction) => transaction.id));
        if (transactionResult.error) throw transactionResult.error;
      }
      if (linkedPayments.length) {
        const paymentResult = await api.from('payment_schedules').delete().in('id', linkedPayments.map((payment) => payment.id));
        if (paymentResult.error) throw paymentResult.error;
      }
      const itemResult = await api.from('cost_items').delete().eq('id', item.id).eq('user_id', userID);
      if (itemResult.error) throw itemResult.error;
      await onRefresh();
    } catch (err) {
      alert(errorMessage(err));
    }
  };

  return (
    <>
      <div className="cost-item-row">
        <button className="cost-item-main" type="button" onClick={() => setEditing(true)}>
          <span>
            <strong>{item.name}</strong>
            <small>{statusLabels[item.cost_status]}</small>
            {item.estimated_amount > 0 && <Progress value={spent} max={item.estimated_amount} />}
          </span>
          <span className="align-right">
            <strong>{item.estimated_amount > 0 ? currency(item.estimated_amount, currencyCode) : 'Belum ada estimasi'}</strong>
            <small>{currency(spent, currencyCode)} keluar</small>
          </span>
        </button>
        <button className="icon-button danger" type="button" onClick={remove} aria-label="Hapus rincian">
          <Trash2 size={17} />
        </button>
      </div>
      {editing && (
        <div className="modal-backdrop" role="dialog" aria-modal="true">
          <div className="modal-sheet">
            <div className="modal-header">
              <strong>Edit Rincian</strong>
              <button className="icon-button" type="button" onClick={() => setEditing(false)} aria-label="Tutup">
                <X size={20} />
              </button>
            </div>
            <CostItemEditForm
              item={item}
              onSaved={async () => {
                await onRefresh();
                setEditing(false);
              }}
            />
          </div>
        </div>
      )}
    </>
  );
}

function CostItemEditForm({ item, onSaved }: { item: CostItem; onSaved: () => Promise<void> }) {
  const [name, setName] = useState(item.name);
  const [amount, setAmount] = useState(String(item.estimated_amount || ''));
  const [status, setStatus] = useState<CostStatus>(item.cost_status);
  const [notes, setNotes] = useState(item.notes);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setError(null);
    setSaving(true);
    try {
      const { error } = await requireSupabase()
        .from('cost_items')
        .update({
          name: name.trim(),
          estimated_amount: parseAmount(amount),
          cost_status: status,
          notes: notes.trim(),
        })
        .eq('id', item.id)
        .eq('user_id', item.user_id);
      if (error) throw error;
      await onSaved();
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  return (
    <FormShell onSubmit={submit} error={error}>
      <TextField label="Nama rincian" value={name} onChange={setName} required />
      <TextField label="Estimasi biaya" value={amount} onChange={setAmount} inputMode="numeric" />
      <SelectField
        label="Status harga"
        value={status}
        onChange={(value) => setStatus(value as CostStatus)}
        options={[
          ['not_searched', 'Belum dicari'],
          ['estimate', 'Estimasi'],
          ['quote', 'Quote'],
          ['deal', 'Deal'],
        ]}
      />
      <TextArea label="Catatan" value={notes} onChange={setNotes} />
      <SubmitButton saving={saving}>Simpan perubahan</SubmitButton>
    </FormShell>
  );
}

async function deleteCategory(category: Category, data: AppData, userID: string, onRefresh: () => Promise<void>) {
  const categoryItems = data.costItems.filter((item) => item.category_id === category.id);
  const categoryItemIDs = new Set(categoryItems.map((item) => item.id));
  const linkedTransactions = data.transactions.filter(
    (transaction) => transaction.category_id === category.id || (transaction.cost_item_id ? categoryItemIDs.has(transaction.cost_item_id) : false),
  );
  const linkedPayments = data.payments.filter(
    (payment) => payment.category_id === category.id || (payment.cost_item_id ? categoryItemIDs.has(payment.cost_item_id) : false),
  );
  const linkedChecklist = data.checklistItems.filter((item) => item.category_id === category.id);
  const linkedVendors = data.vendors.filter((vendor) => vendor.category_id === category.id);
  const linkedCount = categoryItems.length + linkedTransactions.length + linkedPayments.length + linkedChecklist.length + linkedVendors.length;

  if (linkedCount > 0) {
    const total = linkedTransactions.reduce((sum, transaction) => sum + transaction.amount, 0);
    const typed = prompt(
      `Kategori "${category.name}" punya ${categoryItems.length} rincian, ${linkedTransactions.length} transaksi (${currency(total)}), ${linkedPayments.length} jadwal, ${linkedChecklist.length} checklist, dan ${linkedVendors.length} vendor terkait. Ketik DELETE untuk hapus kategori dan data terkait. Vendor tidak dihapus, hanya dilepas dari kategori.`,
    );
    if (typed !== 'DELETE') return;
  } else if (!confirm(`Hapus kategori "${category.name}"?`)) {
    return;
  }

  const api = requireSupabase();
  try {
    await removeReceiptPaths(receiptPathsForTransactions(linkedTransactions, data));
    if (linkedTransactions.length) {
      const transactionResult = await api.from('transactions').delete().in('id', linkedTransactions.map((transaction) => transaction.id));
      if (transactionResult.error) throw transactionResult.error;
    }
    if (linkedPayments.length) {
      const paymentResult = await api.from('payment_schedules').delete().in('id', linkedPayments.map((payment) => payment.id));
      if (paymentResult.error) throw paymentResult.error;
    }
    if (linkedChecklist.length) {
      const checklistResult = await api.from('checklist_items').delete().in('id', linkedChecklist.map((item) => item.id));
      if (checklistResult.error) throw checklistResult.error;
    }
    if (linkedVendors.length) {
      const vendorResult = await api.from('vendors').update({ category_id: null }).eq('category_id', category.id).eq('user_id', userID);
      if (vendorResult.error) throw vendorResult.error;
    }
    if (categoryItems.length) {
      const itemResult = await api.from('cost_items').delete().in('id', categoryItems.map((item) => item.id));
      if (itemResult.error) throw itemResult.error;
    }
    const categoryResult = await api.from('categories').delete().eq('id', category.id).eq('user_id', userID);
    if (categoryResult.error) throw categoryResult.error;
    await onRefresh();
  } catch (err) {
    alert(errorMessage(err));
  }
}

function receiptPathsForTransactions(transactions: Transaction[], data: AppData) {
  const transactionIDs = new Set(transactions.map((transaction) => transaction.id));
  const receiptIDs = new Set(transactions.map((transaction) => transaction.receipt_attachment_id).filter(Boolean));
  return data.receipts
    .filter((receipt) => (receipt.transaction_id ? transactionIDs.has(receipt.transaction_id) : false) || receiptIDs.has(receipt.id))
    .map((receipt) => receipt.storage_path);
}

async function removeReceiptPaths(paths: string[]) {
  if (!paths.length) return;
  const { error } = await requireSupabase().storage.from('receipts').remove(paths);
  if (error) throw error;
}

function FormShell({ children, onSubmit, error }: { children: ReactNode; onSubmit: (event: FormEvent) => void; error: string | null }) {
  return (
    <form className="form-stack" onSubmit={onSubmit}>
      {children}
      {error && <InlineError message={error} />}
    </form>
  );
}

function TextField({
  label,
  value,
  onChange,
  type = 'text',
  required = false,
  inputMode,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  required?: boolean;
  inputMode?: HTMLAttributes<HTMLInputElement>['inputMode'];
}) {
  return (
    <label className="field">
      <span>{label}</span>
      <input type={type} value={value} onChange={(event) => onChange(event.target.value)} required={required} inputMode={inputMode} />
    </label>
  );
}

function DateField({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return (
    <label className="field">
      <span>{label}</span>
      <input type="date" value={value} onChange={(event) => onChange(event.target.value)} />
    </label>
  );
}

function TextArea({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return (
    <label className="field">
      <span>{label}</span>
      <textarea value={value} onChange={(event) => onChange(event.target.value)} rows={3} />
    </label>
  );
}

function SelectField({
  label,
  value,
  onChange,
  options,
  allowEmpty = false,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: ReadonlyArray<readonly [string, string]>;
  allowEmpty?: boolean;
}) {
  return (
    <label className="field">
      <span>{label}</span>
      <select value={value} onChange={(event) => onChange(event.target.value)}>
        {allowEmpty && <option value="">None</option>}
        {options.map(([optionValue, optionLabel]) => (
          <option key={optionValue} value={optionValue}>
            {optionLabel}
          </option>
        ))}
      </select>
    </label>
  );
}

function SubmitButton({ children, saving }: { children: ReactNode; saving: boolean }) {
  return (
    <button className="primary-action" type="submit" disabled={saving}>
      {saving ? 'Menyimpan...' : children}
    </button>
  );
}

function SummaryCard({ title, icon: Icon, children }: { title: string; icon: LucideIcon; children: ReactNode }) {
  return (
    <section className="summary-card">
      <div className="card-title">
        <Icon size={18} />
        <h2>{title}</h2>
      </div>
      <div className="card-content">{children}</div>
    </section>
  );
}

function MetricGrid({ children, columns = 3 }: { children: ReactNode; columns?: number }) {
  return (
    <div className="metric-grid" style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}>
      {children}
    </div>
  );
}

function Metric({ label, value, tone = 'ink' }: { label: string; value: string; tone?: 'ink' | 'rose' | 'sage' | 'gold' | 'red' }) {
  return (
    <div className="metric">
      <span>{label}</span>
      <strong className={`tone-${tone}`}>{value}</strong>
    </div>
  );
}

function Progress({ value, max }: { value: number; max: number }) {
  const percentage = max > 0 ? Math.min(Math.max(value / max, 0), 1) * 100 : 0;
  return (
    <div className="progress-track">
      <span style={{ width: `${percentage}%` }} />
    </div>
  );
}

function ListRow({ title, detail, amount, tone }: { title: string; detail?: string; amount?: string; tone?: 'red' | 'sage' | 'rose' }) {
  return (
    <div className="list-row">
      <div>
        <strong>{title}</strong>
        {detail && <small className={tone ? `tone-${tone}` : ''}>{detail}</small>}
      </div>
      {amount && <strong>{amount}</strong>}
    </div>
  );
}

function CategoryIcon({ category }: { category: Category }) {
  const Icon = categoryIcons[category.icon] ?? Folder;
  return (
    <span className="category-icon" style={{ color: category.color_hex, backgroundColor: `${category.color_hex}22` }}>
      <Icon size={20} />
    </span>
  );
}

function TabButton({ active, label, icon: Icon, onClick }: { active: boolean; label: string; icon: LucideIcon; onClick: () => void }) {
  return (
    <button className={active ? 'tab-button active' : 'tab-button'} type="button" onClick={onClick}>
      <Icon size={20} />
      <span>{label}</span>
    </button>
  );
}

function QuickButton({ icon: Icon, label, onClick }: { icon: LucideIcon; label: string; onClick: () => void }) {
  return (
    <button className="quick-button" type="button" onClick={onClick}>
      <Icon size={20} />
      <span>{label}</span>
    </button>
  );
}

function Segmented({ value, onChange, options }: { value: string; onChange: (value: string) => void; options: ReadonlyArray<readonly [string, string]> }) {
  return (
    <div className="segmented">
      {options.map(([optionValue, label]) => (
        <button key={optionValue} className={value === optionValue ? 'active' : ''} type="button" onClick={() => onChange(optionValue)}>
          {label}
        </button>
      ))}
    </div>
  );
}

function EmptyText({ children }: { children: ReactNode }) {
  return <p className="empty-text">{children}</p>;
}

function EmptyBlock({ label }: { label: string }) {
  return <div className="empty-block">{label}</div>;
}

function Divider() {
  return <div className="divider" />;
}

function InlineError({ message }: { message: string }) {
  return <div className="inline-error">{message}</div>;
}

function LoadingScreen() {
  return (
    <div className="auth-page">
      <div className="auth-card center-card">
        <div className="brand-mark">
          <Heart size={30} />
        </div>
        <strong>Wedding Planner</strong>
        <p className="muted">Menyiapkan data...</p>
      </div>
    </div>
  );
}

function ErrorScreen({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div className="auth-page">
      <div className="auth-card">
        <h1>Gagal memuat</h1>
        <InlineError message={message} />
        <button className="primary-action" type="button" onClick={onRetry}>
          Coba lagi
        </button>
      </div>
    </div>
  );
}

function EnvironmentScreen() {
  return (
    <div className="auth-page">
      <div className="auth-card">
        <h1>Supabase belum aktif</h1>
        <p className="muted">Isi `.env.local` dari `.env.example`, lalu restart dev server.</p>
      </div>
    </div>
  );
}

function tabTitle(tab: Tab) {
  if (tab === 'costs') return 'Biaya';
  if (tab === 'checklist') return 'Checklist';
  if (tab === 'vendors') return 'Vendor';
  return 'Home';
}

function quickAddTitle(mode: QuickAdd | 'menu') {
  const labels: Record<QuickAdd | 'menu', string> = {
    menu: 'Tambah',
    expense: 'Catat Pengeluaran',
    payment: 'Jadwal Pembayaran',
    checklist: 'Tambah Checklist',
    vendor: 'Tambah Vendor',
    category: 'Tambah Kategori',
    costItem: 'Tambah Rincian',
  };
  return labels[mode];
}

function categoryName(id: string | null, data: AppData) {
  if (!id) return '';
  return data.categories.find((category) => category.id === id)?.name ?? '';
}

function vendorName(id: string | null, data: AppData) {
  if (!id) return '';
  return data.vendors.find((vendor) => vendor.id === id)?.name ?? '';
}

function transactionDetail(transaction: Transaction, data: AppData) {
  const itemName = data.costItems.find((item) => item.id === transaction.cost_item_id)?.name;
  return [shortDate(transaction.date), categoryName(transaction.category_id, data), itemName, vendorName(transaction.vendor_id, data)]
    .filter(Boolean)
    .join(' • ');
}

function startOfToday() {
  const date = new Date();
  date.setHours(0, 0, 0, 0);
  return date;
}

function safeFilename(name: string) {
  return name.toLowerCase().replace(/[^a-z0-9.-]/g, '-');
}

function errorMessage(error: unknown) {
  if (error instanceof Error) return error.message;
  if (typeof error === 'object' && error && 'message' in error) return String((error as { message: unknown }).message);
  return 'Terjadi kesalahan.';
}

export default App;
