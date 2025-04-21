const Keyboard = ({ onKeyPress }) => {
  // Define the keyboard layout rows
  const rows = [
    ["Q", "W", "E", "R", "T", "Y", "U", "I", "O", "P"],
    ["A", "S", "D", "F", "G", "H", "J", "K", "L"],
    ["Z", "X", "C", "V", "B", "N", "M"],
  ];

  return (
    <div className="flex flex-col items-center justify-center w-full">
      <div className="border-2 border-[#143E94] p-6 w-full">
        {rows.map((row, rowIndex) => (
          <div
            key={rowIndex}
            className={`flex justify-center ${rowIndex !== 2 ? "mb-4" : ""}`}
          >
            {row.map((key) => (
              <div
                key={key}
                onClick={() => onKeyPress(key)}
                className="border-2 border-[#143E94] text-[#3673F5] w-12 h-12 m-1 flex items-center justify-center text-xl hover:bg-[#3673F5] hover:text-[#020B20] transition duration-200 ease-in-out cursor-pointer"
              >
                {key}
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
};

export default Keyboard;
