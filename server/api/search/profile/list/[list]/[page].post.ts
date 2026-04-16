import { forwardSearchPost } from '~~/server/utils/search'
import { requireRouteInteger } from '~~/server/utils/query'

export default defineEventHandler(async (event) => {
  const list = requireRouteInteger(getRouterParam(event, 'list'), 'profile list', 0)
  const page = requireRouteInteger(getRouterParam(event, 'page'), 'page', 0)

  return await forwardSearchPost(event, `/search/profile/list/${list}/${page}`)
})
