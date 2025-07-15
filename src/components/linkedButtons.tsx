
import Button from '@mui/material/Button';
import { useNavigate } from 'react-router-dom';



interface LinkedButtonsProps {
    link: string;
    BackgroundColor: string;
    color: string;
    text: string;
    borderColor: string;
}

export default function LinkedButtons({ link, BackgroundColor, color, text, borderColor }: LinkedButtonsProps) {
    const navigate = useNavigate();
    return (
        <Button 
            variant="contained"
            sx = {{
                backgroundColor: BackgroundColor, 
                color: color, 
                marginTop: '2rem', 
                width: '200px', 
                height: '50px', 
                font: 'RethinkSans',
                borderColor: borderColor, 
                '&:hover': { 
                    backgroundColor: BackgroundColor,
                    borderColor: '#ED70C0' 
                }
            }} 
            onClick={() => console.log({link})}>
              {text}
        </Button>
    )
}