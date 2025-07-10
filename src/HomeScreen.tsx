import { useNavigate } from 'react-router-dom';
import RALLY from './RALLY-2.png'
import './MainScreen.css'

function HomeScreen() {
  const navigate = useNavigate();
  return (
    <div style={{ textAlign: 'center', marginTop: '2rem' }}>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <img 
          src={RALLY} 
          alt="RALLY" 
          style={{ 
            width: '500px', 
            height: '500px',
            marginBottom: '20px'
          }} 
        />
        
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '20px', marginTop: '20px' }}>
            <button
              onClick={() => navigate('/main')}
              className="rally-button-2"
            >
              RALLY UP!
            </button>
            
            <button
              onClick={() => navigate('/main')}
              className="rally-button"
            >
              JOIN THE RALLY!
            </button>
          </div>

      </div>
    </div>
  );
}

export default HomeScreen;