type Props = {
  label: string;
  value: number;
};

export function ScoreBadge({ label, value }: Props) {
  const tone = value >= 0.75 ? "high" : value >= 0.5 ? "mid" : "low";
  return (
    <span className={`score score-${tone}`}>
      {label} {value.toFixed(2)}
    </span>
  );
}
