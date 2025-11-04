import { useState } from 'react';
import ConfirmDialog from './ConfirmDialog';

export default function JobCard({ job, onAccept, onReject }) {
  const [showDialog, setShowDialog] = useState(false);
  const [actionType, setActionType] = useState(null); // "accept" or "reject"

  const handleClick = (type) => {
    setActionType(type);
    setShowDialog(true);
  }

  const handleConfirm = () => {
    if (actionType === 'accept') onAccept(job);
    else if (actionType === 'reject') onReject(job);
    setShowDialog(false);
  }

  const handleCancel = () => {
    setShowDialog(false);
    setActionType(null);
  }

  return (
    <>
      <div style={{
        border: '1px solid #ccc',
        padding: '12px',
        borderRadius: '6px',
        boxShadow: '0 2px 5px rgba(0,0,0,0.1)'
      }}>
        <h4>{job.title}</h4>
        <p>{job.company}</p>
        <div style={{ marginTop: '8px', display: 'flex', gap: '8px' }}>
          <button onClick={() => handleClick('accept')}>Accept</button>
          <button onClick={() => handleClick('reject')}>Reject</button>
        </div>
      </div>

      {showDialog && (
        <ConfirmDialog
          message={`Are you sure you want to ${actionType.toUpperCase()} the job "${job.title}"?`}
          onConfirm={handleConfirm}
          onCancel={handleCancel}
        />
      )}
    </>
  )
}
