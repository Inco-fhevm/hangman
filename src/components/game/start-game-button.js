import { ErrorMessage } from "./error-message";

export const StartGameButton = ({ onStartGame, isLoading, error }) => (
  <div className="flex flex-col items-center justify-center">
    {error && <ErrorMessage message={error} onRetry={onStartGame} />}
    <h2 className="text-2xl md:text-5xl font-bold text-[#3673F5] mb-6">
      Ready to Play?
    </h2>
    <button
      onClick={onStartGame}
      disabled={isLoading}
      className={`bg-[#3673F5] text-white px-6 md:px-8 py-3 md:py-4 text-lg md:text-xl font-semibold transition-colors md:mt-6 ${
        isLoading ? "opacity-50 cursor-not-allowed" : "hover:bg-blue-600"
      }`}
    >
      {isLoading ? "Starting..." : "Start Game"}
    </button>
  </div>
);
