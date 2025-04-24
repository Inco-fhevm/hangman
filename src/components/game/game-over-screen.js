import Image from "next/image";

export const GameOverScreen = ({ hasWon, resetGame, isMobile }) => (
  <div
    className={`grid place-items-center pb-24 ${
      isMobile ? "" : "h-[calc(100vh-136px)]"
    } w-full`}
  >
    {hasWon ? (
      <div className="">
        <div className="h-full flex items-end px-4">
          <div
            className="relative"
            style={{ width: isMobile ? "auto" : "581.82px" }}
          >
            <div className="relative">
              <div
                className={`
                 ${isMobile ? "flex flex-col items-center" : "relative z-10"}
                `}
              >
                <Image
                  width={isMobile ? 200 : 260}
                  height={isMobile ? 310 : 406}
                  src={`/game-over/win.svg`}
                  alt={`Game Over`}
                  className={`
                    ${isMobile ? "h-48 w-auto" : "max-w-full"} 
                    object-contain
                  `}
                />

                <div 
                  className={`
                    text-[#3673F5] flex flex-col z-30
                    ${isMobile ? "items-center mt-4" : "absolute top-0 left-80 items-start"}
                  `}
                >
                  <div className={`text-4xl mb-4 pixel-font ${isMobile ? "text-center text-2xl" : "max-w-[21rem]"}`}>
                    Thank you for saving my life!
                  </div>
                  <button
                    className="border-2 mt-8 border-[#3673F5] text-[#3673F5] hover:bg-[#3673F5] hover:text-white px-8 py-4 pixel-font"
                    style={{ fontSize: isMobile ? "1rem" : "1.5rem" }}
                    onClick={resetGame}
                  >
                    Play Again
                  </button>
                </div>
              </div>

              <div className={`${isMobile ? "hidden" : "absolute left-0 w-full z-20"}`}>
                <Image
                  width={isMobile ? 300 : 581.82}
                  height={isMobile ? 80 : 140}
                  src="/game-over/line.svg"
                  alt="Background"
                  className="max-w-full object-contain"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    ) : (
      <div className="">
        <div className="h-full flex items-end px-4">
          <div
            className="relative"
            style={{ width: isMobile ? "auto" : "581.82px" }}
          >
            <div className="relative">
              <div
                className={`
                  ${isMobile ? "flex flex-col items-center" : "relative z-10"}
                `}
              >
                <Image
                  width={isMobile ? 200 : 260}
                  height={isMobile ? 310 : 406}
                  src={`/game-over/lose.svg`}
                  alt={`Game Over`}
                  className={`
                    ${isMobile ? "h-48 w-auto" : "max-w-full"} 
                    object-contain
                  `}
                />

                <div 
                  className={`
                    text-[#3673F5] flex flex-col z-30
                    ${isMobile ? "items-center mt-4" : "absolute top-0 right-16 items-end"}
                  `}
                >
                  <div className={`text-4xl mb-4 pixel-font ${isMobile ? "text-center text-2xl" : ""}`}>
                    You suck.
                  </div>
                  <button
                    className="border-2 mt-8 border-[#3673F5] text-[#3673F5] hover:bg-[#3673F5] hover:text-white px-8 py-4 pixel-font"
                    style={{ fontSize: isMobile ? "1rem" : "1.5rem" }}
                    onClick={resetGame}
                  >
                    Try Again
                  </button>
                </div>
              </div>

              <div className={`${isMobile ? "hidden" : "absolute bottom-0 left-0 w-full z-20"}`}>
                <Image
                  width={isMobile ? 300 : 581.82}
                  height={isMobile ? 80 : 140}
                  src="/logout-screen/fire.svg"
                  alt="Background"
                  className="max-w-full object-contain"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    )}
  </div>
);