"use client";

import Navbar from "@/components/navbar";
import { useAuth } from "./auth-context";
// import Loading from "@/components/loading";
import ConnectWallet from "@/components/logout-screen/connect-wallet";

/**
 * @dev Wrapper component that conditionally renders content based on authentication state.
 */
export default function AuthWrapper({ children }) {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return <></>;
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen">
        <Navbar />
        <ConnectWallet />
      </div>
    );
  }

  return children;
}
