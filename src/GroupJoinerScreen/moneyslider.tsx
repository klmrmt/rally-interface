import { Slider } from '@mui/material'
import { useState } from 'react'

export default function MoneySlider() {
    const [value, setValue] = useState(50)

    return (
        <Slider value = {value} onChange = {(value, newValue) => setValue(newValue)} aria-label = "Slider" />
    )
}