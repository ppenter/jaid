import React from "react";

export const App = () => {
  const [state, setState] = React.useState(0);
  return (
    <div>
      <h1>Hello</h1>
      <button onClick={() => setState(state + 1)}>Click</button>
      <p>{state}</p>
    </div>
  );
};

export const Html = ({ children, props, css }: any) => {
  return (
    <html>
      <head>
        <title>Jaid</title>
        {/* <link rel="stylesheet" href="/dist/tailwind.css" /> */}
        {/* tailwind cdn */}
        <meta charSet="UTF-8"></meta>
        {css && <style>{css}</style>}
        <script src="https://cdn.tailwindcss.com"></script>
        <script
          dangerouslySetInnerHTML={{
            __html: `window.__INITIAL__DATA__ = ${JSON.stringify(props)}`,
          }}
        ></script>
      </head>
      <body>
        <div className="p-0" id="root">
          {children}
        </div>
      </body>
    </html>
  );
};
