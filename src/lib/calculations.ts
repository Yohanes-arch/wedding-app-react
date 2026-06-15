import type { Category, CostItem, PaymentSchedule, Transaction } from '../types';

export function estimatedTotal(items: CostItem[]) {
  return items.filter((item) => !item.is_archived).reduce((total, item) => total + item.estimated_amount, 0);
}

export function spentTotal(transactions: Transaction[]) {
  return transactions.reduce((total, transaction) => total + transaction.amount, 0);
}

export function categoryEstimate(category: Category, items: CostItem[]) {
  return estimatedTotal(items.filter((item) => item.category_id === category.id));
}

export function categorySpent(category: Category, transactions: Transaction[]) {
  return transactions
    .filter((transaction) => transaction.category_id === category.id)
    .reduce((total, transaction) => total + transaction.amount, 0);
}

export function paymentPaidTotal(payment: PaymentSchedule, transactions: Transaction[]) {
  return transactions
    .filter((transaction) => transaction.payment_schedule_id === payment.id)
    .reduce((total, transaction) => total + transaction.amount, 0);
}

export function paymentStatus(payment: PaymentSchedule, transactions: Transaction[]) {
  const paid = paymentPaidTotal(payment, transactions);
  if (paid >= payment.amount_due) return 'paid';
  if (paid > 0) return 'partial';
  return payment.status;
}

export function unpaidPaymentTotal(payments: PaymentSchedule[], transactions: Transaction[]) {
  return payments.reduce((total, payment) => {
    const paid = paymentPaidTotal(payment, transactions);
    return total + Math.max(0, payment.amount_due - paid);
  }, 0);
}
