export class BetterWebSocket {
    url: string;
    promisePool: {};
    messagePool: Array<Object>;
    private _websocket: WebSocket;
    constructor(url: string) {
        this.url = url;
        this.promisePool = {};
        this.messagePool = new Array();
    }

    /**
     * Opens a WebSocket connection to the specified URL.
     *
     * @param url - The URL of the WebSocket server.
     * @returns A Promise that resolves when the WebSocket connection is opened.
     * The resolved value is an object containing the WebSocket event and the instance itself.
     * @throws An error if the WebSocket connection cannot be opened.
     */
    open() {
        return new Promise((resolve, reject) => {
            if (typeof this._websocket === 'undefined') {
                this._websocket = new WebSocket(this.url);
                this._websocket.onopen = (e: Event) => {
                    resolve({ e: Event, ws: BetterWebSocket });
                };
                this._websocket.onerror = (e: Event) => {
                    reject(e);
                };
            }

            this._websocket.onclose = (e: CloseEvent) => {};
            this._websocket.onmessage = (e: MessageEvent) => {
                const encodedData = e.data;
                const decodedData = JSON.parse(encodedData);
                if(decodedData["content"]["request_key"])
                {
                    console.log("Sync message: ");
                    console.log(decodedData);
                    const requestKey = decodedData["content"]["request_key"];
                    const requestPromise = this.promisePool[requestKey];
                    requestPromise.resolve(e);
                    delete this.promisePool[requestKey];
                }
                else
                {
                    console.log("Async message: ");
                    console.log(decodedData);
                    this.messagePool.push(decodedData);
                }
            };
        });
    }

    /**
     * Closes the WebSocket connection.
     */
    close(): void {
        // Purpose: This method is used to close the WebSocket connection.
        // Parameters: None.
        // Return Value: None.
        // Throws: None.
        // Side Effects: The WebSocket connection is closed.
        this._websocket.close();
    }

    /**
     * Sends a request to the WebSocket server.
     *
     * @param request_key - A unique identifier for the request.
     * @param content - The content of the request to be sent to the server.
     * @returns A Promise that resolves when the server responds to the request.
     * The resolved value is the response data from the server.
     * @throws An error if the WebSocket connection cannot be opened or if the request cannot be sent.
     */
    send_sync(request_key: any, content: Record<string, any>): Promise<any> {
        return new Promise((resolve, reject) => {
            // Store the promise, resolve, reject, and request_key for this request.
            this.promisePool[content["content"]["request_key"]] = {
                content,
                resolve,
                reject,
                request_key
            };

            // Set the request_key for the content.
            content["content"]["request_key"] = request_key;

            // Send the request to the server.
            this._websocket.send(JSON.stringify(content));
        });
    }

    get_message_by_type(type: string): Array<Object>{
        var result = new Array();
        let message;
        for (message in this.messagePool) 
            if(message["type"] == type) result.push(message);

        return result;
    }
}