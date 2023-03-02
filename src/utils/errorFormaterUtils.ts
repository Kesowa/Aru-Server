interface Requesterror {
  msg: string;
  param: string;
}

export const formatRequestError = (errors: any) => {
  const customerrors = errors.array().map(({ msg, param }: Requesterror) => {
    return {
      msg,
      param,
    };
  });
  return customerrors;
};
