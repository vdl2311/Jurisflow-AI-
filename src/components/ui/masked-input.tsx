'use client'

import { Input } from '@/components/ui/input'
import { applyMask, getRawValue, type MaskType } from '@/lib/masks'
import { forwardRef, useState, useEffect } from 'react'

interface MaskedInputProps extends Omit<React.ComponentProps<typeof Input>, 'onChange' | 'value'> {
  mask: MaskType
  value?: string | number
  onChange?: (rawValue: string | number, formattedValue: string) => void
  onRawChange?: (rawValue: string | number) => void
}

export const MaskedInput = forwardRef<HTMLInputElement, MaskedInputProps>(
  ({ mask, value, onChange, onRawChange, ...props }, ref) => {
    const [display, setDisplay] = useState('')

    // Atualiza display quando value muda externamente
    useEffect(() => {
      if (value !== undefined && value !== null) {
        setDisplay(applyMask(mask, String(value)))
      } else {
        setDisplay('')
      }
    }, [value, mask])

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const raw = e.target.value
      const formatted = applyMask(mask, raw)
      setDisplay(formatted)
      const rawValue = getRawValue(mask, formatted)
      onChange?.(rawValue, formatted)
      onRawChange?.(rawValue)
    }

    return (
      <Input
        ref={ref}
        value={display}
        onChange={handleChange}
        inputMode={mask === 'currency' ? 'numeric' : 'text'}
        {...props}
      />
    )
  }
)

MaskedInput.displayName = 'MaskedInput'
