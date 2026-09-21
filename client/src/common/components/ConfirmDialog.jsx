import React from "react";
import Modal from "./Modal";
import Button from "./Button";
import { IconWarning } from "../icons";

const ConfirmDialog = ({
  open,
  onClose,
  onConfirm,
  title = "Confirm this action?",
  message = "Are you sure you want to continue?",
  confirmText = "Confirm",
  cancelText = "Go back",
  variant = "danger",
  loading = false,
}) => (
  <Modal open={open} onClose={onClose} size="sm">
    <div className="text-center">
      <div className="mx-auto w-12 h-12 rounded-xl bg-red-50 dark:bg-red-950/40 flex items-center justify-center mb-4">
        <IconWarning className="w-6 h-6 text-danger" aria-hidden="true" />
      </div>
      <h3 className="text-lg font-bold text-ink mb-2">{title}</h3>
      <p className="text-sm text-ink-muted mb-6">{message}</p>
      <div className="flex items-center justify-center gap-3">
        <Button variant="secondary" onClick={onClose} disabled={loading}>
          {cancelText}
        </Button>
        <Button variant={variant} onClick={onConfirm} loading={loading} loadingText="Working…">
          {confirmText}
        </Button>
      </div>
    </div>
  </Modal>
);

export default ConfirmDialog;
