"use client";
import React from "react";
import Navbar from "./navbar";

const MainLayout = ({ children }) => {
  return (
    <div className="min-h-screen">
      <Navbar />
      <div>{children}</div>
    </div>
  );
};

export default MainLayout;
