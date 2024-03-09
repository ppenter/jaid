import React from "react";
import { ServerSideParamsContext } from "../components/SSRParamsContext";

export const useParams = () => {
  return React.useContext(ServerSideParamsContext);
};
