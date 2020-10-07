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
      console.error(`error while processing: ${e.config.data}`);
      console.error(JSON.stringify(e.response.data, null, 1));
      throw Error("error while sending to firefly");
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
