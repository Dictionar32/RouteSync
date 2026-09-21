"use client";

import { AlertCircle, RefreshCw } from "lucide-react";
import { ErrorStateContainer, ErrorStateIconBox, ErrorStateTitle, ErrorStateDesc, ErrorStateActionBtn } from "./shared.styles";

interface ErrorStateProps {
  title?: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
}

export function ErrorState({
  title = "Terjadi kesalahan",
  description = "Tidak dapat memuat data. Silakan coba lagi.",
  actionLabel = "Coba Lagi",
  onAction,
}: ErrorStateProps) {
  return (
    <ErrorStateContainer>
      <ErrorStateIconBox>
        <AlertCircle size={64} />
      </ErrorStateIconBox>
      <ErrorStateTitle>
        {title}
      </ErrorStateTitle>
      <ErrorStateDesc>{description}</ErrorStateDesc>
      {onAction && (
        <ErrorStateActionBtn onClick={onAction}>
          <RefreshCw className="w-4 h-4 mr-2" />
          {actionLabel}
        </ErrorStateActionBtn>
      )}
    </ErrorStateContainer>
  );
}

export default ErrorState;
