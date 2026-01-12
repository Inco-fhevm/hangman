import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(request) {
  try {
    const HANGMAN_FACTORY_CONTRACT_ADDRESS =
      process.env.HANGMAN_FACTORY_CONTRACT_ADDRESS;
    const INCO_ENV = process.env.INCO_ENV;
    const REOWN_APP_ID = process.env.REOWN_APP_ID;

    // Validate required environment variables
    if (!HANGMAN_FACTORY_CONTRACT_ADDRESS || !INCO_ENV || !REOWN_APP_ID) {
      console.error("Missing required environment variables", {
        hasHangmanFactory: !!HANGMAN_FACTORY_CONTRACT_ADDRESS,
        hasIncoEnv: !!INCO_ENV,
        hasReownAppId: !!REOWN_APP_ID,
      });

      return NextResponse.json(
        { error: "Configuration error" },
        { status: 500 }
      );
    }

    const contractData = {
      hangmanFactoryContract: {
        address: HANGMAN_FACTORY_CONTRACT_ADDRESS,
      },
      incoEnv: INCO_ENV,
      reownAppId: REOWN_APP_ID,
    };

    console.log("Contracts API request successful", {
      contractCount: 1,
      incoEnv: INCO_ENV,
      statusCode: 200,
    });

    return NextResponse.json(contractData);
  } catch (error) {
    console.error("Contracts API request failed", {
      error: error instanceof Error ? error.message : "Unknown error",
      stack: error instanceof Error ? error.stack : undefined,
      statusCode: 500,
    });

    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}






