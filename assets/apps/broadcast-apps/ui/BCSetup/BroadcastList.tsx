import { localFormat } from "../../business/utils";
import React from "react";
import { Temporal } from "temporal-polyfill";

function BroadcastList(props) {

  return (
    <div className="broadcast-list">
      <h2>Broadcasts</h2>
      <table>
        <thead>
          <tr className="headers">
            <th>ID</th>
            <th>Scheduled</th>
            <th>Created</th>
          </tr>
        </thead>
        <tbody>
          {props.broadcasts?.map((broadcast, index) => (
            <tr key={index}>
              <td>{broadcast.id}</td>
              <td>{localFormat(broadcast.date_time_scheduled)}</td>
              <td>{localFormat(broadcast.created_at)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default BroadcastList;
