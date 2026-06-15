export type CostStatus = 'not_searched' | 'estimate' | 'quote' | 'deal';
export type PaymentStatus = 'pending' | 'partial' | 'paid';
export type ChecklistStatus = 'todo' | 'in_progress' | 'done';
export type ChecklistPriority = 'low' | 'normal' | 'high';
export type TransactionKind = 'expense' | 'payment';
export type BudgetTemplateType = 'general_indonesian' | 'batak_toba';

export type WeddingProfile = {
  id: string;
  user_id: string;
  groom_name: string;
  bride_name: string;
  wedding_date: string;
  city: string;
  guest_estimate: number;
  target_amount: number | null;
  currency_code: string;
  created_at: string;
  updated_at: string;
};

export type Category = {
  id: string;
  user_id: string;
  name: string;
  icon: string;
  color_hex: string;
  sort_order: number;
  is_archived: boolean;
  created_at: string;
  updated_at: string;
};

export type CostItem = {
  id: string;
  user_id: string;
  category_id: string;
  name: string;
  estimated_amount: number;
  cost_status: CostStatus;
  notes: string;
  sort_order: number;
  is_archived: boolean;
  created_at: string;
  updated_at: string;
};

export type Transaction = {
  id: string;
  user_id: string;
  date: string;
  title: string;
  amount: number;
  category_id: string;
  cost_item_id: string | null;
  vendor_id: string | null;
  payment_schedule_id: string | null;
  receipt_attachment_id: string | null;
  kind: TransactionKind;
  notes: string;
  created_at: string;
  updated_at: string;
};

export type Vendor = {
  id: string;
  user_id: string;
  name: string;
  category_id: string | null;
  contact_name: string;
  phone: string;
  instagram: string;
  package_name: string;
  agreed_amount: number;
  notes: string;
  is_archived: boolean;
  created_at: string;
  updated_at: string;
};

export type PaymentSchedule = {
  id: string;
  user_id: string;
  vendor_id: string | null;
  category_id: string | null;
  cost_item_id: string | null;
  title: string;
  due_date: string;
  amount_due: number;
  status: PaymentStatus;
  notes: string;
  created_at: string;
  updated_at: string;
};

export type ChecklistItem = {
  id: string;
  user_id: string;
  category_id: string | null;
  title: string;
  deadline: string;
  status: ChecklistStatus;
  priority: ChecklistPriority;
  notes: string;
  created_at: string;
  updated_at: string;
};

export type ReceiptAttachment = {
  id: string;
  user_id: string;
  transaction_id: string | null;
  storage_path: string;
  original_filename: string;
  created_at: string;
  updated_at: string;
};

export type AppData = {
  profile: WeddingProfile | null;
  categories: Category[];
  costItems: CostItem[];
  transactions: Transaction[];
  vendors: Vendor[];
  payments: PaymentSchedule[];
  checklistItems: ChecklistItem[];
  receipts: ReceiptAttachment[];
};

export type Database = {
  public: {
    Tables: {
      wedding_profiles: {
        Row: WeddingProfile;
        Insert: Partial<WeddingProfile> & Pick<WeddingProfile, 'user_id' | 'groom_name' | 'bride_name' | 'wedding_date'>;
        Update: Partial<WeddingProfile>;
      };
      categories: {
        Row: Category;
        Insert: Partial<Category> & Pick<Category, 'user_id' | 'name'>;
        Update: Partial<Category>;
      };
      cost_items: {
        Row: CostItem;
        Insert: Partial<CostItem> & Pick<CostItem, 'user_id' | 'category_id' | 'name'>;
        Update: Partial<CostItem>;
      };
      transactions: {
        Row: Transaction;
        Insert: Partial<Transaction> & Pick<Transaction, 'user_id' | 'title' | 'amount' | 'category_id'>;
        Update: Partial<Transaction>;
      };
      vendors: {
        Row: Vendor;
        Insert: Partial<Vendor> & Pick<Vendor, 'user_id' | 'name'>;
        Update: Partial<Vendor>;
      };
      payment_schedules: {
        Row: PaymentSchedule;
        Insert: Partial<PaymentSchedule> & Pick<PaymentSchedule, 'user_id' | 'title' | 'due_date' | 'amount_due'>;
        Update: Partial<PaymentSchedule>;
      };
      checklist_items: {
        Row: ChecklistItem;
        Insert: Partial<ChecklistItem> & Pick<ChecklistItem, 'user_id' | 'title' | 'deadline'>;
        Update: Partial<ChecklistItem>;
      };
      receipt_attachments: {
        Row: ReceiptAttachment;
        Insert: Partial<ReceiptAttachment> & Pick<ReceiptAttachment, 'user_id' | 'storage_path'>;
        Update: Partial<ReceiptAttachment>;
      };
    };
  };
};
