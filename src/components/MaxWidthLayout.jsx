import React from 'react'

/**
 * A reusable layout component that enforces a maximum width on its contents
 * and centers them horizontally.
 *
 * @param {Object} props - Component props
 * @param {React.ReactNode} props.children - The content to be displayed within the layout
 * @param {string} [props.className] - Additional CSS classes to apply to the container
 * @param {string} [props.maxWidth='max-w-4xl'] - The maximum width class to apply
 */
const MaxWidthLayout = ({
  children,
  className = '',
  maxWidth = 'max-w-4xl',
}) => {
  return (
    <div className={`mx-auto px-4 ${maxWidth} ${className}`}>{children}</div>
  )
}

export default MaxWidthLayout
