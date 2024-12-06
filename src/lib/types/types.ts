
/*

These are the return types for API calls 

*/


export interface SuccessRes <T> {
  data: T;
  error: null;
}

export interface ErrorRes {
  data: null;
  error: Error;
}

export type Res<T> = SuccessRes<T> | ErrorRes
