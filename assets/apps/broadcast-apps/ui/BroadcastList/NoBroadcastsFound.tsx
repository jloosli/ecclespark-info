import React from 'react';

const NoBroadcastsFound: React.FC = () => {
    return (
        <div className="py-12 text-center text-slate-500 dark:text-slate-400">
            <p className="text-lg font-medium">No broadcasts are currently scheduled</p>
        </div>
    );
};

export default NoBroadcastsFound;
