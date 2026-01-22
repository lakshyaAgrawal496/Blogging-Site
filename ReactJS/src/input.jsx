export function Input({ className, ...props }) {
  return (
    <input
      className={`w-full border border-gray-300 rounded-lg px-3 py-2 ${className}`}
      {...props}
    />
  );
}
