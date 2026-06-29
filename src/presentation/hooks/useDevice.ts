import { useEffect, useState } from 'react'

type Device = 'mobile' | 'desktop'

const MOBILE_BREAKPOINT = 768

export function useDevice(): Device {
  const [device, setDevice] = useState<Device>(() =>
    window.innerWidth < MOBILE_BREAKPOINT ? 'mobile' : 'desktop'
  )

  useEffect(() => {
    const mq = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`)
    const handler = (e: MediaQueryListEvent) => setDevice(e.matches ? 'mobile' : 'desktop')

    mq.addEventListener('change', handler)
    return () => mq.removeEventListener('change', handler)
  }, [])

  return device
}

export function useIsMobile(): boolean {
  return useDevice() === 'mobile'
}
