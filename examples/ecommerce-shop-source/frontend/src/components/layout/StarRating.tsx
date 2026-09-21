import React from 'react';
import { Star } from 'lucide-react';

interface StarRatingProps {
  rating: number;
  size?: number;
  interactive?: boolean;
  onRate?: (rating: number) => void;
}

import { StarContainer, StarFilled, StarEmpty } from './StarRating.styles';

export default function StarRating({ rating, size = 14, interactive, onRate }: StarRatingProps) {
  return (
    <StarContainer>
      {[1, 2, 3, 4, 5].map((star) => {
        const isFilled = star <= Math.round(rating);
        const IconWrapper = isFilled ? StarFilled : StarEmpty;
        
        return (
          <IconWrapper
            key={star}
            style={{ cursor: interactive ? 'pointer' : 'default', display: 'flex' }}
            onClick={() => interactive && onRate?.(star)}
          >
            <Star
              size={size}
              fill={isFilled ? '#d4a843' : 'none'}
            />
          </IconWrapper>
        );
      })}
    </StarContainer>
  );
}
