import { Button } from "../components/ui/button"

interface NumberKeypadProps {
  onNumberClick: (num: string) => void
  onClear: () => void
}

export function NumberKeypad({ onNumberClick, onClear }: NumberKeypadProps) {
  return (
    <div className="grid grid-cols-3 gap-4 mb-8">
      {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
        <Button
          key={num}
          variant="outline"
          size="lg"
          className="w-16 h-16 text-2xl font-bold border border-gray-300"
          onClick={() => onNumberClick(num.toString())}
        >
          {num}
        </Button>
      ))}
      <Button
        variant="outline"
        size="lg"
        className="w-16 h-16 text-lg font-bold border border-gray-300"
        onClick={onClear}
      >
        C
      </Button>
      <Button
        variant="outline"
        size="lg"
        className="w-16 h-16 text-2xl font-bold border border-gray-300"
        onClick={() => onNumberClick("0")}
      >
        0
      </Button>
      <div></div>
    </div>
  )
}