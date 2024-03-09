/// <reference types="node" />
import React from "react";
export declare const createServer: (
  Entry: React.JSX.Element,
) => Promise<
  import("http").Server<
    typeof import("http").IncomingMessage,
    typeof import("http").ServerResponse
  >
>;
