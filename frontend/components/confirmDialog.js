export default function ConfirmDialog({ message, onConfirm, onCancel }) {
  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100%',
      height: '100%',
      backgroundColor: 'rgba(0,0,0,0.5)',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 1000
    }}>
      <div style={{
        backgroundColor: 'white',
        padding: '24px',
        borderRadius: '8px',
        minWidth: '300px',
        boxShadow: '0 5px 15px rgba(0,0,0,0.3)',
        textAlign: 'center'
      }}>
        <p>{message}</p>
        <div style={{ marginTop: '16px', display: 'flex', justifyContent: 'space-around' }}>
          <button onClick={onConfirm} style={{ padding: '8px 16px' }}>Yes</button>
          <button onClick={onCancel} style={{ padding: '8px 16px' }}>No</button>
        </div>
      </div>
    </div>
  )
}
