import { umApi } from '@/lib/api'
import { employeeApi } from '@/lib/gold-api'
import { useAuthStore } from '@/store/auth'

export const SYSTEM_CODE = process.env.NEXT_PUBLIC_SYSTEM_CODE || 'GOLD'

/**
 * Finishes signing in with a UM access token for this system: reads where
 * the Gold API lives and who the user is, then their branch.
 */
export async function startGoldSession(token: string): Promise<void> {
  const auth = { headers: { Authorization: `Bearer ${token}` } }

  // Get System Host (the Gold API) + clientId; refuse a token for another system
  const sysRes = await umApi.get('/auth/system', auth)
  if (sysRes.data.systemCode !== SYSTEM_CODE) {
    throw new Error(`This sign-in is for ${sysRes.data.systemCode}, not ${SYSTEM_CODE}`)
  }

  // Get User Info for Role
  const userRes = await umApi.get('/user/info', auth)

  // Save auth (sets token+host so goldApi interceptor works)
  const { setAuth, setUserInfo } = useAuthStore.getState()
  setAuth(token, sysRes.data.host, userRes.data.role, sysRes.data.clientId)

  // Fetch employee /me to get branch name + id
  let branchName = ''
  let branchId = ''
  try {
    const emp = await employeeApi.me()
    branchName = emp.branchName || ''
    // API returns snake_case, type declares camelCase — read raw field directly.
    branchId = (emp as unknown as { branch_id?: string }).branch_id || ''
  } catch {
    // Not an employee (e.g. SUPER admin) — branch fields stay empty
  }
  setUserInfo(userRes.data.username, branchName, branchId)
}

/**
 * Signs in with the one-time ticket UM put in the address when the user
 * opened Gold from UM (um-api ADR-0011); any earlier session here ends first.
 */
export async function continueFromUm(ticket: string): Promise<void> {
  useAuthStore.getState().logout()
  const res = await umApi.post('/auth/exchange', { ticket })
  try {
    await startGoldSession(res.data.accessToken)
  } catch (e) {
    useAuthStore.getState().logout()
    throw e
  }
}
