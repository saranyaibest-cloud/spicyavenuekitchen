import { resolveScan, supabaseRpc } from '../../../shared/qr/resolve.js'

/* Permanent QR entry point: https://<domain>/q/<code>
   Printed QR codes encode this URL, never the menu page directly, so the
   destination can be changed in the admin dashboard (or the hosting replaced)
   without reprinting. Unknown or deactivated codes fall back to /menu.
   Runs on the server (a Vercel function); it is never prerendered or cached. */
export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig(event)
  const rpc = supabaseRpc({ url: config.supabaseUrl, anonKey: config.supabaseAnonKey })
  const { target } = await resolveScan({
    code: getRouterParam(event, 'code'),
    getHeader: (name) => getHeader(event, name),
    rpc,
  })
  setResponseHeaders(event, {
    'Cache-Control': 'no-store, max-age=0',
    'X-Robots-Tag': 'noindex',
  })
  return sendRedirect(event, target, 302)
})
