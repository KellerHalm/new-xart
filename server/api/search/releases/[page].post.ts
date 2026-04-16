import { forwardSearchPost, resolveApiVersion } from '~~/server/utils/search'
import { requireRouteInteger } from '~~/server/utils/query'

export default defineEventHandler(async (event) => {
  const page = requireRouteInteger(getRouterParam(event, 'page'), 'page', 0)
  const apiVersion = resolveApiVersion(event, 'v2')

  if (apiVersion === 'v1') {
    return await forwardSearchPost(event, `/search/releases/${page}/`)
  }

  return await forwardSearchPost(event, `/search/releases/${page}`, {
    apiVersion,
  })
})
