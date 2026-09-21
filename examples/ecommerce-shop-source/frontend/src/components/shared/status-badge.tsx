import { CheckCircle, Clock, Truck, XCircle } from "lucide-react"

interface StatusBadgeProps { status: string }

export function StatusBadge({ status }: StatusBadgeProps) {
  const s = status?.toLowerCase()
  if (s === "paid" || s === "success" || s === "completed")
    return <span className="badge border-emerald-800/60 bg-emerald-900/20 text-emerald-400"><CheckCircle size={10} className="mr-1" />{status}</span>
  if (s === "pending" || s === "awaiting")
    return <span className="badge border-amber-800/60 bg-amber-900/20 text-amber-400"><Clock size={10} className="mr-1" />{status}</span>
  if (s === "shipped" || s === "processing")
    return <span className="badge border-blue-800/60 bg-blue-900/20 text-blue-400"><Truck size={10} className="mr-1" />{status}</span>
  if (s === "cancelled" || s === "failed")
    return <span className="badge border-red-800/60 bg-red-900/20 text-red-400"><XCircle size={10} className="mr-1" />{status}</span>
  return <span className="badge border-obsidian-700 bg-obsidian-800/40 text-obsidian-400">{status}</span>
}
