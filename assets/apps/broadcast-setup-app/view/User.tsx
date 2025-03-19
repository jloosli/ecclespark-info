import React from "react";

const User = ({ value: { name, picture } }) => {
    return (
    <>
      <h2>
        Logged In: <span className="name">{name}</span>
        <div className="user-image">
          <img className="pic" src={picture}  />
        </div>
      </h2>
    </>
  );
};

export default User;
