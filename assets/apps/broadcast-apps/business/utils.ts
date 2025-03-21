import { Temporal } from "temporal-polyfill";

function decodeJwtResponse(token) {
    var base64Url = token.split(".")[1];
    var base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
    var jsonPayload = decodeURIComponent(
      window
        .atob(base64)
        .split("")
        .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
        .join("")
    );

    return JSON.parse(jsonPayload);
  }

  function copyLinkToClipboard(link) {
    navigator.clipboard
      .writeText(link)
      .then(() => {
        console.log("Link copied to clipboard: ", link);
      })
      .catch((err) => {
        console.error("Could not copy link: ", err);
      });
  }

  const localFormat = (dateString) => {
      return Temporal.Instant.from(dateString)
        .toZonedDateTimeISO(Temporal.Now.timeZoneId())
        .toLocaleString();
    };
  export {decodeJwtResponse, copyLinkToClipboard, localFormat}