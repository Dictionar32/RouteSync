"use client";

import { SearchX } from "lucide-react";
import { EmptyStateContainer, EmptyStateIconBox, EmptyStateTitle, EmptyStateDesc, EmptyStateActionBtn } from "./shared.styles";

interface EmptyStateProps {
  title?: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
  icon?: React.ReactNode;
}

export function EmptyState({
  title = "Tidak ada data",
  description = "Data yang Anda cari tidak ditemukan",
  actionLabel,
  onAction,
  icon,
}: EmptyStateProps) {
  return (
    <EmptyStateContainer>
      <EmptyStateIconBox>
        {icon || <SearchX size={64} />}
      </EmptyStateIconBox>
      <EmptyStateTitle>
        {title}
      </EmptyStateTitle>
      <EmptyStateDesc>{description}</EmptyStateDesc>
      {actionLabel && onAction && (
        <EmptyStateActionBtn onClick={onAction}>
          {actionLabel}
        </EmptyStateActionBtn>
      )}
    </EmptyStateContainer>
  );
}

export default EmptyState;
