import "../css/style.css";
import { useRef, useCallback, useEffect, useState } from "react";
import { useLoaderData, useOutletContext } from "react-router-dom";
import * as globals from "./Globals"

function ProblemInfoFetcher({ lastJsonMessage, problemInfo, requestKey }) {
    const [websocketMessageHistory, setWebsocketMessageHistory] = useState([]);
	
	useEffect(() => {
        if (lastJsonMessage !== null) setWebsocketMessageHistory((previousMessage) => previousMessage.concat(lastJsonMessage));
    }, [lastJsonMessage]);
	
	useEffect(() => {
        const _websocketMessageHistory = websocketMessageHistory;
        _websocketMessageHistory.map((message, index) => {
            if (message) {
                console.log(message);
				if (message.type && message.content && message.content.problem_number && message.content.difficulty && message.content.problem_name && message.content.problem_statement && message.type === "problem_statement") {
                    problemInfo.current = {
						problem_number: message.content.problem_number,
						difficulty: message.content.difficulty,
						problem_name: message.content.problem_name,
						problem_statement: message.content.problem_statement
					};
                    delete _websocketMessageHistory[index];
                }
            }
        });

        if(!globals.compareArray(_websocketMessageHistory, websocketMessageHistory)) setWebsocketMessageHistory(_websocketMessageHistory);
		console.log(problemInfo.current);
	}, [websocketMessageHistory]);
    return <div></div>;
}

export default function ProblemMain() {
    const { problemNumber } = useLoaderData();
	const [websocketMessageHistory, setWebsocketMessageHistory] = useState([]);
    const { sendJsonMessage, lastJsonMessage } = useOutletContext();
	const problemInfo = useRef({});
	const [requestKey, setRequestKey] = useState("");
	
	useEffect(() => {
        if (lastJsonMessage !== null) setWebsocketMessageHistory((previousMessage) => previousMessage.concat(lastJsonMessage));
    }, [lastJsonMessage]);
	
	const handleLoadProblemInfo = useCallback(() => {
        const _requestKey = globals.randomUUID();
        sendJsonMessage({
            type: "problem_statement",
            content: {
				problem_number: problemNumber,
                request_key: _requestKey
            }
        });

        return _requestKey;
    }, []);
	
	useEffect(() => {
        setRequestKey(handleLoadProblemInfo());
    }, [handleLoadProblemInfo]);
	
    return <>
		{
			console.log(problemInfo.current.problem_statement), problemInfo.current.problem_statement
			?
			problemInfo.current.problem_statement.map((statement) => (
					<p>{statement}</p>
				)
			)
			:
			<></>
		}
        <ProblemInfoFetcher 
			lastJsonMessage={lastJsonMessage}
			problemInfo={problemInfo} 
			requestKey={requestKey} />
    </>;
}