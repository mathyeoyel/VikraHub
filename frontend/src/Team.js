import React, { useEffect, useState } from "react";
import { teamAPI } from "./api";

export default function Team() {
  const [team, setTeam] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    console.log('Fetching team...');
    teamAPI.getAll()   // Use the proper API method
      .then(res => {
        console.log('Team response:', res.data);
        setTeam(res.data);
        setError(null);
      })
      .catch(err => {
        console.error('Team error:', err);
        setError(err.message || 'Failed to load team');
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div>Loading team...</div>;

  if (error) {
    return (
      <div className="error-message">
        <h3>Error Loading Team</h3>
        <p>{error}</p>
        <button onClick={() => window.location.reload()}>Retry</button>
      </div>
    );
  }

  return (
    <div>
      <h2>Team Members</h2>
      <ul>
        {team.map(m => (
          <li key={m.id}>
            {m.name}
            {m.image && <img src={m.image} alt={m.name} width={80} />}
          </li>
        ))}
      </ul>
    </div>
  );
}
