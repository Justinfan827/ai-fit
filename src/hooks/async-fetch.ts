import { useState } from "react";

export function useAsyncFetch({ queryFunc }: { queryFunc: any }) {
  const [isPending, setIsPending] = useState(false);
  const [res, setRes] = useState({
    data: null,
    error: null,
  });
  const runQuery = async () => {
    setIsPending(true);
    const res = await queryFunc();
    setIsPending(false);
    setRes(res);
  };
  return {
    res,
    isPending,
    runQuery,
  };
}

