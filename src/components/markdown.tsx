import Link from 'next/link'
import React, { memo } from 'react'
import ReactMarkdown, { type Components } from 'react-markdown'
import remarkGfm from 'remark-gfm'

// Shared props type for custom markdown renderers
type MarkdownElementProps = {
  node?: any // Provided by react-markdown but not strictly typed
  children?: React.ReactNode
} & React.HTMLAttributes<HTMLElement>

const components: Partial<Components> = {
  pre: ({ children }: MarkdownElementProps) => <>{children}</>,
  ol: ({ children, ...props }: MarkdownElementProps) => {
    return (
      <ol className="ml-4 list-outside list-decimal" {...props}>
        {children}
      </ol>
    )
  },
  li: ({ children, ...props }: MarkdownElementProps) => {
    return (
      <li className="py-1" {...props}>
        {children}
      </li>
    )
  },
  ul: ({ children, ...props }: MarkdownElementProps) => {
    return (
      <ul className="ml-4 list-outside list-decimal" {...props}>
        {children}
      </ul>
    )
  },
  strong: ({ children, ...props }: MarkdownElementProps) => {
    return (
      <span className="font-semibold" {...props}>
        {children}
      </span>
    )
  },
  a: ({ children, ...props }: MarkdownElementProps) => {
    return (
      // @ts-expect-error
      <Link
        className="text-blue-500 hover:underline"
        target="_blank"
        rel="noreferrer"
        {...props}
      >
        {children}
      </Link>
    )
  },
  h1: ({ children, ...props }: MarkdownElementProps) => {
    return (
      <h1 className="mt-6 mb-2 text-3xl font-semibold" {...props}>
        {children}
      </h1>
    )
  },
  h2: ({ children, ...props }: MarkdownElementProps) => {
    return (
      <h2 className="mt-6 mb-2 text-2xl font-semibold" {...props}>
        {children}
      </h2>
    )
  },
  h3: ({ children, ...props }: MarkdownElementProps) => {
    return (
      <h3 className="mt-6 mb-2 text-xl font-semibold" {...props}>
        {children}
      </h3>
    )
  },
  h4: ({ children, ...props }: MarkdownElementProps) => {
    return (
      <h4 className="mt-6 mb-2 text-lg font-semibold" {...props}>
        {children}
      </h4>
    )
  },
  h5: ({ children, ...props }: MarkdownElementProps) => {
    return (
      <h5 className="mt-6 mb-2 text-base font-semibold" {...props}>
        {children}
      </h5>
    )
  },
  h6: ({ children, ...props }: MarkdownElementProps) => {
    return (
      <h6 className="mt-6 mb-2 text-sm font-semibold" {...props}>
        {children}
      </h6>
    )
  },
}

const remarkPlugins = [remarkGfm]

const NonMemoizedMarkdown = ({ children }: { children: string }) => {
  return (
    <ReactMarkdown remarkPlugins={remarkPlugins} components={components}>
      {children}
    </ReactMarkdown>
  )
}

export const Markdown = memo(
  NonMemoizedMarkdown,
  (prevProps, nextProps) => prevProps.children === nextProps.children
)
