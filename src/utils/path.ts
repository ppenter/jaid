export const getQuery = (path: string) => {
  const search = path.split("?")[1];
  if (!search) return {};
  const params = search.split("&");
  const result: any = {};
  params.forEach((param) => {
    const [key, value] = param.split("=");
    result[key] = value;
  });
  return result;
};
