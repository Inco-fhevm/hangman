export const WordTiles = ({ tiles, correctTiles }) => (
  <div className="mb-8">
    <h3 className="text-xl text-center font-semibold text-[#3673F5] mb-6">
      Word to Guess:
    </h3>
    <div className="flex space-x-4 w-full px-2 md:px-8 justify-center">
      {[...Array(4)].map((_, index) => (
        <div
          key={`tile-${index}`}
          className={`w-16 h-16 md:w-20 md:h-20 flex items-center justify-center 
                     text-3xl md:text-4xl font-bold border-b-2 
                     ${
                       correctTiles[index]
                         ? "border-green-500 text-green-700 bg-green-100"
                         : "border-[#3673F5] text-[#3673F5] bg-white/10"
                     }`}
        >
          {tiles[index] || "_"}
        </div>
      ))}
    </div>
  </div>
);
