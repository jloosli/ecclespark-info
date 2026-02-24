import { localFormat } from "../../business/utils";
import { generateVideoLinkFromId } from "../../data/create-youtube-broadcast";
import React from "react";

function BroadcastList({broadcasts}) {
    return (
        <>
          <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100 mb-4">
            Upcoming Broadcasts
          </h2>
          <div className="grid grid-cols-[repeat(auto-fill,minmax(280px,1fr))] gap-4">
            {broadcasts.map((broadcast, index) => (
              <a href={generateVideoLinkFromId(broadcast.id)} key={index}
                 className="no-underline group">
                <div className="rounded-xl border border-slate-200 bg-white shadow-sm
                                hover:shadow-md transition-shadow duration-200 overflow-hidden
                                dark:bg-slate-800 dark:border-slate-700">
                  <div className="aspect-video bg-slate-100 dark:bg-slate-700
                                  flex items-center justify-center p-6">
                    <img src="/images/speaker_female.svg" alt="Sacrament Meeting"
                         className="max-h-full object-contain" />
                  </div>
                  <div className="p-4 border-t border-slate-100 dark:border-slate-700">
                    <h4 className="font-semibold text-slate-900 dark:text-slate-100 m-0">
                      Sacrament Meeting
                    </h4>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                      {localFormat(broadcast.date_time_scheduled)}
                    </p>
                  </div>
                </div>
              </a>
            ))}
          </div>
        </>
      );
}

export default BroadcastList
