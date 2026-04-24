import { anixMirrorRequest } from '~~/server/utils/mirror'
import { pickDefinedValues, toObjectRecord } from '~~/server/utils/query'

export default defineEventHandler(async (event) => {
  const body = toObjectRecord(await readBody(event).catch(() => undefined))
  const query = getQuery(event)

  return await anixMirrorRequest(event, '/auth/signIn', {
    method: 'POST',
    query: pickDefinedValues(
      {
        login: body.login ?? query.login,
        password: body.password ?? query.password,
      },
      ['login', 'password'],
    ),
    forwardAuth: false,
  })
})