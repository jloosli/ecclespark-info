import React from "react";

const CalendarSelect = ({ handleBroadcastForm }) => {
  const setMeeting = (formData) => {
    handleBroadcastForm(
      formData.entries().reduce((acc, [key, val]) => {
        acc[key] = val;
        return acc;
      }, {})
    );
  };
  return (
    <>
      <form id="meeting_form" action={setMeeting}>
        <h3>Add Meeting:</h3>
        <div>
          <label htmlFor="title">Title:</label>
          <input
            type="text"
            id="title"
            name="title"
            defaultValue="Eccles Park Ward Sacrament Meeting"
            required
          />
        </div>
        <div>
          <label htmlFor="date">Date: </label>
          <input type="date" name="date" required />
        </div>
        <div>
          <label htmlFor="time">Time: </label>
          <input type="time" name="time" required defaultValue="10:00" />
        </div>
        <div>
          <button type="submit">Submit</button>
        </div>
      </form>
      <div className="err"></div>
    </>
  );
};

export default CalendarSelect;
