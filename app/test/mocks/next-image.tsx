// test/mocks/next-image.tsx
import React from 'react'

interface ImageProps {
  src: string
  alt: string
  fill?: boolean
  priority?: boolean
  sizes?: string
  className?: string
  width?: number
  height?: number
  // on accepte tout le reste pour ne pas casser
  [key: string]: unknown
}

const NextImageMock = ({
  src,
  alt,
  fill: _fill,
  priority: _priority,
  sizes: _sizes,
  width: _width,
  height: _height,
  ...rest
}: ImageProps) => {
  // On rend un <img> standard — jsdom l'expose correctement
  // eslint-disable-next-line @next/next/no-img-element, jsx-a11y/alt-text
  return <img src={src} alt={alt} {...rest} />
}

export default NextImageMock