import React, { useRef, useEffect } from "react";
import ReactDOM from "react-dom/client";
import params from "@params";
import { decodeJwtResponse } from "../business/utils";

const Login = ({onRef}) => {
  const g_ref = useRef(null);


  useEffect(() => {
    if (g_ref.current) {
      onRef(g_ref.current);
    }
  }, [g_ref.current]);

  return <div ref={g_ref}></div>;
};
export default Login;
