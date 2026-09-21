import React from 'react';
import defaultMdxComponents from 'fumadocs-ui/mdx';
import { Tab, Tabs } from 'fumadocs-ui/components/tabs';
import { Callout } from 'fumadocs-ui/components/callout';
import { Accordion, Accordions } from 'fumadocs-ui/components/accordion';
import { Step, Steps } from 'fumadocs-ui/components/steps';
import { PatternDiagram } from './pattern-diagram';
import { LanguageNote, LanguageTabs, LanguageTab } from './language-note';
import type { MDXComponents } from 'mdx/types';

function extractCodeText(node: React.ReactNode): string {
  if (typeof node === 'string') return node;
  if (typeof node === 'number') return String(node);
  if (Array.isArray(node)) return node.map(extractCodeText).join('');
  if (React.isValidElement(node)) {
    return extractCodeText((node.props as any)?.children);
  }
  return '';
}

const DefaultPre = defaultMdxComponents.pre;

function Pre(props: React.ComponentProps<'pre'>) {
  const child = props.children;
  if (React.isValidElement(child)) {
    const codeProps = (child.props || {}) as any;
    const className = codeProps.className || (props as any).className || '';
    const dataLang = (props as any)['data-language'] || codeProps['data-language'] || '';
    if (className.includes('language-mermaid') || dataLang === 'mermaid') {
      const codeText = extractCodeText(codeProps.children || props.children);
      return <PatternDiagram chart={codeText} />;
    }
  }
  return <DefaultPre {...props} />;
}

export function getMDXComponents(components?: MDXComponents) {
  return {
    ...defaultMdxComponents,
    pre: Pre,
    Tab,
    Tabs,
    Callout,
    Accordion,
    Accordions,
    Step,
    Steps,
    PatternDiagram,
    LanguageNote,
    LanguageTabs,
    LanguageTab,
    ...components,
  } satisfies MDXComponents;
}

export const useMDXComponents = getMDXComponents;

declare global {
  type MDXProvidedComponents = ReturnType<typeof getMDXComponents>;
}
