export const InputFields = ({
  inputs,
  wrongInputs,
  activeIndex,
  inputRefs,
  handleInputChange,
  handleKeyDown,
  handlePaste,
  handleFocus,
}) => (
  <div className="flex space-x-2 md:space-x-4 w-full px-2 md:px-8">
    {[...Array(8)].map((_, index) => (
      <input
        key={index}
        ref={(el) => (inputRefs.current[index] = el)}
        type="text"
        value={inputs[index]}
        onChange={(e) => handleInputChange(index, e.target.value.toUpperCase())}
        onKeyDown={(e) => handleKeyDown(e, index)}
        onPaste={handlePaste}
        onFocus={() => handleFocus(index)}
        className={`w-full h-12 md:h-16 text-center border-b-2 
                  ${
                    wrongInputs[index]
                      ? "border-b-4 border-red-500 text-red-500 bg-red-50"
                      : `${activeIndex === index ? "border-b-4" : "border-b-2"} 
                       border-[#3673F5] text-[#3673F5] bg-transparent`
                  } 
                  text-2xl md:text-3xl focus:outline-none ${
                    !wrongInputs[index] && "focus:border-b-4"
                  }`}
        maxLength={1}
        autoComplete="off"
        readOnly={wrongInputs[index]}
      />
    ))}
  </div>
);
