export function Button({ children, className, ...props }) {
  return (
    <button
      className={`bg-blue-500 hover:bg-blue-600 text-white font-medium py-2 px-4 rounded-lg ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
