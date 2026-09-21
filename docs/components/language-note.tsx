'use client';

import React from 'react';

export type Lang = 'rust' | 'cpp' | 'ts' | 'js';
export type NoteType = 'problem' | 'gotcha' | 'concept';

export interface LanguageNoteProps {
  lang?: Lang;
  type?: NoteType;
  title?: string;
  children: React.ReactNode;
}

export interface LanguageTabProps {
  lang: Lang;
  type?: NoteType;
  title?: string;
  children: React.ReactNode;
}

/**
 * Minimal passthrough components maintained for backward compatibility.
 * Native Fumadocs <Tabs> and <Callout> are now used directly across all pattern guides.
 */
export function LanguageNote({ title, children }: LanguageNoteProps) {
  return (
    <div className="my-4 rounded-xl border border-fd-border bg-fd-card p-4 text-sm text-fd-foreground shadow-sm">
      {title && <h5 className="mb-2 font-semibold text-fd-foreground">{title}</h5>}
      <div>{children}</div>
    </div>
  );
}

export function LanguageTab({ children }: LanguageTabProps) {
  return <>{children}</>;
}

export const LanguageTabs = LanguageNote;
