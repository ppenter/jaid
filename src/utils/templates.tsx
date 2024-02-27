import fs from "fs";

export const generate = (path: string, data: string) => {
  fs.writeFileSync(path, data);
};
