import React from "react";
import params from "@params";
import { generateVideoLinkFromId } from "../../data/create-youtube-broadcast";
import { copyLinkToClipboard } from "../../business/utils";

const ShowCreatedVideo = ({ videoId }) => {
  const videoLink = generateVideoLinkFromId(videoId);
  const handleCopyClick = () => copyLinkToClipboard(videoLink);
  return (
    <div className="my-4">
      <h3 className="text-slate-900 dark:text-slate-100">Meeting scheduled:</h3>
      <a href={videoLink}>{videoLink}</a>&nbsp;
      <img
        onClick={handleCopyClick}
        src="/images/copy-svgrepo-com.svg"
        alt="Copy Icon"
        className="inline-block cursor-pointer w-5 h-5"
        title="Copy to clipboard"
      />
      <p>
        Copy the above link and paste it into&nbsp;
        <a href={params.EDIT_WEEK_LINK} target="_blank" rel="noopener noreferrer">
          GitHub
        </a>
        .
      </p>
    </div>
  );
};
export default ShowCreatedVideo;
