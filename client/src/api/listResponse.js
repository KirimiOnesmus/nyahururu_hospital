/** Return a list from either an unpaged API response or the paged { data } shape. */
export function getListData(responseData, endpointName = "API") {
  if (Array.isArray(responseData)) return responseData;
  if (Array.isArray(responseData?.data)) return responseData.data;

  const received = typeof responseData === "string"
    ? "HTML or text"
    : responseData === null
      ? "null"
      : typeof responseData;
  throw new TypeError(`${endpointName} returned ${received}; expected a list.`);
}
