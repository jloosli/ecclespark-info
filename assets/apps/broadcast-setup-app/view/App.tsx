import React, { useEffect, useState } from "react";
import ReactDOM from "react-dom/client";
import Login from "./Login";
import User from "./User";
import loadScripts from "../business/loadScripts";
import CalendarSelect from "./CalendarSelect";
import params from "@params";
import {
  googlePrompt,
  initialize,
  renderLoginButtion,
} from "../business/google-user-login";
import { createYoutubeBroadcast } from "../data/create-youtube-broadcast";
import ShowCreatedVideo from "./ShowCreatedVideo";

export function App() {
  const [user, setUser] = useState(null);
  const [videoId, setVideoId] = useState(null);

  const handleBroadcastFormSubmit = async (formVals) => {
    const response = await createYoutubeBroadcast(formVals);
    setVideoId(response.result.id);
  };

  useEffect(() => {
    const rootElement = document.getElementById('app');
    rootElement.classList.add("broadcast-setup-app");
    initialize().then((u) => setUser(u));
    googlePrompt();
  }, []);
  const handleRef = (ref) => renderLoginButtion(ref);
  return (
    <>
      {user ? (
        <>
          <User value={user} />
          <CalendarSelect handleBroadcastForm={handleBroadcastFormSubmit} />
          {videoId ? <ShowCreatedVideo videoId={videoId} /> : ""}
        </>
      ) : (
        <Login user={user} onRef={handleRef} />
      )}
    </>
  );
}

export function main() {
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
