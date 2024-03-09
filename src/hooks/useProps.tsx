import React from "react";
import { ServerSidePropsContext } from "../components/SSRPropsContext";

export const useProps = () => {
  return React.useContext(ServerSidePropsContext);
};
