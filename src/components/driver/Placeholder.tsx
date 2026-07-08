export default function Placeholder({
  size,
  borderRadius = 12,
  stripe = 8,
  style,
}: {
  size: number;
  borderRadius?: number;
  stripe?: number;
  style?: React.CSSProperties;
}) {
  return (
    <div
      style={{
        width: size,
        height: size,
        flex: `0 0 ${size}px`,
        borderRadius,
        backgroundImage: `repeating-linear-gradient(135deg,#F2F4F6 0 ${stripe}px,#E9ECEF ${stripe}px ${stripe * 2}px)`,
        ...style,
      }}
    />
  );
}
