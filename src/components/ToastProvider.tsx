'use client';

import { Toaster } from 'react-hot-toast';

export default function ToastProvider() {
  return (
    <Toaster
      position="top-center"
      toastOptions={{
        style: {
          borderRadius: '12px',
          background: '#333',
          color: '#fff',
          fontSize: '14px',
        },
      }}
    />
  );
}
