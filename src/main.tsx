import React from 'react';
import ReactDOM from 'react-dom/client';
import { RouterProvider } from 'react-router-dom';
import { QueryProvider } from '@/providers/query-provider';
import { AuthProvider } from '@/providers/auth-provider';
import { ToastProvider } from '@/providers/toast-provider';
import { ConfirmDialogProvider } from '@/components/confirm-dialog';
import { router } from '@/router';
import '@/styles/global.css';

const root = document.getElementById('root')!;

ReactDOM.createRoot(root).render(
  React.createElement(
    QueryProvider,
    null,
    React.createElement(
      AuthProvider,
      null,
      React.createElement(
        ToastProvider,
        null,
        React.createElement(ConfirmDialogProvider, null, React.createElement(RouterProvider, { router })),
      ),
    ),
  ),
);
