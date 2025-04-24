export const IncorrectGuessCounter = ({ incorrectCount }) => (
  <div className="mt-6 text-center">
    <p className="text-lg text-gray-700">
      Incorrect Guesses:{" "}
      <span
        className={`font-bold ${incorrectCount > 5 ? "text-red-500" : "text-[#3673F5]"}`}
      >
        {incorrectCount}
      </span>
      /8
    </p>
  </div>
);
