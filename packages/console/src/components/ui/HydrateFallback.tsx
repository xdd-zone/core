import { Loading } from './Loading'
import { Pattern } from './Pattern'

export function HydrateFallback() {
  return (
    <div className="relative h-screen w-screen">
      <Pattern />
      <Loading />
    </div>
  )
}
