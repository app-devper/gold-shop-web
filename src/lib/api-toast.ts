import { toast } from 'sonner'

type AxiosLike = { response?: { data?: { message?: string } } }

export function apiToastError(e: unknown, fallback = 'เกิดข้อผิดพลาด') {
  const ax = e as AxiosLike
  const msg = ax?.response?.data?.message || (e as Error)?.message || fallback
  toast.error(msg)
}
