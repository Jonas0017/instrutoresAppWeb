import React, { createContext, useContext } from 'react';
import { useConfirm } from '../hooks/useConfirm';
import ConfirmDialog from './ConfirmDialog';

interface ConfirmContextType {
  confirm: (options: {
    title: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
    type?: 'danger' | 'warning' | 'info';
  }) => Promise<boolean>;
}

const ConfirmContext = createContext<ConfirmContextType | undefined>(undefined);

export const useConfirmContext = () => {
  const context = useContext(ConfirmContext);
  if (!context) {
    throw new Error('useConfirmContext must be used within a ConfirmProvider');
  }
  return context;
};

interface ConfirmProviderProps {
  children: React.ReactNode;
}

const ConfirmProvider: React.FC<ConfirmProviderProps> = ({ children }) => {
  const { confirmState, confirm } = useConfirm();

  const value = {
    confirm
  };

  return (
    <ConfirmContext.Provider value={value}>
      {children}
      {confirmState && (
        <ConfirmDialog
          isOpen={confirmState.isOpen}
          title={confirmState.title}
          message={confirmState.message}
          confirmText={confirmState.confirmText}
          cancelText={confirmState.cancelText}
          type={confirmState.type}
          onConfirm={confirmState.onConfirm}
          onCancel={confirmState.onCancel}
        />
      )}
    </ConfirmContext.Provider>
  );
};

export default ConfirmProvider; 