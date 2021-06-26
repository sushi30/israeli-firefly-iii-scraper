import axios from "axios";

const HEADER = {
  "Content-Type": "application/json",
  Accept: "application/json",
  Authorization: "Bearer " + process.env.FIREFLY_TOKEN,
};

export async function getWrapper(url: string, params: any) {
  return axios
    .get(url, {
      headers: HEADER,
      params,
    })
    .catch((e) => {
      throw Error(`error getting from firefly ${e.message}`);
    });
}

export async function postWrapper(url: string, data) {
  return axios
    .post(url, data, {
      headers: HEADER,
    })
    .catch((e) => {
      console.error(`error while processing: ${e.config.data}`);
      console.error(JSON.stringify(e.response.data, null, 1));
      throw Error("error while sending to firefly");
    });
}

export async function txExists(url: string, tx) {
  return getWrapper(url + "/api/v1/transactions", {
    start: tx.date,
    end: tx.date,
  }).then(({ data }) =>
    data.data
      .flat()
      .map(({ attributes }) => attributes)
      .map(({ transactions }) => transactions)
      .flat()
      .some(({ external_id }) => external_id == tx.external_id)
  );
}
