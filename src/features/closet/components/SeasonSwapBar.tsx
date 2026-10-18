import { BottomBar } from "~/components/ui/BottomBar";
import { Button } from "~/components/ui/Button";

type Props = {
  moveCount: number;
  saving: boolean;
  onConfirm: () => void;
};

export function SeasonSwapBar({ moveCount, saving, onConfirm }: Props) {
  return (
    <BottomBar>
      <Button
        label={confirmLabel(moveCount)}
        onPress={onConfirm}
        loading={saving}
        disabled={moveCount === 0}
        size="lg"
      />
    </BottomBar>
  );
}

const confirmLabel = (moveCount: number): string => {
  if (moveCount === 0) return "Nothing selected";
  if (moveCount === 1) return "Swap 1 piece";
  return `Swap ${moveCount} pieces`;
};
