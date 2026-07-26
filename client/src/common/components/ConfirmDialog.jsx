import React from "react";
import Modal from "./Modal";
import Button from "./Button";
import { FaExclamationTriangle } from "react-icons/fa";

const ConfirmDialog = ({
  open,
  onClose,
  onConfirm,
  title = "Confirm Action",
  message = "Are you sure you want to proceed?",
  confirmText = "Confirm",
  cancelText = "Cancel",
  variant = "danger",
  loading = false,
}) => (
  <Modal open={open} onClose={onClose} size="sm">
    <div className="text-center">
      <div className="mx-auto w-12 h-12 rounded-xl bg-red-50 flex items-center justify-center mb-4">
        <FaExclamationTriangle className="text-xl text-red-500" />
      </div>
      <h3 className="text-lg font-bold text-gray-900 mb-2">{title}</h3>
      <p className="text-sm text-gray-500 mb-6">{message}</p>
      <div className="flex items-center justify-center gap-3">
        <Button variant="secondary" onClick={onClose} disabled={loading}>
          {cancelText}
        </Button>
        <Button variant={variant} onClick={onConfirm} loading={loading}>
          {confirmText}
        </Button>
      </div>
    </div>
  </Modal>
);

export default ConfirmDialog;
