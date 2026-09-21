"use client";

import { Loader2 } from "lucide-react";
import { PageLoaderContainer, PageLoaderSpinnerBox, PageLoaderText } from "./shared.styles";

interface PageLoaderProps {
  text?: string;
}

export function PageLoader({ text = "Memuat..." }: PageLoaderProps) {
  return (
    <PageLoaderContainer>
      <PageLoaderSpinnerBox>
        <Loader2 size={32} className="animate-spin" />
      </PageLoaderSpinnerBox>
      <PageLoaderText>{text}</PageLoaderText>
    </PageLoaderContainer>
  );
}

export default PageLoader;
