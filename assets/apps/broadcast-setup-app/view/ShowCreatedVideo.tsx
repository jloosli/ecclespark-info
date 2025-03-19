import React from "react";
import params from "@params";
import { generateVideoLinkFromId } from "../data/create-youtube-broadcast";
import { copyLinkToClipboard } from "../business/utils";

const ShowCreatedVideo = ({ videoId }) => {
  const videoLink = generateVideoLinkFromId(videoId);
  const handleCopyClick = () => copyLinkToClipboard(videoLink);
  return (
    <div id="show-created-video">
      <h3>Meeting scheduled:</h3>
      <a href={videoLink}>{videoLink}</a>&nbsp;
      <img
        onClick={handleCopyClick}
        src="/images/copy-svgrepo-com.svg"
        alt="Copy Icon"
        className="copy-icon"
        title="Copy to clipboard"
      />
      <p>
        Copy the above link and paste it into&nbsp; 
        <a href={params.EDIT_WEEK_LINK} target="_blank">
          Github
        </a>
        .
      </p>
    </div>
  );
};
export default ShowCreatedVideo;
