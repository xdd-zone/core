import { z } from 'zod'
import { SignUpEmailBodySchema, SignInEmailBodySchema } from '@/shared/validator'

export { SignUpEmailBodySchema, SignInEmailBodySchema }
export type SignUpEmailBody = z.infer<typeof SignUpEmailBodySchema>
export type SignInEmailBody = z.infer<typeof SignInEmailBodySchema>
