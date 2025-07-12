


interface RallyLogoProps {
    RALLY: string;
    width: string;
    height: string;
    marginBottom: string;
}

export default function RallyLogo({ RALLY, width, height, marginBottom }: RallyLogoProps) { 

    return (
        <img 
          src={RALLY} 
          alt="RALLY" 
          style={{ 
            width: width, 
            height: height,
            marginBottom: marginBottom
          }} 
        />
    )


}