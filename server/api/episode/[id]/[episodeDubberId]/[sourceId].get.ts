import { anixRequest } from '~~/server/utils/anix'
import { requireRouteInteger } from '~~/server/utils/query'

export default defineEventHandler(async (event) => {
  const id = requireRouteInteger(getRouterParam(event, 'id'), 'release id', 1)
  const episodeDubberId = requireRouteInteger(
    getRouterParam(event, 'episodeDubberId'),
    'episode dubber id',
    1,
  )
  const sourceId = requireRouteInteger(
    getRouterParam(event, 'sourceId'),
    'episode source id',
    1,
  )

  return await anixRequest<Record<string, unknown>>(
    `/episode/${id}/${episodeDubberId}/${sourceId}`,
  )
})
