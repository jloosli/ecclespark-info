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
      <form id="meeting_form" action={setMeeting} className="space-y-4">
        <h3>Add Meeting:</h3>
        <div className="flex items-center gap-3">
          <label htmlFor="title" className="w-12 shrink-0">Title:</label>
          <input
            type="text"
            id="title"
            name="title"
            defaultValue="Eccles Park Ward Sacrament Meeting"
            required
            className="w-96 border border-slate-300 rounded px-2 py-1"
          />
        </div>
        <div className="flex items-center gap-3">
          <label htmlFor="date" className="w-12 shrink-0">Date:</label>
          <input type="date" name="date" required
                 className="border border-slate-300 rounded px-2 py-1" />
        </div>
        <div className="flex items-center gap-3">
          <label htmlFor="time" className="w-12 shrink-0">Time:</label>
          <input type="time" name="time" required defaultValue="10:00"
                 className="border border-slate-300 rounded px-2 py-1" />
        </div>
        <div>
          <button type="submit"
                  className="bg-primary text-white px-4 py-2 rounded hover:bg-primary-hover transition-colors">
            Submit
          </button>
        </div>
      </form>
      <div className="err"></div>
    </>
  );
};

export default CalendarSelect;
