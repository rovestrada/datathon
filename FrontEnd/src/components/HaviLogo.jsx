/**
 * HaviLogo — renders HeyBancoLogo inline SVG cropped to just the logo mark.
 *
 * Uses an inline SVG (HeyBancoLogoRaw) so embedded PNG data is not blocked
 * by browser security restrictions when loading external SVG files.
 *
 * SVG viewBox: 0 0 1440 810, logo clip region: (525,206)→(915,604) = 390×398
 * We override viewBox to crop to that region and set size accordingly.
 *
 * Props:
 *  size — display height in px. Default: 36
 */
import HeyBancoLogoRaw from './HeyBancoLogoRaw'

export default function HaviLogo({ size = 36 }) {
  // Logo content region in viewBox coordinates
  const CONTENT_X = 525
  const CONTENT_Y = 206
  const CONTENT_W = 390
  const CONTENT_H = 398

  const aspectRatio = CONTENT_W / CONTENT_H
  const displayW = Math.round(size * aspectRatio)

  return (
    <HeyBancoLogoRaw
      viewBox={`${CONTENT_X} ${CONTENT_Y} ${CONTENT_W} ${CONTENT_H}`}
      width={displayW}
      height={size}
      preserveAspectRatio="xMidYMid meet"
      style={{ display: 'inline-block', flexShrink: 0 }}
    />
  )
}
