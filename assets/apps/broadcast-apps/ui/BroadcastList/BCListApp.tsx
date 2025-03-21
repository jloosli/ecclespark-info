import React, { useEffect } from "react";
import ReactDOM from "react-dom/client";
import loadScripts from "../../business/loadScripts";
import { getBroadcasts } from "apps/broadcast-apps/data/store-youtube-broadcast";
import NoBroadcastsFound from "./NoBroadcastsFound";
import BroadcastList from "./BroadcastList";
import LookingForBroadcasts from "./LookingForBroadcasts";

function BCListApp() {
  const [broadcasts, setBroadcasts] = React.useState([]);
  const [loading, setLoading] = React.useState(true);

  useEffect(() => {
    getBroadcasts().then((broadcasts) => {
      console.log("Broadcasts loaded:", broadcasts);
      setBroadcasts(broadcasts);
      setLoading(false);
    });
  }, []);

  return (
    <>
      {loading ? (
        <LookingForBroadcasts />
      ) : broadcasts.length === 0 ? (
        <NoBroadcastsFound />
      ) : (
        <BroadcastList broadcasts={broadcasts} />
      )}
    </>
  );
}

function setupBCListApp() {
  const query = document.querySelector("#broadcast-list");
  if (query) {
    loadScripts();
    window.addEventListener("load", () => {
      const root = ReactDOM.createRoot(query);
      root.render(<BCListApp />);
    });
  } else {
    console.error("No element with id 'broadcast-list' found");
  }
}

export default BCListApp;
export { setupBCListApp };
