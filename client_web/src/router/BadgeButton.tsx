import { CSSProperties, MouseEventHandler, useEffect, useState } from "react";

export function BadgeButton({ text, style, onClick }: {
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
    return <button style={{ ...style, border: "1px solid", borderWidth: "1px", borderRadius: "3px", backgroundColor: stateClick ? "rgb(65, 131, 196)" : (stateHover ? "rgba(65, 131, 196, 0.1)" : "rgba(65, 131, 196, 0)"), color: "#4183C4" }}
        onMouseEnter={() => setStateHover(true)} onMouseLeave={() => setStateHover(false)}
        onClick={(event) => { if (onClick) onClick(event); setStateClick(true); }}>
        <span style={{ margin: "0 2px 0 2px", color: stateClick ? "#ffffff" : "#4183C4", lineHeight: "1.5" }}>
            {text}
        </span>
    </button>;
}