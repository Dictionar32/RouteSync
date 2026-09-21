import { Star } from "lucide-react"

interface StarRatingProps {
  rating: number
  count?: number
  size?: number
}

export function StarRating({ rating, count, size = 12 }: StarRatingProps) {
  return (
    <div className="flex items-center gap-1.5">
      <div className="flex items-center">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star key={star} size={size} fill="currentColor"
            className={star <= Math.round(rating) ? "star-filled" : "star-empty"} />
        ))}
      </div>
      {count !== undefined && <span className="text-xs text-obsidian-500">({count})</span>}
    </div>
  )
}
