export function formatPrice(amount: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

export function getStatusColor(status: string): string {
  const map: Record<string, string> = {
    pending: 'bg-amber-900/40 text-amber-400 border-amber-800',
    processing: 'bg-blue-900/40 text-blue-400 border-blue-800',
    shipped: 'bg-indigo-900/40 text-indigo-400 border-indigo-800',
    delivered: 'bg-emerald-900/40 text-emerald-400 border-emerald-800',
    completed: 'bg-emerald-900/40 text-emerald-400 border-emerald-800',
    cancelled: 'bg-red-900/40 text-red-400 border-red-800',
    success: 'bg-emerald-900/40 text-emerald-400 border-emerald-800',
    failed: 'bg-red-900/40 text-red-400 border-red-800',
  };
  return map[status] || 'bg-obsidian-800 text-obsidian-300 border-obsidian-700';
}