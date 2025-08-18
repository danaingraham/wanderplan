interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  body?: string;
  primaryAction?: { label: string; onClick: () => void };
}

export default function EmptyState({
  icon,
  title,
  body,
  primaryAction,
}: EmptyStateProps) {
  return (
    <div className="border border-gray-200 rounded-2xl p-10 text-center bg-white shadow-sm">
      {icon ? <div className="mx-auto mb-4">{icon}</div> : null}
      <h3 className="text-lg font-medium">{title}</h3>
      {body ? <p className="mt-1 text-sm text-gray-500">{body}</p> : null}
      {primaryAction ? (
        <button
          onClick={primaryAction.onClick}
          className="mt-6 inline-flex items-center rounded-xl bg-red-500 px-4 py-2 text-white hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
        >
          {primaryAction.label}
        </button>
      ) : null}
    </div>
  );
}

// Also export as named export for backward compatibility
export { EmptyState };