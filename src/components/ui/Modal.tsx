import { Fragment } from 'react';
import type { ReactNode } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { X } from 'lucide-react';
import { cn } from '../../lib/utils';
import { Button } from './Button';

type Size = 'sm' | 'md' | 'lg' | 'xl' | '2xl';

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  subtitle?: string;
  size?: Size;
  children: ReactNode;
  footer?: ReactNode;
}

const sizeMap: Record<Size, string> = {
  sm: 'max-w-md',
  md: 'max-w-lg',
  lg: 'max-w-2xl',
  xl: 'max-w-4xl',
  '2xl': 'max-w-6xl',
};

export const Modal = ({
  open,
  onClose,
  title,
  subtitle,
  size = 'md',
  children,
  footer,
}: ModalProps) => (
  <Transition show={open} as={Fragment}>
    <Dialog onClose={onClose} className="relative z-50">
      <Transition.Child
        as={Fragment}
        enter="ease-out duration-200"
        enterFrom="opacity-0"
        enterTo="opacity-100"
        leave="ease-in duration-150"
        leaveFrom="opacity-100"
        leaveTo="opacity-0"
      >
        <div className="fixed inset-0 bg-bokka-ink/40 backdrop-blur-sm" aria-hidden="true" />
      </Transition.Child>

      <div className="fixed inset-0 overflow-y-auto">
        <div className="flex min-h-full items-center justify-center p-4">
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-200"
            enterFrom="opacity-0 scale-[0.98]"
            enterTo="opacity-100 scale-100"
            leave="ease-in duration-150"
            leaveFrom="opacity-100 scale-100"
            leaveTo="opacity-0 scale-[0.98]"
          >
            <Dialog.Panel
              className={cn(
                'w-full bg-bokka-surface rounded-2xl shadow-md border border-bokka-border',
                sizeMap[size],
                'flex flex-col max-h-[calc(100vh-2rem)]',
              )}
            >
              {title && (
                <div className="flex items-start justify-between gap-4 p-6 pb-4 border-b border-bokka-border">
                  <div className="min-w-0">
                    {title && (
                      <Dialog.Title className="text-lg font-semibold text-bokka-ink">
                        {title}
                      </Dialog.Title>
                    )}
                    {subtitle && (
                      <p className="text-sm text-bokka-ink-3 mt-1">{subtitle}</p>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={onClose}
                    className="text-bokka-ink-3 hover:text-bokka-ink hover:bg-bokka-surface-3 rounded-md p-1 transition-colors -mr-1 -mt-1"
                    aria-label="Fechar"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              )}
              <div className="p-6 overflow-y-auto flex-1">{children}</div>
              {footer && (
                <div className="p-6 pt-4 border-t border-bokka-border flex items-center justify-end gap-3 bg-bokka-surface-2 rounded-b-2xl">
                  {footer}
                </div>
              )}
            </Dialog.Panel>
          </Transition.Child>
        </div>
      </div>
    </Dialog>
  </Transition>
);

interface ConfirmModalProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  danger?: boolean;
  loading?: boolean;
}

export const ConfirmModal = ({
  open,
  onClose,
  onConfirm,
  title,
  message,
  confirmLabel = 'Confirmar',
  cancelLabel = 'Cancelar',
  danger,
  loading,
}: ConfirmModalProps) => (
  <Modal
    open={open}
    onClose={onClose}
    title={title}
    size="sm"
    footer={
      <>
        <Button variant="secondary" onClick={onClose} disabled={loading}>
          {cancelLabel}
        </Button>
        <Button
          variant={danger ? 'danger' : 'primary'}
          onClick={onConfirm}
          loading={loading}
        >
          {confirmLabel}
        </Button>
      </>
    }
  >
    <p className="text-sm text-bokka-ink-2 leading-relaxed">{message}</p>
  </Modal>
);
