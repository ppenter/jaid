import React from "react";

export const App = () => {
  return <div>Hello World</div>;
};

export const Html = ({
  children,
}: {
  children: any;
  jsPath?: string;
}) => {
  return (
    <html>
      <head>
        <title>Jaid</title>
      </head>
      <body>
        <div className="p-0" id="root">{children}</div>
      </body>
      <script src="/jss/twind.js"></script>
    </html>
  );
};
