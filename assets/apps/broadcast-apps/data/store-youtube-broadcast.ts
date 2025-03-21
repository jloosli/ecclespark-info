import Airtable, { FieldSet } from "airtable";
import params from "@params";
import { QueryParams } from "airtable/lib/query_params";

type broadcast = {
  id: string;
  date_time_scheduled: string;
  created_at: string;
};

Airtable.configure({
  endpointUrl: "https://api.airtable.com",
  apiKey: params.AIRTABLE_READ_WRITE_TOKEN,
});

const base = new Airtable({ apiKey: params.AIRTABLE_READ_WRITE_TOKEN }).base(
  params.AIRTABLE_BASE
);

function getBroadcasts(params: QueryParams<FieldSet> = {}) {
  const defaultParams: QueryParams<FieldSet> = {
    filterByFormula: `{date_time_scheduled} >= TODAY()`,
    sort: [{ field: "date_time_scheduled", direction: "asc" }],
  };

  const mergedParams = { ...defaultParams, ...params };
  const results = [];
  return base("Youtube Broadcasts")
    .select(mergedParams)
    .eachPage((records, fetchNextPage) => {
      records.forEach((record) => results.push(record.fields));
      fetchNextPage();
    })
    .then(() => results);
}

function storeBroadcast(bc: broadcast) {
  return base("Youtube Broadcasts").create(bc);
}
export { getBroadcasts, storeBroadcast, broadcast };
