import { useState } from 'react'
import { Heart } from 'lucide-react'
import { Button, type ButtonProps } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface LikeButtonProps {
  isLiked: boolean
  likeCount: number
  onToggle: () => void
  isLoading?: boolean
  showCount?: boolean
}

export function LikeButton({
  isLiked,
  likeCount,
  onToggle,
  isLoading = false,
  showCount = true,
}: LikeButtonProps) {
  const [animating, setAnimating] = useState(false)

  const handleClick = () => {
    if (isLoading) return
    setAnimating(true)
    setTimeout(() => setAnimating(false), 300)
    onToggle()
  }

  return (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      onClick={handleClick}
      disabled={isLoading}
      className={cn(
        'flex items-center space-x-1 text-sm text-muted-foreground',
        'hover:bg-transparent hover:text-pixelshelf-primary',
        isLoading && 'opacity-50 cursor-not-allowed'
      )}
    >
      <Heart
        className={cn(
          'h-5 w-5 transition-all',
          animating && 'scale-125',
          isLiked && 'fill-pixelshelf-primary text-pixelshelf-primary'
        )}
      />
      {showCount && <span>{likeCount}</span>}
    </Button>
  )
}
