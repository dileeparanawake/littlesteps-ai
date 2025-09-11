// src/components/layout/ModalProvider.tsx
'use client';

import { createContext, useContext, useState } from 'react';
import SignInModal from '@/components/sign-in/SignInModal';

type ModalContextValue = {
  showSignIn: boolean;
  setShowSignIn: (v: boolean) => void;
};

const ModalContext = createContext<ModalContextValue | null>(null);

export function useModal() {
  const ctx = useContext(ModalContext);
  if (!ctx) throw new Error('useModal must be used inside ModalProvider');
  return ctx;
}

export default function ModalProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [showSignIn, setShowSignIn] = useState<boolean>(false);

  return (
    <ModalContext.Provider value={{ showSignIn, setShowSignIn }}>
      {/* Render the modal once at the root */}
      <SignInModal />
      {children}
    </ModalContext.Provider>
  );
}
