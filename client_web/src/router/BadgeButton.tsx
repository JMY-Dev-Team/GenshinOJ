import { CSSProperties, MouseEventHandler, useCallback, useEffect, useState } from "react";

export default function BadgeButton({ text, style, onClick }: {
    text: string;
    style?: CSSProperties | undefined;
    onClick?: MouseEventHandler<HTMLButtonElement> | undefined;
}) {
    const [stateHover, setStateHover] = useState(false);
    const [stateClick, setStateClick] = useState(false);

    useEffect(() => {
        if (stateClick === true)
            setTimeout(() => setStateClick(false), 500);
    }, [stateClick]);

    const handleMouseEnter = useCallback(() => {
        setStateHover(true);
    }, []);

    const handleMouseLeave = useCallback(() => {
        setStateHover(false);
    }, []);

    const handleClick = useCallback((event: React.MouseEvent<HTMLButtonElement>) => {
        if (onClick) onClick(event); setStateClick(true);
    }, [onClick]);

    return <button style={{ ...style, border: "1px solid", borderWidth: "1px", borderRadius: "3px", backgroundColor: stateClick ? "rgb(65, 131, 196)" : (stateHover ? "rgba(65, 131, 196, 0.1)" : "rgba(65, 131, 196, 0)"), color: "#4183C4" }}
        onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave}
        onClick={handleClick}>
        <span style={{ margin: "0 2px 0 2px", color: stateClick ? "#ffffff" : "#4183C4", lineHeight: "1.5" }}>
            {text}
        </span>
    </button>;
}