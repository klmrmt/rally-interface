import { Box } from '@mui/material'

import MoneySlider from './moneyslider'

function JoinScreen() {
    return (
        <Box 
        sx = {{
            display: 'flex', 
            flexDirection: 'column', 
            alignItems: 'center', 
            justifyContent: 'center', 
            height: 'calc(100vh - 32px)', 
            width: 'calc(100vw - 32px)',
            background: 'white',
            borderRadius: '8px',
            boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
        }}>

        <MoneySlider />
 
        </Box>
    )
}

export default JoinScreen;