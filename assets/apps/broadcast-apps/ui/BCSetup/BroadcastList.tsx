import { localFormat } from "../../business/utils";
import React from "react";
import { Temporal } from "temporal-polyfill";

function BroadcastList(props) {

  return (
    <div className="mt-6">
      <h2 className="text-xl font-bold mb-3 dark:text-slate-100">Broadcasts</h2>
      <table className="w-full max-w-3xl border-collapse">
        <thead>
          <tr>
            <th className="border border-slate-300 dark:border-slate-600 px-3 py-2 text-left">ID</th>
            <th className="border border-slate-300 dark:border-slate-600 px-3 py-2 text-left">Scheduled</th>
            <th className="border border-slate-300 dark:border-slate-600 px-3 py-2 text-left">Created</th>
          </tr>
        </thead>
        <tbody>
          {props.broadcasts?.map((broadcast, index) => (
            <tr key={index}>
              <td className="border border-slate-300 dark:border-slate-600 px-3 py-2 text-center font-bold">
                {broadcast.id}
              </td>
              <td className="border border-slate-300 dark:border-slate-600 px-3 py-2">
                {localFormat(broadcast.date_time_scheduled)}
              </td>
              <td className="border border-slate-300 dark:border-slate-600 px-3 py-2">
                {localFormat(broadcast.created_at)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default BroadcastList;
