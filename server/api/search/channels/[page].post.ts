import { forwardSearchPost } from '~~/server/utils/search'
import { requireRouteInteger } from '~~/server/utils/query'

export default defineEventHandler(async (event) => {
  const page = requireRouteInteger(getRouterParam(event, 'page'), 'page', 0)

  return await forwardSearchPost(event, `/search/channels/${page}`)
})
