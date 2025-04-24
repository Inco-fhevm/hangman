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
               ${isMobile ? "flex justify-center" : "relative z-10"}
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

                <div className="absolute top-0 left-80 text-[#3673F5] flex flex-col items-start z-30">
                  <div className="text-4xl mb-4 pixel-font max-w-[21rem]">
                    Thank you for saving my life!
                  </div>
                  <button
                    className="border-2 mt-8 text-2xl border-[#3673F5] text-[#3673F5] hover:bg-[#3673F5] hover:text-white px-8 py-4 pixel-font"
                    onClick={resetGame}
                  >
                    Play Again
                  </button>
                </div>
              </div>

              {!isMobile && (
                <div className="absolute left-0 w-full z-20">
                  <Image
                    width={581.82}
                    height={140}
                    src="/game-over/line.svg"
                    alt="Background"
                    className="max-w-full object-contain"
                  />
                </div>
              )}
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
                ${isMobile ? "flex justify-center" : "relative z-10"}
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

                <div className="absolute top-0 right-16 text-[#3673F5] flex flex-col items-end z-30">
                  <div className="text-4xl mb-4 pixel-font">You suck.</div>
                  <button
                    className="border-2 mt-8 text-2xl border-[#3673F5] text-[#3673F5] hover:bg-[#3673F5] hover:text-white px-8 py-4 pixel-font"
                    onClick={resetGame}
                  >
                    Try Again
                  </button>
                </div>
              </div>

              {!isMobile && (
                <div className="absolute bottom-0 left-0 w-full z-20">
                  <Image
                    width={581.82}
                    height={140}
                    src="/logout-screen/fire.svg"
                    alt="Background"
                    className="max-w-full object-contain"
                  />
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    )}
  </div>
);
