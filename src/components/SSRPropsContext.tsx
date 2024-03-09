import React, { createContext, useState } from "react";

type TParams = {
  [key: string]: any;
};
// สร้าง Context
export const ServerSidePropsContext = React.createContext(null);

export const ServerSidePropsProvider = ({ children, value }: any) => {
  return (
    <ServerSidePropsContext.Provider value={value}>
      {children}
    </ServerSidePropsContext.Provider>
  );
};
