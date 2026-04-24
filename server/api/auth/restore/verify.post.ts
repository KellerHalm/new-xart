import { anixMirrorRequest } from '~~/server/utils/mirror'
import { pickDefinedValues, toObjectRecord } from '~~/server/utils/query'

export default defineEventHandler(async (event) => {
  const body = toObjectRecord(await readBody(event).catch(() => undefined))
  const query = getQuery(event)

  return await anixMirrorRequest(event, '/auth/restore/verify', {
    method: 'POST',
    query: pickDefinedValues(
      {
        login: body.login ?? query.login,
        password: body.password ?? query.password,
        hash: body.hash ?? query.hash,
        code: body.code ?? query.code,
      },
      ['login', 'password', 'hash', 'code'],
    ),
    forwardAuth: false,
  })
})