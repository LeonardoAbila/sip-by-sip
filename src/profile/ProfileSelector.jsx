import React from 'react';

export default function ProfileSelector({ profiles, selectedId, onSelect }) {
  if (!profiles.length) return null;
  return (
    <label htmlFor="local-profile">Perfis neste navegador
      <select id="local-profile" value={selectedId} onChange={event => onSelect(event.target.value)}>
        <option value="">Selecione um perfil</option>
        {profiles.map(profile => <option key={profile.id} value={profile.id}>{profile.username}</option>)}
      </select>
    </label>
  );
}
