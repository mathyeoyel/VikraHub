import React, { useEffect, useState } from "react";
import api from "./api";

export default function Team() {
  const [team, setTeam] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get("team/")   // This will attach the JWT automatically
      .then(res => setTeam(res.data))
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div>Loading team...</div>;

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
