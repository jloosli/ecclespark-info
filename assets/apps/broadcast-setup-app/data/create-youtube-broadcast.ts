import params from "@params";
import { Temporal } from "temporal-polyfill";

function insertEvent({ title, dateTime }) {
  console.log("inserting event");

  gapi.client.setApiKey(params.API_KEY);
  return gapi.client.youtube.liveBroadcasts.insert({
    part: ["id", "snippet", "contentDetails", "status"],
    resource: {
      snippet: {
        title: title,
        scheduledStartTime: dateTime,
      },
      contentDetails: {
        enableClosedCaptions: true,
        enableDvr: true,
        enableEmbed: false,
        recordFromStart: true,
      },
      status: {
        privacyStatus: "unlisted",
        selfDeclaredMadeForKids: false,
      },
    },
  });
}

function bindEventToStream(eventId, streamId) {
  console.log("bindEventToStream");
  return gapi.client.youtube.liveBroadcasts
    .bind({
      id: eventId,
      part: "id,contentDetails,snippet,status",
      streamId: streamId,
    })
    .then(function (response) {
      console.log("Event bound to stream:", response);
      return response;
    });
}

function generateVideoLinkFromId(videoId) {
  return `https://youtube.com/live/${videoId}`;
}

function getToken() {
  return new Promise((resolve, reject) => {
    const client = google.accounts.oauth2.initTokenClient({
      client_id: params.CLIENT_ID,
      scope: "https://www.googleapis.com/auth/youtube.force-ssl",
      callback: resolve,
    });
    client.requestAccessToken();
  });
}

function loadYoutubeApi(token) {
  return new Promise((resolve, reject) => {
    gapi.load("client", () => {
      console.log("Load Youtube API");
      // gapi.client.setApiKey(params.API_KEY);
      gapi.client.setToken(token);
      gapi.client.load("youtube", "v3", resolve);
    });
  });
}

const createDateTimeFromSeparateDateAndTime = (date, time) => {
  const plainDate = Temporal.PlainDate.from(date);
  const plainTime = Temporal.PlainTime.from(time);
  const zonedDateTime = plainDate.toZonedDateTime({
    plainTime,
    timeZone: "America/Denver",
  });

  const dateTime = zonedDateTime.toInstant().toString();
  return dateTime;
};

const createYoutubeBroadcast = ({ title, date, time }) => {
  const dateTime = createDateTimeFromSeparateDateAndTime(date, time);
  return getToken()
    .then(loadYoutubeApi)
    .then(() => insertEvent({ title, dateTime }))
    .then((response) => bindEventToStream(response.result.id, params.STREAM_ID))
    .catch((err) => console.error(err));
};

export { createYoutubeBroadcast, generateVideoLinkFromId };
