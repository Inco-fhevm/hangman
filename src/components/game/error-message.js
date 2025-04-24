export const ErrorMessage = ({ message, onRetry }) => (
  <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4">
    <strong className="font-bold">Error:</strong>
    <span className="block sm:inline"> Something went wrong!</span>
    {onRetry && (
      <button
        onClick={onRetry}
        className="mt-2 bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded"
      >
        Retry
      </button>
    )}
  </div>
);
