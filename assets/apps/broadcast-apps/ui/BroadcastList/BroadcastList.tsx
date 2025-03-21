import { localFormat } from "../../business/utils";
import { generateVideoLinkFromId } from "../../data/create-youtube-broadcast";
import React from "react";

function BroadcastList({broadcasts}) {
    return (
        <>
          <h2>Upcoming Broadcasts</h2>
          <div className="cards">
            {broadcasts.map((broadcast, index) => (
              <a href={generateVideoLinkFromId(broadcast.id)} key={index}>
                <div className="card">
                  <div className="image">
                    <img
                      src="/images/speaker_female.svg"
                      alt="Sacrament Meeting"
                    />
                  </div>
                  <div className="title">
                    <h4>Sacrament Meeting</h4>
                    <h5>{localFormat(broadcast.date_time_scheduled)}</h5>
                  </div>
                </div>
              </a>
            ))}
          </div>
        </>
      );
}

export default BroadcastList