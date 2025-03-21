import React, { useEffect, useState } from "react";
import ReactDOM from "react-dom/client";
import loadScripts from "../../business/loadScripts";
import CalendarSelect from "./CalendarSelect";
import BroadcastList from "./BroadcastList";

import { createYoutubeBroadcast } from "../../data/create-youtube-broadcast";
import ShowCreatedVideo from "./ShowCreatedVideo";
import { getBroadcasts } from "../../data/store-youtube-broadcast";

export function App() {
  const [videoId, setVideoId] = useState(null);
  const [broadcasts, setBroadcasts] = useState([]);

  const handleBroadcastFormSubmit = async (formVals) => {
    console.log(formVals)
    const response = await createYoutubeBroadcast(formVals);
    setVideoId(response.result.id);
  };

  useEffect(() => {
    getBroadcasts().then((broadcasts) => setBroadcasts(broadcasts));
  }, [videoId]);

  return (
    <>
      <CalendarSelect handleBroadcastForm={handleBroadcastFormSubmit} />
      {videoId && <ShowCreatedVideo videoId={videoId} />}
      <BroadcastList broadcasts={broadcasts} />
    </>
  );
}

export function setupBCSetupApp() {
  const query = document.querySelector("#app");
  if (query) {
    loadScripts();
    window.addEventListener("load", () => {
      const root = ReactDOM.createRoot(query);
      root.render(<App />);
    });
  } else {
    console.error("No element with id 'app' found");
  }
}
