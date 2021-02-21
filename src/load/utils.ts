import axios from "axios";

const HEADER = {
  "Content-Type": "application/json",
  Accept: "application/json",
  Authorization: "Bearer " + process.env.FIREFLY_TOKEN,
};

export async function getWrapper(url, params) {
  return axios
    .get(url, {
      headers: HEADER,
      params,
    })
    .catch((e) => {
      throw Error(`error getting from firefly ${e.message}`);
    });
}

export async function postWrapper(url, data) {
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

export async function txExists(url, tx) {
  return axios
    .get(url + "/api/v1/transactions?", {
      params: { start: tx.date, end: tx.date },
      headers: HEADER,
    })
    .then(
      ({ data }) =>
        data.data
          .flat()
          .map(({ attributes }) => attributes)
          .map(({ transactions }) => transactions)
          .flat()
          .map(({ external_id }) => external_id)
          .filter((id: string) => id == tx.exernal_id).length > 0
    );
}
