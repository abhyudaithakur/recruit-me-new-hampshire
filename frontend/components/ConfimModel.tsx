import { MouseEventHandler } from "react";

// Custom Confirmation Modal Component
export default function ConfirmModal({
  message,
  onConfirm,
  onCancel,
}: {
  message: string;
  onConfirm: MouseEventHandler<HTMLButtonElement>;
  onCancel: MouseEventHandler<HTMLButtonElement>;
}) {
  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: "rgba(0,0,0,0.5)",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        zIndex: 1000,
      }}>
      <div
        style={{
          backgroundColor: "#fff",
          padding: "20px 30px",
          borderRadius: "10px",
          textAlign: "center",
          minWidth: "300px",
        }}>
        <p>{message}</p>
        <div
          style={{
            marginTop: "20px",
            display: "flex",
            justifyContent: "space-around",
          }}>
          <button onClick={onConfirm} style={{ padding: "5px 15px" }}>
            Yes
          </button>
          <button onClick={onCancel} style={{ padding: "5px 15px" }}>
            No
          </button>
        </div>
      </div>
    </div>
  );
}