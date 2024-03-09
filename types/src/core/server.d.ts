/// <reference types="node" />
import React from "react";
export declare const createServer: (App: (props?: any) => React.ReactElement) => Promise<import("http").Server<typeof import("http").IncomingMessage, typeof import("http").ServerResponse>>;
