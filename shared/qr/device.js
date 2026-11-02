/* Coarse, non-identifying classification of a user agent (ported unchanged from
   the QR system's src/lib/qr/device.ts). Only these two labels are stored; the
   user-agent string itself, IP addresses and cookies are never recorded.
   device: 'mobile' | 'tablet' | 'desktop' | 'bot' | 'unknown'
   os:     'ios' | 'android' | 'windows' | 'macos' | 'linux' | 'other' */
export function classifyUserAgent(ua) {
  if (!ua) return { device: 'unknown', os: 'other' }
  const s = String(ua).toLowerCase()
  if (/bot|crawler|spider|crawling|facebookexternalhit|slackbot|whatsapp|telegrambot|preview|headless/.test(s)) {
    return { device: 'bot', os: 'other' }
  }
  let os = 'other'
  if (/iphone|ipad|ipod/.test(s)) os = 'ios'
  else if (/android/.test(s)) os = 'android'
  else if (/windows/.test(s)) os = 'windows'
  else if (/macintosh|mac os x/.test(s)) os = 'macos'
  else if (/linux|cros/.test(s)) os = 'linux'

  let device = 'desktop'
  if (/ipad|tablet/.test(s) || (os === 'android' && !/mobile/.test(s))) device = 'tablet'
  else if (/mobi|iphone|ipod|android/.test(s)) device = 'mobile'
  return { device, os }
}
