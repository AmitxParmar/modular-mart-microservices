"use client";

import React, { createContext, useContext, useState, ReactNode } from "react";

type AuthViewType = "signIn" | "signUp";

interface AuthDialogContextType {
  isOpen: boolean;
  view: AuthViewType;
  openDialog: (view?: AuthViewType) => void;
  closeDialog: () => void;
  setView: (view: AuthViewType) => void;
}

const AuthDialogContext = createContext<AuthDialogContextType | undefined>(undefined);

export function AuthDialogProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [view, setView] = useState<AuthViewType>("signIn");

  const openDialog = (v: AuthViewType = "signIn") => {
    setView(v);
    setIsOpen(true);
  };

  const closeDialog = () => setIsOpen(false);

  return (
    <AuthDialogContext.Provider value={{ isOpen, view, openDialog, closeDialog, setView }}>
      {children}
    </AuthDialogContext.Provider>
  );
}

export function useAuthDialog() {
  const context = useContext(AuthDialogContext);
  if (!context) {
    throw new Error("useAuthDialog must be used within an AuthDialogProvider");
  }
  return context;
}
