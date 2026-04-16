import { forwardSearchPost } from '~~/server/utils/search'
import { requireRouteInteger } from '~~/server/utils/query'

export default defineEventHandler(async (event) => {
  const id = requireRouteInteger(getRouterParam(event, 'id'), 'channel id', 1)
  const page = requireRouteInteger(getRouterParam(event, 'page'), 'page', 0)

  return await forwardSearchPost(
    event,
    `/search/channel/${id}/subscribers/${page}`,
  )
})
