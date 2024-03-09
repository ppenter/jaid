import React, { createContext, useState } from "react";

type TParams = {
  [key: string]: any;
};
// สร้าง Context
export const ServerSideParamsContext = React.createContext(null);

export const ServerSideParamsProvider = ({ children, value }: any) => {
  return (
    <ServerSideParamsContext.Provider value={value}>
      {children}
    </ServerSideParamsContext.Provider>
  );
};
